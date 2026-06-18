const LANGUAGE_STYLES = {
  English: {
    name: 'English',
    script: 'Latin',
    stt_language_code: 'en-IN',
    instruction: 'Reply in clear simple English with warm counselor wording, not generic AI wording. Keep it audio-friendly and short.',
  },
  Hinglish: {
    name: 'Hinglish',
    script: 'Latin',
    stt_language_code: 'hi-IN',
    instruction: 'Reply in simple Hinglish using Roman script, matching the user style. Prefer rural-friendly Hindi words in Latin script: jankari, hunar, naukri, vyapar, saboot, rasta, madad. Avoid English career words like profile, skill, job, internship, business, resume, proof, pathway unless the learner used them. Use Meera as a female counselor or neutral wording; avoid male first-person forms like karunga, banaunga, dunga.',
  },
  Hindi: {
    name: 'Hindi',
    script: 'Devanagari',
    stt_language_code: 'hi-IN',
    instruction: 'Reply in simple Hindi using Devanagari script. Prefer rural-friendly words: जानकारी, हुनर, नौकरी, व्यापार, सबूत, रास्ता, मदद. Avoid English career words like profile, skill, job, internship, business, resume, proof, pathway unless the learner used them. Use Meera as a female counselor or neutral wording; avoid male first-person forms.',
  },
  Odia: {
    name: 'Odia',
    script: 'Odia',
    stt_language_code: 'od-IN',
    instruction: 'Reply in simple Odia. If the user mixes Hindi/Odia, keep the same mixed style. Keep the tone human and counselor-like.',
  },
  Bengali: {
    name: 'Bengali',
    script: 'Bengali',
    stt_language_code: 'bn-IN',
    instruction: 'Reply in simple Bengali with warm counselor wording.',
  },
  Marathi: {
    name: 'Marathi',
    script: 'Devanagari',
    stt_language_code: 'mr-IN',
    instruction: 'Reply in simple Marathi with warm counselor wording. Use Meera as a female counselor or neutral wording.',
  },
  Tamil: {
    name: 'Tamil',
    script: 'Tamil',
    stt_language_code: 'ta-IN',
    instruction: 'Reply in simple Tamil with warm counselor wording.',
  },
  Telugu: {
    name: 'Telugu',
    script: 'Telugu',
    stt_language_code: 'te-IN',
    instruction: 'Reply in simple Telugu with warm counselor wording.',
  },
  Kannada: {
    name: 'Kannada',
    script: 'Kannada',
    stt_language_code: 'kn-IN',
    instruction: 'Reply in simple Kannada with warm counselor wording.',
  },
  Malayalam: {
    name: 'Malayalam',
    script: 'Malayalam',
    stt_language_code: 'ml-IN',
    instruction: 'Reply in simple Malayalam with warm counselor wording.',
  },
  Gujarati: {
    name: 'Gujarati',
    script: 'Gujarati',
    stt_language_code: 'gu-IN',
    instruction: 'Reply in simple Gujarati with warm counselor wording.',
  },
  Punjabi: {
    name: 'Punjabi',
    script: 'Gurmukhi',
    stt_language_code: 'pa-IN',
    instruction: 'Reply in simple Punjabi using Gurmukhi script with warm counselor wording.',
  },
};

