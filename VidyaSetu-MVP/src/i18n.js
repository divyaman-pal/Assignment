// Lightweight UI-chrome localization for VidyaSetu.
// Covers navigation, page headers, primary buttons, and the pathway/journey
// panels a first-generation learner must read to use the app without a helper.
// English is the fallback; Hindi, Hinglish, and Odia (the persona languages)
// are fully covered for the chrome. Other languages fall back to English chrome
// while the counselor still replies in the learner's language.

const en = {
  nav: { counselor: 'Meera', pathways: 'My Pathway', journey: 'Learning Journey', passport: 'Skill Passport', jobs: 'Opportunities' },
  navShort: { counselor: 'Meera', pathways: 'Pathway', journey: 'Journey', passport: 'Passport', jobs: 'Jobs' },
  title: {
    counselor: 'Talk to Meera',
    pathways: 'Your personalised pathway',
    journey: 'Learning journey',
    passport: 'Skill Passport',
    jobs: 'Opportunities',
  },
  subtitle: {
    counselor: 'She builds your profile from a normal chat - type or speak, in your language.',
    pathways: 'Meera decides the shortest credible route to your goal - and what unlocks next.',
    journey: 'Concrete daily tasks. Each week ends with a proof task.',
    passport: 'Verified skills with evidence - yours to share, only when you choose.',
    jobs: 'Found live and verified - never fabricated. Everything shows when it was checked.',
  },
  btn: {
    notMe: 'This is not me',
    addLearner: 'Add new learner on this phone',
    refreshRecommendations: 'Refresh recommendations',
    startThisWeek: 'Start this week',
    createJourney: 'Create / refresh journey',
    refreshStudyPlan: 'Refresh study plan',
    open: 'Open',
  },
  pathway: {
    whyPathway: 'Why this pathway',
    blocked: "What's blocked and why",
    whyThisRoute: 'Why this route',
    whatYouGet: 'What you get',
    doThisNext: 'Do this next',
    unlocksAfter: 'Unlocks after',
    recommended: 'Recommended',
    option: 'Option',
  },
  journey: {
    yourPathway: 'Your pathway',
    startHere: 'Start here',
    todaysTask: "Today's task",
    howToComplete: 'How to complete',
    proofRequired: 'Proof required',
    unlocksNext: 'Unlocks next',
    week: 'Week',
  },
  thisWeek: {
    title: 'Do this week',
    subtitle: 'Real steps you can take right now — each one is on an official site or near you.',
    byWhen: 'By when',
    how: 'How',
    inApp: 'In this app',
  },
};

const hi = {
  nav: { counselor: 'मीरा', pathways: 'मेरा रास्ता', journey: 'सीखने की यात्रा', passport: 'स्किल पासपोर्ट', jobs: 'अवसर' },
  navShort: { counselor: 'मीरा', pathways: 'रास्ता', journey: 'यात्रा', passport: 'पासपोर्ट', jobs: 'अवसर' },
  title: {
    counselor: 'मीरा से बात करें',
    pathways: 'आपका व्यक्तिगत रास्ता',
    journey: 'सीखने की यात्रा',
    passport: 'स्किल पासपोर्ट',
    jobs: 'अवसर',
  },
  subtitle: {
    counselor: 'सामान्य बातचीत से मीरा आपकी प्रोफ़ाइल बनाती है — अपनी भाषा में बोलें या लिखें।',
    pathways: 'मीरा आपके लक्ष्य तक का सबसे छोटा भरोसेमंद रास्ता और अगला कदम तय करती है।',
    journey: 'रोज़ के ठोस काम। हर हफ़्ते के अंत में एक प्रूफ़ टास्क।',
    passport: 'सबूत के साथ आपके हुनर — सिर्फ़ तभी साझा करें जब आप चाहें।',
    jobs: 'लाइव और सत्यापित — कभी झूठे नहीं। हर चीज़ कब जाँची गई, दिखता है।',
  },
  btn: {
    notMe: 'यह मैं नहीं हूँ',
    addLearner: 'इस फ़ोन पर नया लर्नर जोड़ें',
    refreshRecommendations: 'सुझाव फिर से लाएँ',
    startThisWeek: 'इस हफ़्ते शुरू करें',
    createJourney: 'यात्रा बनाएँ / ताज़ा करें',
    refreshStudyPlan: 'पढ़ाई योजना ताज़ा करें',
    open: 'खोलें',
  },
  pathway: {
    whyPathway: 'यह रास्ता क्यों',
    blocked: 'अभी क्या रुका है और क्यों',
    whyThisRoute: 'यह रास्ता क्यों',
    whatYouGet: 'आपको क्या मिलेगा',
    doThisNext: 'अगला कदम',
    unlocksAfter: 'किसके बाद खुलेगा',
    recommended: 'सुझाया गया',
    option: 'विकल्प',
  },
  journey: {
    yourPathway: 'आपका रास्ता',
    startHere: 'यहाँ से शुरू करें',
    todaysTask: 'आज का काम',
    howToComplete: 'कैसे पूरा करें',
    proofRequired: 'ज़रूरी प्रूफ़',
    unlocksNext: 'आगे क्या खुलेगा',
    week: 'सप्ताह',
  },
  thisWeek: {
    title: 'इस हफ़्ते यह करें',
    subtitle: 'अभी उठाए जा सकने वाले असली कदम — हर एक किसी आधिकारिक साइट पर या आपके पास है।',
    byWhen: 'कब तक',
    how: 'कैसे',
    inApp: 'इसी ऐप में',
  },
};

