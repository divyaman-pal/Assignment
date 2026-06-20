import { methodNotAllowed, readJson, sendJson } from './_lib/http.js';
import { insertRows, patchRows, selectRows } from './_lib/supabase.js';
import {
  callClaudeJson,
  fallbackProfileFromTranscript,
  inferLearnerGoal,
  isAcademicPrepText,
  isEntranceExamPrepText,
  isSchoolStudyText,
  transcribeSarvamAudio,
} from './_lib/services.js';
import {
  isGenericReply,
  languageInstruction,
  languageVoiceProfile,
  phrase,
  voiceLanguageCode,
  withLanguageMetadata,
} from './_lib/language.js';

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

function isGenericGoal(goal = {}) {
  return !goal?.intent || goal.intent === 'unknown' || ['open_counseling', 'goal_clarification_needed'].includes(goal.type);
}

function goalSpecificity(goal = {}) {
  const text = `${goal.label || ''} ${goal.type || ''} ${goal.intent || ''}`.toLowerCase();
  let score = 0;
  if (goal.intent && goal.intent !== 'unknown') score += 1;
  if (goal.type && !['open_counseling', 'goal_clarification_needed'].includes(goal.type)) score += 1;
  if (/machine learning|data science|data analyst|python|sql|mushroom|poultry|plumbing|electrician|mobile repair|tailor|accounting|driving|nursing/i.test(text)) {
    score += 2;
  }
  if (/job|business|enterprise|self_employment|training|internship/i.test(text)) score += 1;
  if (/college career|college pathway|skill pathway exploration|vocational training/i.test(text)) score -= 1;
  return score;
}

function latestIsBackgroundContext(latestText = '') {
  const text = String(latestText || '').toLowerCase();
  const hasBackground =
    /college|semester|year|final year|fourth year|4th year|department|branch|civil engineering|mechanical|btech|b\.tech|degree|youtube|series|github|project|course|कोर्स|कॉलेज|सेमेस्टर|डिपार्टमेंट|सिविल|यूट्यूब|गिटहब|प्रोजेक्ट/i.test(
      text,
    );
  const explicitSwitch =
    /instead|change|switch|leave|not that|actually now|sirf|only|bas|business|व्यापार|बिजनेस|छोटा व्यापार|study only|exam only/i.test(
      text,
    );
  return hasBackground && !explicitSwitch;
}

function mergeLearnerGoal(baseGoal = {}, nextGoal = {}, latestText = '') {
  if (!hasValue(nextGoal)) return baseGoal;
  if (!baseGoal || isGenericGoal(baseGoal)) return nextGoal;
  if (isGenericGoal(nextGoal)) return baseGoal;
  if (baseGoal.intent === 'job' && nextGoal.type === 'skill_pathway_exploration' && !latestExplicitGoalSwitch(latestText)) return baseGoal;
  if (baseGoal.intent === 'job' && nextGoal.intent === 'college' && latestIsBackgroundContext(latestText)) return baseGoal;
  if (baseGoal.intent === 'job' && nextGoal.intent === 'career' && latestIsBackgroundContext(latestText)) return baseGoal;
  if (goalSpecificity(baseGoal) > goalSpecificity(nextGoal) && latestIsBackgroundContext(latestText)) return baseGoal;
  return goalSpecificity(nextGoal) >= goalSpecificity(baseGoal) ? nextGoal : baseGoal;
}

function latestExplicitGoalSwitch(latestText = '') {
  return /\b(?:change|switch|instead|not that|actually now|ab\s+(?:mujhe|sirf|bas)|sirf|bas|only)\b|अब\s+(?:मुझे|सिर्फ|बस)|सिर्फ|बस/i.test(
    String(latestText || ''),
  );
}

function mergeProfile(base = {}, update = {}, { latestText = '' } = {}) {
  const merged = { ...base };
  Object.entries(update || {}).forEach(([key, value]) => {
    if (key === 'learner_goal') {
      const goal = mergeLearnerGoal(base.learner_goal, value, latestText);
      if (hasValue(goal)) merged.learner_goal = goal;
      return;
    }
    if (['aspirations', 'skills', 'content_preferences', 'support_needs'].includes(key)) {
      const baseValues = Array.isArray(base[key]) ? base[key] : [];
      const nextValues = Array.isArray(value) ? value : [];
      const mergedValues = [...baseValues, ...nextValues].map((item) => String(item).trim()).filter(Boolean);
      if (mergedValues.length) merged[key] = [...new Set(mergedValues)];
      return;
    }
    if (hasValue(value)) merged[key] = value;
  });
  return merged;
}

function latestUserContent(messages = []) {
  return [...messages].reverse().find((message) => message.role === 'user')?.content || '';
}

function latestAssistantContent(messages = []) {
  return [...messages].reverse().find((message) => message.role === 'assistant')?.content || '';
}

function meaningfulArraySignals(values = []) {
  return values
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item) => !/^(?:mera|my|ab|now)?\s*(?:pathway|pathwat|raasta|rasta|roadmap|plan|next step)(?:\s+banao|\s+build|\s+make)?$/i.test(item))
    .filter((item) => !/\b(?:pathway|pathwat|raasta|rasta|roadmap)\s+(?:banao|build|make)\b/i.test(item));
}

function applyLatestSignals(profile = {}, latestText = '') {
  const latestProfile = fallbackProfileFromTranscript(latestText);
  const next = { ...profile };
  Object.entries(latestProfile).forEach(([key, value]) => {
    if (!hasValue(value)) return;
    if (key === 'learner_goal') return;
    if (Array.isArray(value)) {
      if (key === 'aspirations' || key === 'skills' || key === 'content_preferences' || key === 'support_needs') {
        if ((key === 'aspirations' || key === 'skills') && asksAboutProofUse(latestText)) return;
        const nextValues = meaningfulArraySignals(value);
        if (nextValues.length) {
          const previousValues = Array.isArray(next[key]) ? next[key] : [];
          next[key] = [...new Set([...previousValues, ...nextValues])];
        }
      }
      return;
    }
    next[key] = value;
  });
  return next;
}

function applyAcademicIntent(profile = {}, latestText = '') {
  if (educationBackgroundOnly(latestText) && profile.learner_goal?.intent && profile.learner_goal.intent !== 'study') return profile;
  if (!isAcademicPrepText(latestText)) return profile;
  const extracted = fallbackProfileFromTranscript(latestText);
  return {
    ...profile,
    class_level: extracted.class_level || profile.class_level || 'Class 12',
    education_status: 'Class 12 exam preparation',
    aspirations: ['class 12 board exam preparation'],
    skills: profile.skills || [],
    proof_available: profile.proof_available || [],
    academic_goal: extracted.academic_goal || {
      type: 'class_12_exam_prep',
      board: 'CBSE or state board',
      subjects: ['Learner selected subjects'],
      target: 'score better marks in Class 12',
    },
    content_preferences: [...new Set([...(profile.content_preferences || []), 'NCERT chapter plan', 'sample paper practice', 'mistake-log tracking'])],
    support_needs: [...new Set([...(profile.support_needs || []), 'study planning', 'exam revision support'])],
    profile_complete: true,
  };
}

function applyEntranceExamIntent(profile = {}, latestText = '') {
  if (educationBackgroundOnly(latestText) && profile.learner_goal?.intent && profile.learner_goal.intent !== 'study') return profile;
  if (!isEntranceExamPrepText(latestText)) return profile;
  const extracted = fallbackProfileFromTranscript(latestText);
  const exam = extracted.academic_goal?.exam || 'entrance exam';
  return {
    ...profile,
    class_level: extracted.class_level || profile.class_level || 'Entrance exam learner',
    education_status: `${exam} preparation`,
    aspirations: extracted.aspirations?.length ? extracted.aspirations : [`${exam} preparation`],
    skills: profile.skills || [],
    proof_available: profile.proof_available || [],
    academic_goal: extracted.academic_goal || {
      type: 'entrance_exam_prep',
      exam,
      board: 'Official exam syllabus',
      subjects: ['Syllabus topics'],
      target: `prepare for ${exam} with syllabus coverage, practice, mocks, and error-log tracking`,
    },
    content_preferences: [
      ...new Set([
        ...(profile.content_preferences || []),
        'syllabus map',
        'daily practice sets',
        'mock-test analysis',
        'mistake-log tracking',
      ]),
    ],
    support_needs: [...new Set([...(profile.support_needs || []), 'study planning', 'exam strategy', 'doubt clearing'])],
    income_pressure: false,
    earning_urgency: profile.earning_urgency === 'immediate' ? '' : profile.earning_urgency || '',
    profile_complete: true,
  };
}

function applySchoolStudyIntent(profile = {}, latestText = '') {
  if (educationBackgroundOnly(latestText) && profile.learner_goal?.intent && profile.learner_goal.intent !== 'study') return profile;
  if (!isSchoolStudyText(latestText) || isAcademicPrepText(latestText) || isEntranceExamPrepText(latestText)) return profile;
  const extracted = fallbackProfileFromTranscript(latestText);
  return {
    ...profile,
    class_level: extracted.class_level || profile.class_level || 'School',
    education_status: extracted.education_status || profile.education_status || 'School study support',
    aspirations: extracted.aspirations?.length ? extracted.aspirations : ['school study support'],
    skills: profile.skills || [],
    proof_available: profile.proof_available || [],
    academic_goal: extracted.academic_goal || {
      type: 'school_study_support',
      board: 'CBSE or state board',
      subjects: ['Learner selected subjects'],
      target: 'improve school learning',
    },
    content_preferences: [...new Set([...(profile.content_preferences || []), 'chapter plan', 'practice questions', 'mistake-log tracking'])],
    support_needs: [...new Set([...(profile.support_needs || []), 'study planning'])],
    earning_urgency: profile.earning_urgency || '',
    income_pressure: false,
    profile_complete: true,
  };
}

function applyGeneralGoal(profile = {}, latestText = '') {
  const extracted = fallbackProfileFromTranscript(latestText);
  const extractedGoalFromText = extracted.learner_goal;
  const inferredGoal = inferLearnerGoal(latestText, {
    entrancePrep: isEntranceExamPrepText(latestText),
    academicPrep: isAcademicPrepText(latestText),
    schoolStudy: isSchoolStudyText(latestText),
    aspirations: [...(extracted.aspirations || []), ...(profile.aspirations || [])],
  });
  const extractedGoal =
    extractedGoalFromText?.intent && extractedGoalFromText.intent !== 'unknown' ? extractedGoalFromText : inferredGoal;
  const existingGoal = profile.learner_goal;
  const hasMeaningfulExtractedGoal = Boolean(extractedGoal?.intent && extractedGoal.intent !== 'unknown');
  const latestExplicitChange =
    /actually|instead|change(?:d)?|\bab\b|now|also|too|sirf|only|bas|but|first|pehle|career|job|role|full.?time|internship|placement|training|course|naukri|नौकरी|रोजगार|प्लेसमेंट|पहले|बट/i.test(
      latestText,
    );
  const latestChangesLane =
    existingGoal?.intent &&
    extractedGoal?.intent &&
    extractedGoal.intent !== 'unknown' &&
    extractedGoal.intent !== existingGoal.intent &&
    /job|role|full.?time|naukri|career|internship|placement|training|course|study|exam|jee|neet|marks|score|padh|padhai|नौकरी|रोजगार|प्लेसमेंट|पढ़|परीक्षा/i.test(
      latestText,
    );
  const shouldUseLatest =
    !(educationBackgroundOnly(latestText) && existingGoal?.intent && existingGoal.intent !== 'study') &&
    (!existingGoal ||
    (['open_counseling', 'goal_clarification_needed'].includes(existingGoal.type) && hasMeaningfulExtractedGoal) ||
    extractedGoal?.type === 'informal_skill_validation' ||
    extractedGoal?.type === 'entrance_exam_prep' ||
    extractedGoal?.intent === 'study' ||
    latestChangesLane ||
    (latestExplicitChange && hasMeaningfulExtractedGoal) ||
    (existingGoal.intent === 'unknown' && hasMeaningfulExtractedGoal));
  const goal = shouldUseLatest ? extractedGoal : existingGoal;
  const next = {
    ...profile,
    learner_goal: goal,
  };
  if (goal?.intent && goal.intent !== 'study') {
    next.academic_goal = null;
  }
  if (
    goal.intent === 'job' &&
    /switch.*career|career.*switch|job counseling|career counseling|career\/job|career.*job|job.*career|employability|opportunity search|outreach pipeline/i.test(
      latestText,
    ) &&
    /study|school|class|exam|marks|chapter|subject|board/i.test((profile.aspirations || []).join(' '))
  ) {
    next.aspirations = [];
    next.skills = [];
    next.proof_available = [];
    next.academic_goal = null;
  }
  if (goal.intent === 'job') {
    next.profile_complete = Boolean(next.location && (next.skills?.length || next.aspirations?.length || next.proof_available?.length));
  }
  return next;
}