export function detectLanguageStyle(text = '', profile = {}) {
  const raw = String(text || '');
  const lower = raw.toLowerCase();
  const preferred = String(profile.preferred_language || profile.language || profile.language_profile?.preferred_language || '').toLowerCase();
  const hasLatestText = Boolean(raw.trim());
  const hasIndicScript = /[\u0900-\u0D7F\u0A00-\u0AFF]/.test(raw);
  const hasClearLatinLanguage =
    hasIndicRoman(lower) ||
    /\b(i|my|want|need|can|you|help|study|job|course|open|business|scheme|loan|what|how|why|tell|please|english)\b/.test(lower);
  const allowPreferred = !hasLatestText || (!hasIndicScript && !hasClearLatinLanguage);

  if (allowPreferred && (/hinglish/.test(preferred) || (/hindi/.test(preferred) && /english/.test(preferred) && !/[\u0900-\u097F]/.test(raw)))) {
    return style('Hinglish');
  }
  if (/[\u0B00-\u0B7F]/.test(raw) || /\b(odia|oriya|odiare|mora|mu)\b/.test(lower) || (allowPreferred && /odia/.test(preferred))) {
    return style('Odia');
  }
  if (/[\u0980-\u09FF]/.test(raw) || /\b(bengali|bangla)\b/.test(lower) || (allowPreferred && /bengali|bangla/.test(preferred))) {
    return style('Bengali');
  }
  if (/[\u0B80-\u0BFF]/.test(raw) || /\b(tamil)\b/.test(lower) || (allowPreferred && /tamil/.test(preferred))) {
    return style('Tamil');
  }
  if (/[\u0C00-\u0C7F]/.test(raw) || /\b(telugu)\b/.test(lower) || (allowPreferred && /telugu/.test(preferred))) {
    return style('Telugu');
  }
  if (/[\u0C80-\u0CFF]/.test(raw) || /\b(kannada)\b/.test(lower) || (allowPreferred && /kannada/.test(preferred))) {
    return style('Kannada');
  }
  if (/[\u0D00-\u0D7F]/.test(raw) || /\b(malayalam)\b/.test(lower) || (allowPreferred && /malayalam/.test(preferred))) {
    return style('Malayalam');
  }
  if (/[\u0A80-\u0AFF]/.test(raw) || /\b(gujarati)\b/.test(lower) || (allowPreferred && /gujarati/.test(preferred))) {
    return style('Gujarati');
  }
  if (/[\u0A00-\u0A7F]/.test(raw) || /\b(punjabi)\b/.test(lower) || (allowPreferred && /punjabi/.test(preferred))) {
    return style('Punjabi');
  }
  if (
    hasIndicRoman(lower) &&
    !/\b(marathi|mala|majha|majhi|majhe|ahe|pahije)\b/.test(lower) &&
    !(allowPreferred && /hindi/.test(preferred)) &&
    !(allowPreferred && /marathi/.test(preferred))
  ) {
    return style('Hinglish');
  }
  if (allowPreferred && /english/.test(preferred) && !hasIndicRoman(lower) && !/\b(marathi|mala|majha|majhi|majhe|ahe|pahije)\b/.test(lower)) {
    return style('English');
  }
  if (allowPreferred && /hindi/.test(preferred) && !hasIndicRoman(lower) && !/\b(marathi|mala|majha|majhi|majhe|ahe|pahije)\b/.test(lower)) {
    return style('Hindi');
  }
  if (/\b(marathi|mala|majha|majhi|ahe|pahije|pune|mumbai|nagpur)\b/.test(lower) || /मराठी|मला|माझ|आहे|पाहिजे/.test(raw) || (allowPreferred && /marathi/.test(preferred))) {
    return style('Marathi');
  }
  if (hasIndicRoman(lower)) {
    return style('Hinglish');
  }
  if (/[\u0900-\u097F]/.test(raw) || /\b(hindi)\b/.test(lower) || /हिंदी|हिन्दी/.test(raw) || (allowPreferred && /hindi/.test(preferred))) {
    return style('Hindi');
  }
  if (allowPreferred && /english/.test(preferred) && !hasIndicRoman(lower)) {
    return style('English');
  }
  return style('English');
}

export function languageInstruction(profile = {}, latestText = '') {
  const detected = detectLanguageStyle(latestText, profile);
  return `${detected.instruction} The latest learner message decides the reply language and script; if it differs from the saved profile language, follow the latest message. Keep the answer in ${detected.name} unless the learner explicitly switches language. Speak like a field counselor on a voice call: one simple idea at a time, no formal product words, no generic AI phrasing. Do not say you are an AI/model. Do not use markdown, stars, bullets, headings, or long profile recaps. Meera is female; use female or neutral wording for Meera, and do not assume the learner's gender.`;
}