const hinglish = {
  nav: { counselor: 'Meera', pathways: 'Mera Rasta', journey: 'Seekhne ki Yatra', passport: 'Skill Passport', jobs: 'Mauke' },
  navShort: { counselor: 'Meera', pathways: 'Rasta', journey: 'Yatra', passport: 'Passport', jobs: 'Mauke' },
  title: {
    counselor: 'Meera se baat karein',
    pathways: 'Aapka personalised rasta',
    journey: 'Seekhne ki yatra',
    passport: 'Skill Passport',
    jobs: 'Mauke (Opportunities)',
  },
  subtitle: {
    counselor: 'Normal chat se Meera aapki profile banati hai — apni bhasha mein type ya bol sakte ho.',
    pathways: 'Meera aapke goal tak ka sabse chhota bharosemand rasta aur agla kadam decide karti hai.',
    journey: 'Roz ke thos kaam. Har hafte ke end mein ek proof task.',
    passport: 'Saboot ke saath aapke skills — share tabhi jab aap chaaho.',
    jobs: 'Live aur verified — kabhi fake nahi. Sab kuch kab check hua, dikhta hai.',
  },
  btn: {
    notMe: 'Yeh main nahi hoon',
    addLearner: 'Is phone par naya learner add karein',
    refreshRecommendations: 'Suggestions refresh karein',
    startThisWeek: 'Is hafte shuru karein',
    createJourney: 'Journey banayein / refresh karein',
    refreshStudyPlan: 'Study plan refresh karein',
    open: 'Kholein',
  },
  pathway: {
    whyPathway: 'Yeh rasta kyun',
    blocked: 'Abhi kya ruka hai aur kyun',
    whyThisRoute: 'Yeh rasta kyun',
    whatYouGet: 'Aapko kya milega',
    doThisNext: 'Agla kadam',
    unlocksAfter: 'Kiske baad khulega',
    recommended: 'Recommended',
    option: 'Option',
  },
  journey: {
    yourPathway: 'Aapka rasta',
    startHere: 'Yahan se shuru karein',
    todaysTask: 'Aaj ka kaam',
    howToComplete: 'Kaise poora karein',
    proofRequired: 'Zaroori proof',
    unlocksNext: 'Aage kya khulega',
    week: 'Hafta',
  },
  thisWeek: {
    title: 'Is hafte yeh karein',
    subtitle: 'Abhi utha sakne wale asli kadam — har ek official site par ya aapke paas hai.',
    byWhen: 'Kab tak',
    how: 'Kaise',
    inApp: 'Isi app mein',
  },
};