function exactGoalFromProfileSignals(profile = {}, latestText = '') {
  const signalText = [
    latestText,
    profile.learner_goal?.label,
    profile.learner_goal?.type,
    ...(Array.isArray(profile.aspirations) ? profile.aspirations : []),
    ...(Array.isArray(profile.skills) ? profile.skills : []),
  ]
    .join(' ')
    .toLowerCase();
  const directGoal = inferLearnerGoal(signalText, {
    aspirations: [...(profile.aspirations || []), ...(profile.skills || [])],
  });
  const officeJobSignal =
    /computer basics|typing|data entry|computer operator|front desk|reception|billing|office assistant|office job|local office|bpo|call center|customer service|retail billing/i.test(
      signalText,
    ) &&
    /job|naukri|naukari|nokri|placement|role|work|kaam|day shift|turant|immediate/i.test(signalText);
  if (officeJobSignal) {
    return {
      type: 'local_office_job',
      label: /customer service/i.test(signalText)
        ? 'Computer typing customer service job search'
        : /data entry|computer operator/i.test(signalText)
          ? 'Computer typing data-entry job search'
          : 'Local office computer job search',
      intent: 'job',
      needs_location_for_offline: true,
      recommended_next_step:
        'Build simple typing/customer-service proof, shortlist nearby day-shift office roles, then apply only with learner consent.',
    };
  }
  if (directGoal?.intent && directGoal.intent !== 'unknown' && directGoal.type !== 'skill_pathway_exploration') {
    return directGoal;
  }
  return null;
}

function preserveExactGoalFromSignals(profile = {}, latestText = '', previousProfile = {}) {
  const exactGoal = exactGoalFromProfileSignals(profile, latestText);
  const currentGoal = profile.learner_goal || {};
  const previousGoal = previousProfile.learner_goal || {};
  const shouldUseExact =
    exactGoal &&
    (isGenericGoal(currentGoal) ||
      currentGoal.type === 'skill_pathway_exploration' ||
      goalSpecificity(exactGoal) >= goalSpecificity(currentGoal) ||
      (currentGoal.intent === exactGoal.intent && !latestExplicitGoalSwitch(latestText)));
  const shouldRestorePrevious =
    previousGoal?.intent &&
    previousGoal.intent !== 'unknown' &&
    (isGenericGoal(currentGoal) || currentGoal.type === 'skill_pathway_exploration') &&
    !latestExplicitGoalSwitch(latestText);
  const learnerGoal = shouldUseExact ? exactGoal : shouldRestorePrevious ? previousGoal : currentGoal;
  const aspirations = [...(profile.aspirations || [])];
  if (learnerGoal?.type === 'local_office_job') {
    ['computer basics', 'typing', 'customer service'].forEach((item) => {
      if (new RegExp(item.replace(/\s+/g, '\\s+'), 'i').test(
        `${latestText} ${(profile.aspirations || []).join(' ')} ${(profile.skills || []).join(' ')}`,
      ) && !aspirations.some((existing) => existing.toLowerCase() === item)) {
        aspirations.push(item);
      }
    });
  }
  return {
    ...profile,
    learner_goal: learnerGoal,
    aspirations: aspirations.length ? aspirations : profile.aspirations,
    academic_goal: learnerGoal?.intent && learnerGoal.intent !== 'study' ? null : profile.academic_goal,
  };
}

function refusesLocation(text = '') {
  return /city.*nahi|location.*nahi|jagah.*nahi|abhi nahi batana|city abhi nahi batana|location abhi nahi/i.test(text);
}

function refusesName(text = '') {
  return /naam.*nahi|name.*nahi|naam.*private|name.*private|abhi.*naam.*nahi|don't want.*name|do not want.*name/i.test(text);
}

function educationBackgroundOnly(text = '') {
  const value = String(text || '').toLowerCase();
  const mentionsEducationLevel =
    /class\s*\d{1,2}|\d{1,2}(?:st|nd|rd|th)\s*(?:tak|तक)|क्लास\s*\d{1,2}|कक्षा\s*\d{1,2}|पांचवी|पाँचवी|5वीं|5वी/i.test(value);
  const saysLimitedStudy =
    /zyada\s+padhai\s+nahi|padhai\s+(?:nahi|nahin|nhi)|sirf.*padh|bas.*padh|tak\s+hi\s+pad|school.*chhod|ज़्यादा\s+पढ़ाई\s+नहीं|ज्यादा\s+पढ़ाई\s+नहीं|पढ़ाई\s+नहीं|तक\s+ही\s+पढ़|तक\s+पढ़|स्कूल.*छोड़/i.test(value);
  const asksAcademicHelp =
    /help.*subject|subject.*help|exam|marks|score|board|homework|chapter|ncert|cbse|jee|neet|परीक्षा|नंबर|अंक|होमवर्क|अध्याय|विषय.*मदद|सब्जेक्ट.*मदद/i.test(value);
  return (mentionsEducationLevel || saysLimitedStudy) && !asksAcademicHelp;
}

function lowEducationText(text = '') {
  const value = String(text || '').toLowerCase();
  if (
    /\b(no schooling|never went to school|did not go to school|didn't go to school|not studied|not educated|no education|illiterate|can't read|cannot read|anpadh|anpad|school nahi|school nahin|school nhi|school nahi gayi|school nahi gaya|school nahin gayi|school nahin gaya|padhai nahi|padhai nahin|padhi nahi|padha nahi|padhna nahi|padhna nahin|school chhod|school chhod diya|dropout|drop out)\b/i.test(
      value,
    )
  ) {
    return true;
  }
  return (
    /[\u0900-\u097F]/.test(value) &&
      /(?:\u0938\u094d\u0915\u0942\u0932|\u092a\u0922|\u092a\u095d|\u092a\u0922\u093e\u0908).*(?:\u0928\u0939\u0940|\u0928\u0939\u0940\u0902|\u091b\u094b\u0921|\u0917\u0908|\u0917\u092f\u093e)/.test(value)
  ) || (
    /[\u0B80-\u0BFF]/.test(value) &&
      /(?:\u0baa\u0bb3\u0bcd\u0bb3\u0bbf.*(?:\u0baa\u0bcb\u0b95\u0bb5\u0bbf\u0bb2\u0bcd\u0bb2\u0bc8|\u0baa\u0bcb\u0b95\u0bb2|\u0baa\u0bcb\u0b95\u0bb5\u0bc7\u0b87\u0bb2\u0bcd\u0bb2\u0bc8)|\u0baa\u0b9f\u0bbf\u0b95\u0bcd\u0b95\u0bb5\u0bbf\u0bb2\u0bcd\u0bb2\u0bc8)/.test(value)
  );
}

function lowEducationProfile(profile = {}, latestText = '') {
  const text = [
    latestText,
    profile.class_level,
    profile.education_status,
    ...(profile.support_needs || []),
    ...(profile.content_preferences || []),
  ].join(' ');
  return lowEducationText(text) || /low.?literacy|no formal schooling/i.test(text);
}

const LOW_EDUCATION_COPY = {
  English: {
    saved: 'Got it, I saved that.',
    education: 'No formal schooling reported',
    goal: 'What kind of work or income help do you want first: tailoring, cooking, shop work, farming, phone repair, or something else?',
    location: 'Which district or village are you in right now?',
    time: 'How much time can you give in one day?',
    phone: 'Is this phone yours or shared with family?',
    mobility: 'How far can you safely go from home for work or training?',
    proof: 'Do you have any simple proof of your work, like a photo, video, voice note, or sample?',
    ready: 'Good, I have enough to build your pathway. Click Generate Pathway now; if you have another question, ask Meera here.',
  },
  Hinglish: {
    saved: 'Theek hai, save kar liya.',
    education: 'School padhai nahi hui bataya',
    goal: 'Sabse pehle kis kaam ya kamai mein madad chahiye: silai, rasoi, dukaan ka kaam, kheti, phone theek karna, ya kuch aur?',
    location: 'Aap abhi kis zila ya gaon mein hain?',
    time: 'Ek din mein kitna time de sakte ho?',
    phone: 'Yeh phone aapka hai ya family ke saath shared hai?',
    mobility: 'Kaam ya seekhne ke liye ghar se kitni door surakshit ja sakte ho?',
    proof: 'Aapke kaam ka koi aasaan saboot hai, jaise photo, video, awaaz note, ya namuna?',
    ready: 'Theek hai, rasta banane ke liye jankari kafi hai. Ab Rasta banayein dabao; koi aur sawaal ho to Meera ko yahin poochho.',
  },
  Hindi: {
    saved: 'ठीक है, सहेज लिया।',
    education: 'स्कूल की पढ़ाई नहीं हुई बताया',
    goal: 'सबसे पहले किस काम या कमाई में मदद चाहिए: सिलाई, खाना बनाना, दुकान का काम, खेती, मोबाइल ठीक करना, या कुछ और?',
    location: 'आप अभी किस जिले या गाँव में हैं?',
    time: 'एक दिन में कितना समय दे सकते हैं?',
    phone: 'यह फोन आपका है या परिवार के साथ साझा है?',
    mobility: 'काम या सीखने के लिए घर से कितनी दूर सुरक्षित जा सकते हैं?',
    proof: 'आपके काम का कोई आसान सबूत है, जैसे फोटो, वीडियो, आवाज नोट, या नमूना?',
    ready: 'ठीक है, रास्ता बनाने के लिए जानकारी काफी है। अब रास्ता बनाएँ दबाएँ; कोई और सवाल हो तो मीरा से यहीं पूछें।',
  },
  Marathi: {
    saved: 'ठीक आहे, सेव केले.',
    education: 'शाळेचे शिक्षण झाले नाही असे सांगितले',
    goal: 'सगळ्यात आधी कोणत्या कामात किंवा कमाईत मदत हवी: शिवणकाम, स्वयंपाक, दुकानाचे काम, शेती, फोन दुरुस्ती, की काही दुसरे?',
    location: 'तुम्ही सध्या कोणत्या जिल्ह्यात किंवा गावात आहात?',
    time: 'एका दिवसात किती वेळ देऊ शकता?',
    phone: 'हा फोन तुमचा आहे की कुटुंबासोबत शेअर आहे?',
    mobility: 'काम किंवा प्रशिक्षणासाठी घरापासून किती दूर सुरक्षित जाऊ शकता?',
    proof: 'तुमच्या कामाचा सोपा पुरावा आहे का, जसे फोटो, व्हिडिओ, voice note, किंवा sample?',
    ready: 'ठीक आहे, pathway बनवण्यासाठी profile पुरेशी आहे. आता Generate Pathway दाबा; अजून प्रश्न असेल तर Meera ला इथे विचारा.',
  },
  Odia: {
    saved: 'ଠିକ ଅଛି, save କଲି.',
    education: 'ସ୍କୁଲ ପଢା ହୋଇନାହିଁ ବୋଲି କହିଛନ୍ତି',
    goal: 'ପ୍ରଥମେ କେଉଁ କାମ କିମ୍ବା ଆୟରେ ସହାୟତା ଚାହୁଁଛନ୍ତି: ସିଲାଇ, ରନ୍ଧଣ, ଦୋକାନ କାମ, ଚାଷ, phone repair, କିମ୍ବା ଅନ୍ୟ କିଛି?',
    location: 'ଆପଣ ଏବେ କେଉଁ ଜିଲ୍ଲା କିମ୍ବା ଗାଁରେ ଅଛନ୍ତି?',
    time: 'ଦିନକୁ କେତେ ସମୟ ଦେଇପାରିବେ?',
    phone: 'ଏହି phone ଆପଣଙ୍କର କି ପରିବାର ସହ shared?',
    mobility: 'କାମ କିମ୍ବା training ପାଇଁ ଘରୁ କେତେ ଦୂର safe ଯାଇପାରିବେ?',
    proof: 'ଆପଣଙ୍କ କାମର ସହଜ proof ଅଛି କି, ଯେମିତି photo, video, voice note, କିମ୍ବା sample?',
    ready: 'ଠିକ ଅଛି, pathway ପାଇଁ profile ପର୍ଯ୍ୟାପ୍ତ. ଏବେ Generate Pathway ଦବାନ୍ତୁ; ଅନ୍ୟ ପ୍ରଶ୍ନ ଥିଲେ Meera କୁ ଏଠି ପଚାରନ୍ତୁ.',
  },
  Bengali: {
    saved: 'ঠিক আছে, সেভ করলাম.',
    education: 'স্কুলের পড়া হয়নি বলেছেন',
    goal: 'আগে বলুন, কোন কাজ বা আয়ের সাহায্য চান: সেলাই, রান্না, দোকানের কাজ, চাষ, ফোন মেরামত, না অন্য কিছু?',
    location: 'আপনি এখন কোন জেলা বা গ্রামে আছেন?',
    time: 'এক দিনে কত সময় দিতে পারবেন?',
    phone: 'এই ফোন আপনার নিজের, নাকি পরিবারের সঙ্গে শেয়ার করা?',
    mobility: 'কাজ বা training-এর জন্য বাড়ি থেকে কত দূর নিরাপদে যেতে পারবেন?',
    proof: 'আপনার কাজের কোনো সহজ proof আছে, যেমন photo, video, voice note, বা sample?',
    ready: 'ঠিক আছে, pathway বানানোর জন্য profile যথেষ্ট. এখন Generate Pathway চাপুন; আর প্রশ্ন থাকলে এখানেই Meera কে জিজ্ঞেস করুন.',
  },
  Tamil: {
    saved: 'சரி, அதை சேமித்தேன்.',
    education: 'பள்ளி படிப்பு இல்லை என்று தெரிவித்தார்',
    goal: 'முதலில் எந்த வேலை அல்லது வருமான உதவி வேண்டும்: தையல், சமையல், கடை வேலை, விவசாயம், மொபைல் சரி செய்வது, அல்லது வேறு ஏதாவது?',
    location: 'நீங்கள் இப்போது எந்த மாவட்டம் அல்லது ஊரில் இருக்கிறீர்கள்?',
    time: 'ஒரு நாளில் எவ்வளவு நேரம் தர முடியும்?',
    phone: 'இந்த phone உங்களுடையதா, இல்லையா குடும்பத்துடன் பகிர்வதா?',
    mobility: 'வேலை அல்லது பயிற்சிக்காக வீட்டிலிருந்து பாதுகாப்பாக எவ்வளவு தூரம் செல்ல முடியும்?',
    proof: 'உங்கள் வேலைக்கு புகைப்படம், வீடியோ, குரல் குறிப்பு, அல்லது மாதிரி போன்ற எளிய சான்று ஏதாவது இருக்கிறதா?',
    ready: 'சரி, பாதை உருவாக்க உங்கள் விவரம் போதும். இப்போது பாதை உருவாக்கு பொத்தானை அழுத்துங்கள்; வேறு கேள்வி இருந்தால் இங்கே கேளுங்கள்.',
  },
  Telugu: {
    saved: 'సరే, సేవ్ చేశాను.',
    education: 'పాఠశాల చదువు లేదని చెప్పారు',
    goal: 'ముందుగా ఏ పని లేదా ఆదాయ సహాయం కావాలి: కుట్టు, వంట, దుకాణ పని, వ్యవసాయం, phone repair, లేదా ఇంకేదైనా?',
    location: 'మీరు ఇప్పుడు ఏ జిల్లా లేదా గ్రామంలో ఉన్నారు?',
    time: 'ఒక రోజులో ఎంత సమయం ఇవ్వగలరు?',
    phone: 'ఈ phone మీదేనా, లేక కుటుంబంతో share చేసుకుంటారా?',
    mobility: 'పని లేదా training కోసం ఇంటి నుండి ఎంత దూరం safe గా వెళ్లగలరు?',
    proof: 'మీ పనికి photo, video, voice note, లేదా sample లాంటి simple proof ఏదైనా ఉందా?',
    ready: 'సరే, pathway తయారు చేయడానికి profile సరిపోతుంది. ఇప్పుడు Generate Pathway నొక్కండి; ఇంకో ప్రశ్న ఉంటే ఇక్కడే Meeraని అడగండి.',
  },
  Gujarati: {
    saved: 'બરાબર, સેવ કરી દીધું.',
    education: 'શાળાનું ભણતર નથી એવું જણાવ્યું',
    goal: 'સૌથી પહેલા કયા કામ અથવા કમાણીમાં મદદ જોઈએ: સિલાઈ, રસોઈ, દુકાનનું કામ, ખેતી, phone repair, કે બીજું કંઈ?',
    location: 'તમે હાલ કયા જિલ્લામાં અથવા ગામમાં છો?',
    time: 'એક દિવસમાં કેટલો સમય આપી શકો?',
    phone: 'આ phone તમારો છે કે પરિવાર સાથે shared છે?',
    mobility: 'કામ અથવા training માટે ઘરથી કેટલું દૂર safely જઈ શકો?',
    proof: 'તમારા કામનો કોઈ સરળ proof છે, જેમ કે photo, video, voice note, અથવા sample?',
    ready: 'બરાબર, pathway બનાવવા માટે profile પૂરતું છે. હવે Generate Pathway દબાવો; બીજો સવાલ હોય તો અહીં Meera ને પૂછો.',
  },
};

