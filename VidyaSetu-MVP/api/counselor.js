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

function mergeProfile(base = {}, update = {}) {
  const merged = { ...base };
  Object.entries(update || {}).forEach(([key, value]) => {
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
    /actually|instead|change(?:d)?|\bab\b|now|also|too|sirf|only|bas|but|first|pehle|career|job|internship|placement|training|course|naukri|पहले|बट/i.test(
      latestText,
    );
  const latestChangesLane =
    existingGoal?.intent &&
    extractedGoal?.intent &&
    extractedGoal.intent !== 'unknown' &&
    extractedGoal.intent !== existingGoal.intent &&
    /job|naukri|career|internship|placement|training|course|study|exam|jee|neet|marks|score|padh|padhai|पढ़|नौकरी|परीक्षा/i.test(
      latestText,
    );
  const shouldUseLatest =
    !existingGoal ||
    (['open_counseling', 'goal_clarification_needed'].includes(existingGoal.type) && hasMeaningfulExtractedGoal) ||
    extractedGoal?.type === 'informal_skill_validation' ||
    extractedGoal?.type === 'entrance_exam_prep' ||
    extractedGoal?.intent === 'study' ||
    latestChangesLane ||
    (latestExplicitChange && hasMeaningfulExtractedGoal) ||
    (existingGoal.intent === 'unknown' && hasMeaningfulExtractedGoal);
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

function refusesLocation(text = '') {
  return /city.*nahi|location.*nahi|jagah.*nahi|abhi nahi batana|city abhi nahi batana|location abhi nahi/i.test(text);
}

function refusesName(text = '') {
  return /naam.*nahi|name.*nahi|naam.*private|name.*private|abhi.*naam.*nahi|don't want.*name|do not want.*name/i.test(text);
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
    goal: 'Sabse pehle kis kaam ya kamai mein help chahiye: silai, cooking, shop ka kaam, kheti, phone repair, ya kuch aur?',
    location: 'Aap abhi kis district ya gaon mein hain?',
    time: 'Ek din mein kitna time de sakte ho?',
    phone: 'Yeh phone aapka hai ya family ke saath shared hai?',
    mobility: 'Kaam ya training ke liye ghar se kitni door safe ja sakte ho?',
    proof: 'Aapke kaam ka koi simple proof hai, jaise photo, video, voice note, ya sample?',
    ready: 'Theek hai, pathway banane ke liye profile enough hai. Ab Generate Pathway dabao; koi aur sawaal ho to Meera ko yahin poochho.',
  },
  Hindi: {
    saved: 'ठीक है, सेव कर लिया।',
    education: 'स्कूल की पढ़ाई नहीं हुई बताया',
    goal: 'सबसे पहले किस काम या कमाई में मदद चाहिए: सिलाई, खाना बनाना, दुकान का काम, खेती, फोन रिपेयर, या कुछ और?',
    location: 'आप अभी किस जिले या गाँव में हैं?',
    time: 'एक दिन में कितना समय दे सकते हैं?',
    phone: 'यह फोन आपका है या परिवार के साथ साझा है?',
    mobility: 'काम या ट्रेनिंग के लिए घर से कितनी दूर सुरक्षित जा सकते हैं?',
    proof: 'आपके काम का कोई आसान सबूत है, जैसे फोटो, वीडियो, आवाज नोट, या नमूना?',
    ready: 'ठीक है, pathway बनाने के लिए profile काफी है। अब Generate Pathway दबाएँ; कोई और सवाल हो तो Meera से यहीं पूछें।',
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
    goal: 'முதலில் எந்த வேலை அல்லது வருமான உதவி வேண்டும்: தையல், சமையல், கடை வேலை, விவசாயம், phone repair, அல்லது வேறு ஏதாவது?',
    location: 'நீங்கள் இப்போது எந்த மாவட்டம் அல்லது ஊரில் இருக்கிறீர்கள்?',
    time: 'ஒரு நாளில் எவ்வளவு நேரம் தர முடியும்?',
    phone: 'இந்த phone உங்களுடையதா, இல்லையா குடும்பத்துடன் பகிர்வதா?',
    mobility: 'வேலை அல்லது பயிற்சிக்காக வீட்டிலிருந்து பாதுகாப்பாக எவ்வளவு தூரம் செல்ல முடியும்?',
    proof: 'உங்கள் வேலைக்கு photo, video, voice note, அல்லது sample போன்ற எளிய proof ஏதாவது இருக்கிறதா?',
    ready: 'சரி, பாதை உருவாக்க உங்கள் விவரம் போதும். இப்போது Pathway உருவாக்கு பொத்தானை அழுத்துங்கள்; வேறு கேள்வி இருந்தால் இங்கே கேளுங்கள்.',
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

function suspiciousName(value = '') {
  const text = String(value || '').trim();
  if (!text) return false;
  if (text.length > 40) return true;
  if (/\b(nahi|nahin|nhi|can't|cannot|can not)\b.*\b(bana|bna|make|create|kar|sakta|sakti|skta|skti|paunga|paungi)\b/i.test(text)) return true;
  return /study|plan|career|job|internship|employability|pathway|course|training|business|school|class|board|cbse|jee|neet|padhai|naukri|skill|location|phone|whatsapp|proof|resume/i.test(
    text,
  );
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
    return Boolean(profile.aspirations?.length || profile.skills?.length || profile.proof_available?.length);
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
  if (['job_search_only', 'formal_skill_job_search', 'college_job_search'].includes(goalType)) {
    return ['skill_signal', ...(profile.relocation_preference ? [] : ['location']), 'mobility_signal'];
  }
  if (['informal_skill_validation', 'vocational_training', 'skill_pathway_exploration'].includes(goalType)) {
    return ['location', 'skill_signal', 'time_available', 'mobility_signal'];
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
    if (['job_search_only', 'formal_skill_job_search'].includes(goalType)) {
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
      Hinglish: 'Sabse pehle kis cheez mein help chahiye: padhai, kaam ka skill seekhna, job, internship, ya chhota business?',
      Hindi: 'सबसे पहले किस चीज़ में मदद चाहिए: पढ़ाई, काम का skill सीखना, नौकरी, internship, या छोटा business?',
      Marathi: 'Sagleat aadhi kashat madat havi: padhai, kaamacha skill, job, internship, ki chhota business?',
      Tamil: 'முதலில் எதில் உதவி வேண்டும்: படிப்பு, வேலை skill கற்றல், job, internship, அல்லது சிறு business?',
      Telugu: 'ముందుగా ఏ విషయంలో సహాయం కావాలి: చదువు, పని skill నేర్చుకోవడం, job, internship, లేదా చిన్న business?',
      Odia: 'ପ୍ରଥମେ କେଉଁଥିରେ ସହାୟତା ଦରକାର: ପଢ଼ା, କାମ skill ଶିଖିବା, job, internship, କିମ୍ବା ଛୋଟ business?',
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
      Hindi: 'आप अभी किस city या district में हैं?',
      Marathi: 'Tumhi sadhya kontya city kiwa district madhe aahat?',
    });
  }
  if (field === 'skill_signal') {
    const goal = profile.learner_goal || {};
    if (lowEducationProfile(profile, latestText)) {
      return lowEducationLine(profile, latestText, 'goal');
    }
    if (goal.intent === 'job' || goal.type === 'job_search_only' || goal.type === 'formal_skill_job_search') {
      return localizedLine(profile, latestText, {
        English: 'Which target role or skill should I prepare you for first? Also mention any proof you already have: resume, certificate, project, sample work, or experience.',
        Hinglish: 'Sabse pehle target role ya skill batao. Saath mein koi proof ho to batao: resume, certificate, project, sample kaam, ya experience.',
        Hindi: 'सबसे पहले target role या skill बताइए. साथ में कोई proof हो तो बताइए: resume, certificate, project, sample काम, या experience.',
        Marathi: 'Sagleat aadhi target role kiwa skill sanga. Proof asel tar sanga: resume, certificate, project, sample work, kiwa experience.',
      });
    }
    if (goal.intent === 'training') {
      return localizedLine(profile, latestText, {
        English: 'Which skill or course do you want to learn first?',
        Hinglish: 'Sabse pehle kaunsa skill ya course seekhna chahte hain?',
        Hindi: 'सबसे पहले कौन-सा skill या course सीखना चाहते हैं?',
        Marathi: 'Sagleat aadhi konta skill kiwa course shikaycha aahe?',
      });
    }
    return localizedLine(profile, latestText, {
      English: 'What is the one goal you want help with first: study, skill training, job, internship, or business?',
      Hinglish: 'Sabse pehle ek goal batao: padhai, skill training, job, internship, ya business?',
      Hindi: 'सबसे पहले एक goal बताइए: पढ़ाई, skill training, job, internship, या business?',
      Marathi: 'Sagleat aadhi ek goal sanga: study, skill training, job, internship, ki business?',
    });
  }
  if (field === 'time_available') return lowEducationProfile(profile, latestText) ? lowEducationLine(profile, latestText, 'time') : phrase(profile, latestText, 'missing_time', {});
  if (field === 'phone_access') return lowEducationProfile(profile, latestText) ? lowEducationLine(profile, latestText, 'phone') : phrase(profile, latestText, 'missing_phone', {});
  if (field === 'mobility_signal') {
    if (lowEducationProfile(profile, latestText)) return lowEducationLine(profile, latestText, 'mobility');
    return localizedLine(profile, latestText, {
      English: 'How far can you safely travel from home each day?',
      Hinglish: 'Ghar se roz kitni door tak safe travel kar sakte hain?',
      Hindi: 'घर से रोज़ कितनी दूर तक safe travel कर सकते हैं?',
      Marathi: 'Gharapasun roj kiti door safe travel karu shakta?',
    });
  }
  if (field === 'proof_available') {
    if (lowEducationProfile(profile, latestText)) return lowEducationLine(profile, latestText, 'proof');
    return localizedLine(profile, latestText, {
      English: 'Do you already have any proof: resume, certificate, project, sample work, score, or work experience?',
      Hinglish: 'Koi proof hai kya: resume, certificate, project, sample kaam, score, ya work experience?',
      Hindi: 'कोई proof है क्या: resume, certificate, project, sample काम, score, या work experience?',
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

  if (/connect|hirer|hiring|founder|employer|mail|email|outreach|contact/i.test(text)) {
    if (lowEducationProfile(profile, latestText)) {
      return localizedLine(profile, latestText, {
        English: 'Yes, Meera can prepare outreach later, but only after your work proof, location, and consent are clear.',
        Hinglish: 'Haan, Meera baad mein outreach taiyar kar sakti hai, par pehle kaam ka proof, location, aur consent clear hona chahiye.',
        Hindi: 'हाँ, Meera बाद में outreach तैयार कर सकती है, लेकिन पहले काम का proof, location और consent साफ होना चाहिए.',
        Tamil: 'ஆம், Meera பிறகு outreach தயார் செய்யலாம்; முதலில் வேலை proof, location, consent தெளிவாக வேண்டும்.',
      });
    }
    return localizedLine(profile, latestText, {
      English:
        'Yes, I can prepare hirer outreach, but only after your proof/resume, target role, location or relocation, and consent are clear.',
      Hinglish:
        'Haan, Meera hirer outreach prepare kar sakti hai, lekin proof/resume, target role, location ya relocation, aur consent clear hone ke baad.',
      Hindi:
        'हाँ, मीरा hirer outreach prepare कर सकती है, लेकिन proof/resume, target role, location या relocation, और consent clear होने के बाद.',
      Marathi:
        'Ho, mi hirer outreach tayar karu shakto, pan proof/resume, target role, location/relocation ani consent clear zalyavar.',
    });
  }
  if (/scheme|loan|business|startup|self.employ|mushroom|poultry|goat|bakri|enterprise/i.test(text)) {
    return localizedLine(profile, latestText, {
      English:
        'Yes, I can build a safe setup plan first: training, cost heads, buyer/supplier checks, scheme eligibility, and loan risk. I will not promise income.',
      Hinglish:
        'Haan, pehle safe setup plan banega: training, cost heads, buyer/supplier check, scheme eligibility, aur loan risk. Meera income guarantee nahi degi.',
      Hindi:
        'हाँ, पहले safe setup plan बनेगा: training, cost heads, buyer/supplier check, scheme eligibility, और loan risk. मीरा income guarantee नहीं देगी.',
      Marathi:
        'Ho, aadhi safe setup plan banavto: training, cost heads, buyer/supplier check, scheme eligibility ani loan risk. Income guarantee denar nahi.',
    });
  }
  if (/job|naukri|placement|internship|career/i.test(text)) {
    return localizedLine(profile, latestText, {
      English: 'Yes, I can help with a job path.',
      Hinglish: 'Haan, Meera job path mein help kar sakti hai.',
      Hindi: 'हाँ, मीरा job path में help कर सकती है.',
      Marathi: 'Ho, job path madhe madat karu shakto.',
    });
  }
  if (
    profile.learner_goal?.intent === 'training' ||
    /training|course|vocational|skill|seekhna|sikhna|plumb|pipe fitter|sanitary|water fitting|bathroom fitting|electrician|mobile repair|tailor|silai/i.test(text)
  ) {
    return localizedLine(profile, latestText, {
      English: 'Yes, Meera can help you build a practical training route.',
      Hinglish: 'Haan, Meera practical training route banane mein help karegi.',
      Hindi: 'हाँ, मीरा practical training route बनाने में help करेगी.',
      Marathi: 'Ho, Meera practical training route banavnyat madat karel.',
    });
  }
  if (profile.learner_goal?.intent === 'study' && /jee|neet|cuet|exam|board|marks|score|class|padh|study|homework|subject/i.test(text)) {
    return localizedLine(profile, latestText, {
      English: 'Yes, I can help with study planning.',
      Hinglish: 'Haan, Meera study planning mein help kar sakti hai.',
      Hindi: 'हाँ, मीरा study planning में help कर सकती है.',
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
    const nextQuestion = oneThingQuestion(nextField, profile, latestText);
    const candidate = cleanCounselorReply(avoidRepeat(
      joinParts([ack, directAnswer, nextQuestion]),
      previousAssistant,
      profile,
      latestText,
    ));
    if (replyMatchesLanguage(candidate, profile, latestText)) return candidate;
    return cleanCounselorReply(avoidRepeat(nextQuestion, previousAssistant, profile, latestText));
  }

  const baseReply = directReply || conciseReadyReply(profile, latestText, modelReply);
  const readyAck = lowEducationProfile(profile, latestText) ? '' : ack;
  const candidate = cleanCounselorReply(avoidRepeat(
    joinParts([
      readyAck,
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
    Hinglish: 'Theek hai, save kar liya.',
    Hindi: 'ठीक है, सेव कर लिया।',
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
  const directModelReply = String(modelReply || '').trim();
  if (directModelReply && directModelReply.length <= 180 && !/[\n*]/.test(directModelReply)) {
    return directModelReply;
  }
  const intent = profile.learner_goal?.intent || '';
  if (intent === 'study') {
    return localizedLine(profile, latestText, {
      English: 'Good, I have enough to make a study plan now. I will keep it focused on weak topics and daily practice.',
      Hinglish: 'Theek hai, ab study plan ban sakta hai. Meera weak topics aur daily practice par focus rakhegi.',
      Hindi: 'ठीक है, अब study plan बन सकता है. मीरा weak topics और daily practice पर focus रखेगी.',
      Marathi: 'Theek aahe, ata study plan banu shakto. Weak topics ani daily practice var focus thevu.',
    });
  }
  if (intent === 'job' || intent === 'college') {
    return localizedLine(profile, latestText, {
      English: 'Good, I have enough to build the pathway. I will show only matching jobs after proof and consent.',
      Hinglish: 'Theek hai, pathway banane ke liye profile enough hai. Jobs sirf fit, proof aur consent ke baad dikhengi.',
      Hindi: 'ठीक है, pathway बनाने के लिए profile enough है. Jobs सिर्फ fit, proof और consent के बाद दिखेंगी.',
      Marathi: 'Theek aahe, pathway sathi profile enough aahe. Jobs fit, proof ani consent nantarach disatil.',
    });
  }
  if (intent === 'training') {
    return localizedLine(profile, latestText, {
      English: 'Good, I can build the training route now. I will check safe travel, fees, proof, and placement risk.',
      Hinglish: 'Theek hai, training route ban sakta hai. Meera safe travel, fees, proof aur placement risk check karegi.',
      Hindi: 'ठीक है, training route बन सकता है. मीरा safe travel, fees, proof और placement risk check करेगी.',
      Marathi: 'Theek aahe, training route banu shakto. Safe travel, fees, proof ani placement risk check karu.',
    });
  }
  return localizedLine(profile, latestText, {
    English: 'Good, I have enough for the next step. I will keep the pathway simple and tied to this profile.',
    Hinglish: 'Theek hai, next step ke liye profile enough hai. Pathway simple aur isi profile se linked rahega.',
    Hindi: 'ठीक है, next step के लिए profile enough है. Pathway simple और इसी profile से linked रहेगा.',
    Marathi: 'Theek aahe, next step sathi profile enough aahe. Pathway simple ani ya profile shi linked rahil.',
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
    if (profile.profile_complete) return conciseReadyReply(profile, latestText);
    const nextField = nextBestIntakeField(profile.missing_fields || [], profile);
    return oneThingQuestion(nextField, profile, latestText);
  }
  return clean;
}

function fallbackCounselor({ messages, profile }) {
  const text = messages.filter((message) => message.role === 'user').map((message) => message.content).join('\n');
  const latestText = latestUserContent(messages);
  const extracted = applyLowEducationSignal(mergeProfile(profile, fallbackProfileFromTranscript(text)), latestText);
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
      system: `You are VidyaSetu, a 24/7 multilingual India career and learning counselor for school learners, entrance-exam aspirants, college learners, formal job seekers, informal workers, vocational trainees, and self-employment/enterprise aspirants. ${languageInstruction(profile, latestText)} Detect the learner goal before asking questions. The latest user message wins when it clearly changes goal. Intake must feel like a counselor conversation, not a form or chatbot demo: answer the learner's direct question first, then ask only one next-best question. Keep the spoken reply short: maximum two short sentences. Do not summarize the whole profile unless the learner explicitly asks for a summary. Do not use markdown, stars, bullet symbols, numbered lists, headings, or tables because voice will read them aloud. Meera is the female counselor voice; use female or neutral wording for Meera and do not assume learner gender. Build the structured profile silently in JSON. When asking about education, use learner words in the learner's language: school, college, work, learning a skill, or school was not possible. Do not say stage, dropout, graduate, diploma, ITI, or resume unless the learner used those words first. If the learner says they never studied, did not go to school, cannot read, or does not understand formal education/job words, record that as education_status/support_need and do not ask class/stage/school/ITI/diploma/resume questions unless the learner asks for them. For low/no-schooling learners, use simple words and ask one concrete question at a time: work interest, district/village, daily time, safe travel, phone access, or simple proof such as photo, video, voice note, or sample work. If enough information is available, tell them to click Generate Pathway and invite any other question. If the learner wants poultry, mushroom, food processing, home business, shop, loan, scheme, or self-employment, classify it as enterprise setup; gather location, space/resources, starter budget/loan need, training access, buyer channel, and risk constraints one at a time; do not show job outreach as the main path. Extract profile facts only from user messages, never from assistant messages. Never copy the previous assistant reply. If the learner changes any fact or goal later, update the profile silently and acknowledge briefly. Offline jobs/training/enterprise support must not be recommended without current location plus commute or local-office travel preference. Never ask caste, religion, or community. Do not shame dropout, low marks, informal work, or career gaps. Return strict JSON only.`,
      prompt: `Current profile:\n${JSON.stringify(profile)}\n\nLatest user message:\n${latestText}\n\nPrevious assistant reply to avoid repeating:\n${previousAssistant}\n\nConversation:\n${JSON.stringify(messages)}\n\nReturn JSON: { "reply": "short warm counselor response in the learner's current language and script. Maximum two short sentences. No markdown, no stars, no bullets, no full profile recap. Do not sound like a generic AI assistant. Meera is female; use female or neutral wording for Meera, and do not assume learner gender. Answer direct questions first. Ask at most one next-best question if information is missing. If asking education, say it simply in the learner's language: school, college, work, learning a skill, or school was not possible. Do not say stage, dropout, graduate, diploma, ITI, or resume unless the learner used those words first. If enough information is available, say the next step briefly and tell the learner to click Generate Pathway. If user wants a job plan, mention proof/resume, pathway, opportunity search, or consent only when relevant. If the learner has low/no schooling, do not use class/stage/school/ITI/diploma/resume wording; ask about work interest, location, time, safe travel, phone, or simple photo/video/voice/sample proof. If user wants self-employment/enterprise/loan/scheme, mention setup roadmap, scheme/loan caution, buyer/supplier verification, and risk checks instead of job cards. If user changes to a study/exam goal, do not mention old job/outreach pipeline.", "profile": { "name": string, "age": number, "class_level": string, "education_status": string, "location": string, "commute_km": number, "commute_constraint": string, "relocation_preference": string, "aspirations": string[], "skills": string[], "proof_available": string[], "phone_access": string, "device": string, "time_available": string, "earning_urgency": "immediate" | "1-2 months" | "after training" | "not sure", "income_pressure": boolean, "language": string, "preferred_language": string, "content_preferences": string[], "support_needs": string[], "profile_complete": boolean }, "profile_complete": boolean, "missing_fields": string[] }`,
    });

    const mergedGeneratedProfile = mergeProfile(profile, generated.data.profile || {});
    let nextProfile = applyLatestSignals(mergedGeneratedProfile, latestText);
    nextProfile = applyLowEducationSignal(nextProfile, latestText);
    nextProfile = applyEntranceExamIntent(nextProfile, latestText);
    nextProfile = applyAcademicIntent(nextProfile, latestText);
    nextProfile = applySchoolStudyIntent(nextProfile, latestText);
    nextProfile = applyGeneralGoal(nextProfile, latestText);
    nextProfile = applyLowEducationSignal(nextProfile, latestText);
    nextProfile = withLanguageMetadata(nextProfile, latestText);
    nextProfile = scrubForeignScriptFields(nextProfile, latestText);
    if (suspiciousName(nextProfile.name)) {
      nextProfile.name = suspiciousName(profile.name) ? '' : profile.name || '';
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
    const reply = buildStepwiseReply({
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