export function languageVoiceProfile(profile = {}, latestText = '') {
  const detected = detectLanguageStyle(latestText, profile);
  return {
    preferred_language: detected.name,
    reply_script: detected.script,
    stt_language_code: detected.stt_language_code,
    voice_channel: ['English', 'Hinglish'].includes(detected.name) ? 'voice + text' : 'local-language voice + text',
    same_language_reply: true,
    instruction: detected.instruction,
  };
}

export function voiceLanguageCode(profile = {}, latestText = '') {
  return detectLanguageStyle(latestText, profile).stt_language_code;
}

export function withLanguageMetadata(profile = {}, latestText = '') {
  const detected = detectLanguageStyle(latestText, profile);
  const languageProfile = languageVoiceProfile(profile, latestText);
  return {
    ...profile,
    preferred_language: detected.name,
    language: mergeLanguageLabels(profile.language, detected.name),
    language_profile: languageProfile,
  };
}

export function phrase(profile = {}, latestText = '', key, vars = {}) {
  const styleName = detectLanguageStyle(latestText, profile).name;
  const dict = PHRASES[styleName] || PHRASES.English;
  const template = dict[key] || dict.next_pathway || PHRASES.English[key] || '';
  return interpolate(template, vars);
}

export function isGenericReply(text = '') {
  const normalized = String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return true;
  return GENERIC_PATTERNS.some((pattern) => pattern.test(normalized));
}

function style(name) {
  return LANGUAGE_STYLES[name] || LANGUAGE_STYLES.English;
}

function hasIndicRoman(lower = '') {
  return /\b(hinglish|hindi english|mujhe|mera|meri|main|mai|hoon|hun|hai|chahiye|naukri|padh|padhai|samjha|samjhao|karna|kaise|kya|bata|batao|roz|ghar|paas|seekh|seekhna|job chahiye|marks chahiye|madad|help kar|kaam|silai|paisa|kamai|kitna|kahan)\b/.test(
    lower,
  );
}

function mergeLanguageLabels(existing = '', next = '') {
  const values = String(existing || '')
    .split(/\s*\+\s*|,\s*/)
    .concat(next)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !/local language|hindi or odia/i.test(item));
  return [...new Set(values)].join(' + ') || next || 'Hindi or local language';
}