function lowEducationLine(profile = {}, latestText = '', key = 'goal') {
  const language = languageVoiceProfile(profile, latestText).preferred_language;
  if (key === 'ready') {
    const readyOverride = {
      Marathi: 'ठीक आहे, रस्ता बनवण्यासाठी माहिती पुरेशी आहे. आता Rasta बटण दाबा; अजून प्रश्न असेल तर Meera ला इथे विचारा.',
      Odia: 'ଠିକ ଅଛି, ରାସ୍ତା ବନାଇବା ପାଇଁ ତଥ୍ୟ ପର୍ଯ୍ୟାପ୍ତ। ଏବେ Rasta button ଦବାନ୍ତୁ; ଅନ୍ୟ ପ୍ରଶ୍ନ ଥିଲେ Meera କୁ ଏଠି ପଚାରନ୍ତୁ।',
      Bengali: 'ঠিক আছে, রাস্তা বানানোর জন্য তথ্য যথেষ্ট। এখন Rasta button চাপুন; আর প্রশ্ন থাকলে এখানেই Meera কে জিজ্ঞেস করুন।',
      Tamil: 'சரி, பாதை உருவாக்க தகவல் போதும். இப்போது Rasta button அழுத்துங்கள்; வேறு கேள்வி இருந்தால் Meera-வை இங்கே கேளுங்கள்.',
    };
    if (readyOverride[language]) return readyOverride[language];
  }
  const copy = LOW_EDUCATION_COPY[language] || LOW_EDUCATION_COPY.Hinglish;
  return copy[key] || LOW_EDUCATION_COPY.Hinglish[key] || LOW_EDUCATION_COPY.English[key] || '';
}

function applyLowEducationSignal(profile = {}, latestText = '') {
  if (!lowEducationText(latestText) && !lowEducationProfile(profile, latestText)) return profile;
  const next = { ...profile };
  next.education_status = lowEducationLine(next, latestText, 'education') || next.education_status || 'No formal schooling reported';
  const latest = String(latestText || '').toLowerCase();
  const regionalSkills = [
    [/(?:tailor|tailoring|silai|stitch|sewing|\u0ba4\u0bc8\u0baf\u0bb2\u0bcd)/i, 'tailoring'],
    [/(?:cook|cooking|kitchen|\u0b9a\u0bae\u0bc8\u0baf\u0bb2\u0bcd)/i, 'cooking'],
    [/(?:shop|retail|\u0b95\u0b9f\u0bc8)/i, 'shop work'],
    [/(?:farm|farming|kheti|\u0bb5\u0bbf\u0bb5\u0b9a\u0bbe\u0baf)/i, 'farming'],
    [/(?:phone repair|mobile repair|\u0baa\u0bcb\u0ba9\u0bcd.*\u0bb0\u0bbf\u0baa\u0bcd\u0baa\u0bc7\u0bb0\u0bcd)/i, 'phone repair'],
  ];
  const detectedSkills = regionalSkills.filter(([pattern]) => pattern.test(latest)).map(([, skill]) => skill);
  if (detectedSkills.length) {
    next.aspirations = [...new Set([...(next.aspirations || []), ...detectedSkills.map((skill) => `${skill} work`)])];
    next.skills = [...new Set([...(next.skills || []), ...detectedSkills])];
  }
  if (!next.location && /\u0ba4\u0bae\u0bbf\u0bb4\u0bcd\u0ba8\u0bbe\u0b9f\u0bc1/.test(latestText)) {
    next.location = /\u0b95\u0bbf\u0bb0\u0bbe\u0bae/.test(latestText) ? 'Tamil Nadu village' : 'Tamil Nadu';
  }
  if (/school|class|college|iti|diploma|graduate/i.test(next.class_level || '') && !/\d/.test(next.class_level || '')) {
    next.class_level = '';
  }
  next.academic_goal = null;
  next.content_preferences = [...new Set([...(next.content_preferences || []), 'voice-first simple guidance'])];
  next.support_needs = [...new Set([...(next.support_needs || []), 'low-literacy counseling'])];
  if (
    (next.aspirations?.length || next.skills?.length) &&
    (!next.learner_goal ||
      next.learner_goal.intent === 'unknown' ||
      ['open_counseling', 'goal_clarification_needed'].includes(next.learner_goal.type))
  ) {
    next.learner_goal = inferLearnerGoal(latestText, { aspirations: [...(next.aspirations || []), ...(next.skills || [])] });
  }
  return next;
}

function preserveSelectedLanguage(previousProfile = {}, nextProfile = {}) {
  const selected =
    previousProfile.preferred_language ||
    previousProfile.language_profile?.preferred_language ||
    previousProfile.language ||
    '';
  if (!selected || selected === 'Pending') return nextProfile;
  return {
    ...nextProfile,
    preferred_language: selected,
    language: selected,
    language_profile: {
      ...(nextProfile.language_profile || {}),
      preferred_language: selected,
    },
  };
}