const or = {
  nav: { counselor: 'ମୀରା', pathways: 'ମୋ ବାଟ', journey: 'ଶିଖିବା ଯାତ୍ରା', passport: 'ସ୍କିଲ୍ ପାସପୋର୍ଟ', jobs: 'ସୁଯୋଗ' },
  navShort: { counselor: 'ମୀରା', pathways: 'ବାଟ', journey: 'ଯାତ୍ରା', passport: 'ପାସପୋର୍ଟ', jobs: 'ସୁଯୋଗ' },
  title: {
    counselor: 'ମୀରା ସହ କଥା ହୁଅନ୍ତୁ',
    pathways: 'ଆପଣଙ୍କ ନିଜସ୍ୱ ବାଟ',
    journey: 'ଶିଖିବା ଯାତ୍ରା',
    passport: 'ସ୍କିଲ୍ ପାସପୋର୍ଟ',
    jobs: 'ସୁଯୋଗ',
  },
  subtitle: {
    counselor: 'ସାଧାରଣ କଥାବାର୍ତ୍ତାରୁ ମୀରା ଆପଣଙ୍କ ପ୍ରୋଫାଇଲ୍ ତିଆରି କରେ — ନିଜ ଭାଷାରେ କୁହନ୍ତୁ କିମ୍ବା ଲେଖନ୍ତୁ।',
    pathways: 'ମୀରା ଆପଣଙ୍କ ଲକ୍ଷ୍ୟ ପର୍ଯ୍ୟନ୍ତ ସବୁଠାରୁ ଛୋଟ ବିଶ୍ୱାସଯୋଗ୍ୟ ବାଟ ଓ ପରବର୍ତ୍ତୀ ପଦକ୍ଷେପ ସ୍ଥିର କରେ।',
    journey: 'ପ୍ରତିଦିନର ନିର୍ଦ୍ଦିଷ୍ଟ କାମ। ପ୍ରତି ସପ୍ତାହ ଶେଷରେ ଗୋଟିଏ ପ୍ରମାଣ କାମ।',
    passport: 'ପ୍ରମାଣ ସହ ଆପଣଙ୍କ ଦକ୍ଷତା — ଆପଣ ଚାହିଁଲେ ହିଁ ଶେୟାର କରନ୍ତୁ।',
    jobs: 'ଲାଇଭ୍ ଓ ଯାଞ୍ଚିତ — କେବେ ମିଥ୍ୟା ନୁହେଁ। ସବୁ କେବେ ଯାଞ୍ଚ ହେଲା ଦେଖାଯାଏ।',
  },
  btn: {
    notMe: 'ଏହା ମୁଁ ନୁହେଁ',
    addLearner: 'ଏହି ଫୋନରେ ନୂଆ ଶିକ୍ଷାର୍ଥୀ ଯୋଡ଼ନ୍ତୁ',
    refreshRecommendations: 'ସୁପାରିଶ ପୁଣି ଆଣନ୍ତୁ',
    startThisWeek: 'ଏହି ସପ୍ତାହ ଆରମ୍ଭ କରନ୍ତୁ',
    createJourney: 'ଯାତ୍ରା ତିଆରି / ସତେଜ କରନ୍ତୁ',
    refreshStudyPlan: 'ପଢ଼ା ଯୋଜନା ସତେଜ କରନ୍ତୁ',
    open: 'ଖୋଲନ୍ତୁ',
  },
  pathway: {
    whyPathway: 'ଏହି ବାଟ କାହିଁକି',
    blocked: 'ବର୍ତ୍ତମାନ କ’ଣ ଅଟକିଛି ଓ କାହିଁକି',
    whyThisRoute: 'ଏହି ବାଟ କାହିଁକି',
    whatYouGet: 'ଆପଣ କ’ଣ ପାଇବେ',
    doThisNext: 'ପରବର୍ତ୍ତୀ ପଦକ୍ଷେପ',
    unlocksAfter: 'କେବେ ଖୋଲିବ',
    recommended: 'ସୁପାରିଶ',
    option: 'ବିକଳ୍ପ',
  },
  journey: {
    yourPathway: 'ଆପଣଙ୍କ ବାଟ',
    startHere: 'ଏଠାରୁ ଆରମ୍ଭ କରନ୍ତୁ',
    todaysTask: 'ଆଜିର କାମ',
    howToComplete: 'କିପରି ସମ୍ପୂର୍ଣ୍ଣ କରିବେ',
    proofRequired: 'ଆବଶ୍ୟକ ପ୍ରମାଣ',
    unlocksNext: 'ଆଗକୁ କ’ଣ ଖୋଲିବ',
    week: 'ସପ୍ତାହ',
  },
  thisWeek: {
    title: 'ଏହି ସପ୍ତାହ ଏହା କରନ୍ତୁ',
    subtitle: 'ବର୍ତ୍ତମାନ ନେଇପାରିବା ଭଳି ପ୍ରକୃତ ପଦକ୍ଷେପ — ପ୍ରତ୍ୟେକ ଆଧିକାରିକ ସାଇଟରେ କିମ୍ବା ଆପଣଙ୍କ ପାଖରେ।',
    byWhen: 'କେବେ ସୁଦ୍ଧା',
    how: 'କିପରି',
    inApp: 'ଏହି ଆପ୍‌ରେ',
  },
};

const DICTS = { en, hi, hinglish, or };

export function uiLangCode(languageName = '') {
  const raw = String(languageName || '').toLowerCase();
  if (/hinglish|hindi \+ english|hindi\+english/.test(raw)) return 'hinglish';
  if (/odia|oriya|ଓଡ଼ିଆ/.test(raw)) return 'or';
  if (/hindi|हिंदी|हिन्दी/.test(raw)) return 'hi';
  return 'en';
}

export function getTranslations(languageName = '') {
  return DICTS[uiLangCode(languageName)] || en;
}