function interpolate(template = '', vars = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

const GENERIC_PATTERNS = [
  /^samajh gaya\.?$/,
  /^samajh gaya\.? main pehle/,
  /^understood\.?$/,
  /^i understand\.?$/,
  /^ठीक है[।.]?$/,
  /^समझ गया[।.]?$/,
  /^समझ गई[।.]?$/,
];

const ENGLISH = {
  study_ready:
    'Yes. I will keep this as a study goal, not a job route. Your next step is {focus}: weak-topic diagnosis, the right resources, daily practice, and progress tracking.',
  entrance_ready:
    'Yes. I will prioritize {exam} preparation first. The plan will cover syllabus mapping, weak-topic diagnosis, daily problem practice, mocks, and error-log review.',
  job_ready:
    'Yes. I will build a job pathway for {goal}. Next I will check proof/resume gaps, search relevant opportunities for {location}, and prepare consent-based outreach.',
  training_ready:
    'Yes. I will build a training-to-work pathway for {goal} near {location}. I will check course fit, safe commute, fee risk, proof tasks, and placement/apprenticeship options.',
  proof_ready:
    'Yes. First we will convert your existing skill into proof, then use that proof for local training, RPL, apprenticeship, or job matching.',
  need_location:
    'For offline jobs, training, apprenticeships, or local courses, I need your city/district and safe commute range first. I will not suggest offline options without that.',
  need_skill:
    'Tell me the exact role or skill you want help with, plus any proof you already have: resume, certificate, project, sample work, or experience.',
  career_switch:
    'Got it. I am switching from study-only mode to career/job counseling. First I need the target role, skill/proof, location or relocation preference, and resume/project status.',
  direct_answer_prefix: 'Short answer:',
  missing_class: 'Are you studying in school, studying in college, working, learning a work skill, or was school not possible?',
  missing_subjects: 'Which subject or exam area do you need help with?',
  missing_college_goal: 'For college, what is your main goal: internship, project, placement, higher studies, or skill building?',
  missing_time: 'How much time can you give daily or weekly for learning, practice, or job preparation?',
  missing_phone: 'Is the phone your own or shared? Can you use WhatsApp, voice notes, and documents on it?',
  missing_mobility: 'For offline options, how far can you safely travel from home? If you can relocate anywhere in India, say that too.',
  next_pathway: 'I can now build the next pathway for you.',
  voice_retry: 'I could not hear the voice note clearly. Please record again for 5-10 seconds, or type the same message.',
};

const PHRASES = {
  English: ENGLISH,
  Hinglish: {
    study_ready:
      'Haan. Meera isko study goal rakhegi, job route nahi. Next step: {focus} ke weak topics identify karna, right resources, daily practice, aur progress tracking.',
    entrance_ready:
      'Haan. Meera pehle {exam} prep ko priority degi. Plan mein syllabus map, weak-topic diagnosis, daily problem practice, mocks, aur error-log review hoga.',
    job_ready:
      'Haan. Meera {goal} ke liye job pathway banayegi. Pehle proof/resume gaps check honge, {location} ke hisaab se relevant opportunities dekhe jayenge, aur consent ke baad outreach draft banega.',
    training_ready:
      'Haan. Meera {location} ke around {goal} ka training-to-work pathway banayegi: course fit, safe commute, fee risk, proof tasks, aur placement/apprenticeship options.',
    proof_ready:
      'Haan. Pehle aapki existing skill ko proof mein convert karenge, phir us proof se local training, RPL, apprenticeship, ya job matching karenge.',
    need_location:
      'Offline job, training, apprenticeship, ya local course ke liye city/district aur safe commute range chahiye. Location ke bina Meera offline options suggest nahi karegi.',
    need_skill:
      'Aap exact role/skill batao, aur koi proof hai to woh bhi: resume, certificate, project, sample kaam, ya experience.',
    career_switch:
      'Theek hai. Meera study-only mode se career/job counseling mode mein switch kar rahi hai. Pehle target role, skill/proof, location ya relocation preference, aur resume/project status chahiye.',
    direct_answer_prefix: 'Short answer:',
    missing_class: 'Aap abhi school mein padh rahe hain, college mein hain, kaam kar rahe hain, koi kaam seekh rahe hain, ya padhai zyada nahi hui?',
    missing_subjects: 'Kis subject ya exam area mein help chahiye?',
    missing_college_goal: 'College ke liye main goal kya hai: internship, project, placement, higher studies, ya skill building?',
    missing_time: 'Roz ya hafte mein learning, practice, ya job prep ke liye kitna time de sakte hain?',
    missing_phone: 'Phone aapka khud ka hai ya shared hai? WhatsApp, voice note, aur documents chal jate hain?',
    missing_mobility: 'Offline option ke liye ghar se kitni door tak safe travel kar sakte hain? Agar India mein kahin bhi relocate kar sakte hain, woh bhi bata dijiye.',
    next_pathway: 'Meera ab aapke liye next pathway bana sakti hai.',
    voice_retry: 'Voice note clear nahi aaya. Kripya 5-10 second dobara record karo, ya wahi baat type kar do.',
  },
  Hindi: {
    study_ready:
      'हाँ। मीरा इसे पढ़ाई का लक्ष्य रखेगी, नौकरी वाला रास्ता नहीं। अगला कदम: {focus} के कमजोर टॉपिक पहचानना, सही संसाधन, रोज़ अभ्यास और प्रगति ट्रैक करना।',
    entrance_ready:
      'हाँ। मीरा पहले {exam} तैयारी को प्राथमिकता देगी। प्लान में सिलेबस मैप, कमजोर टॉपिक, रोज़ की प्रैक्टिस, मॉक टेस्ट और एरर-लॉग रिव्यू होगा।',
    job_ready:
      'हाँ। मीरा {goal} के लिए नौकरी pathway बनाएगी। पहले proof/resume gaps देखे जाएँगे, {location} के हिसाब से अवसर खोजे जाएँगे, फिर consent के बाद outreach draft बनेगा।',
    training_ready:
      'हाँ। मीरा {location} के हिसाब से {goal} का training-to-work pathway बनाएगी: course fit, safe commute, fee risk, proof tasks और placement/apprenticeship options।',
    proof_ready:
      'हाँ। पहले आपकी मौजूदा skill को proof में बदलेंगे, फिर उसी proof से local training, RPL, apprenticeship या job matching करेंगे।',
    need_location:
      'Offline job, training, apprenticeship या local course के लिए city/district और safe commute range चाहिए। Location के बिना मीरा offline options suggest नहीं करेगी।',
    need_skill:
      'आप exact role/skill बताइए, और कोई proof हो तो वह भी: resume, certificate, project, sample work या experience।',
    career_switch:
      'ठीक है। मीरा study-only mode से career/job counseling mode में switch कर रही है। पहले target role, skill/proof, location या relocation preference और resume/project status चाहिए।',
    direct_answer_prefix: 'छोटा जवाब:',
    missing_class: 'आप अभी स्कूल में पढ़ रहे हैं, कॉलेज में हैं, काम कर रहे हैं, कोई काम सीख रहे हैं, या पढ़ाई ज़्यादा नहीं हुई?',
    missing_subjects: 'आपको किस subject या exam area में help चाहिए?',
    missing_college_goal: 'College के लिए आपका main goal क्या है: internship, project, placement, higher studies, या skill building?',
    missing_time: 'Learning, practice, या job prep के लिए आप रोज़ या हफ्ते में कितना time दे सकते हैं?',
    missing_phone: 'Phone आपका खुद का है या shared है? क्या WhatsApp, voice note, और documents चल जाते हैं?',
    missing_mobility: 'Offline option के लिए आप घर से कितनी दूर तक safely travel कर सकते हैं? अगर India में कहीं भी relocate कर सकते हैं, तो वह भी बताइए।',
    next_pathway: 'अब मीरा आपके लिए next pathway बना सकती है।',
    voice_retry: 'Voice note साफ़ नहीं आया। कृपया 5-10 सेकंड दोबारा record करें, या वही बात type कर दें।',
  },
  Odia: localPhrases({
    yes: 'ହଁ।',
    study: 'ଏହାକୁ ପଢ଼ା ଲକ୍ଷ୍ୟ ଭାବେ ରଖିବି, job route ନୁହେଁ।',
    job: '{goal} ପାଇଁ job pathway ବନାଇବି। {location} ଅନୁସାରେ opportunity ଖୋଜିବି ଏବଂ consent ପରେ outreach draft କରିବି।',
    location: 'Offline option ପାଇଁ city/district ଏବଂ safe commute range ଦରକାର।',
    skill: 'Exact role/skill ଏବଂ proof କହନ୍ତୁ: resume, certificate, project, sample work କିମ୍ବା experience।',
    classQ: 'ଆପଣ ଏବେ ସ୍କୁଲ୍‌ରେ ପଢୁଛନ୍ତି, କଲେଜ୍‌ରେ ଅଛନ୍ତି, କାମ କରୁଛନ୍ତି, କୌଣସି କାମ ଶିଖୁଛନ୍ତି, କିମ୍ବା ପଢ଼ା ଅଧିକ ହୋଇନାହିଁ?',
    timeQ: 'ପ୍ରତିଦିନ କିମ୍ବା ସପ୍ତାହକୁ କେତେ time ଦେଇପାରିବେ?',
    retry: 'Voice note ସ୍ପଷ୍ଟ ନୁହେଁ। 5-10 second ପୁଣି record କରନ୍ତୁ କିମ୍ବା type କରନ୍ତୁ।',
  }),
  Bengali: localPhrases({
    yes: 'হ্যাঁ।',
    study: 'এটাকে পড়াশোনার লক্ষ্য হিসেবেই রাখব, চাকরির route নয়।',
    job: '{goal} এর জন্য job pathway বানাব। {location} অনুযায়ী opportunity খুঁজব এবং consent এর পরে outreach draft করব।',
    location: 'Offline option এর জন্য city/district এবং safe commute range দরকার।',
    skill: 'Exact role/skill আর proof বলুন: resume, certificate, project, sample work বা experience।',
    classQ: 'আপনি এখন স্কুলে পড়ছেন, কলেজে আছেন, কাজ করছেন, কোনো কাজ শিখছেন, নাকি পড়াশোনা বেশি হয়নি?',
    timeQ: 'প্রতিদিন বা সপ্তাহে কত time দিতে পারবেন?',
    retry: 'Voice note পরিষ্কার আসেনি। 5-10 second আবার record করুন, অথবা type করুন।',
  }),
  Marathi: localPhrases({
    yes: 'हो.',
    study: 'हे अभ्यासाचे goal म्हणून ठेवतो, job route नाही.',
    job: '{goal} साठी job pathway बनवतो. {location} नुसार opportunities शोधतो आणि consent नंतर outreach draft करतो.',
    location: 'Offline option साठी city/district आणि safe commute range लागेल.',
    skill: 'Exact role/skill आणि proof सांगा: resume, certificate, project, sample work किंवा experience.',
    classQ: 'तुम्ही सध्या शाळेत शिकता, कॉलेजमध्ये आहात, काम करता, एखादे काम शिकत आहात, की जास्त शिक्षण झाले नाही?',
    timeQ: 'दररोज किंवा आठवड्यात किती time देऊ शकता?',
    retry: 'Voice note स्पष्ट आले नाही. 5-10 second पुन्हा record करा किंवा type करा.',
  }),
  Tamil: localPhrases({
    yes: 'ஆம்.',
    study: 'இதைக் கல்வி இலக்காகவே வைத்துக்கொள்கிறேன், job route அல்ல.',
    job: '{goal} க்கான job pathway உருவாக்குவேன். {location} அடிப்படையில் opportunities தேடி, consent பிறகு outreach draft செய்வேன்.',
    location: 'Offline option க்கு city/district மற்றும் safe commute range தேவை.',
    skill: 'Exact role/skill மற்றும் proof சொல்லுங்கள்: resume, certificate, project, sample work அல்லது experience.',
    classQ: 'நீங்கள் இப்போது பள்ளியில் படிக்கிறீர்களா, கல்லூரியில் இருக்கிறீர்களா, வேலை செய்கிறீர்களா, ஒரு தொழில் கற்றுக்கொள்கிறீர்களா, அல்லது அதிகம் படிக்க முடியவில்லையா?',
    timeQ: 'தினமும் அல்லது வாரத்திற்கு எவ்வளவு time கொடுக்க முடியும்?',
    retry: 'Voice note தெளிவாக இல்லை. 5-10 second மீண்டும் record செய்யவும் அல்லது type செய்யவும்.',
  }),
  Telugu: localPhrases({
    yes: 'అవును.',
    study: 'దీనిని చదువు goal గానే ఉంచుతాను, job route కాదు.',
    job: '{goal} కోసం job pathway తయారు చేస్తాను. {location} ప్రకారం opportunities వెతికి, consent తర్వాత outreach draft చేస్తాను.',
    location: 'Offline option కోసం city/district మరియు safe commute range కావాలి.',
    skill: 'Exact role/skill మరియు proof చెప్పండి: resume, certificate, project, sample work లేదా experience.',
    classQ: 'మీరు ఇప్పుడు పాఠశాలలో చదువుతున్నారా, కాలేజీలో ఉన్నారా, పని చేస్తున్నారా, ఏదైనా పని నేర్చుకుంటున్నారా, లేక ఎక్కువ చదువు కాలేదా?',
    timeQ: 'రోజుకు లేదా వారానికి ఎంత time ఇవ్వగలరు?',
    retry: 'Voice note స్పష్టంగా లేదు. 5-10 second మళ్లీ record చేయండి లేదా type చేయండి.',
  }),
  Kannada: localPhrases({
    yes: 'ಹೌದು.',
    study: 'ಇದನ್ನು study goal ಆಗಿಯೇ ಇಡುತ್ತೇನೆ, job route ಅಲ್ಲ.',
    job: '{goal} ಗೆ job pathway ಮಾಡುತ್ತೇನೆ. {location} ಆಧರಿಸಿ opportunities ಹುಡುಕಿ, consent ನಂತರ outreach draft ಮಾಡುತ್ತೇನೆ.',
    location: 'Offline option ಗೆ city/district ಮತ್ತು safe commute range ಬೇಕು.',
    skill: 'Exact role/skill ಮತ್ತು proof ಹೇಳಿ: resume, certificate, project, sample work ಅಥವಾ experience.',
    classQ: 'ನೀವು ಈಗ ಶಾಲೆಯಲ್ಲಿ ಓದುತ್ತಿದ್ದೀರಾ, ಕಾಲೇಜಿನಲ್ಲಿ ಇದ್ದೀರಾ, ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಾ, ಯಾವುದಾದರೂ ಕೆಲಸ ಕಲಿಯುತ್ತಿದ್ದೀರಾ, ಅಥವಾ ಹೆಚ್ಚು ಓದಲು ಆಗಲಿಲ್ಲವೇ?',
    timeQ: 'ದಿನಕ್ಕೆ ಅಥವಾ ವಾರಕ್ಕೆ ಎಷ್ಟು time ಕೊಡಬಹುದು?',
    retry: 'Voice note clear ಆಗಿಲ್ಲ. 5-10 second ಮತ್ತೆ record ಮಾಡಿ ಅಥವಾ type ಮಾಡಿ.',
  }),
  Malayalam: localPhrases({
    yes: 'അതെ.',
    study: 'ഇത് പഠന goal ആയി തന്നെ വയ്ക്കാം, job route അല്ല.',
    job: '{goal} വേണ്ടി job pathway ഉണ്ടാക്കാം. {location} അനുസരിച്ച് opportunities കണ്ടെത്തി, consent കഴിഞ്ഞ് outreach draft ചെയ്യും.',
    location: 'Offline option ന് city/district ഉം safe commute range ഉം വേണം.',
    skill: 'Exact role/skill, proof എന്നിവ പറയൂ: resume, certificate, project, sample work അല്ലെങ്കിൽ experience.',
    classQ: 'നിങ്ങൾ ഇപ്പോൾ സ്കൂളിൽ പഠിക്കുകയാണോ, കോളേജിലാണോ, ജോലി ചെയ്യുകയാണോ, ഏതെങ്കിലും ജോലി പഠിക്കുകയാണോ, അല്ലെങ്കിൽ കൂടുതൽ പഠിക്കാൻ കഴിഞ്ഞില്ലേ?',
    timeQ: 'ദിവസവും അല്ലെങ്കിൽ ആഴ്ചയിൽ എത്ര time നൽകാം?',
    retry: 'Voice note വ്യക്തമായില്ല. 5-10 second വീണ്ടും record ചെയ്യൂ അല്ലെങ്കിൽ type ചെയ്യൂ.',
  }),
  Gujarati: localPhrases({
    yes: 'હા.',
    study: 'આને study goal તરીકે જ રાખીશ, job route નહીં.',
    job: '{goal} માટે job pathway બનાવીશ. {location} મુજબ opportunities શોધીશ અને consent પછી outreach draft કરીશ.',
    location: 'Offline option માટે city/district અને safe commute range જોઈએ.',
    skill: 'Exact role/skill અને proof કહો: resume, certificate, project, sample work અથવા experience.',
    classQ: 'તમે હાલમાં શાળામાં ભણો છો, કોલેજમાં છો, કામ કરો છો, કોઈ કામ શીખો છો, કે વધુ ભણતર થયું નથી?',
    timeQ: 'દિવસે અથવા અઠવાડિયામાં કેટલો time આપી શકો?',
    retry: 'Voice note clear નથી. 5-10 second ફરી record કરો અથવા type કરો.',
  }),
  Punjabi: localPhrases({
    yes: 'ਹਾਂ।',
    study: 'ਇਸਨੂੰ study goal ਹੀ ਰੱਖਾਂਗਾ, job route ਨਹੀਂ।',
    job: '{goal} ਲਈ job pathway ਬਣਾਵਾਂਗਾ। {location} ਮੁਤਾਬਕ opportunities ਲੱਭਾਂਗਾ ਅਤੇ consent ਤੋਂ ਬਾਅਦ outreach draft ਕਰਾਂਗਾ।',
    location: 'Offline option ਲਈ city/district ਅਤੇ safe commute range ਚਾਹੀਦੀ ਹੈ।',
    skill: 'Exact role/skill ਅਤੇ proof ਦੱਸੋ: resume, certificate, project, sample work ਜਾਂ experience.',
    classQ: 'ਤੁਸੀਂ ਹੁਣ ਸਕੂਲ ਵਿੱਚ ਪੜ੍ਹ ਰਹੇ ਹੋ, ਕਾਲਜ ਵਿੱਚ ਹੋ, ਕੰਮ ਕਰ ਰਹੇ ਹੋ, ਕੋਈ ਕੰਮ ਸਿੱਖ ਰਹੇ ਹੋ, ਜਾਂ ਪੜ੍ਹਾਈ ਜ਼ਿਆਦਾ ਨਹੀਂ ਹੋਈ?',
    timeQ: 'ਰੋਜ਼ ਜਾਂ ਹਫ਼ਤੇ ਵਿੱਚ ਕਿੰਨਾ time ਦੇ ਸਕਦੇ ਹੋ?',
    retry: 'Voice note ਸਾਫ਼ ਨਹੀਂ ਆਇਆ। 5-10 second ਮੁੜ record ਕਰੋ ਜਾਂ type ਕਰੋ।',
  }),
};

function localPhrases(parts) {
  return {
    study_ready: `${parts.yes} ${parts.study} Focus: {focus}. ${parts.plan || 'Daily practice, resources, and progress tracking will be prepared.'}`,
    entrance_ready: `${parts.yes} {exam} preparation first. ${parts.plan || 'Syllabus map, weak topics, mocks, and error-log review will be prepared.'}`,
    job_ready: `${parts.yes} ${parts.job}`,
    training_ready: `${parts.yes} ${parts.training || '{location} near {goal} training-to-work pathway will be prepared.'}`,
    proof_ready: `${parts.yes} ${parts.proof || 'First we will convert your existing skill into proof, then use it for local training, RPL, apprenticeship, or job matching.'}`,
    need_location: parts.location,
    need_skill: parts.skill,
    career_switch: `${parts.yes} ${parts.careerSwitch || 'I am switching to career/job counseling. Tell me target role, proof, location/relocation, and resume/project status.'}`,
    direct_answer_prefix: parts.yes,
    missing_class: parts.classQ,
    missing_subjects: parts.subjectQ || `${parts.yes} Which subject or exam area needs help?`,
    missing_college_goal: parts.collegeQ || `${parts.yes} College goal: internship, project, placement, higher studies, or skill building?`,
    missing_time: parts.timeQ,
    missing_phone: parts.phoneQ || `${parts.yes} Is the phone personal or shared? Do WhatsApp, voice notes, and documents work?`,
    missing_mobility: parts.mobilityQ || `${parts.yes} For offline options, how far can you travel safely?`,
    next_pathway: parts.next || `${parts.yes} I can now build the next pathway.`,
    voice_retry: parts.retry,
  };
}