function suspiciousName(value = '') {
  const text = String(value || '').trim();
  if (!text) return false;
  if (text.length > 40) return true;
  if (/^(unknown|<unknown>|n\/a|null|none|not provided|na)$/i.test(text)) return true;
  if (/\b(nahi|nahin|nhi|can't|cannot|can not)\b.*\b(bana|bna|make|create|kar|sakta|sakti|skta|skti|paunga|paungi)\b/i.test(text)) return true;
  return /study|plan|career|job|internship|employability|pathway|course|training|business|school|class|board|cbse|jee|neet|padhai|naukri|skill|location|phone|whatsapp|proof|resume/i.test(
    text,
  );
}

function previousAskedName(previousAssistant = '') {
  return /name|naam|nav|न[ाा]म|ப[ெே]யர்|పేరు|ಹೆಸರ|નામ|নাম|ନାମ|ਨਾਂ/i.test(String(previousAssistant || ''));
}

function shortNameCandidate(latestText = '') {
  const raw = String(latestText || '')
    .replace(/[।.!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const spokenName =
    raw.match(/(?:मेरा नाम|मेरे नाम|नाम|mera naam|my name is|naam)\s+([\p{L}\p{M} .]{2,40}?)(?:\s+(?:है|हूँ|हूं|hai|hoon|hun)|$)/iu)?.[1]?.trim() ||
    raw.match(/(?:मैं|main|mai|i am)\s+([\p{L}\p{M} .]{2,40}?)(?:\s+(?:हूँ|हूं|hu|hun|hoon)|$)/iu)?.[1]?.trim();
  const text = (spokenName || raw)
    .replace(/^(?:मेरा नाम|मेरे नाम|नाम|mera naam|my name is|naam)\s+/iu, '')
    .replace(/\s+(है|हूँ|हूं|hai|hoon|hun)$/iu, '')
    .trim();
  if (!text || text.length < 2 || text.length > 40) return '';
  if (/^(yes|haan|han|ha|ji|sahi|correct|no|nahi|nahin|नहीं|हाँ|हां|जी|सही|ठीक)$/i.test(text)) return '';
  if (/[?]/.test(text)) return '';
  if (/\d/.test(text)) return '';
  if (suspiciousName(text)) return '';
  return text;
}

function suspiciousLocation(value = '') {
  return /hindi|english|odia|language|content|marks|chahiye|batana|nahi|offline|online|remote|graduate$|student$|study|plan|career|job|internship|employability|pathway|course|training|business|school|class|board|cbse|jee|neet|padhai|naukri|skill|phone|whatsapp|proof|resume/i.test(
    String(value),
  );
}

function academicReply(profile = {}, latestText = '') {
  const subjects = profile.academic_goal?.subjects?.length ? profile.academic_goal.subjects.join(', ') : 'selected subjects';
  return phrase(profile, latestText, 'study_ready', { focus: subjects });
}

function entranceExamReply(profile = {}, latestText = '') {
  const exam = profile.academic_goal?.exam || 'entrance exam';
  return phrase(profile, latestText, 'entrance_ready', { exam });
}

function schoolStudyReply(profile = {}, latestText = '') {
  const classLevel = profile.class_level || 'school';
  const subjects = profile.academic_goal?.subjects?.length ? profile.academic_goal.subjects.join(', ') : 'aapke subjects';
  return phrase(profile, latestText, 'study_ready', { focus: `${classLevel} ${subjects}` });
}

function profileCompleteness(profile = {}) {
  const missing = requiredFieldsForProfile(profile).filter((field) => !fieldHasValue(profile, field));
  return { missing, complete: missing.length === 0 };
}

function hasClearLearnerGoal(profile = {}) {
  const goal = profile.learner_goal || {};
  return Boolean(
    goal.intent &&
      goal.intent !== 'unknown' &&
      !['open_counseling', 'goal_clarification_needed'].includes(goal.type),
  );
}

function profileConfidence(profile = {}, missing = []) {
  const required = requiredFieldsForProfile(profile);
  const coveredRequired = Math.max(0, required.length - missing.length);
  const base = required.length ? coveredRequired / required.length : 0.5;
  const bonusSignals = [
    profile.name,
    profile.location || profile.relocation_preference,
    profile.time_available,
    profile.phone_access || profile.device,
    profile.preferred_language || profile.language,
    profile.earning_urgency,
    profile.proof_available?.length,
  ].filter(Boolean).length;
  return Math.min(0.98, Math.round((base * 0.78 + Math.min(bonusSignals / 7, 1) * 0.22) * 100) / 100);
}

function counselorPersona(profile = {}) {
  const goalType = profile.learner_goal?.type || profile.academic_goal?.type || '';
  const goalIntent = profile.learner_goal?.intent || '';
  const text = `${goalType} ${goalIntent} ${profile.class_level || ''} ${profile.education_status || ''} ${(profile.aspirations || []).join(' ')} ${(profile.skills || []).join(' ')}`.toLowerCase();
  if (/formal_skill_job_search|certified|certificate|iti|diploma|license/.test(text)) return 'formal_skill_job_search';
  if (goalIntent === 'job' || /job_search|job|naukri|placement/.test(text)) return 'job_search_only';
  if (goalIntent === 'training' || /training|course|vocational/.test(text)) return 'vocational_training';
  if (goalIntent === 'proof_to_work') return 'informal_skill_rpl';
  if (/entrance|jee|neet|polytechnic/.test(text)) return 'entrance_exam_prep';
  if (/class 12|board|marks|score/.test(text)) return 'board_exam_prep';
  if (goalIntent === 'study' || /school_study|school study|homework/.test(text)) return 'school_study_support';
  if (/internship|project/.test(text)) return 'college_internship';
  if (/college|btech|b\.tech|engineering|degree|bca|mca/.test(text)) return 'college_career';
  if (/informal|rpl|tailor|stitch|repair|farming|cooking/.test(text)) return 'informal_skill_rpl';
  if (/dropout|school chhod|income urgent/.test(text)) return 'dropout_income';
  return 'unsure_exploration';
}

function fieldHasValue(profile = {}, field) {
  if (field === 'goal_signal') {
    return hasClearLearnerGoal(profile);
  }
  if (field === 'skill_signal') {
    const specificSignals = [
      ...(Array.isArray(profile.aspirations) ? profile.aspirations : []),
      ...(Array.isArray(profile.skills) ? profile.skills : []),
      ...(Array.isArray(profile.proof_available) ? profile.proof_available : []),
    ]
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .filter(
        (item) =>
          !/^(?:work skill|kaam ka hunar|hunar|skill|skill training|vocational training|learn skill|learn a skill|skill learning|काम का हुनर|हुनर|हुनर सीखना|कौशल|कौशल सीखना|प्रशिक्षण|स्किल सीखना)$/i.test(
            item,
          ),
      );
    return specificSignals.length > 0;
  }
  if (field === 'mobility_signal') {
    const relocation = String(profile.relocation_preference || '').toLowerCase();
    return Boolean(profile.commute_km || /relocat|anywhere|remote|india.?wide|outside/i.test(relocation));
  }
  if (field === 'academic_subjects') {
    return Boolean(profile.academic_goal?.subjects?.length);
  }
  if (field === 'college_goal') {
    return Boolean(profile.aspirations?.length || profile.skills?.length || profile.education_status);
  }
  if (field === 'class_level') {
    return Boolean(profile.class_level || lowEducationProfile(profile));
  }
  const value = profile[field];
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

function requiredFieldsForProfile(profile = {}) {
  if (!hasClearLearnerGoal(profile)) {
    return ['goal_signal'];
  }
  const goalType = profile.learner_goal?.type || 'goal_clarification_needed';
  const lowEducation = lowEducationProfile(profile);
  if (['school_study_support', 'school_exam_prep', 'entrance_exam_prep'].includes(goalType)) {
    return ['class_level', 'academic_subjects', 'time_available', 'phone_access'];
  }
  if (['college_career', 'college_internship_project'].includes(goalType)) {
    return ['class_level', 'college_goal', ...(profile.learner_goal?.needs_location_for_offline ? ['location'] : [])];
  }
  if (['job_search_only', 'formal_skill_job_search', 'college_job_search', 'local_office_job'].includes(goalType)) {
    return ['skill_signal', ...(profile.relocation_preference ? [] : ['location']), 'mobility_signal'];
  }
  if (['informal_skill_validation', 'vocational_training', 'skill_pathway_exploration'].includes(goalType)) {
    return ['location', 'skill_signal', 'time_available', 'mobility_signal'];
  }
  if (goalType === 'self_employment_enterprise' || profile.learner_goal?.intent === 'self_employment') {
    return ['location', 'skill_signal', 'time_available', 'mobility_signal', 'phone_access'];
  }
  if (lowEducation) {
    return ['skill_signal', 'location', 'time_available', 'mobility_signal'];
  }
  return ['class_level', 'skill_signal'];
}

function nextQuestionForMissing(missing = [], profile = {}, latestText = '') {
  const goalType = profile.learner_goal?.type || 'goal_clarification_needed';
  if (missing.includes('goal_signal')) return oneThingQuestion('goal_signal', profile, latestText);
  if (missing.includes('class_level')) {
    return lowEducationProfile(profile, latestText) ? lowEducationLine(profile, latestText, 'goal') : phrase(profile, latestText, 'missing_class', {});
  }
  if (missing.includes('academic_subjects')) return phrase(profile, latestText, 'missing_subjects', {});
  if (missing.includes('college_goal')) return phrase(profile, latestText, 'missing_college_goal', {});
  if (missing.includes('location')) return phrase(profile, latestText, 'need_location', {});
  if (missing.includes('skill_signal')) {
    if (['job_search_only', 'formal_skill_job_search', 'local_office_job'].includes(goalType)) {
      return phrase(profile, latestText, 'need_skill', {});
    }
    return phrase(profile, latestText, 'need_skill', {});
  }
  if (missing.includes('time_available')) return phrase(profile, latestText, 'missing_time', {});
  if (missing.includes('phone_access')) return phrase(profile, latestText, 'missing_phone', {});
  if (missing.includes('commute_km') || missing.includes('mobility_signal')) return phrase(profile, latestText, 'missing_mobility', {});
  return profile.learner_goal?.recommended_next_step || phrase(profile, latestText, 'next_pathway', {});
}

function nextBestIntakeField(missing = [], profile = {}) {
  const goal = profile.learner_goal || {};
  const jobLike = ['job', 'career', 'training', 'proof_to_work', 'self_employment'].includes(goal.intent);
  const lowEducation = lowEducationProfile(profile);
  if (!profile.name) return 'name';
  if (missing.includes('goal_signal')) return 'goal_signal';
  if (missing.includes('class_level') && !lowEducation) return 'class_level';
  if (missing.includes('academic_subjects')) return 'academic_subjects';
  if (missing.includes('college_goal')) return 'college_goal';
  if (missing.includes('skill_signal')) return 'skill_signal';
  if (missing.includes('location')) return 'location';
  if (missing.includes('time_available')) return 'time_available';
  if (missing.includes('phone_access')) return 'phone_access';
  if (missing.includes('commute_km') || missing.includes('mobility_signal')) return 'mobility_signal';
  if (jobLike && !profile.proof_available?.length) return 'proof_available';
  return missing[0] || 'next_pathway';
}

function oneThingQuestion(field = '', profile = {}, latestText = '') {
  if (field === 'goal_signal') {
    if (lowEducationProfile(profile, latestText)) return lowEducationLine(profile, latestText, 'goal');
    return localizedLine(profile, latestText, {
      English: 'What do you want help with first: study, learning a work skill, job, internship, or starting a small business?',
      Hinglish: 'Sabse pehle kis cheez mein madad chahiye: padhai, kaam ka hunar seekhna, naukri, kaam seekhne ka avsar, ya chhota vyapar?',
      Hindi: 'सबसे पहले किस चीज़ में मदद चाहिए: पढ़ाई, काम का हुनर सीखना, नौकरी, काम सीखने का मौका, या छोटा व्यापार?',
      Marathi: 'सगळ्यात आधी कशात मदत हवी: अभ्यास, कामाचे कौशल्य शिकणे, नोकरी, काम शिकण्याची संधी, की छोटा व्यवसाय?',
      Tamil: 'முதலில் எதில் உதவி வேண்டும்: படிப்பு, வேலைக்கான திறன் கற்றல், வேலை, வேலை கற்றுக்கொள்ளும் வாய்ப்பு, அல்லது சிறு தொழில்?',
      Telugu: 'ముందుగా ఏ విషయంలో సహాయం కావాలి: చదువు, పని నైపుణ్యం నేర్చుకోవడం, ఉద్యోగం, పని నేర్చుకునే అవకాశం, లేదా చిన్న వ్యాపారం?',
      Odia: 'ପ୍ରଥମେ କେଉଁଥିରେ ସହାୟତା ଦରକାର: ପଢ଼ା, କାମର ହୁନର ଶିଖିବା, ଚାକିରି, କାମ ଶିଖିବାର ସୁଯୋଗ, କିମ୍ବା ଛୋଟ ବ୍ୟବସାୟ?',
    });
  }
  if (field === 'name') {
    return localizedLine(profile, latestText, {
      English: 'First, what name should I call you?',
      Hinglish: 'Pehle batao, Meera aapko kis naam se bulaye?',
      Hindi: 'पहले बताइए, मैं आपको किस नाम से बुलाऊँ?',
      Marathi: 'पहिले सांगा, मी तुम्हाला कोणत्या नावाने बोलवू?',
      Odia: 'ପ୍ରଥମେ କହନ୍ତୁ, ମୁଁ ଆପଣଙ୍କୁ କେଉଁ ନାମରେ ଡାକିବି?',
      Bengali: 'আগে বলুন, আমি আপনাকে কোন নামে ডাকব?',
      Tamil: 'முதலில் சொல்லுங்கள், உங்களை எந்த பெயரில் அழைக்கலாம்?',
      Telugu: 'ముందుగా చెప్పండి, మిమ్మల్ని ఏ పేరుతో పిలవాలి?',
      Kannada: 'ಮೊದಲು ಹೇಳಿ, ನಿಮ್ಮನ್ನು ಯಾವ ಹೆಸರಿನಿಂದ ಕರೆಯಲಿ?',
      Malayalam: 'ആദ്യം പറയൂ, നിങ്ങളെ ഏത് പേരിൽ വിളിക്കണം?',
      Gujarati: 'પહેલા કહો, હું તમને કયા નામથી બોલાવું?',
      Punjabi: 'ਪਹਿਲਾਂ ਦੱਸੋ, ਮੈਂ ਤੁਹਾਨੂੰ ਕਿਸ ਨਾਮ ਨਾਲ ਬੁਲਾਵਾਂ?',
    });
  }
  if (field === 'class_level') return phrase(profile, latestText, 'missing_class', {});
  if (field === 'academic_subjects') return phrase(profile, latestText, 'missing_subjects', {});
  if (field === 'college_goal') return phrase(profile, latestText, 'missing_college_goal', {});
  if (field === 'location') {
    if (lowEducationProfile(profile, latestText)) return lowEducationLine(profile, latestText, 'location');
    return localizedLine(profile, latestText, {
      English: 'Which city or district are you in right now?',
      Hinglish: 'Aap abhi kis city ya district mein hain?',
      Hindi: 'आप अभी किस शहर या जिले में हैं?',
      Marathi: 'Tumhi sadhya kontya city kiwa district madhe aahat?',
    });
  }
  if (field === 'skill_signal') {
    const goal = profile.learner_goal || {};
    if (lowEducationProfile(profile, latestText)) {
      return lowEducationLine(profile, latestText, 'goal');
    }
    if (goal.intent === 'self_employment' || goal.type === 'self_employment_enterprise') {
      return localizedLine(profile, latestText, {
        English: 'For this small business, what do you already have: space, small budget, buyer contact, supplier contact, or none yet?',
        Hinglish: 'Is chhote business ke liye abhi aapke paas kya hai: jagah, chhota budget, buyer, supplier, ya abhi kuch nahi?',
        Hindi: 'इस छोटे व्यवसाय के लिए अभी आपके पास क्या है: जगह, छोटा बजट, खरीदार, सामान देने वाला, या अभी कुछ नहीं?',
        Odia: 'ଏହି ଛୋଟ business ପାଇଁ ଆପଣଙ୍କ ପାଖରେ ଏବେ କଣ ଅଛି: ଜାଗା, ଛୋଟ budget, buyer, supplier, କିମ୍ବା ଏଯାବତ କିଛି ନାହିଁ?',
        Bengali: 'এই ছোট business-এর জন্য এখন আপনার কাছে কী আছে: জায়গা, ছোট budget, buyer, supplier, না এখনও কিছু নেই?',
        Tamil: 'இந்த சிறு business-க்கு இப்போது உங்களிடம் என்ன உள்ளது: இடம், சிறிய budget, buyer, supplier, அல்லது இன்னும் எதுவும் இல்லையா?',
        Marathi: 'या छोट्या business साठी तुमच्याकडे आत्ता काय आहे: जागा, छोटा budget, buyer, supplier, की अजून काही नाही?',
      });
    }
    if (goal.intent === 'job' || ['job_search_only', 'formal_skill_job_search', 'local_office_job'].includes(goal.type)) {
      return localizedLine(profile, latestText, {
        English: 'Which target role or skill should I prepare you for first? Also mention any proof you already have: resume, certificate, project, sample work, or experience.',
        Hinglish: 'Sabse pehle batao, kis kaam ya hunar ke liye taiyari karni hai. Agar koi saboot ho, jaise certificate, sample kaam, ya kaam ka anubhav, to batao.',
        Hindi: 'सबसे पहले बताइए, किस काम या हुनर के लिए तैयारी करनी है। अगर कोई सबूत हो, जैसे प्रमाणपत्र, काम का नमूना, या काम का अनुभव, तो बताइए।',
        Marathi: 'Sagleat aadhi target role kiwa skill sanga. Proof asel tar sanga: resume, certificate, project, sample work, kiwa experience.',
      });
    }
    if (goal.intent === 'training') {
      return localizedLine(profile, latestText, {
        English: 'Which skill or course do you want to learn first?',
        Hinglish: 'Sabse pehle kaunsa hunar ya training seekhna chahte hain?',
        Hindi: 'सबसे पहले कौन-सा हुनर या प्रशिक्षण सीखना चाहते हैं?',
        Marathi: 'Sagleat aadhi konta skill kiwa course shikaycha aahe?',
      });
    }
    return localizedLine(profile, latestText, {
      English: 'What is the one goal you want help with first: study, skill training, job, internship, or business?',
      Hinglish: 'Sabse pehle ek lakshya batao: padhai, kaam ka hunar seekhna, naukri, kaam seekhne ka avsar, ya vyapar?',
      Hindi: 'सबसे पहले एक लक्ष्य बताइए: पढ़ाई, काम का हुनर सीखना, नौकरी, काम सीखने का मौका, या व्यापार?',
      Marathi: 'सगळ्यात आधी एक लक्ष्य सांगा: अभ्यास, कामाचे कौशल्य, नोकरी, काम शिकण्याची संधी, की व्यवसाय?',
    });
  }
  if (field === 'time_available') return lowEducationProfile(profile, latestText) ? lowEducationLine(profile, latestText, 'time') : phrase(profile, latestText, 'missing_time', {});
  if (field === 'phone_access') return lowEducationProfile(profile, latestText) ? lowEducationLine(profile, latestText, 'phone') : phrase(profile, latestText, 'missing_phone', {});
  if (field === 'mobility_signal') {
    if (lowEducationProfile(profile, latestText)) return lowEducationLine(profile, latestText, 'mobility');
    return localizedLine(profile, latestText, {
      English: 'How far can you safely travel from home each day?',
      Hinglish: 'Ghar se roz kitni door tak safe travel kar sakte hain?',
      Hindi: 'घर से रोज़ कितनी दूर तक सुरक्षित आ-जा सकते हैं?',
      Marathi: 'Gharapasun roj kiti door safe travel karu shakta?',
    });
  }
  if (field === 'proof_available') {
    if (lowEducationProfile(profile, latestText)) return lowEducationLine(profile, latestText, 'proof');
    return localizedLine(profile, latestText, {
      English: 'Do you already have any proof: resume, certificate, project, sample work, score, or work experience?',
      Hinglish: 'Koi saboot hai kya: certificate, sample kaam, photo, awaaz note, score, ya kaam ka anubhav?',
      Hindi: 'कोई सबूत है क्या: प्रमाणपत्र, काम का नमूना, फोटो, आवाज़ नोट, अंक, या काम का अनुभव?',
      Marathi: 'Proof aahe ka: resume, certificate, project, sample work, score, kiwa experience?',
    });
  }
  return nextQuestionForMissing([field], profile, latestText);
}

function directAnswerForLatest(profile = {}, latestText = '') {
  const text = String(latestText || '').toLowerCase();
  const hasQuestion = /\?|kya|kaise|can you|will you|help|madad|bata|plan|connect|job|course|padh|study|exam|marks|score|outreach|hire|founder|scheme|loan/i.test(
    latestText,
  );
  if (!hasQuestion) return '';

  if (asksAboutProofUse(latestText)) {
    return proofUseReply(profile, latestText, { profileReady: false });
  }

  if (/connect|hirer|hiring|founder|employer|mail|email|outreach|contact/i.test(text)) {
    if (lowEducationProfile(profile, latestText)) {
      return localizedLine(profile, latestText, {
        English: 'Yes, Meera can prepare outreach later, but only after your work proof, location, and consent are clear.',
        Hinglish: 'Haan, Meera baad mein baat-cheet ka sandesh taiyar kar sakti hai, par pehle kaam ka saboot, jagah, aur aapki anumati clear honi chahiye.',
        Hindi: 'हाँ, मीरा बाद में बात करने का संदेश तैयार कर सकती है, लेकिन पहले काम का सबूत, जगह और आपकी अनुमति साफ होनी चाहिए।',
        Tamil: 'ஆம், Meera பிறகு outreach தயார் செய்யலாம்; முதலில் வேலை proof, location, consent தெளிவாக வேண்டும்.',
      });
    }
    return localizedLine(profile, latestText, {
      English:
        'Yes, I can prepare hirer outreach, but only after your proof/resume, target role, location or relocation, and consent are clear.',
      Hinglish:
        'Haan, Meera kaam dene wale se baat karne ka sandesh bana sakti hai, lekin pehle saboot, kaam ka lakshya, jagah, aur aapki anumati clear honi chahiye.',
      Hindi:
        'हाँ, मीरा काम देने वाले से बात करने का संदेश बना सकती है, लेकिन पहले सबूत, काम का लक्ष्य, जगह और आपकी अनुमति साफ होनी चाहिए।',
      Marathi:
        'Ho, mi hirer outreach tayar karu shakto, pan proof/resume, target role, location/relocation ani consent clear zalyavar.',
    });
  }
  if (/scheme|loan|business|startup|self.employ|mushroom|poultry|goat|bakri|enterprise|मशरूम|खेती|व्यापार|व्यवसाय|बिजनेस|बिज़नेस|कारोबार|धंधा|लोन|कर्ज|योजना|पोल्ट्री|बकरी/i.test(text)) {
    return localizedLine(profile, latestText, {
      English:
        'Yes, I can build a safe setup plan first: training, cost heads, buyer/supplier checks, scheme eligibility, and loan risk. I will not promise income.',
      Hinglish:
        'Haan, pehle surakshit shuruat ka plan banega: seekhna, kharcha, kharidar/samaan dene wale ki jaanch, yojana ki eligibility, aur loan ka risk. Meera kamai ki guarantee nahi degi.',
      Hindi:
        'हाँ, पहले सुरक्षित शुरुआत की योजना बनेगी: सीखना, खर्च, खरीदार/सामान देने वाले की जाँच, सरकारी योजना की पात्रता, और कर्ज़ का जोखिम। मीरा कमाई की गारंटी नहीं देगी।',
      Marathi:
        'Ho, aadhi safe setup plan banavto: training, cost heads, buyer/supplier check, scheme eligibility ani loan risk. Income guarantee denar nahi.',
    });
  }
  if (/job|naukri|placement|internship|career/i.test(text)) {
    return localizedLine(profile, latestText, {
      English: 'Yes, I can help with a job path.',
      Hinglish: 'Haan, Meera naukri ke raste mein madad kar sakti hai.',
      Hindi: 'हाँ, मीरा नौकरी के रास्ते में मदद कर सकती है।',
      Marathi: 'Ho, job path madhe madat karu shakto.',
    });
  }
  if (
    profile.learner_goal?.intent === 'training' ||
    /training|course|vocational|skill|seekhna|sikhna|plumb|pipe fitter|sanitary|water fitting|bathroom fitting|electrician|mobile repair|tailor|silai/i.test(text)
  ) {
    return localizedLine(profile, latestText, {
      English: 'Yes, Meera can help you build a practical training route.',
      Hinglish: 'Haan, Meera kaam seekhne ka vyavaharik rasta banane mein madad karegi.',
      Hindi: 'हाँ, मीरा काम सीखने का व्यावहारिक रास्ता बनाने में मदद करेगी।',
      Marathi: 'Ho, Meera practical training route banavnyat madat karel.',
    });
  }
  if (profile.learner_goal?.intent === 'study' && /jee|neet|cuet|exam|board|marks|score|class|padh|study|homework|subject/i.test(text)) {
    return localizedLine(profile, latestText, {
      English: 'Yes, I can help with study planning.',
      Hinglish: 'Haan, Meera padhai ki yojana mein madad kar sakti hai.',
      Hindi: 'हाँ, मीरा पढ़ाई की योजना में मदद कर सकती है।',
      Marathi: 'Ho, study planning madhe madat karu shakto.',
    });
  }
  return '';
}

function buildStepwiseReply({
  previousProfile = {},
  profile = {},
  missing = [],
  profileReady = false,
  latestText = '',
  previousAssistant = '',
  modelReply = '',
  directReply = '',
}) {
  const updates = changedProfileFields(previousProfile, profile);
  const directAnswer = directAnswerForLatest(profile, latestText);
  const ack = updates.length ? updateLine(updates, profile, latestText) : '';
  if (!profileReady) {
    const nextField = nextBestIntakeField(missing, profile);
    const nextQuestion = nameConfirmationQuestion(previousProfile, profile, latestText, updates, previousAssistant) ||
      oneThingQuestion(nextField, profile, latestText);
    const nextLooksReady = !nextField || /rasta|pathway|jankari kafi|profile complete|ready/i.test(String(nextQuestion || ''));
    const candidate = cleanCounselorReply(avoidRepeat(
      joinParts([nextLooksReady ? '' : ack, directAnswer, nextQuestion]),
      previousAssistant,
      profile,
      latestText,
    ));
    if (replyMatchesLanguage(candidate, profile, latestText)) return candidate;
    return cleanCounselorReply(avoidRepeat(nextQuestion, previousAssistant, profile, latestText));
  }

  const baseReply = directReply || conciseReadyReply(profile, latestText, modelReply);
  const candidate = cleanCounselorReply(avoidRepeat(
    joinParts([
      baseReply,
    ]),
    previousAssistant,
    profile,
    latestText,
  ));
  if (replyMatchesLanguage(candidate, profile, latestText)) return candidate;
  const localizedReady = lowEducationProfile(profile, latestText) ? lowEducationLine(profile, latestText, 'ready') : readyReply(profile, latestText);
  return cleanCounselorReply(avoidRepeat(localizedReady, previousAssistant, profile, latestText));
}

function nameConfirmationQuestion(previousProfile = {}, profile = {}, latestText = '', updates = [], previousAssistant = '') {
  const name = String(profile.name || '').trim();
  const meaningfulOtherUpdates = updates.filter((item) => item !== 'name' && item !== 'goal');
  const shortAnswerLooksLikeName = Boolean(shortNameCandidate(latestText));
  const askedNameThenShortAnswer = previousAskedName(previousAssistant) && shortAnswerLooksLikeName;
  const latestHasFullProfileContext =
    String(latestText || '').trim().split(/\s+/).length >= 10 &&
    (hasClearLearnerGoal(profile) || profile.location || profile.class_level || profile.education_status);
  if (latestHasFullProfileContext && updates.includes('name')) return '';
  if (
    !name ||
    previousProfile.name ||
    (!askedNameThenShortAnswer && meaningfulOtherUpdates.length) ||
    (!updates.includes('name') && !askedNameThenShortAnswer)
  ) return '';
  return localizedLine(profile, latestText, {
    English: `I heard your name as ${name}. Is that correct?`,
    Hinglish: `Meera ne aapka naam ${name} suna. Kya ye sahi hai?`,
    Hindi: `मीरा ने आपका नाम ${name} सुना। क्या यह सही है?`,
    Marathi: `Meera ne tumcha nav ${name} aikla. Barobar aahe ka?`,
    Tamil: `Meera உங்கள் பெயரை ${name} என்று கேட்டது. இது சரியா?`,
    Telugu: `Meera మీ పేరు ${name} అని విన్నది. ఇది సరేనా?`,
    Odia: `Meera ଆପଣଙ୍କ ନାମ ${name} ବୋଲି ଶୁଣିଲା. ଏହା ଠିକ୍ କି?`,
  });
}

function changedProfileFields(previous = {}, next = {}) {
  const fields = [
    ['name', 'name'],
    ['class_level', 'stage'],
    ['education_status', 'education'],
    ['location', 'location'],
    ['time_available', 'time'],
    ['phone_access', 'phone access'],
    ['commute_km', 'commute'],
    ['relocation_preference', 'relocation'],
    ['earning_urgency', 'earning urgency'],
    ['persona', 'persona'],
  ];
  const changes = fields
    .filter(([field]) => normalizeComparable(previous[field]) !== normalizeComparable(next[field]) && hasValue(next[field]))
    .map(([, label]) => label);
  const previousGoal = normalizeComparable(previous.learner_goal?.label || previous.learner_goal?.type || previous.academic_goal?.target);
  const nextGoal = normalizeComparable(next.learner_goal?.label || next.learner_goal?.type || next.academic_goal?.target);
  if (nextGoal && previousGoal !== nextGoal) changes.push('goal');
  const previousSkill = normalizeComparable((previous.aspirations || []).join(','));
  const nextSkill = normalizeComparable((next.aspirations || []).join(','));
  if (nextSkill && previousSkill !== nextSkill) changes.push('interest');
  return [...new Set(changes)].slice(0, 4);
}

function updateLine(updates = [], profile = {}, latestText = '') {
  if (lowEducationProfile(profile, latestText)) {
    return lowEducationLine(profile, latestText, 'saved');
  }
  return localizedLine(profile, latestText, {
    English: 'Got it, I saved that.',
    Hinglish: 'Theek hai, jankari rakh li.',
    Hindi: 'ठीक है, सहेज लिया।',
    Marathi: 'Theek aahe, save kele.',
  });
}

function collectedProfileLine(profile = {}, latestText = '') {
  const facts = [
    profile.name ? `name ${profile.name}` : '',
    profile.class_level || profile.education_status ? `stage ${profile.class_level || profile.education_status}` : '',
    profile.learner_goal?.label || profile.academic_goal?.target ? `goal ${profile.learner_goal?.label || profile.academic_goal?.target}` : '',
    profile.location ? `location ${profile.location}` : profile.relocation_preference ? `mobility ${profile.relocation_preference}` : '',
    profile.time_available ? `time ${profile.time_available}` : '',
    profile.phone_access || profile.device ? `phone ${profile.phone_access || profile.device}` : '',
    profile.commute_km ? `safe travel ${profile.commute_km} km` : '',
  ].filter(Boolean);
  const factText = facts.join('; ');
  return localizedLine(profile, latestText, {
    English: `I have collected this profile: ${factText}.`,
    Hinglish: `Profile collect ho gaya: ${factText}.`,
    Hindi: `Profile collect ho gaya: ${factText}.`,
    Marathi: `Profile collect zala: ${factText}.`,
  });
}

function localizedLine(profile = {}, latestText = '', variants = {}) {
  const language = languageVoiceProfile(profile, latestText).preferred_language;
  if (variants[language]) return variants[language];
  if (language === 'English') return variants.English || variants.Hinglish || Object.values(variants)[0] || '';
  if (language === 'Hinglish') return variants.Hinglish || variants.Hindi || variants.English || '';
  if (language === 'Hindi') return variants.Hindi || variants.Hinglish || variants.English || '';
  return variants[language] || variants.Hinglish || variants.English || Object.values(variants)[0] || '';
}

function joinParts(parts = []) {
  return parts.map((part) => String(part || '').trim()).filter(Boolean).join(' ');
}

function cleanCounselorReply(reply = '') {
  return String(reply || '')
    .replace(/^\s*Theek hai,\s*jankari rakh li\.\s*Theek hai,/i, 'Theek hai,')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/\s+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function asksAboutProofUse(text = '') {
  const lower = String(text || '').toLowerCase();
  const proofWord = /video|photo|pic|sample|typing sample|screen|record|recording|proof|saboot|sabot|certificate|marksheet|voice note|awaaz|आवाज|वीडियो|फोटो|सबूत|प्रमाण/.test(
    lower,
  );
  const questionWord = /\b(?:kya|kyu|kyon|kaise|karna|krna|karu|what|why|how|use|share|send|bhejna|dikhana)\b|karna h|krna h|क्यों|क्या|कैसे|करना|भेजना|दिखाना/.test(
    lower,
  );
  return proofWord && questionWord;
}

function proofUseReply(profile = {}, latestText = '', { profileReady = false } = {}) {
  const target =
    profile.learner_goal?.label ||
    (profile.aspirations || []).filter((item) => !/video creation|voice note|photo proof/i.test(item)).slice(0, 2).join(', ') ||
    'kaam';
  const readyNext = profileReady
    ? 'Ab Rasta button dabao, Meera isi saboot aur profile se safe options banayegi.'
    : 'Agle step ke liye bas apni jagah, safe travel, aur time clear karna hai.';
  return localizedLine(profile, latestText, {
    English: `The video is only simple proof for ${target}: for typing, record 20-30 seconds showing a few lines typed clearly. It is shared only after your consent. ${profileReady ? 'Press the Pathway button now.' : 'I will ask one more small question if needed.'}`,
    Hinglish: `Video sirf ${target} ka chhota saboot hai: typing ke liye 20-30 second mein screen/keyboard par 4-5 line type karte hue dikhao. Ye sirf aapki anumati ke baad share hoga. ${readyNext}`,
    Hindi: `वीडियो सिर्फ ${target} का छोटा सबूत है: typing के लिए 20-30 सेकंड में screen/keyboard पर 4-5 लाइन type करते हुए दिखाइए। यह सिर्फ आपकी अनुमति के बाद share होगा।`,
    Marathi: `Video ha fakta ${target} cha chhota proof aahe: typing sathi 20-30 second screen/keyboard var 4-5 line type kartana dakhva. He fakt tumchya permission nantar share hoil.`,
    Odia: `Video କେବଳ ${target} ର ଛୋଟ proof: typing ପାଇଁ 20-30 second screen/keyboard ରେ 4-5 line type କରୁଥିବା ଦେଖାନ୍ତୁ. ଆପଣଙ୍କ permission ପରେ ମାତ୍ର share ହେବ.`,
    Bengali: `Video শুধু ${target}-এর ছোট proof: typing হলে 20-30 second screen/keyboard-এ 4-5 line type করা দেখান. আপনার permission ছাড়া share হবে না.`,
    Tamil: `Video என்பது ${target} க்கு சிறிய proof மட்டும்: typing என்றால் 20-30 second screen/keyboard-ல் 4-5 line type செய்வதை காட்டுங்கள். உங்கள் permission இல்லாமல் share ஆகாது.`,
  });
}

function asksWhatToDoNext(latestText = '') {
  const raw = String(latestText || '');
  const text = raw.toLowerCase();
  return (
    /\b(ab|aage|age|next|now)\b.{0,40}\b(kya|what|karna|krna|karu|kru|kare|kre|do|step)\b/i.test(text) ||
    /\b(kya|what)\b.{0,40}\b(karna|krna|karu|kru|kare|kre|do|next|step)\b/i.test(text) ||
    /(?:अब|आगे).{0,40}(?:क्या|करना|करूं|करूँ)/.test(raw)
  );
}

function nextActionReply(profile = {}, latestText = '') {
  return localizedLine(profile, latestText, {
    English:
      'Now press My Pathway or Generate pathway. Meera will make the route from this profile; ask anything else here.',
    Hinglish:
      'Ab Mera Rasta ya Rasta banao dabao. Meera isi jankari se rasta banayegi; kuch aur poochna ho to yahin poochho.',
    Hindi:
      'अब मेरा रास्ता या रास्ता बनाएं दबाइए। मीरा इसी जानकारी से रास्ता बनाएगी; कुछ और पूछना हो तो यहीं पूछिए।',
    Marathi:
      'Ata Maza Marg kiwa Pathway banava daba. Meera ya mahitivarun marg banavel; ajun kahi vicharayche asel tar ithe vichara.',
    Odia:
      'Ebe Mo Bata ba Pathway banantu dabantu. Meera ei tathya ru bata banai deb; au kichhi pachariba thile ethare pacharantu.',
    Bengali:
      'Ebar Amar Path ba Pathway banan chapun. Meera ei tothyo diye path banabe; aro kichhu jiggesh korte hole ekhanei korun.',
    Tamil:
      'Ippoluthu En Pathai allathu Pathway uruvaakku button-ai azhuthungal. Meera indha vivarathil irundhu pathai seyyum; vera kelvi irundhaal inge kelungal.',
  });
}

function normalizeComparable(value) {
  if (Array.isArray(value)) return value.map(normalizeComparable).filter(Boolean).join('|');
  return String(value ?? '').trim().toLowerCase();
}

function readyReply(profile = {}, latestText = '') {
  const goal = profile.learner_goal;
  const aspirations = (profile.aspirations || []).join(', ') || 'target role';
  const locationText = profile.relocation_preference || profile.location || 'aapki location';
  if (goal?.type === 'entrance_exam_prep' || profile.academic_goal?.type === 'entrance_exam_prep') {
    return entranceExamReply(profile, latestText);
  }
  if (goal?.intent === 'study') {
    return phrase(profile, latestText, 'study_ready', {
      focus: profile.academic_goal?.subjects?.join(', ') || profile.academic_goal?.target || profile.class_level || 'study',
    });
  }
  if (/data science|machine learning|analytics|python|sql/i.test(`${aspirations} ${latestText}`)) {
    return phrase(profile, latestText, 'job_ready', {
      goal: 'Data Science / Analyst',
      location: locationText,
    });
  }
  if (goal?.intent === 'job') {
    return phrase(profile, latestText, 'job_ready', { goal: aspirations, location: locationText });
  }
  if (goal?.intent === 'training') {
    return phrase(profile, latestText, 'training_ready', {
      goal: aspirations,
      location: profile.location || locationText,
    });
  }
  if (goal?.intent === 'college') {
    return phrase(profile, latestText, 'job_ready', { goal: aspirations, location: locationText });
  }
  if (goal?.intent === 'proof_to_work') {
    return phrase(profile, latestText, 'proof_ready', {});
  }
  return phrase(profile, latestText, 'need_skill', {});
}

function conciseReadyReply(profile = {}, latestText = '', modelReply = '') {
  if (lowEducationProfile(profile, latestText)) {
    return lowEducationLine(profile, latestText, 'ready');
  }
  const intent = profile.learner_goal?.intent || '';
  if (intent === 'study') {
    return localizedLine(profile, latestText, {
      English: 'Good, I have enough to make a study plan now. I will keep it focused on weak topics and daily practice.',
      Hinglish: 'Theek hai, ab padhai ki yojana ban sakti hai. Meera kamzor topics aur roz ki practice par dhyan rakhegi.',
      Hindi: 'ठीक है, अब पढ़ाई की योजना बन सकती है। मीरा कमजोर हिस्सों और रोज़ के अभ्यास पर ध्यान रखेगी।',
      Marathi: 'Theek aahe, ata study plan banu shakto. Weak topics ani daily practice var focus thevu.',
    });
  }
  if (intent === 'job' || intent === 'college') {
    return localizedLine(profile, latestText, {
      English: 'Good, I have enough to build the pathway. Press My Pathway or Generate pathway; jobs will show only after proof and consent.',
      Hinglish: 'Theek hai, rasta banane ke liye jankari kafi hai. Ab Mera Rasta ya Rasta banao dabao; mauke sirf saboot aur anumati ke baad dikhengi.',
      Hindi: 'ठीक है, रास्ता बनाने के लिए जानकारी काफी है। मौके सिर्फ मेल, सबूत और आपकी अनुमति के बाद दिखेंगे।',
      Marathi: 'ठीक आहे, रस्ता बनवण्यासाठी माहिती पुरेशी आहे. कामाचे पर्याय fit, proof आणि तुमच्या permission नंतरच दिसतील.',
      Odia: 'ଠିକ ଅଛି, ରାସ୍ତା ବନାଇବା ପାଇଁ ତଥ୍ୟ ପର୍ଯ୍ୟାପ୍ତ। fit, proof ଓ ଆପଣଙ୍କ permission ପରେ ମାତ୍ର ମୌକା ଦେଖାଯିବ।',
      Bengali: 'ঠিক আছে, রাস্তা বানানোর জন্য তথ্য যথেষ্ট। fit, proof আর আপনার permission-এর পরে তবেই সুযোগ দেখানো হবে।',
      Tamil: 'சரி, பாதை உருவாக்க தகவல் போதும். fit, proof, உங்கள் permission பிறகே வாய்ப்புகள் காட்டப்படும்.',
    });
  }
  if (intent === 'self_employment') {
    return localizedLine(profile, latestText, {
      English: 'Good, I have enough to build the small-business pathway. I will check training, cost, buyer, supplier, scheme, and loan risk before any next step.',
      Hinglish: 'Theek hai, chhote vyapar ka rasta banane ke liye jankari kafi hai. Meera training, kharcha, buyer, supplier, scheme aur loan risk pehle check karegi.',
      Hindi: 'ठीक है, छोटे व्यापार का रास्ता बनाने के लिए जानकारी काफी है। मीरा पहले training, खर्च, buyer, supplier, योजना और loan risk check करेगी।',
      Marathi: 'ठीक आहे, छोट्या व्यवसायाचा मार्ग बनवण्यासाठी माहिती पुरेशी आहे. Meera आधी training, खर्च, buyer, supplier, scheme आणि loan risk तपासेल.',
      Odia: 'ଠିକ ଅଛି, ଛୋଟ business ରାସ୍ତା ପାଇଁ ତଥ୍ୟ ପର୍ଯ୍ୟାପ୍ତ। Meera ପ୍ରଥମେ training, ଖର୍ଚ୍ଚ, buyer, supplier, scheme ଓ loan risk check କରିବ।',
      Bengali: 'ঠিক আছে, ছোট business-এর রাস্তা বানানোর জন্য তথ্য যথেষ্ট। Meera আগে training, খরচ, buyer, supplier, scheme আর loan risk check করবে।',
      Tamil: 'சரி, சிறு business பாதைக்கு தகவல் போதும். Meera முதலில் training, செலவு, buyer, supplier, scheme, loan risk சரிபார்க்கும்.',
    });
  }
  if (intent === 'training') {
    return localizedLine(profile, latestText, {
      English: 'Good, I can build the training route now. I will check safe travel, fees, proof, and placement risk.',
      Hinglish: 'Theek hai, seekhne ka rasta ban sakta hai. Meera surakshit aana-jaana, fees, saboot, aur kaam milne ka risk check karegi.',
      Hindi: 'ठीक है, सीखने का रास्ता बन सकता है। मीरा सुरक्षित आना-जाना, फीस, सबूत और काम मिलने का जोखिम जाँचेगी।',
      Marathi: 'ठीक आहे, training चा रस्ता बनू शकतो. Meera safe travel, fees, proof आणि काम मिळण्याचा risk तपासेल.',
      Odia: 'ଠିକ ଅଛି, training ରାସ୍ତା ବନିପାରିବ। Meera safe travel, fees, proof ଓ କାମ ମିଳିବା risk check କରିବ।',
      Bengali: 'ঠিক আছে, training-এর রাস্তা বানানো যাবে। Meera safe travel, fees, proof আর কাজ পাওয়ার risk check করবে।',
      Tamil: 'சரி, training பாதை உருவாக்கலாம். Meera safe travel, fees, proof, வேலை கிடைக்கும் risk எல்லாம் சரிபார்க்கும்.',
    });
  }
  return localizedLine(profile, latestText, {
    English: 'Good, I have enough for the next step. I will keep the pathway simple and tied to this profile.',
    Hinglish: 'Theek hai, agle kadam ke liye jankari kafi hai. Rasta isi jankari se juda rahega.',
    Hindi: 'ठीक है, अगले कदम के लिए जानकारी काफी है। रास्ता इसी जानकारी से जुड़ा रहेगा।',
    Marathi: 'ठीक आहे, पुढच्या पावलासाठी माहिती पुरेशी आहे. रस्ता या profile शी जोडलेला राहील.',
    Odia: 'ଠିକ ଅଛି, ପରବର୍ତ୍ତୀ କଦମ ପାଇଁ ତଥ୍ୟ ପର୍ଯ୍ୟାପ୍ତ। ରାସ୍ତା ଏହି profile ସହିତ ଜୁଡ଼ି ରହିବ।',
    Bengali: 'ঠিক আছে, পরের ধাপের জন্য তথ্য যথেষ্ট। রাস্তা এই profile-এর সঙ্গে যুক্ত থাকবে।',
    Tamil: 'சரி, அடுத்த படிக்கு தகவல் போதும். பாதை இந்த profile-க்கு இணைந்திருக்கும்.',
  });
}

function usableModelReply(reply = '') {
  const text = String(reply || '').trim();
  if (isGenericReply(text)) return '';
  return text;
}

function replyMatchesLanguage(reply = '', profile = {}, latestText = '') {
  const text = String(reply || '').trim();
  if (!text) return false;
  const script = languageVoiceProfile(profile, latestText).reply_script;
  const scriptPatterns = Object.fromEntries(
    Object.entries(INDIC_SCRIPT_RANGES).map(([name, range]) => [name, new RegExp(`[${range}]`)]),
  );
  if (script === 'Latin') return !/[\u0900-\u0D7F]/.test(text);
  return scriptPatterns[script] ? scriptPatterns[script].test(text) && !containsForeignIndicScript(text, script) : true;
}

function guardCounselorReplyLanguage(reply = '', profile = {}, latestText = '', missing = []) {
  const language = languageVoiceProfile(profile, latestText).preferred_language;
  const allowHinglish = ['Hindi', 'Hinglish', 'English'].includes(language);
  let text = cleanCounselorReply(reply);
  if (!allowHinglish) {
    text = text
      .replace(/^\s*(?:theek|thik|haan|haanji|ok|okay|got it|samajh|jankari|save kar|theek aahe|save kele)[^.!?\u0964]*[.!?\u0964]?\s*/i, '')
      .replace(/^\s*(?:theek|thik|haan|haanji|ok|okay|got it|samajh|jankari|save kar|theek aahe|save kele)[^.!?\u0964]*[.!?\u0964]?\s*/i, '')
      .trim();
  }
  if (replyMatchesLanguage(text, profile, latestText)) return text;
  const field = nextBestIntakeField(missing, profile);
  const fallbackByLanguage = {
    Odia: {
      location: 'ଆପଣ ଏବେ କେଉଁ ଜିଲ୍ଲା କିମ୍ବା ଗାଁରେ ଅଛନ୍ତି?',
      time_available: 'ଦିନକୁ କେତେ ସମୟ ଦେଇପାରିବେ?',
      phone_access: 'ଆପଣଙ୍କ ପାଖରେ ନିଜ phone ଅଛି କି shared phone?',
      mobility_signal: 'ଘରୁ ଦିନକୁ କେତେ ଦୂର ସୁରକ୍ଷିତ ଭାବେ ଯାଇପାରିବେ?',
      skill_signal: 'କେଉଁ କାମ କିମ୍ବା ହୁନର ପ୍ରଥମେ ଶିଖିବାକୁ ଚାହୁଁଛନ୍ତି?',
      default: 'ପରବର୍ତ୍ତୀ ଛୋଟ ତଥ୍ୟ କହନ୍ତୁ, ମୁଁ ରାସ୍ତା ତିଆରି କରିବି.',
    },
    Bengali: {
      location: 'আপনি এখন কোন জেলা বা গ্রামে আছেন?',
      time_available: 'দিনে কত সময় দিতে পারবেন?',
      phone_access: 'আপনার নিজের phone আছে, না shared phone?',
      mobility_signal: 'বাড়ি থেকে রোজ কত দূর নিরাপদে যেতে পারবেন?',
      skill_signal: 'প্রথমে কোন কাজ বা দক্ষতা শিখতে চান?',
      default: 'পরের ছোট তথ্যটি বলুন, আমি আপনার পথ তৈরি করব।',
    },
    Tamil: {
      location: 'நீங்கள் இப்போது எந்த மாவட்டம் அல்லது ஊரில் இருக்கிறீர்கள்?',
      time_available: 'தினமும் எவ்வளவு நேரம் தர முடியும்?',
      phone_access: 'உங்களிடம் தனி phone உள்ளதா, shared phone ஆ?',
      mobility_signal: 'வீட்டிலிருந்து தினமும் எவ்வளவு தூரம் பாதுகாப்பாக செல்ல முடியும்?',
      skill_signal: 'முதலில் எந்த வேலைத் திறனை கற்க விரும்புகிறீர்கள்?',
      default: 'அடுத்த சிறிய தகவலைச் சொல்லுங்கள், நான் உங்கள் பாதையை உருவாக்குவேன்.',
    },
    Marathi: {
      location: 'तुम्ही आत्ता कोणत्या जिल्हा किंवा गावात आहात?',
      time_available: 'दररोज किती वेळ देऊ शकता?',
      phone_access: 'तुमच्याकडे स्वतःचा phone आहे की shared phone?',
      mobility_signal: 'घरातून रोज किती दूर सुरक्षित जाऊ शकता?',
      skill_signal: 'सगळ्यात आधी कोणते काम किंवा कौशल्य शिकायचे आहे?',
      default: 'पुढची छोटी माहिती सांगा, मी तुमचा मार्ग तयार करेन.',
    },
  };
  const languageFallback = fallbackByLanguage[language];
  return languageFallback?.[field] || languageFallback?.default || text;
}

const INDIC_SCRIPT_RANGES = {
  Devanagari: '\\u0900-\\u097F',
  Bengali: '\\u0980-\\u09FF',
  Gurmukhi: '\\u0A00-\\u0A7F',
  Gujarati: '\\u0A80-\\u0AFF',
  Odia: '\\u0B00-\\u0B7F',
  Tamil: '\\u0B80-\\u0BFF',
  Telugu: '\\u0C00-\\u0C7F',
  Kannada: '\\u0C80-\\u0CFF',
  Malayalam: '\\u0D00-\\u0D7F',
};

function containsForeignIndicScript(value = '', expectedScript = '') {
  const text = String(value || '').replace(/[\u0964\u0965]/g, '');
  if (!text) return false;
  if (expectedScript === 'Latin') return /[\u0900-\u0D7F]/.test(text);
  const foreignRanges = Object.entries(INDIC_SCRIPT_RANGES)
    .filter(([script]) => script !== expectedScript)
    .map(([, range]) => range)
    .join('');
  return foreignRanges ? new RegExp(`[${foreignRanges}]`).test(text) : false;
}

function scrubForeignScriptFields(profile = {}, latestText = '') {
  const script = languageVoiceProfile(profile, latestText).reply_script;
  const scrubString = (value = '') => (containsForeignIndicScript(value, script) ? '' : value);
  const scrubArray = (values = []) => (Array.isArray(values) ? values.filter((value) => !containsForeignIndicScript(value, script)) : []);
  return {
    ...profile,
    location: scrubString(profile.location || ''),
    aspirations: scrubArray(profile.aspirations),
    skills: scrubArray(profile.skills),
    proof_available: scrubArray(profile.proof_available),
    content_preferences: scrubArray(profile.content_preferences),
    support_needs: scrubArray(profile.support_needs),
    academic_goal: profile.academic_goal
      ? {
          ...profile.academic_goal,
          subjects: scrubArray(profile.academic_goal.subjects),
          target: scrubString(profile.academic_goal.target || ''),
        }
      : profile.academic_goal,
  };
}

function directLatestReply(profile = {}, latestText = '', previousProfile = {}) {
  const lower = String(latestText || '').toLowerCase();
  const goal = profile.learner_goal || {};
  const explicitSwitch = /switch.*career|career.*switch|job counseling|employability/i.test(lower);
  const additiveCareerAsk = /job.*also|internship.*also|career.*also|ab.*job|now.*job/i.test(lower);
  const previousWasStudy =
    previousProfile.learner_goal?.intent === 'study' ||
    Boolean(previousProfile.academic_goal?.type) ||
    /school|study|exam|marks|board|jee|neet/i.test(`${(previousProfile.aspirations || []).join(' ')} ${previousProfile.class_level || ''}`);
  if (explicitSwitch || (previousWasStudy && additiveCareerAsk)) {
    return phrase(profile, latestText, 'career_switch', {});
  }
  if (asksAboutProofUse(latestText)) {
    return proofUseReply(profile, latestText, { profileReady: Boolean(profile.profile_complete) });
  }
  if (profile.profile_complete && asksWhatToDoNext(latestText)) {
    return nextActionReply(profile, latestText);
  }
  if (
    (goal.needs_location_for_offline || ['job', 'training', 'proof_to_work', 'career'].includes(goal.intent)) &&
    !profile.location &&
    !profile.relocation_preference
  ) {
    return phrase(profile, latestText, 'need_location', {});
  }
  if (/resume|cv/i.test(lower) && /\b(nahi|nahin|nhi|can't|cannot|can not|not able|unable)\b|bana\s+nahi|bna\s+nahi/i.test(lower)) {
    if (lowEducationProfile(profile, latestText)) {
      return localizedLine(profile, latestText, {
        English: 'No problem. Meera can build simple shareable proof from this chat, photos, voice notes, or sample work.',
        Hinglish: 'Koi baat nahi. Meera isi chat, photo, voice note, ya sample kaam se simple shareable proof bana sakti hai.',
        Hindi: 'कोई बात नहीं. Meera इसी chat, photo, voice note या sample काम से आसान shareable proof बना सकती है.',
        Tamil: 'பரவாயில்லை. இந்த chat, photo, voice note, அல்லது sample வேலை வைத்து Meera எளிய shareable proof உருவாக்கலாம்.',
      });
    }
    return localizedLine(profile, latestText, {
      English: 'No problem. I can build a simple truthful resume from this chat and your certificate/photo proof.',
      Hinglish: 'Koi baat nahi. Meera isi chat aur certificate/photo proof se simple truthful resume bana sakti hai.',
      Hindi: 'कोई बात नहीं. मीरा इसी chat और certificate/photo proof से simple truthful resume बना सकती है.',
      Marathi: 'Kahi problem nahi. Ya chat ani certificate/photo proof varun mi simple truthful resume banavu shakto.',
    });
  }
  if (/resume|cv/i.test(lower) && !profile.proof_available?.some((item) => /resume|cv/i.test(item))) {
    return `${phrase(profile, latestText, 'direct_answer_prefix')} ${phrase(profile, latestText, 'need_skill', {})}`;
  }
  if (/pathway|pathwat|raasta|rasta|roadmap|next step|plan/i.test(lower)) {
    return localizedLine(profile, latestText, {
      English: 'Yes. I can build the pathway now from this profile.',
      Hinglish: 'Haan. Ab isi profile se Meera pathway bana sakti hai.',
      Hindi: 'हाँ. अब इसी profile से मीरा pathway बना सकती है.',
      Marathi: 'Ho. Ata ya profile varun pathway banu shakto.',
    });
  }
  if (/connect|hirer|hiring|founder|employer|mail|email|outreach|contact/i.test(lower) && goal.intent === 'job') {
    return phrase(profile, latestText, 'job_ready', {
      goal: (profile.aspirations || ['target role']).join(', '),
      location: profile.relocation_preference || profile.location || 'your location',
    });
  }
  return '';
}

function avoidRepeat(reply = '', previous = '', profile = {}, latestText = '') {
  const clean = String(reply || '').trim();
  const previousClean = String(previous || '').trim();
  if (!clean) return conciseReadyReply(profile, latestText);
  if (previousClean && clean.toLowerCase() === previousClean.toLowerCase()) {
    if (profile.profile_complete && asksWhatToDoNext(latestText)) return nextActionReply(profile, latestText);
    if (profile.profile_complete) return nextActionReply(profile, latestText);
    const nextField = nextBestIntakeField(profile.missing_fields || [], profile);
    return oneThingQuestion(nextField, profile, latestText);
  }
  return clean;
}

function fallbackCounselor({ messages, profile }) {
  const text = messages.filter((message) => message.role === 'user').map((message) => message.content).join('\n');
  const latestText = latestUserContent(messages);
  const extracted = applyLowEducationSignal(mergeProfile(profile, fallbackProfileFromTranscript(text), { latestText }), latestText);
  const { missing, complete } = profileCompleteness(extracted);
  const nextQuestion = nextQuestionForMissing(missing, extracted, latestText);

  return {
    reply: complete ? readyReply(extracted, latestText) : nextQuestion,
    profile: { ...extracted, profile_complete: complete },
    profile_complete: complete,
    missing_fields: missing,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  try {
    const body = await readJson(req);
    const profile = body.profile || {};
    let messages = body.messages || [];
    let stt = null;
    if (body.audioBase64) {
      const browserTranscript = String(body.browserTranscript || '').trim();
      stt = await transcribeSarvamAudio({
        audioBase64: body.audioBase64,
        fileName: body.fileName || 'counselor-voice.webm',
        languageCode: body.languageCode || voiceLanguageCode(profile, latestUserContent(messages)),
      });
      const voiceText = String(stt.transcript || browserTranscript || '').trim();
      if (!voiceText) {
        const retryProfile = withLanguageMetadata(
          {
            ...profile,
            learner_id: profile.learner_id || body.learner_id || null,
          },
          latestUserContent(messages),
        );
        return sendJson(res, 200, {
          reply: phrase(retryProfile, latestUserContent(messages), 'voice_retry', {}),
          profile: retryProfile,
          profile_complete: Boolean(retryProfile.profile_complete),
          missing_fields: retryProfile.missing_fields || [],
          intent: { learner_goal: retryProfile.learner_goal || null },
          language: languageVoiceProfile(retryProfile, latestUserContent(messages)),
          proof: {
            counselor: {
              ok: false,
              provider: 'voice_retry',
              model: null,
              fallback_chain: [],
              error: stt?.error || 'Voice transcription did not produce text.',
            },
            stt,
            language: languageVoiceProfile(retryProfile, latestUserContent(messages)),
            memory: { ok: false, table: 'conversations', error: 'Voice retry was not saved as a learner message.' },
          },
        });
      }
      if (!stt.transcript && browserTranscript) {
        stt = {
          ...stt,
          transcript: browserTranscript,
          ok: true,
          provider: 'browser_speech_recognition_fallback',
          error: stt?.error || null,
        };
      }
      messages = [...messages, { role: 'user', content: voiceText }];
    }
    const latestText = latestUserContent(messages);
    const previousAssistant = latestAssistantContent(messages);
    const entranceExamIntent = isEntranceExamPrepText(latestText);
    const academicIntent = !entranceExamIntent && isAcademicPrepText(latestText);
    const schoolStudyIntent = !entranceExamIntent && !academicIntent && isSchoolStudyText(latestText);
    const fallback = fallbackCounselor({ messages, profile });
    const generated = await callClaudeJson({
      fallback,
      maxTokens: 420,
      system: `You are VidyaSetu, a 24/7 multilingual India career and learning counselor for school learners, entrance-exam aspirants, college learners, formal job seekers, informal workers, vocational trainees, and self-employment/enterprise aspirants. ${languageInstruction(profile, latestText)} Detect the learner goal before asking questions. The latest user message wins when it clearly changes goal. Intake must feel like a counselor conversation, not a form or chatbot demo: answer the learner's direct question first, then ask only one next-best question. Keep the spoken reply short: maximum two short sentences. Do not summarize the whole profile unless the learner explicitly asks for a summary. Do not use markdown, stars, bullet symbols, numbered lists, headings, or tables because voice will read them aloud. Meera is the female counselor voice; use female or neutral wording for Meera and do not assume learner gender. Build the structured profile silently in JSON. When asking about education, use learner words in the learner's language: school, college, work, learning a skill, or school was not possible. Do not say stage, dropout, graduate, diploma, ITI, or resume unless the learner used those words first. If the selected or detected learner language is Odia, Bengali, Tamil, Marathi, Telugu, Kannada, Malayalam, Gujarati, or Punjabi, do not start with Hinglish/Hindi filler such as "Theek hai", "jankari rakh li", "save kar liya", or "samajh gaya"; use that language and script for the main reply. If the learner says they never studied, did not go to school, cannot read, or does not understand formal education/job words, record that as education_status/support_need and do not ask class/stage/school/ITI/diploma/resume questions unless the learner asks for them. For low/no-schooling learners, use simple words and ask one concrete question at a time: work interest, district/village, daily time, safe travel, phone access, or simple proof such as photo, video, voice note, or sample work. If enough information is available, tell them to press the pathway/rasta button and invite any other question. If the learner wants poultry, mushroom, food processing, home business, shop, loan, scheme, or self-employment, classify it as enterprise setup; gather location, space/resources, starter budget/loan need, training access, buyer channel, and risk constraints one at a time; do not show job outreach as the main path. Extract profile facts only from user messages, never from assistant messages. Never copy the previous assistant reply. If the learner changes any fact or goal later, update the profile silently and acknowledge briefly. Offline jobs/training/enterprise support must not be recommended without current location plus commute or local-office travel preference. Never ask caste, religion, or community. Do not shame dropout, low marks, informal work, or career gaps. Return strict JSON only.`,
      prompt: `Current profile:\n${JSON.stringify(profile)}\n\nLatest user message:\n${latestText}\n\nPrevious assistant reply to avoid repeating:\n${previousAssistant}\n\nConversation:\n${JSON.stringify(messages)}\n\nReturn JSON: { "reply": "short warm counselor response in the learner's current language and script. Maximum two short sentences. No markdown, no stars, no bullets, no full profile recap. Do not sound like a generic AI assistant. Do not use Hinglish/Hindi acknowledgements like Theek hai, jankari rakh li, save kar liya, or samajh gaya unless the learner language is Hindi/Hinglish. Meera is female; use female or neutral wording for Meera, and do not assume learner gender. Answer direct questions first. Ask at most one next-best question if information is missing. If asking education, say it simply in the learner's language: school, college, work, learning a skill, or school was not possible. Do not say stage, dropout, graduate, diploma, ITI, or resume unless the learner used those words first. If enough information is available, say the next step briefly and tell the learner to press the pathway/rasta button. If user wants a job plan, mention proof/resume, pathway, opportunity search, or consent only when relevant. If the learner has low/no schooling, do not use class/stage/school/ITI/diploma/resume wording; ask about work interest, location, time, safe travel, phone, or simple photo/video/voice/sample proof. If user wants self-employment/enterprise/loan/scheme, mention setup roadmap, scheme/loan caution, buyer/supplier verification, and risk checks instead of job cards. If user changes to a study/exam goal, do not mention old job/outreach pipeline.", "profile": { "name": string, "age": number, "class_level": string, "education_status": string, "location": string, "commute_km": number, "commute_constraint": string, "relocation_preference": string, "aspirations": string[], "skills": string[], "proof_available": string[], "phone_access": string, "device": string, "time_available": string, "earning_urgency": "immediate" | "1-2 months" | "after training" | "not sure", "income_pressure": boolean, "language": string, "preferred_language": string, "content_preferences": string[], "support_needs": string[], "profile_complete": boolean }, "profile_complete": boolean, "missing_fields": string[] }`,
    });

    const mergedGeneratedProfile = mergeProfile(profile, generated.data.profile || {}, { latestText });
    let nextProfile = applyLatestSignals(mergedGeneratedProfile, latestText);
    nextProfile = applyLowEducationSignal(nextProfile, latestText);
    nextProfile = applyEntranceExamIntent(nextProfile, latestText);
    nextProfile = applyAcademicIntent(nextProfile, latestText);
    nextProfile = applySchoolStudyIntent(nextProfile, latestText);
    nextProfile = applyGeneralGoal(nextProfile, latestText);
    nextProfile = preserveExactGoalFromSignals(nextProfile, latestText, profile);
    nextProfile = applyLowEducationSignal(nextProfile, latestText);
    nextProfile = preserveSelectedLanguage(profile, nextProfile);
    nextProfile = withLanguageMetadata(nextProfile, latestText);
    nextProfile = scrubForeignScriptFields(nextProfile, latestText);
    if (suspiciousName(nextProfile.name)) {
      nextProfile.name = suspiciousName(profile.name) ? '' : profile.name || '';
    }
    if (previousAskedName(previousAssistant)) {
      const heardName = shortNameCandidate(latestText);
      if (heardName) nextProfile.name = heardName;
    }
    if (refusesLocation(latestText)) {
      nextProfile.location = '';
    } else if (suspiciousLocation(nextProfile.location)) {
      nextProfile.location = suspiciousLocation(profile.location) ? '' : profile.location || '';
    }
    nextProfile.learner_id = profile.learner_id || body.learner_id || null;
    const { complete, missing } = profileCompleteness(nextProfile);
    const needsNameFirst = !nextProfile.name && !refusesName(latestText);
    const profileReady = !needsNameFirst && complete;
    const effectiveMissing = needsNameFirst ? ['name', ...missing.filter((field) => field !== 'name')] : missing;
    nextProfile.profile_complete = profileReady;
    nextProfile.missing_fields = profileReady && (entranceExamIntent || academicIntent || schoolStudyIntent) ? [] : effectiveMissing;
    nextProfile.profile_confidence = profileConfidence(nextProfile, nextProfile.missing_fields);
    nextProfile.persona = counselorPersona(nextProfile);
    nextProfile.last_updated = new Date().toISOString();
    const candidateModelReply = generated.ok ? usableModelReply(generated.data.reply) : '';
    const modelReply = replyMatchesLanguage(candidateModelReply, nextProfile, latestText) ? candidateModelReply : '';
    const directReply = directLatestReply(nextProfile, latestText, profile);
    const rawReply = buildStepwiseReply({
      previousProfile: profile,
      profile: nextProfile,
      missing: effectiveMissing,
      profileReady,
      latestText,
      previousAssistant,
      modelReply: entranceExamIntent
        ? entranceExamReply(nextProfile, latestText)
        : academicIntent
          ? academicReply(nextProfile, latestText)
          : schoolStudyIntent
            ? schoolStudyReply(nextProfile, latestText)
          : modelReply,
      directReply,
    });
    const reply = guardCounselorReplyLanguage(rawReply, nextProfile, latestText, effectiveMissing);

    const savedMessages = [...messages, { role: 'assistant', content: reply }];
    let conversationPersistence = { ok: false, error: 'No learner_id yet' };
    if (body.learner_id || nextProfile.learner_id) {
      const learnerId = body.learner_id || nextProfile.learner_id;
      const existingConversation = await selectRows('conversations', {
        filters: { learner_id: learnerId },
        order: 'updated_at.desc',
        limit: 1,
      });
      const existing = existingConversation.ok ? existingConversation.data?.[0] : null;
      if (existing?.id) {
        conversationPersistence = await patchRows('conversations', { id: existing.id }, {
          messages: savedMessages,
          profile_json: nextProfile,
          last_summary: reply,
          updated_at: new Date().toISOString(),
        });
      } else {
        conversationPersistence = await insertRows('conversations', {
          learner_id: learnerId,
          phone_hash: body.phone_hash || null,
          messages: savedMessages,
          profile_json: nextProfile,
          last_summary: reply,
        });
      }
      await patchRows('learners', { id: learnerId }, {
        name: nextProfile.name || 'Learner',
        language: nextProfile.preferred_language || nextProfile.language || 'Hindi or local language',
        location: nextProfile.location || '',
        profile_json: nextProfile,
        updated_at: new Date().toISOString(),
      });
    }

    return sendJson(res, 200, {
      reply,
      profile: nextProfile,
      profile_complete: profileReady,
      missing_fields: nextProfile.missing_fields,
      intent: {
        entrance_exam_prep: entranceExamIntent,
        academic_prep: academicIntent,
        school_study: schoolStudyIntent,
        learner_goal: nextProfile.learner_goal,
      },
      language: languageVoiceProfile(nextProfile, latestText),
      proof: {
        counselor: {
          ok: generated.ok,
          provider: generated.provider,
          model: generated.model || null,
          fallback_chain: generated.fallback_chain || [],
          error: generated.error,
        },
        stt,
        language: languageVoiceProfile(nextProfile, latestText),
        memory: { ok: conversationPersistence.ok, table: 'conversations', error: conversationPersistence.error },
      },
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}
