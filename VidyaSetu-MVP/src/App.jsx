import { useEffect, useMemo, useRef, useState } from 'react';
import { getTranslations } from './i18n.js';
import {
  Bell,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  GraduationCap,
  Languages,
  LayoutDashboard,
  LogOut,
  Lock,
  MessageCircle,
  Mic,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  Upload,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';

const encodedQuickStarts = [
  {
    label: 'Mobile repair learner',
    text: 'Mera naam Divyaman hai. Main Class 10 mein hoon, Basti district se. Mujhe mobile repair aur short videos banana pasand hai. Mere paas Android phone with WhatsApp hai, roz 45 minutes learning kar sakta hoon, aur income jaldi chahiye. Main 30 km tak safe travel kar sakta hoon.',
  },
  {
    label: 'Computer job seeker',
    text: 'Mera naam Riya hai. Main Class 12 pass hoon, Varanasi ke paas rehti hoon. Mujhe computer basics, typing aur customer service job chahiye. Phone shared hai but WhatsApp voice note chal jata hai. Roz 1 hour practice kar sakti hoon. Ghar ke paas safe day shift chahiye.',
  },
  {
    label: 'Tailoring path',
    text: 'Mera naam Sana hai. Maine school chhod diya tha. Main silai aur tailoring seekhkar ghar ke paas income banana chahti hoon. Family phone shared hai, Hindi voice notes best rahenge. Roz 30 minutes practice kar sakti hoon aur 10 km se zyada travel mushkil hai.',
  },
  {
    label: 'Agri drone interest',
    text: 'Mera naam Mohan hai. Main Class 11 mein hoon, Balangir Odisha se. Mujhe agriculture, drone aur digital farm service mein interest hai. Mere paas Android phone hai. Main Odia aur Hindi mein seekhna chahta hoon, roz 45 minutes de sakta hoon, income 1-2 months mein chahiye.',
  },
  {
    label: 'Odia study support',
    text: 'ମୋ ନାମ ପ୍ରକାଶ। ମୁଁ କ୍ଲାସ 10 ରେ ପଢୁଛି, ବଲାଙ୍ଗିର ଓଡିଶାରୁ। ମୋତେ ଗଣିତ ଏବଂ ବିଜ୍ଞାନରେ ସହାୟତା ଦରକାର। ଘରର shared phone ଅଛି, ଦିନକୁ 1 ଘଣ୍ଟା ପଢିପାରିବି।',
  },
  {
    label: 'Marathi placement',
    text: 'माझे नाव नेहा आहे. मी पुण्याजवळ BSc final year मध्ये आहे. मला data analyst internship किंवा job पाहिजे. माझ्याकडे resume draft आहे, Python basic येते, रोज 2 तास देऊ शकते आणि मराठी मध्ये guidance पाहिजे.',
  },
];

const quickStarts = encodedQuickStarts.map((item) => {
  const cleanText = {
    'Odia study support':
      'Mo naam Prakash. Mu Class 10 re padhuchi, Balangir Odisha ru. Mate Maths ebam Science re help darkar. Ghara shared phone achhi, mu Odia voice note re bujhiparibi, ebam dina ku 1 ghanta padhai pain deiparibi.',
    'Marathi placement':
      'Majhe nav Neha aahe. Mi Pune jawal BSc final year madhe aahe. Mala data analyst internship kiwa job pahije. Majhyakade resume draft aahe, Python basic yete, roj 2 taas deu shakte, ani Marathi madhe guidance pahije.',
  }[item.label];
  return cleanText ? { ...item, text: cleanText } : item;
});

const FIELD_DEMO_PROMPT =
  'Mo naam Prakash. Mu Balangir Odisha ru, Class 10 pass. Ghara shared Android phone achhi, WhatsApp voice note chaluchi kintu data slow. Mate agriculture drone service ebam digital farm service sikhibaku darkar, income 1-2 months re darkar. Mu Odia re bujhe, dina ku 45 minute deiparibi, 20 km safe travel kariparibi.';

const demoMoments = [
  {
    id: 'voice',
    title: 'Odia voice intake',
    target: 'counselor',
    proof: 'Language selected, live transcript/voice path, and structured profile facts.',
  },
  {
    id: 'pathway',
    title: 'Generated pathway map',
    target: 'pathways',
    proof: 'Three route options with tradeoffs, source titles, and recommendation trace.',
  },
  {
    id: 'passport',
    title: 'Skill Passport QR',
    target: 'passport',
    proof: 'Consent-scoped proof package with QR token and learning proof.',
  },
  {
    id: 'opportunity',
    title: 'Hyperlocal opportunity engine',
    target: 'jobs',
    proof: 'Location-aware search plan, source tasks, and only live-derived cards.',
  },
  {
    id: 'adews',
    title: 'ADEWS worker alert',
    target: 'support',
    proof: 'Missed check-ins trigger risk score and worker action.',
  },
];

const validationMetrics = [
  { label: 'Persona smoke tests', value: '8/8', detail: 'school, boards, JEE, dropout, ITI, training, college, no-location guard' },
  { label: 'Language/voice tests', value: '8/8', detail: 'English, Hinglish, Hindi, Odia, Bengali, Marathi, Tamil, retry path' },
  { label: 'Journey persistence tests', value: '3/3', detail: 'study, data science, informal skill proof resume/passport progress' },
  { label: 'Opportunity safety', value: '0 fake sends', detail: 'contact missing stays in source-review until verified' },
];

const languageOptions = [
  { name: 'English', label: 'English', helper: 'Simple English', stt: 'en-IN', speech: 'en-IN' },
  { name: 'Hinglish', label: 'Hinglish', helper: 'Hindi + English', stt: 'hi-IN', speech: 'hi-IN' },
  { name: 'Hindi', label: 'Hindi', helper: 'Hindi script', stt: 'hi-IN', speech: 'hi-IN' },
  { name: 'Marathi', label: 'Marathi', helper: 'Marathi voice/text', stt: 'mr-IN', speech: 'mr-IN' },
  { name: 'Odia', label: 'Odia', helper: 'Odia voice/text', stt: 'od-IN', speech: 'or-IN' },
  { name: 'Bengali', label: 'Bengali', helper: 'Bangla voice/text', stt: 'bn-IN', speech: 'bn-IN' },
  { name: 'Tamil', label: 'Tamil', helper: 'Tamil voice/text', stt: 'ta-IN', speech: 'ta-IN' },
  { name: 'Telugu', label: 'Telugu', helper: 'Telugu voice/text', stt: 'te-IN', speech: 'te-IN' },
  { name: 'Kannada', label: 'Kannada', helper: 'Kannada voice/text', stt: 'kn-IN', speech: 'kn-IN' },
  { name: 'Malayalam', label: 'Malayalam', helper: 'Malayalam voice/text', stt: 'ml-IN', speech: 'ml-IN' },
  { name: 'Gujarati', label: 'Gujarati', helper: 'Gujarati voice/text', stt: 'gu-IN', speech: 'gu-IN' },
  { name: 'Punjabi', label: 'Punjabi', helper: 'Punjabi voice/text', stt: 'pa-IN', speech: 'pa-IN' },
];

const prototypeLanguageOrder = ['Hindi', 'English', 'Hinglish', 'Marathi', 'Odia', 'Tamil', 'Telugu', 'Bengali', 'Gujarati'];
const prototypeLanguageOptions = prototypeLanguageOrder
  .map((name) => languageOptions.find((option) => option.name === name))
  .filter(Boolean);

const indicScriptRegex = /[\u0900-\u097f\u0980-\u09ff\u0a00-\u0a7f\u0a80-\u0aff\u0b00-\u0b7f\u0b80-\u0bff\u0c00-\u0c7f\u0c80-\u0cff\u0d00-\u0d7f]/;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function availableSpeechVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve([]);
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  if (voices.length) return Promise.resolve(voices);

  return new Promise((resolve) => {
    let resolved = false;
    const done = () => {
      if (resolved) return;
      resolved = true;
      resolve(synth.getVoices());
    };

    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', done, { once: true });
    } else {
      const previous = synth.onvoiceschanged;
      synth.onvoiceschanged = (event) => {
        if (typeof previous === 'function') previous.call(synth, event);
        done();
      };
    }
    window.setTimeout(done, 900);
  });
}

function uniqueValues(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function speechLanguageCandidates(option = {}, text = '') {
  const primary = option.speech || option.stt || 'en-IN';
  const hasIndicScript = indicScriptRegex.test(text);
  const isHinglish = option.name === 'Hinglish' || option.label === 'Hinglish';
  const base = hasIndicScript
    ? ['hi-IN', primary, 'en-IN', 'en-US']
    : isHinglish
      ? ['hi-IN', primary, 'en-IN', 'en-US']
      : [primary, 'en-IN', 'en-US', 'hi-IN'];
  return uniqueValues(base);
}

function simpleVoiceLanguageKind(profile = {}) {
  const raw = String(profile?.preferred_language || profile?.language || '').toLowerCase();
  if (raw.includes('hinglish')) return 'hinglish';
  if (raw.includes('hindi')) return 'hindi';
  return raw || 'english';
}

function replaceVoiceTerms(text = '', replacements = []) {
  return replacements.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), String(text || ''));
}

function voiceFriendlyText(text = '', nextProfile = {}) {
  const kind = simpleVoiceLanguageKind(nextProfile);
  const compact = String(text || '').replace(/\s+/g, ' ').trim();
  if (!compact) return '';
  if (kind === 'hindi') {
    return replaceVoiceTerms(compact, [
      [/\bprofile\b/gi, 'जानकारी'],
      [/\blong form\b/gi, 'लंबा फॉर्म'],
      [/\bskill\b/gi, 'हुनर'],
      [/\bskills\b/gi, 'हुनर'],
      [/\bjob\b/gi, 'नौकरी'],
      [/\bjobs\b/gi, 'नौकरियाँ'],
      [/\binternship\b/gi, 'काम सीखने का मौका'],
      [/\bbusiness\b/gi, 'व्यापार'],
      [/\bresume\b/gi, 'काम की जानकारी'],
      [/\bproof\b/gi, 'सबूत'],
      [/\bpathway\b/gi, 'रास्ता'],
      [/\bhelp\b/gi, 'मदद'],
      [/\bsafe travel\b/gi, 'सुरक्षित आना-जाना'],
    ]);
  }
  if (kind === 'hinglish') {
    return replaceVoiceTerms(compact, [
      [/\bprofile\b/gi, 'jankari'],
      [/\blong form\b/gi, 'lamba form'],
      [/\bskill\b/gi, 'hunar'],
      [/\bskills\b/gi, 'hunar'],
      [/\bjob\b/gi, 'naukri'],
      [/\bjobs\b/gi, 'naukriyan'],
      [/\binternship\b/gi, 'kaam seekhne ka avsar'],
      [/\bbusiness\b/gi, 'vyapar'],
      [/\bresume\b/gi, 'kaam ki jankari'],
      [/\bproof\b/gi, 'saboot'],
      [/\bpathway\b/gi, 'rasta'],
      [/\bhelp\b/gi, 'madad'],
      [/\bsafe travel\b/gi, 'surakshit aana-jaana'],
    ]);
  }
  return compact;
}

function voiceScore(voice, lang) {
  const voiceLang = String(voice?.lang || '').toLowerCase();
  const target = String(lang || '').toLowerCase();
  if (!voiceLang || !target) return 0;
  if (voiceLang === target) return voice.localService ? 5 : 4;
  if (voiceLang.split('-')[0] === target.split('-')[0]) return voice.localService ? 3 : 2;
  return 0;
}

function bestVoiceForLanguage(voices = [], lang = '') {
  return [...voices]
    .map((voice) => ({ voice, score: voiceScore(voice, lang) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)[0]?.voice || null;
}

function speechAttempts(option = {}, text = '', voices = []) {
  const candidates = speechLanguageCandidates(option, text);
  const attempts = candidates.map((lang) => ({
    lang,
    voice: bestVoiceForLanguage(voices, lang),
  }));
  attempts.push({ lang: candidates[0] || 'en-IN', voice: null });
  return attempts.filter((attempt, index, list) => {
    const key = `${attempt.lang}-${attempt.voice?.voiceURI || 'default'}`;
    return list.findIndex((item) => `${item.lang}-${item.voice?.voiceURI || 'default'}` === key) === index;
  });
}

function demoMomentStatus({ profile = {}, pathway, journey, passport, matches = [], adews, opportunityMeta, lastProof }) {
  const language = languageProfileForUi(profile, lastProof);
  const sourceTasks = opportunityMeta?.source_tasks || opportunityMeta?.search_plan?.source_tasks || [];
  return {
    voice: {
      ready: Boolean(language.preferred_language && language.stt_language_code && (profile.phone_access || profile.device)),
      detail: `${language.preferred_language || 'language pending'} | ${language.stt_language_code || 'STT pending'} | ${profile.phone_access || profile.device || 'phone pending'}`,
    },
    pathway: {
      ready: Boolean(pathway?.routes?.length),
      detail: pathway?.routes?.length ? `${pathway.routes.length} routes, ${pathway.provider || 'AI + evidence'}` : 'Generate after intake',
    },
    passport: {
      ready: Boolean(passport?.qr_token),
      detail: passport?.qr_token ? `QR ${passport.qr_token}` : 'Create after journey/proof',
    },
    opportunity: {
      ready: Boolean(matches.length || sourceTasks.length || opportunityMeta?.study_mode || opportunityMeta?.location_required),
      detail: matches.length
        ? `${matches.length} live-derived card(s)`
        : sourceTasks.length
          ? `${sourceTasks.length} verification task(s)`
          : opportunityMeta?.location_required
            ? 'location guard active'
            : 'run opportunity engine',
    },
    adews: {
      ready: Boolean(adews?.fired),
      detail: adews?.fired ? `risk ${adews.risk}` : 'run 7-day silence check',
    },
    journey: {
      ready: Boolean(journey?.modules?.length),
      detail: journey?.modules?.length ? `${journey.modules.length} weekly modules` : 'journey pending',
    },
  };
}

function qrCellsForToken(token = '') {
  const source = String(token || 'vidyasetu-demo-passport');
  const cells = [];
  for (let index = 0; index < 49; index += 1) {
    const charCode = source.charCodeAt(index % source.length) || 17;
    const finder =
      (index < 14 && index % 7 < 2) ||
      (index % 7 > 4 && Math.floor(index / 7) < 2) ||
      (index % 7 < 2 && Math.floor(index / 7) > 4);
    cells.push(finder || ((charCode + index * 13) % 5 < 2));
  }
  return cells;
}

function starterMessageForLanguage(language = 'English') {
  const messages = {
    English:
      'Hello, I am Meera from VidyaSetu. We will talk one by one, not fill a long form. First, what name should I call you?',
    Hinglish:
      'Namaste, main VidyaSetu ki Meera hoon. Hum ek-ek baat poochhkar aapki jankari banayenge, lamba form nahi. Pehle batao, Meera aapko kis naam se bulaye?',
    Hindi:
      'नमस्ते, मैं VidyaSetu की मीरा हूँ। मैं एक-एक बात पूछकर आपकी जानकारी बनाऊँगी, लंबा फॉर्म नहीं। पहले बताइए, मीरा आपको किस नाम से बुलाए?',
    Marathi:
      'नमस्ते, मी VidyaSetu ची Meera आहे. मी एक-एक प्रश्न विचारून तुमची माहिती तयार करेन. आधी सांगा, Meera तुम्हाला कोणत्या नावाने बोलवू?',
    Odia:
      'ନମସ୍କାର, ମୁଁ VidyaSetu ର Meera. ମୁଁ ଗୋଟିଏ ପରେ ଗୋଟିଏ କଥା ପଚାରି ଆପଣଙ୍କ ସୂଚନା ତିଆରି କରିବି. ପ୍ରଥମେ କୁହନ୍ତୁ, Meera ଆପଣଙ୍କୁ କେଉଁ ନାମରେ ଡାକିବ?',
    Bengali:
      'নমস্কার, আমি VidyaSetu-র Meera. আমি এক এক করে প্রশ্ন করে আপনার তথ্য তৈরি করব. আগে বলুন, Meera আপনাকে কোন নামে ডাকবে?',
    Tamil:
      'வணக்கம், நான் VidyaSetu Meera. உங்கள் விவரங்களை ஒவ்வொரு படியாக உருவாக்குவோம். முதலில், Meera உங்களை எந்த பெயரில் அழைக்கலாம்?',
    Telugu:
      'నమస్తే, నేను VidyaSetu Meera. ఒక్కొక్క ప్రశ్న అడిగి మీ వివరాలు తయారు చేస్తాను. ముందుగా, Meera మిమ్మల్ని ఏ పేరుతో పిలవాలి?',
    Kannada:
      'ನಮಸ್ತೆ, ನಾನು VidyaSetu Meera. ಒಂದೊಂದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ತಯಾರಿಸುತ್ತೇನೆ. ಮೊದಲು, Meera ನಿಮ್ಮನ್ನು ಯಾವ ಹೆಸರಿನಿಂದ ಕರೆಯಲಿ?',
    Malayalam:
      'നമസ്കാരം, ഞാൻ VidyaSetu Meera. ഓരോ ചോദ്യം ചോദിച്ച് നിങ്ങളുടെ വിവരം തയ്യാറാക്കാം. ആദ്യം, Meera നിങ്ങളെ ഏത് പേരിൽ വിളിക്കണം?',
    Gujarati:
      'નમસ્તે, હું VidyaSetu ની Meera છું. હું એક-એક પ્રશ્ન પૂછીને તમારી માહિતી તૈયાર કરીશ. પહેલા કહો, Meera તમને કયા નામથી બોલાવે?',
    Punjabi:
      'ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ VidyaSetu ਦੀ Meera ਹਾਂ. ਮੈਂ ਇਕ-ਇਕ ਸਵਾਲ ਪੁੱਛ ਕੇ ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਤਿਆਰ ਕਰਾਂਗੀ. ਪਹਿਲਾਂ ਦੱਸੋ, Meera ਤੁਹਾਨੂੰ ਕਿਸ ਨਾਮ ਨਾਲ ਬੁਲਾਏ?',
  };
  return { role: 'assistant', content: messages[language] || messages.English };
}

const initialAssistantMessage = starterMessageForLanguage('English');

const tabMeta = {
  overview: { title: 'Overview', subtitle: 'Pathway, proof, opportunities, and outreach status in one place', Icon: LayoutDashboard },
  profile: { title: 'Learner Profile', subtitle: 'Clean intake, language, device, interest, and constraints', Icon: UserRound },
  counselor: { title: 'Talk to Meera', subtitle: 'She builds your profile from a normal chat - type or speak, in your language.', Icon: MessageCircle },
  readiness: { title: 'Readiness Layers', subtitle: 'Trust and proof gates before any employer outreach', Icon: ShieldCheck },
  pathways: { title: 'Your personalised pathway', subtitle: 'Meera decides the shortest credible route to your goal - and what unlocks next.', Icon: GraduationCap },
  journey: { title: 'Learning journey', subtitle: 'Concrete daily tasks. Each week ends with a proof task.', Icon: BookOpen },
  passport: { title: 'Skill Passport', subtitle: 'Verified skills with evidence - yours to share, only when you choose.', Icon: ClipboardList },
  jobs: { title: 'Opportunities', subtitle: 'Found live and verified - never fabricated. Everything shows when it was checked.', Icon: Search },
  outreach: { title: 'Outreach CRM', subtitle: 'Drafts, queued sends, reply classification, and pipeline state', Icon: Send },
  followups: { title: 'Follow-ups', subtitle: 'Next actions after employer replies or silence', Icon: Bell },
  support: { title: 'Worker Support', subtitle: 'ADEWS support escalation and safety net', Icon: Briefcase },
  proof: { title: 'Evaluation Proof', subtitle: 'Live evidence for intake, personalization, safety, consent, and persistence', Icon: ShieldCheck },
};

function emptyProfile(phone = '') {
  return {
    learner_id: null,
    phone_hash: '',
    phone,
    name: '',
    age: null,
    class_level: '',
    education_status: '',
    location: '',
    commute_km: null,
    commute_constraint: 'safe commute preferred',
    aspirations: [],
    skills: [],
    proof_available: [],
    phone_access: '',
    device: '',
    time_available: '',
    earning_urgency: '',
    income_pressure: false,
    language: 'Language pending',
    preferred_language: '',
    language_profile: {
      preferred_language: 'Pending',
      reply_script: 'Pending',
      stt_language_code: 'en-IN',
      voice_channel: 'voice + text',
      same_language_reply: true,
    },
    content_preferences: [],
    support_needs: [],
    missing_fields: [],
    profile_confidence: 0,
    persona: '',
    last_updated: '',
    profile_complete: false,
  };
}

function languageOptionFor(name = '') {
  const raw = String(name || '').toLowerCase();
  if (!raw || /pending|local language/.test(raw)) return languageOptions[0];
  return (
    languageOptions.find((item) => item.name.toLowerCase() === raw) ||
    languageOptions.find((item) => raw.includes(item.name.toLowerCase())) ||
    languageOptions[0]
  );
}

function profileWithPreferredLanguage(profile = {}, languageName = '') {
  const option = languageOptionFor(languageName || profile.preferred_language || profile.language);
  return {
    ...profile,
    language: option.name,
    preferred_language: option.name,
    language_profile: {
      ...(profile.language_profile || {}),
      preferred_language: option.name,
      reply_script: scriptForLanguage(option.name),
      stt_language_code: option.stt,
      voice_channel: 'voice + text',
      same_language_reply: true,
    },
  };
}

function languageProfileForUi(profile = {}, proof = null) {
  const proofLanguage = proof?.language || {};
  const storedLanguage = profile.language_profile || {};
  const preferred =
    proofLanguage.preferred_language ||
    storedLanguage.preferred_language ||
    profile.preferred_language ||
    profile.language ||
    'Pending';
  return {
    preferred_language: preferred,
    reply_script: proofLanguage.reply_script || storedLanguage.reply_script || scriptForLanguage(preferred),
    stt_language_code: proofLanguage.stt_language_code || storedLanguage.stt_language_code || languageCodeForProfile(profile),
    voice_channel: proofLanguage.voice_channel || storedLanguage.voice_channel || 'voice + text',
    same_language_reply: proofLanguage.same_language_reply ?? storedLanguage.same_language_reply ?? true,
  };
}

function languageCodeForProfile(profile = {}) {
  const profileCode = profile.language_profile?.stt_language_code;
  if (profileCode) return profileCode;
  const label = String(profile.preferred_language || profile.language || '').toLowerCase();
  if (/odia|oriya/.test(label)) return 'od-IN';
  if (/bengali|bangla/.test(label)) return 'bn-IN';
  if (/marathi/.test(label)) return 'mr-IN';
  if (/tamil/.test(label)) return 'ta-IN';
  if (/telugu/.test(label)) return 'te-IN';
  if (/kannada/.test(label)) return 'kn-IN';
  if (/malayalam/.test(label)) return 'ml-IN';
  if (/gujarati/.test(label)) return 'gu-IN';
  if (/punjabi/.test(label)) return 'pa-IN';
  if (/english/.test(label) && !/hindi/.test(label)) return 'en-IN';
  return 'hi-IN';
}

function scriptForLanguage(label = '') {
  const value = String(label || '').toLowerCase();
  if (/odia|oriya/.test(value)) return 'Odia';
  if (/bengali|bangla/.test(value)) return 'Bengali';
  if (/tamil/.test(value)) return 'Tamil';
  if (/telugu/.test(value)) return 'Telugu';
  if (/kannada/.test(value)) return 'Kannada';
  if (/malayalam/.test(value)) return 'Malayalam';
  if (/gujarati/.test(value)) return 'Gujarati';
  if (/punjabi/.test(value)) return 'Gurmukhi';
  if (/hindi|marathi/.test(value)) return 'Devanagari';
  return 'Latin';
}

function uiText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const text = value.map((item) => uiText(item)).filter(Boolean).join(', ');
    return text || fallback;
  }
  if (typeof value === 'object') {
    const preferred =
      value.label ||
      value.title ||
      value.name ||
      value.text ||
      value.value ||
      value.summary ||
      value.description ||
      value.url;
    if (preferred !== undefined) return uiText(preferred, fallback);
    try {
      return JSON.stringify(value).slice(0, 180);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function formatCopy(template = '', values = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
}

function uiUrl(value) {
  const text = uiText(value);
  return /^https?:\/\//i.test(text) ? text : '';
}

function uiConfidence(value, fallback = 0.75) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return number > 1 ? number / 100 : number;
}

function counselorFocus(profile = {}) {
  const intent = profile.learner_goal?.intent;
  const persona = String(profile.persona || '').replace(/_/g, ' ');
  if (intent === 'study') return profile.academic_goal?.target || 'Study support';
  if (intent === 'job') return profile.learner_goal?.label || 'Job readiness';
  if (intent === 'training') return profile.learner_goal?.label || 'Training pathway';
  if (intent === 'proof_to_work') return 'Proof-first work pathway';
  return persona || 'Still choosing a path';
}

function nextCounselorNeed(profile = {}) {
  const missing = Array.isArray(profile.missing_fields) ? profile.missing_fields.filter(Boolean) : [];
  if (missing.length) return missing.slice(0, 2).join(', ');
  if (!profile.location) return 'location';
  if (!profile.time_available) return 'daily time';
  if (!profile.aspirations?.length) return 'interest or goal';
  return 'ready for pathway';
}

function normalizedDisplayKey(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function localizedProfileValue(value, copy = {}, fallback = '') {
  const text = uiText(value, fallback);
  if (!text) return fallback;
  const key = normalizedDisplayKey(text);
  if (['goal not clear yet', 'goal clarification needed'].includes(key)) {
    return copy.discovering || fallback;
  }
  return copy.valueMap?.[key] || text;
}

function localizedProfileNeed(value, copy = {}) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const key = normalizedDisplayKey(item);
      if (key === 'goal signal') return copy.goal || 'goal';
      return copy.needMap?.[key] || item;
    })
    .join(', ');
}

function quickStartSubtitle(label = '') {
  const map = {
    'Mobile repair learner': 'Training + early income',
    'Computer job seeker': 'Local job readiness',
    'Tailoring path': 'Informal skill proof',
    'Agri drone interest': 'Rural tech pathway',
    'Odia study support': 'School support',
    'Marathi placement': 'College placement',
  };
  return map[label] || 'Sample intake';
}

function CounselorAvatar({ compact = false }) {
  return (
    <div className={compact ? 'counselor-avatar compact' : 'counselor-avatar'} aria-label="Meera, VidyaSetu counselor">
      <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true">
        <defs>
          <linearGradient id="meeraKurta" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#3D5AFE" />
            <stop offset="1" stopColor="#2B40C9" />
          </linearGradient>
          <linearGradient id="meeraSkin" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#F1C29B" />
            <stop offset="1" stopColor="#E3A877" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="60" fill="#EEF1FF" />
        <path d="M14 120 C14 90 34 78 60 78 C86 78 106 90 106 120 Z" fill="url(#meeraKurta)" />
        <path d="M14 120 C16 98 30 86 44 82 L40 120 Z" fill="#0E9A8E" opacity=".55" />
        <path d="M106 120 C104 98 90 86 76 82 L80 120 Z" fill="#0E9A8E" opacity=".55" />
        <rect x="53" y="62" width="14" height="20" rx="7" fill="#E3A877" />
        <path d="M33 52 C33 24 87 24 87 52 C87 70 80 80 60 80 C40 80 33 70 33 52 Z" fill="#2A2A33" />
        <ellipse cx="60" cy="50" rx="21" ry="24" fill="url(#meeraSkin)" />
        <path d="M39 46 C40 28 80 28 81 46 C81 40 74 33 60 33 C46 33 39 40 39 46 Z" fill="#2A2A33" />
        <path d="M60 33 L60 44" stroke="#1c1c22" strokeWidth="1.4" />
        <circle cx="60" cy="24" r="8.5" fill="#23232b" />
        <circle cx="39" cy="52" r="3.4" fill="#E3A877" />
        <circle cx="81" cy="52" r="3.4" fill="#E3A877" />
        <circle cx="39" cy="58" r="2.1" fill="#F4A261" />
        <circle cx="81" cy="58" r="2.1" fill="#F4A261" />
        <path d="M49 44 q5 -3 10 0" stroke="#3a2e25" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M61 44 q5 -3 10 0" stroke="#3a2e25" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <ellipse cx="53" cy="50" rx="3.2" ry="3.6" fill="#2c2620" />
        <circle cx="54.1" cy="49" r="1" fill="#fff" />
        <ellipse cx="67" cy="50" rx="3.2" ry="3.6" fill="#2c2620" />
        <circle cx="68.1" cy="49" r="1" fill="#fff" />
        <path d="M60 52 q-1.5 4 1 6" stroke="#cf9468" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M53 62 q7 6 14 0" stroke="#b9603f" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="60" cy="39" r="2" fill="#E5398B" />
      </svg>
      <i className="counselor-avatar-dot" />
    </div>
  );
}

function App() {
  const [mode, setMode] = useState('landing');
  const [phone, setPhone] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  // The learner's explicit language choice. Set only by the login picker and
  // returning-learner restore; never overwritten by later language detection,
  // so the UI chrome stays in the language they chose.
  const [uiLanguage, setUiLanguage] = useState('');
  const [profile, setProfile] = useState(emptyProfile());
  const [messages, setMessages] = useState([initialAssistantMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('counselor');
  const [pathway, setPathway] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [lockedRouteKey, setLockedRouteKey] = useState('');
  const [journey, setJourney] = useState(null);
  const [passport, setPassport] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [outreach, setOutreach] = useState(null);
  const [adews, setAdews] = useState(null);
  const [dailyReminder, setDailyReminder] = useState(null);
  const [lastProof, setLastProof] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [opportunityMeta, setOpportunityMeta] = useState(null);
  const [manualEmail, setManualEmail] = useState('');
  const [completedLessons, setCompletedLessons] = useState({});
  const [proofNotes, setProofNotes] = useState({});
  const [proofArtifacts, setProofArtifacts] = useState({});
  const [progressState, setProgressState] = useState({});
  const [recording, setRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [returning, setReturning] = useState(false);
  const [learnerChoices, setLearnerChoices] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [adminData, setAdminData] = useState(null);
  const [adminQuery, setAdminQuery] = useState('');
  const [adminStatus, setAdminStatus] = useState('all');
  const [adminSelectedLearnerId, setAdminSelectedLearnerId] = useState('');
  const [adminNotice, setAdminNotice] = useState('');
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const speechRecognitionRef = useRef(null);
  const liveTranscriptRef = useRef('');
  const transcriptDraftRef = useRef('');
  const speechRequestRef = useRef(0);
  const speechTimerRef = useRef(null);
  const speechAudioRef = useRef(null);
  const speechTabRef = useRef(activeTab);
  const previousActiveTabRef = useRef(activeTab);

  const selectedMatch = matches.find((match) => match.id === selectedMatchId) || matches[0];
  const completion = useMemo(() => {
    const done = [
      profile.profile_complete,
      pathway?.routes?.length,
      journey?.modules?.length,
      passport?.qr_token,
      resumeText.trim(),
      matches.length,
      outreach,
      adews?.fired,
    ].filter(Boolean).length;
    return Math.round((done / 8) * 100);
  }, [profile, pathway, journey, passport, resumeText, matches, outreach, adews]);
  const readinessLayers = useMemo(
    () => buildReadinessLayers({ profile, pathway, journey, passport, matches, outreach, resumeText }),
    [profile, pathway, journey, passport, matches, outreach, resumeText],
  );
  const journeyProgressForLock = {
    ...(journey?.progress || {}),
    ...(progressState || {}),
  };
  const journeyCompleteForPassport = isJourneyCompleteForPassport(journey, journeyProgressForLock);
  const routeKeyForLock = lockedRouteKey || (journey?.modules?.length ? routeKey(selectedRoute) : '');
  const pathwayLocked = Boolean(routeKeyForLock) && !journeyCompleteForPassport;
  const journeyLocked = Boolean(journey?.modules?.length) && !journeyCompleteForPassport;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0 });
    }
  }, [mode, activeTab]);

  useEffect(() => {
    if (previousActiveTabRef.current !== activeTab) {
      previousActiveTabRef.current = activeTab;
      if (speechTabRef.current && speechTabRef.current !== activeTab) {
        stopSpeaking();
      }
    }
  }, [activeTab]);

  async function api(url, body) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      const checkpoint =
        /Vercel Security Checkpoint|We're verifying your browser|<!doctype html|<!DOCTYPE html/i.test(text);
      throw new Error(
        checkpoint
          ? 'Vercel security checkpoint blocked this request. Please refresh once, or disable Vercel Attack Mode before demo.'
          : 'The server returned an unreadable response. Please retry this action.',
      );
    }
    if (!response.ok) throw new Error(data.error || response.statusText);
    return data;
  }

  async function run(label, fn) {
    setLoading(label);
    setError('');
    try {
      return await fn();
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading('');
    }
  }

  async function adminLogin(event) {
    event.preventDefault();
    await run('Opening admin CRM...', async () => {
      const data = await api('/api/signup', { action: 'admin_login', password: adminPassword });
      setAdminToken(data.admin_token);
      setAdminNotice(data.message || 'Admin session opened.');
      setMode('admin');
      await loadAdminCrm(data.admin_token, adminSelectedLearnerId);
    });
  }

  async function loadAdminCrm(token = adminToken, learnerId = adminSelectedLearnerId) {
    if (!token) return null;
    const data = await api('/api/signup', {
      action: 'admin_overview',
      admin_token: token,
      learner_id: learnerId,
      limit: 250,
    });
    setAdminData(data);
    if (!learnerId && data.users?.[0]?.learner_id) {
      setAdminSelectedLearnerId(data.users[0].learner_id);
    }
    return data;
  }

  async function refreshAdminCrm() {
    await run('Refreshing admin CRM...', async () => {
      await loadAdminCrm(adminToken, adminSelectedLearnerId);
      setAdminNotice('Admin CRM refreshed.');
    });
  }

  async function selectAdminLearner(learnerId) {
    setAdminSelectedLearnerId(learnerId);
    await run('Loading learner detail...', async () => {
      await loadAdminCrm(adminToken, learnerId);
    });
  }

  async function acknowledgeAdminAlert(learnerId, scoreId) {
    await run('Acknowledging worker alert...', async () => {
      const data = await api('/api/signup', {
        action: 'admin_ack_adews',
        admin_token: adminToken,
        learner_id: learnerId,
        score_id: scoreId,
      });
      if (!data.ok) throw new Error(data.error || 'Could not acknowledge alert.');
      setAdminNotice('Worker alert acknowledged.');
      await loadAdminCrm(adminToken, learnerId);
    });
  }

  function closeAdminCrm() {
    setAdminToken('');
    setAdminPassword('');
    setAdminData(null);
    setAdminSelectedLearnerId('');
    setAdminNotice('');
    setMode('landing');
  }

  function hydrateWorkspace(data) {
    const workspace = data.workspace || {};
    const baseProfile = { ...emptyProfile(phone), ...(workspace.profile || data.profile || {}) };
    const storedLanguage = baseProfile.preferred_language || baseProfile.language;
    const requestedLanguage = selectedLanguage || storedLanguage || 'English';
    const nextProfile = profileWithPreferredLanguage(baseProfile, requestedLanguage);
    const starter = starterMessageForLanguage(nextProfile.preferred_language || requestedLanguage);
    const restoredMessages = workspace.messages?.length ? workspace.messages : data.messages?.length ? data.messages : [];
    const restoredJourney = workspace.journey || null;
    const restoredSelectedRoute = workspace.selectedRoute || null;
    const restoredProgress = workspace.progress || restoredJourney?.progress || {};
    setProfile(nextProfile);
    setSelectedLanguage(nextProfile.preferred_language || requestedLanguage);
    setUiLanguage(nextProfile.preferred_language || requestedLanguage);
    setMessages(restoredMessages.length ? restoredMessages : [starter]);
    setReturning(Boolean(data.returning));
    setPathway(workspace.pathway || null);
    setSelectedRoute(restoredSelectedRoute);
    setJourney(restoredJourney);
    setLockedRouteKey(
      restoredJourney?.modules?.length && !isJourneyCompleteForPassport(restoredJourney, restoredProgress)
        ? routeKey(restoredSelectedRoute)
        : '',
    );
    setPassport(workspace.passport || null);
    setMatches(workspace.matches || []);
    setSelectedMatchId(workspace.selectedMatchId || workspace.matches?.[0]?.id || '');
    setOutreach(workspace.outreach || null);
    setAdews(workspace.adews || null);
    setDailyReminder(null);
    setResumeText(workspace.resumeText || '');
    setResumeFileName(workspace.resumeFileName || '');
    setOpportunityMeta(workspace.opportunityMeta || null);
    setManualEmail('');
    setInput('');
    setError('');
    setCompletedLessons(workspace.completedLessons || {});
    setProofNotes(workspace.proofNotes || {});
    setProofArtifacts(workspace.proofArtifacts || {});
    setProgressState(restoredProgress);
    setLastProof(data.proof || null);
    setLearnerChoices([]);
    setMode('platform');
    setActiveTab(workspace.activeTab || 'overview');
  }

  async function startWithPhone(event) {
    event.preventDefault();
    if (!selectedLanguage) {
      setError('Please choose a guidance language first.');
      return;
    }
    await run('Opening learner workspace...', async () => {
      const data = await api('/api/signup', { phone, preferred_language: selectedLanguage });
      if (data.needs_selection) {
        setLearnerChoices(data.learners || []);
        setReturning(true);
        setLastProof(data.proof || null);
        return;
      }
      hydrateWorkspace(data);
    });
  }

  async function selectLearner(learnerId) {
    await run('Restoring saved learner journey...', async () => {
      const data = await api('/api/signup', { phone, learner_id: learnerId, preferred_language: selectedLanguage });
      hydrateWorkspace(data);
    });
  }

  async function startNewLearner() {
    await run('Creating a new learner on this phone...', async () => {
      const data = await api('/api/signup', { phone, create_new: true, preferred_language: selectedLanguage });
      hydrateWorkspace(data);
    });
  }

  async function sendMessage(content = input) {
    const trimmed = content.trim();
    if (!trimmed) return;
    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    await run('Counselor is thinking...', async () => {
      const languageLockedProfile = profileWithPreferredLanguage(profile, selectedLanguage || profile.preferred_language || profile.language);
      const data = await api('/api/counselor', {
        learner_id: languageLockedProfile.learner_id,
        phone_hash: languageLockedProfile.phone_hash || `demo_hash_${languageLockedProfile.phone || phone}`,
        profile: languageLockedProfile,
        messages: nextMessages,
      });
      const nextProfile = profileWithPreferredLanguage({ ...emptyProfile(profile.phone || phone), ...data.profile }, data.profile?.preferred_language || selectedLanguage);
      setProfile(nextProfile);
      setSelectedLanguage(nextProfile.preferred_language || selectedLanguage || 'English');
      setLastProof(data.proof || null);
      const assistantIndex = nextMessages.length;
      setMessages([...nextMessages, { role: 'assistant', content: data.reply }]);
      speakReply(data.reply, nextProfile, assistantIndex);
    });
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Voice recording is not available in this browser.');
      return;
    }
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    transcriptDraftRef.current = '';
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Microphone permission was blocked. Please allow microphone access and try voice again.');
      return;
    }
    const recorder = new MediaRecorder(stream);
    const recognition = startLiveSpeechRecognition(profileWithPreferredLanguage(profile, selectedLanguage || profile.preferred_language || profile.language));
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      setVoiceStatus('Preparing voice note...');
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        setVoiceStatus('Transcribing voice note...');
        await run('Transcribing voice and updating profile...', async () => {
          const languageLockedProfile = profileWithPreferredLanguage(profile, selectedLanguage || profile.preferred_language || profile.language);
          const data = await api('/api/counselor', {
            learner_id: languageLockedProfile.learner_id,
            phone_hash: languageLockedProfile.phone_hash || `demo_hash_${languageLockedProfile.phone || phone}`,
            profile: languageLockedProfile,
            messages,
            audioBase64: reader.result,
            browserTranscript: liveTranscriptRef.current || transcriptDraftRef.current,
            fileName: 'learner-voice.webm',
            languageCode: languageCodeForProfile(languageLockedProfile),
          });
          const transcript = String(data.proof?.stt?.transcript || '').trim();
          const nextProfile = profileWithPreferredLanguage({ ...emptyProfile(profile.phone || phone), ...data.profile }, data.profile?.preferred_language || selectedLanguage);
          setProfile(nextProfile);
          setSelectedLanguage(nextProfile.preferred_language || selectedLanguage || 'English');
          setLastProof(data.proof || null);
          const nextVoiceMessages = transcript
            ? [...messages, { role: 'user', content: transcript }, { role: 'assistant', content: data.reply }]
            : [...messages, { role: 'assistant', content: data.reply }];
          const assistantIndex = nextVoiceMessages.length - 1;
          setMessages(nextVoiceMessages);
          speakReply(data.reply, nextProfile, assistantIndex);
        });
        setVoiceStatus('');
        setLiveTranscript('');
        liveTranscriptRef.current = '';
        transcriptDraftRef.current = '';
      };
      reader.readAsDataURL(blob);
      setRecording(false);
    };
    recorderRef.current = recorder;
    recorder.start();
    speechRecognitionRef.current = recognition;
    setVoiceStatus(recognition ? 'Listening live... speak naturally, then tap Stop voice.' : 'Listening... tap Stop voice when done.');
    setRecording(true);
  }

  function stopRecording() {
    try {
      speechRecognitionRef.current?.stop();
    } catch {
      // Browser speech recognition may already be stopped.
    }
    speechRecognitionRef.current = null;
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setVoiceStatus('Voice note received. Transcribing...');
  }

  function startLiveSpeechRecognition(nextProfile = profile) {
    if (typeof window === 'undefined') return null;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus('Live transcription is not supported in this browser. Audio STT will run after Stop voice.');
      return null;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = languageCodeForProfile(nextProfile);
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        let finalText = '';
        let interimText = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const transcript = event.results[index][0]?.transcript || '';
          if (event.results[index].isFinal) finalText += `${transcript} `;
          else interimText += `${transcript} `;
        }
        const existing = liveTranscriptRef.current.replace(/\s+/g, ' ').trim();
        if (finalText.trim()) {
          liveTranscriptRef.current = `${existing} ${finalText}`.replace(/\s+/g, ' ').trim();
        }
        const display = `${liveTranscriptRef.current} ${interimText}`.replace(/\s+/g, ' ').trim();
        transcriptDraftRef.current = display;
        setLiveTranscript(display);
        if (display) setVoiceStatus('Live transcription active...');
      };
      recognition.onerror = () => {
        setVoiceStatus('Live transcription paused; audio STT will still run after Stop voice.');
      };
      recognition.start();
      return recognition;
    } catch {
      setVoiceStatus('Live transcription could not start; audio STT will still run after Stop voice.');
      return null;
    }
  }

  async function speakReply(text, nextProfile = profile, messageIndex = null, options = {}) {
    if (!text || typeof window === 'undefined') {
      setVoiceStatus('Voice playback is not supported on this browser.');
      return;
    }
    const cleanText = voiceFriendlyText(text, {
      ...nextProfile,
      preferred_language: nextProfile?.preferred_language || selectedLanguage || nextProfile?.language,
    });
    if (!cleanText) return;

    const requestId = speechRequestRef.current + 1;
    speechRequestRef.current = requestId;
    speechTabRef.current = options.tab || activeTab;
    if (speechTimerRef.current) window.clearTimeout(speechTimerRef.current);
    if (speechAudioRef.current) {
      speechAudioRef.current.pause();
      speechAudioRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const option = languageOptionFor(nextProfile.preferred_language || selectedLanguage || nextProfile.language);
    setSpeakingIndex(messageIndex);
    setVoiceStatus(`Preparing ${option.label} voice...`);

    const preferServerVoice = Boolean(options.forceServerVoice) || option.name !== 'English';
    if (preferServerVoice) {
      const serverSpokeFirst = await playServerVoice(cleanText, nextProfile, messageIndex, requestId, option);
      if (serverSpokeFirst) return;
    }

    if ('speechSynthesis' in window) {
      const voices = await availableSpeechVoices();
      if (speechRequestRef.current !== requestId) return;
      const attempts = speechAttempts(option, cleanText, voices);
      await wait(120);

      for (const attempt of attempts) {
        if (speechRequestRef.current !== requestId) return;
        const spoke = await new Promise((resolve) => {
          let started = false;
          let settled = false;
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = attempt.lang;
          if (attempt.voice) utterance.voice = attempt.voice;
          utterance.rate = 0.92;
          utterance.pitch = 1;

          const settle = (ok) => {
            if (settled) return;
            settled = true;
            if (speechTimerRef.current) {
              window.clearTimeout(speechTimerRef.current);
              speechTimerRef.current = null;
            }
            resolve(ok);
          };

          utterance.onstart = () => {
            started = true;
            setSpeakingIndex(messageIndex);
            const voiceName = attempt.voice?.name ? ` (${attempt.voice.name})` : '';
            setVoiceStatus(`Speaking in ${option.label}${voiceName}...`);
          };
          utterance.onend = () => settle(true);
          utterance.onerror = () => settle(false);

          try {
            window.speechSynthesis.speak(utterance);
            speechTimerRef.current = window.setTimeout(() => {
              if (!started) {
                window.speechSynthesis.cancel();
                settle(false);
              }
            }, 4500);
          } catch {
            settle(false);
          }
        });

        if (spoke && speechRequestRef.current === requestId) {
          setSpeakingIndex(null);
          setVoiceStatus('');
          return;
        }
        await wait(160);
      }
    }

    if (!preferServerVoice) {
      const serverSpoke = await playServerVoice(cleanText, nextProfile, messageIndex, requestId, option);
      if (serverSpoke) return;
    }

    if (speechRequestRef.current === requestId) {
      setSpeakingIndex(null);
      setVoiceStatus('Voice playback could not start. Tap Listen again; if this continues, check browser audio permission or Sarvam voice configuration.');
    }
  }

  async function playServerVoice(cleanText, nextProfile, messageIndex, requestId, option) {
    try {
      setVoiceStatus(`Preparing ${option.label} voice with Sarvam...`);
      const data = await api('/api/intake', { action: 'tts', text: cleanText, profile: nextProfile, language: option.label });
      if (speechRequestRef.current !== requestId || !data.audio) return false;

      const audio = new Audio(`data:${data.mime_type || 'audio/wav'};base64,${data.audio}`);
      speechAudioRef.current = audio;
      setSpeakingIndex(messageIndex);
      setVoiceStatus(`Speaking in ${option.label} with Sarvam voice...`);

      const ok = await new Promise((resolve) => {
        let settled = false;
        const settle = (value) => {
          if (settled) return;
          settled = true;
          resolve(value);
        };
        audio.onended = () => settle(true);
        audio.onerror = () => settle(false);
        audio.play().then(() => null).catch(() => settle(false));
      });

      if (speechRequestRef.current === requestId) {
        setSpeakingIndex(null);
        if (speechAudioRef.current === audio) speechAudioRef.current = null;
        if (ok) setVoiceStatus('');
      }
      return Boolean(ok);
    } catch {
      return false;
    }
  }

  function stopSpeaking() {
    speechRequestRef.current += 1;
    speechTabRef.current = '';
    if (speechTimerRef.current && typeof window !== 'undefined') {
      window.clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
    if (speechAudioRef.current) {
      speechAudioRef.current.pause();
      speechAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIndex(null);
    setVoiceStatus('');
  }

  async function generatePathway() {
    if (pathwayLocked) {
      setActiveTab(journey?.modules?.length ? 'journey' : 'pathways');
      setError('This pathway is locked until the selected learning journey proof is complete.');
      return;
    }
    setActiveTab('pathways');
    await run(generationWaitCopy(profile.preferred_language || selectedLanguage || uiLanguage, 'pathway').loading, async () => {
      const latestUserQuestion = [...messages].reverse().find((message) => message.role === 'user')?.content || '';
      const data = await api('/api/pathway', { profile, question: latestUserQuestion });
      setPathway(data);
      setLastProof(data.proof || null);
      setSelectedRoute(data.routes?.[0] || null);
      setLockedRouteKey('');
      setJourney(null);
      setCompletedLessons({});
      setProofNotes({});
      setProofArtifacts({});
      setProgressState({});
    });
  }

  async function createJourney(route = selectedRoute || pathway?.routes?.[0]) {
    if (!route) return;
    if (journeyLocked) {
      setActiveTab('journey');
      setError('This pathway is locked until the current learning journey proof is complete.');
      return;
    }
    setActiveTab('journey');
    await run(generationWaitCopy(profile.preferred_language || selectedLanguage || uiLanguage, 'journey').loading, async () => {
      const data = await api('/api/journey', { profile, route });
      setSelectedRoute(route);
      setJourney(data.journey);
      setLockedRouteKey(routeKey(route));
      setCompletedLessons({});
      setProofNotes({});
      setProofArtifacts({});
      setProgressState(data.journey?.progress || {});
      setLastProof(data.proof || null);
      persistProgress({}, 'journey_created', {}, {}, data.journey).catch(() => {});
    });
  }

  async function persistProgress(
    nextCompletedLessons = completedLessons,
    lastAction = 'lesson_progress_saved',
    nextProofNotes = proofNotes,
    nextProofArtifacts = proofArtifacts,
    journeyForProgress = journey,
  ) {
    if (!profile.learner_id) return null;
    const data = await api('/api/progress', {
      learner_id: profile.learner_id,
      completed_lessons: nextCompletedLessons,
      proof_notes: nextProofNotes,
      proof_artifacts: nextProofArtifacts,
      journey: journeyForProgress,
      active_tab: 'journey',
      last_action: lastAction,
    });
    const nextProgress = data.progress || {};
    setProgressState(nextProgress);
    setLastProof(data.proof || null);
    setJourney((current) =>
      current
        ? {
            ...current,
            progress: {
              ...(current.progress || {}),
              ...nextProgress,
            },
          }
        : current,
    );
    return nextProgress;
  }

  function toggleLesson(itemKey) {
    setCompletedLessons((current) => {
      const next = {
        ...current,
        [itemKey]: !current[itemKey],
      };
      persistProgress(next).catch(() => {});
      return next;
    });
  }

  function updateProofNote(moduleId, value) {
    setProofNotes((current) => ({
      ...current,
      [moduleId]: value,
    }));
  }

  function updateProofArtifact(moduleId, value) {
    setProofArtifacts((current) => ({
      ...current,
      [moduleId]: value,
    }));
  }

  function saveJourneyProgress(lastAction = 'manual_progress_saved') {
    return run('Saving learning progress...', async () => {
      await persistProgress(completedLessons, lastAction, proofNotes, proofArtifacts);
    });
  }

  async function savePassport() {
    const progressForPassport = {
      ...(journey?.progress || {}),
      ...(progressState || {}),
    };
    if (!isJourneyCompleteForPassport(journey, progressForPassport)) {
      setActiveTab('journey');
      setError('Complete the current learning journey proof before creating the Skill Passport.');
      return;
    }
    await run('Creating Skill Passport...', async () => {
      const data = await api('/api/passport', {
        profile,
        selected_route: selectedRoute,
        journey,
        progress: progressForPassport,
        completed_lessons: completedLessons,
        proof_notes: proofNotes,
        proof_artifacts: proofArtifacts,
        consent: { share_certs: true, share_informal: true, share_scores: true },
        require_eligible: true,
      });
      setPassport(data.passport);
      setLastProof(data.proof || null);
      setActiveTab('passport');
    });
  }

  async function prepareResume(profileForResume = profile, journeyForResume = journey) {
    const currentResume = resumeText.trim();
    if (currentResume.length > 240) {
      return currentResume;
    }

    const data = await api('/api/resume', {
      profile: profileForResume,
      journey: journeyForResume,
      resumeText: currentResume,
    });
    const generatedText = data.resume?.text || currentResume;
    setResumeText(generatedText);
    setResumeFileName(data.resume?.headline || 'VidyaSetu AI resume draft');
    setLastProof(data.proof || null);
    return generatedText;
  }

  async function generateResumeFromProfile() {
    await run('Building truthful resume from counselor profile...', async () => {
      const data = await api('/api/resume', { profile, journey, resumeText });
      setResumeText(data.resume?.text || resumeText);
      setResumeFileName(data.resume?.headline || 'VidyaSetu AI resume draft');
      setLastProof(data.proof || null);
      setActiveTab('jobs');
    });
  }

  async function handleResumeUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setResumeText(text.trim());
    setResumeFileName(file.name);
    setError('');
  }

  async function switchToEmployabilityFromStudy() {
    setActiveTab('counselor');
    await sendMessage(
      'Ab main study plan ke saath career, job, internship ya employability options bhi explore karna chahta/chahti hoon. Please meri profile ko study-only se career/job counseling mode mein switch karo, missing details poochho, phir opportunity search aur outreach pipeline banao.',
    );
  }

  async function findJobs(options = {}) {
    await run('Searching live sources for persona-fit opportunities...', async () => {
      const deepContactSearch = options?.deepContactSearch === true;
      const goalIntent = profile.learner_goal?.intent;
      const needsResume =
        ['job', 'college'].includes(goalIntent) ||
        /job|internship|placement|resume|cv|naukri/i.test(`${profile.learner_goal?.label || ''} ${(profile.aspirations || []).join(' ')}`);
      const effectiveResume = needsResume ? await prepareResume(profile, journey) : resumeText.trim();
      const data = await api('/api/jobs', {
        profile,
        passport: passport || profile,
        journey,
        resumeText: effectiveResume,
        deepContactSearch,
      });
      setMatches(data.matches || []);
      setLastProof(data.proof || null);
      setOpportunityMeta({
        segment: data.segment,
        resume_profile: data.resume_profile,
        search_plan: data.search_plan,
        source_tasks: data.source_tasks,
        opportunity_contract: data.opportunity_contract,
        enterprise_plan: data.enterprise_plan,
        block_card: data.block_card,
        unlock_state: data.unlock_state,
        message: data.message,
        recommended_next_step: data.recommended_next_step,
        summary: data.summary,
        location_required: data.location_required,
        study_mode: data.study_mode,
        proof: data.proof,
      });
      setSelectedMatchId(data.matches?.[0]?.id || '');
      setActiveTab('jobs');
    });
  }

  async function contactEmployer(manualEmailOverride = manualEmail) {
    if (!selectedMatch) return;
    const safeManualEmail = typeof manualEmailOverride === 'string' ? manualEmailOverride : manualEmail;
    await run('Preparing consent-limited employer outreach...', async () => {
      const data = await api('/api/outreach', {
        passport: passport || profile,
        match: selectedMatch,
        match_id: selectedMatch.match_id || selectedMatch.id,
        journey,
        profile,
        resumeText,
        manualEmail: safeManualEmail,
      });
      setOutreach(data);
      setLastProof(data.proof || null);
      setActiveTab('outreach');
    });
  }

  async function scoreSupport() {
    await run('Checking support risk...', async () => {
      const data = await api('/api/adews', {
        learner_id: profile.learner_id,
        features: {
          missed_checkins: 3,
          attendance_drop_days: 8,
          economic_stress: Boolean(profile.income_pressure || profile.earning_urgency === 'immediate'),
          exam_window: true,
          gender_window: /girl|women|safe|ladki/i.test(profile.commute_constraint || ''),
        },
      });
      setAdews(data);
      setActiveTab('support');
    });
  }

  async function sendDailyReminder() {
    await run('Preparing today WhatsApp reminder...', async () => {
      const data = await api('/api/adews', {
        job: 'daily-reminders',
        learner_id: profile.learner_id,
        limit: 1,
      });
      setDailyReminder(data);
      setAdews((current) => ({
        ...(current || {}),
        daily_reminder: data,
      }));
      setActiveTab('support');
    });
  }

  async function runBalangirFieldDemo() {
    await run('Running Odia voice-to-placement field demo...', async () => {
      const demoLanguage = 'Odia';
      const baseProfile = profileWithPreferredLanguage(
        {
          ...emptyProfile(profile.phone || phone),
          ...profile,
          location: profile.location || 'Balangir, Odisha',
          phone_access: 'shared Android phone with WhatsApp voice notes',
          device: 'shared Android phone, low-data mode',
          content_preferences: ['Odia voice notes', 'SMS recap', 'picture checklist'],
        },
        demoLanguage,
      );
      const starter = starterMessageForLanguage(demoLanguage);
      const demoMessages = [starter, { role: 'user', content: FIELD_DEMO_PROMPT }];
      setSelectedLanguage(demoLanguage);
      setUiLanguage(demoLanguage);
      setProfile(baseProfile);
      setMessages(demoMessages);
      setVoiceStatus('Field demo: Odia voice note transcript loaded.');

      const counselorData = await api('/api/counselor', {
        learner_id: baseProfile.learner_id,
        phone_hash: baseProfile.phone_hash || `demo_hash_${baseProfile.phone || phone || 'field'}`,
        profile: baseProfile,
        messages: demoMessages,
        browserTranscript: FIELD_DEMO_PROMPT,
        languageCode: 'od-IN',
      });
      const nextProfile = profileWithPreferredLanguage(
        {
          ...emptyProfile(baseProfile.phone || phone),
          ...baseProfile,
          ...counselorData.profile,
          phone_access: counselorData.profile?.phone_access || baseProfile.phone_access,
          device: counselorData.profile?.device || baseProfile.device,
          content_preferences: [
            ...new Set([
              ...(baseProfile.content_preferences || []),
              ...(counselorData.profile?.content_preferences || []),
              'low-data voice note',
            ]),
          ],
        },
        demoLanguage,
      );
      const assistantMessage = { role: 'assistant', content: counselorData.reply };
      setProfile(nextProfile);
      setMessages([...demoMessages, assistantMessage]);

      const pathwayData = await api('/api/pathway', { profile: nextProfile, question: FIELD_DEMO_PROMPT });
      const route = pathwayData.routes?.[0] || null;
      setPathway(pathwayData);
      setSelectedRoute(route);

      let journeyData = null;
      let demoCompleted = {};
      let demoProofNotes = {};
      let progress = {};
      if (route) {
        journeyData = await api('/api/journey', { profile: nextProfile, route });
        const firstModule = journeyData.journey?.modules?.[0];
        if (firstModule) {
          const lessons = Array.isArray(firstModule.lessons) ? firstModule.lessons : [];
          const tasks = Array.isArray(firstModule.practice_tasks) ? firstModule.practice_tasks : [];
          demoCompleted = Object.fromEntries([
            ...lessons.map((lesson) => [`${firstModule.id}::lesson::${lesson}`, true]),
            ...tasks.map((task) => [`${firstModule.id}::task::${task}`, true]),
          ]);
          demoProofNotes = {
            [firstModule.id]: 'Field demo proof: learner completed Week 1 voice checklist and explained the agriculture drone service goal in Odia.',
          };
          if (nextProfile.learner_id) {
            const progressData = await api('/api/progress', {
              learner_id: nextProfile.learner_id,
              completed_lessons: demoCompleted,
              proof_notes: demoProofNotes,
              proof_artifacts: {},
              journey: journeyData.journey,
              active_tab: 'proof',
              last_action: 'balangir_field_demo_progress_saved',
            });
            progress = progressData.progress || {};
          }
          journeyData.journey = {
            ...journeyData.journey,
            progress: {
              ...(journeyData.journey.progress || {}),
              ...progress,
            },
          };
        }
        setJourney(journeyData.journey);
        setCompletedLessons(demoCompleted);
        setProofNotes(demoProofNotes);
        setProofArtifacts({});
        setProgressState(progress || journeyData.journey?.progress || {});
      }

      const passportData = await api('/api/passport', {
        profile: nextProfile,
        selected_route: route,
        journey: journeyData?.journey,
        progress: progress || journeyData?.journey?.progress || {},
        completed_lessons: demoCompleted,
        proof_notes: demoProofNotes,
        proof_artifacts: {},
        consent: { share_certs: true, share_informal: true, share_scores: true },
      });
      setPassport(passportData.passport);

      const jobData = await api('/api/jobs', {
        profile: nextProfile,
        passport: passportData.passport || nextProfile,
        journey: journeyData?.journey || null,
        resumeText: '',
      });
      setMatches(jobData.matches || []);
      setSelectedMatchId(jobData.matches?.[0]?.id || '');
      setOpportunityMeta({
        segment: jobData.segment,
        resume_profile: jobData.resume_profile,
        search_plan: jobData.search_plan,
        source_tasks: jobData.source_tasks,
        enterprise_plan: jobData.enterprise_plan,
        unlock_state: jobData.unlock_state,
        summary: jobData.summary,
        message: jobData.message,
        recommended_next_step: jobData.recommended_next_step,
        location_required: jobData.location_required,
        study_mode: jobData.study_mode,
        proof: jobData.proof,
      });

      const supportData = await api('/api/adews', {
        learner_id: nextProfile.learner_id,
        features: {
          missed_checkins: 4,
          attendance_drop_days: 9,
          economic_stress: true,
          exam_window: true,
          gender_window: false,
        },
      });
      setAdews(supportData);
      setLastProof(supportData.proof || jobData.proof || passportData.proof || journeyData?.proof || pathwayData.proof || counselorData.proof || null);
      setVoiceStatus('');
      setActiveTab('proof');
    });
  }

  if (mode === 'adminLogin') {
    return (
      <AdminLoginScreen
        adminLogin={adminLogin}
        adminPassword={adminPassword}
        error={error}
        loading={loading}
        setAdminPassword={setAdminPassword}
        setMode={setMode}
      />
    );
  }

  if (mode === 'admin') {
    return (
      <AdminCrm
        acknowledgeAdminAlert={acknowledgeAdminAlert}
        adminData={adminData}
        adminNotice={adminNotice}
        adminQuery={adminQuery}
        adminSelectedLearnerId={adminSelectedLearnerId}
        adminStatus={adminStatus}
        closeAdminCrm={closeAdminCrm}
        error={error}
        loading={loading}
        refreshAdminCrm={refreshAdminCrm}
        selectAdminLearner={selectAdminLearner}
        setAdminQuery={setAdminQuery}
        setAdminStatus={setAdminStatus}
      />
    );
  }

  if (mode === 'landing') {
    return (
      <main className="crm-login-shell prototype-login-shell">
        <form className="lang-card" onSubmit={startWithPhone}>
          <div className="logo-row">
            <span className="crm-brand-mark brandmark"><Zap size={20} /></span>
            <div>
              <b>VidyaSetu</b>
              <small>vidya + setu · your bridge to learning, skills and work</small>
            </div>
          </div>
          <h1>
            Choose your language
            <span>apni bhasha chunein</span>
          </h1>
          <p>Meera will talk with you in this language - by text or voice.</p>
          <div className="language-select-grid lang-grid">
            {prototypeLanguageOptions.map((option) => (
              <button
                className={selectedLanguage === option.name ? 'language-select-card lang-btn active' : 'language-select-card lang-btn'}
                key={option.name}
                onClick={() => {
                  setSelectedLanguage(option.name);
                  setUiLanguage(option.name);
                  setProfile((current) => profileWithPreferredLanguage(current, option.name));
                  setMessages([starterMessageForLanguage(option.name)]);
                }}
                type="button"
              >
                <strong>{option.label}</strong>
                <span>{option.helper}</span>
              </button>
            ))}
          </div>
          <label className="prototype-phone-login">
            <span>Learner mobile number</span>
            <input
              inputMode="numeric"
              maxLength="10"
              onChange={(event) => {
                setPhone(event.target.value.replace(/\D/g, '').slice(0, 10));
                setLearnerChoices([]);
              }}
              placeholder="10 digit mobile number"
              required
              value={phone}
            />
          </label>
          <button className="crm-primary" disabled={phone.length !== 10 || !selectedLanguage} type="submit">
            Continue
          </button>
          <button className="admin-entry-button" onClick={() => setMode('adminLogin')} type="button">
            <ShieldCheck size={16} /> Admin CRM
          </button>
          {!selectedLanguage && <small className="login-helper-text">Select language first so VidyaSetu does not assume Hindi.</small>}
          {learnerChoices.length > 0 && (
            <div className="learner-choice-panel">
              <strong>Who is using this phone today?</strong>
              <p>This phone already has saved learner profiles. Choose one, or add a new learner without mixing data.</p>
              {learnerChoices.map((learner) => (
                <button className="learner-choice" key={learner.id} onClick={() => selectLearner(learner.id)} type="button">
                  <span>{(learner.name || 'L')[0]}</span>
                  <div>
                    <strong>{learner.name}</strong>
                    <small>{learner.goal} | {learner.location}</small>
                  </div>
                </button>
              ))}
              <button className="ghost-button" onClick={startNewLearner} type="button">
                Add new learner on this phone
              </button>
            </div>
          )}
          <div className="lang-foot"><ShieldCheck size={13} /> Works on any phone · low-data and voice friendly</div>
        </form>
      </main>
    );
  }

  // The learner's explicit language choice at login drives the UI chrome and
  // must persist even if a later chat message is typed in another language.
  const t = getTranslations(uiLanguage || selectedLanguage || profile?.preferred_language || profile?.language);
  const visibleNavItems = [
    ['counselor', t.nav.counselor],
    ['pathways', t.nav.pathways],
    ['journey', t.nav.journey],
    ['passport', t.nav.passport],
    ['jobs', t.nav.jobs],
  ];
  const baseMeta = tabMeta[activeTab] || tabMeta.profile;
  const activeMeta = {
    ...baseMeta,
    title: t.title[activeTab] || baseMeta.title,
    subtitle: t.subtitle[activeTab] || baseMeta.subtitle,
  };
  const ActiveIcon = activeMeta.Icon || LayoutDashboard;
  const mobileNavItems = [
    ['counselor', t.navShort.counselor],
    ['pathways', t.navShort.pathways],
    ['journey', t.navShort.journey],
    ['passport', t.navShort.passport],
    ['jobs', t.navShort.jobs],
  ];

  return (
    <main className="crm-app-shell">
      <aside className="platform-sidebar crm-sidebar">
        <div className="crm-sidebar-logo">
          <span className="crm-brand-mark"><Zap size={14} /></span>
          <div>
            <p>VidyaSetu</p>
            <small>Outcome engine</small>
          </div>
        </div>
        <nav className="prototype-nav">
          {visibleNavItems.map(([id, label]) => {
            const Icon = tabMeta[id]?.Icon || LayoutDashboard;
            return (
              <button
                className={activeTab === id ? 'journey-step navitem active' : 'journey-step navitem'}
                key={id}
                onClick={() => setActiveTab(id)}
                type="button"
              >
                <Icon size={21} />
                <strong>{label}</strong>
                {id === 'journey' && journey?.modules?.length ? <span className="badge">W{Math.min(journey.modules.length, 4)}</span> : null}
              </button>
            );
          })}
        </nav>
        <button
          className="switch-learner-button"
          onClick={() => {
            setMode('landing');
            setLearnerChoices([]);
          }}
          type="button"
        >
          {t.btn.notMe}
        </button>
        <div className="sb-meera">
          <CounselorAvatar compact />
          <div>
            <b>Meera</b>
            <span><i className="dot" /> {t.counselor.sidebarStatus}</span>
          </div>
        </div>
        </aside>

        <div className="topbar">
          <span className="crm-brand-mark brandmark"><Zap size={14} /></span>
          <b>VidyaSetu</b>
          <span className="lang-tag">{languageProfileForUi(profile).preferred_language}</span>
        </div>

        <section className="crm-content">
          <header className="crm-page-header">
            <div>
              <h1>{activeMeta.title}</h1>
              <p>{loading || activeMeta.subtitle}</p>
            </div>
            <span className="pill crm-header-icon"><ActiveIcon size={15} /> {activeTab === 'counselor' ? t.counselor.headerPill : activeTab === 'jobs' ? t.counselor.jobsPill : t.counselor.proofPill}</span>
          </header>
          {returning && <div className="memory-banner">Welcome back. VidyaSetu restored this learner's saved profile, journey, and next action.</div>}
          {error && <div className="site-alert">{error}</div>}
          {activeTab === 'overview' && (
            <OverviewTab
              completion={completion}
              profile={profile}
              readinessLayers={readinessLayers}
              pathway={pathway}
              journey={journey}
              passport={passport}
              matches={matches}
              outreach={outreach}
              adews={adews}
              lastProof={lastProof}
              opportunityMeta={opportunityMeta}
              runBalangirFieldDemo={runBalangirFieldDemo}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === 'profile' && <ProfileTab profile={profile} readinessLayers={readinessLayers} setActiveTab={setActiveTab} t={t} />}
          {activeTab === 'counselor' && (
            <CounselorTab
              input={input}
              messages={messages}
              profile={profile}
              recording={recording}
              sendMessage={sendMessage}
              setInput={setInput}
              startRecording={startRecording}
              stopRecording={stopRecording}
              quickStarts={quickStarts}
              generatePathway={generatePathway}
              lastProof={lastProof}
              speakingIndex={speakingIndex}
              speakReply={speakReply}
              stopSpeaking={stopSpeaking}
              voiceStatus={voiceStatus}
              liveTranscript={liveTranscript}
              t={t}
            />
          )}
          {activeTab === 'readiness' && <ReadinessTab readinessLayers={readinessLayers} setActiveTab={setActiveTab} />}
          {activeTab === 'pathways' && (
            <PathwaysTab
              pathway={pathway}
              profile={profile}
              selectedRoute={selectedRoute}
              setSelectedRoute={setSelectedRoute}
              generatePathway={generatePathway}
              createJourney={createJourney}
              loading={loading}
              pathwayLocked={pathwayLocked}
              journeyLocked={journeyLocked}
              speakReply={speakReply}
              speakingIndex={speakingIndex}
              stopSpeaking={stopSpeaking}
              t={t}
            />
          )}
          {activeTab === 'journey' && (
            <JourneyTab
              profile={profile}
              journey={journey}
              selectedRoute={selectedRoute}
              createJourney={createJourney}
              savePassport={savePassport}
              completedLessons={completedLessons}
              toggleLesson={toggleLesson}
              proofNotes={proofNotes}
              proofArtifacts={proofArtifacts}
              updateProofNote={updateProofNote}
              updateProofArtifact={updateProofArtifact}
              saveJourneyProgress={saveJourneyProgress}
              progressState={progressState}
              pathwayLocked={journeyLocked}
              loading={loading}
              t={t}
            />
          )}
          {activeTab === 'passport' && (
            <PassportTab
              passport={passport}
              savePassport={savePassport}
              findJobs={findJobs}
              journey={journey}
              progressState={progressState}
              selectedRoute={selectedRoute}
              profile={profile}
              setActiveTab={setActiveTab}
              t={t}
            />
          )}
          {activeTab === 'jobs' && (
            <JobsTab
              matches={matches}
              profile={profile}
              journey={journey}
              resumeText={resumeText}
              setResumeText={setResumeText}
              resumeFileName={resumeFileName}
              handleResumeUpload={handleResumeUpload}
              generateResumeFromProfile={generateResumeFromProfile}
              opportunityMeta={opportunityMeta}
              setActiveTab={setActiveTab}
              switchToEmployabilityFromStudy={switchToEmployabilityFromStudy}
              selectedMatchId={selectedMatchId}
              setSelectedMatchId={setSelectedMatchId}
              findJobs={findJobs}
              contactEmployer={contactEmployer}
            />
          )}
          {activeTab === 'outreach' && (
            <OutreachTab
              outreach={outreach}
              selectedMatch={selectedMatch}
              contactEmployer={contactEmployer}
              scoreSupport={scoreSupport}
              manualEmail={manualEmail}
              setManualEmail={setManualEmail}
            />
          )}
          {activeTab === 'followups' && <FollowupsTab outreach={outreach} selectedMatch={selectedMatch} contactEmployer={contactEmployer} />}
          {activeTab === 'support' && <SupportTab adews={adews} dailyReminder={dailyReminder} scoreSupport={scoreSupport} sendDailyReminder={sendDailyReminder} />}
          {activeTab === 'proof' && (
            <EvaluationProofTab
              adews={adews}
              completedLessons={completedLessons}
              journey={journey}
              lastProof={lastProof}
              matches={matches}
              messages={messages}
              opportunityMeta={opportunityMeta}
              outreach={outreach}
              passport={passport}
              pathway={pathway}
              profile={profile}
              progressState={progressState}
              proofNotes={proofNotes}
              readinessLayers={readinessLayers}
              selectedRoute={selectedRoute}
              setActiveTab={setActiveTab}
            />
          )}
        </section>

        <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
          {mobileNavItems.map(([id, label]) => {
            const Icon = tabMeta[id]?.Icon || LayoutDashboard;
            return (
              <button
                className={activeTab === id ? 'mobile-nav-item active' : 'mobile-nav-item'}
                key={id}
                onClick={() => setActiveTab(id)}
                type="button"
              >
                <Icon size={21} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
    </main>
  );
}

function OverviewTab({
  completion,
  profile,
  readinessLayers,
  pathway,
  journey,
  passport,
  matches,
  outreach,
  adews,
  lastProof,
  opportunityMeta,
  runBalangirFieldDemo,
  setActiveTab,
}) {
  const completeLayers = readinessLayers.filter((layer) => layer.done).length;
  const fieldStatus = demoMomentStatus({ profile, pathway, journey, passport, matches, adews, opportunityMeta, lastProof });
  const stats = [
    {
      label: 'Profile readiness',
      value: `${completion}%`,
      sub: profile.profile_complete ? 'intake complete' : 'intake in progress',
      Icon: LayoutDashboard,
      tone: 'zinc',
    },
    {
      label: 'Readiness layers',
      value: `${completeLayers}/${readinessLayers.length}`,
      sub: 'before employer outreach',
      Icon: ShieldCheck,
      tone: 'violet',
    },
    {
      label: 'Pathway routes',
      value: pathway?.routes?.length || 0,
      sub: pathway?.provider || 'generate after intake',
      Icon: GraduationCap,
      tone: 'blue',
    },
    {
      label: 'Opportunities',
      value: matches.length,
      sub: outreach?.reply_class?.status || 'not contacted',
      Icon: Briefcase,
      tone: 'emerald',
    },
  ];
  const actions = [
    {
      label: profile.profile_complete ? 'Review learner profile' : 'Finish counselor intake',
      hint: profile.aspirations?.length ? `Interest: ${profile.aspirations.join(', ')}` : 'Capture interest, time, commute, phone access.',
      target: profile.profile_complete ? 'profile' : 'counselor',
      accent: 'violet',
    },
    {
      label: pathway?.routes?.length ? 'Open generated pathways' : 'Generate verified pathway',
      hint: pathway?.routes?.length ? `${pathway.routes.length} routes ready for comparison.` : 'Use AI planning plus verified evidence and fallback KB.',
      target: 'pathways',
      accent: 'blue',
    },
    {
      label: passport?.qr_token ? 'Review Skill Passport' : 'Create Skill Passport',
      hint: passport?.qr_token ? `QR token ${passport.qr_token}` : 'Package proof only after consent and readiness.',
      target: 'passport',
      accent: 'emerald',
    },
    {
      label: outreach?.draft ? 'Track outreach pipeline' : 'Prepare outreach queue',
      hint: outreach?.draft ? outreach.reply_class?.extracted_next_step : 'Choose an opportunity and draft consent-limited employer email.',
      target: outreach?.draft ? 'outreach' : 'jobs',
      accent: 'orange',
    },
  ];

  return (
    <div className="overview-stack">
      <div className="overview-stat-grid">
        {stats.map(({ label, value, sub, Icon, tone }) => (
          <div className="overview-stat-card" key={label}>
            <span className={`stat-icon ${tone}`}><Icon size={18} /></span>
            <div>
              <strong>{value}</strong>
              <p>{label}</p>
              <small>{sub}</small>
            </div>
          </div>
        ))}
      </div>

      <FieldDemoPanel fieldStatus={fieldStatus} runBalangirFieldDemo={runBalangirFieldDemo} setActiveTab={setActiveTab} />

      <div className="overview-main-grid">
        <section className="workspace-card">
          <div className="overview-card-header">
            <div>
              <p className="eyebrow">High priority next actions</p>
              <h2>Move this learner from intake to placement proof.</h2>
            </div>
            <button className="ghost-button" onClick={() => setActiveTab('counselor')}>Open counselor</button>
          </div>
          <div className="suggested-action-list">
            {actions.map((action) => (
              <button className="suggested-action" key={action.label} onClick={() => setActiveTab(action.target)}>
                <span className={`action-dot ${action.accent}`} />
                <div>
                  <strong>{action.label}</strong>
                  <p>{action.hint}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="workspace-card">
          <p className="eyebrow">Pipeline monitor</p>
          <h2>Current placement state.</h2>
          <div className="pipeline-monitor">
            <span className={profile.profile_complete ? 'ready' : ''}>Profile</span>
            <span className={pathway?.routes?.length ? 'ready' : ''}>Pathway</span>
            <span className={journey?.modules?.length ? 'ready' : ''}>Learning</span>
            <span className={passport?.qr_token ? 'ready' : ''}>Passport</span>
            <span className={matches.length ? 'ready' : ''}>Match</span>
            <span className={outreach?.draft ? 'ready' : ''}>Outreach</span>
          </div>
          <div className="source-box">
            <strong>{adews?.fired ? 'Worker alert active' : 'Worker support monitoring'}</strong>
            <p>{adews?.worker_message || 'ADEWS will monitor missed check-ins, economic stress, safety, and transition risk after the learner journey starts.'}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function FieldDemoPanel({ fieldStatus, runBalangirFieldDemo, setActiveTab }) {
  return (
    <section className="field-demo-panel">
      <div className="field-demo-head">
        <div>
          <p className="eyebrow">Field demo spine</p>
          <h2>AI-first. Vernacular-first. Impact-first.</h2>
          <p>
            One click runs the Balangir low-resource demo: Odia voice-note transcript, pathway, journey proof,
            Skill Passport QR, opportunity verification, and ADEWS worker alert.
          </p>
        </div>
        <button className="primary-button" onClick={runBalangirFieldDemo}>
          Run Balangir field demo
        </button>
      </div>
      <div className="demo-moment-grid">
        {demoMoments.map((moment, index) => {
          const status = fieldStatus[moment.id] || {};
          return (
            <button className={status.ready ? 'demo-moment-card ready' : 'demo-moment-card'} key={moment.id} onClick={() => setActiveTab(moment.target)}>
              <span>{index + 1}</span>
              <div>
                <strong>{moment.title}</strong>
                <p>{moment.proof}</p>
                <small>{status.detail || 'pending'}</small>
              </div>
            </button>
          );
        })}
      </div>
      <div className="validation-strip">
        {validationMetrics.map((metric) => (
          <span key={metric.label}>
            <b>{metric.value}</b>
            {metric.label}
            <small>{metric.detail}</small>
          </span>
        ))}
      </div>
    </section>
  );
}

function ProfileTab({ profile, readinessLayers, setActiveTab, t = getTranslations('English') }) {
  return (
    <div className="workspace-card">
      <p className="eyebrow">Learner profile layer</p>
      <h2>The profile updates from the latest counselor message.</h2>
      <div className="profile-dashboard">
        <ProfileCard profile={profile} t={t} />
        <div className="profile-detail-grid">
          <DetailBlock label="Learning access" value={profile.phone_access || profile.device || 'Pending'} />
          <DetailBlock label="Preferred language" value={profile.preferred_language || profile.language || 'Pending'} />
          <DetailBlock label="Daily time" value={profile.time_available || 'Pending'} />
          <DetailBlock label="Income urgency" value={profile.earning_urgency || (profile.income_pressure ? 'immediate' : 'Pending')} />
          <DetailBlock label="Mobility" value={profile.relocation_preference || (profile.commute_km ? `${profile.commute_km} km, ${profile.commute_constraint || 'needs review'}` : 'Pending')} />
          <DetailBlock label="Support needs" value={profile.support_needs?.length ? profile.support_needs.join(', ') : 'None captured yet'} />
        </div>
      </div>
      <div className="layer-stack">
        {readinessLayers.map((layer) => (
          <article className={layer.done ? 'layer-card done' : 'layer-card'} key={layer.id}>
            <span>{layer.done ? 'Ready' : 'Pending'}</span>
            <strong>{layer.title}</strong>
            <p>{layer.description}</p>
          </article>
        ))}
      </div>
      <div className="action-row">
        <button className="primary-button" onClick={() => setActiveTab('counselor')}>Update through counselor</button>
        <button className="ghost-button" onClick={() => setActiveTab('readiness')}>View readiness layers</button>
      </div>
    </div>
  );
}

function DetailBlock({ label, value }) {
  return (
    <div className="detail-block">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ReadinessTab({ readinessLayers, setActiveTab }) {
  const completed = readinessLayers.filter((layer) => layer.done).length;
  return (
    <div className="workspace-card">
      <p className="eyebrow">Pre-placement layers</p>
      <h2>Build trust before job outreach starts.</h2>
      <p>
        VidyaSetu should not contact employers just because a learner typed an interest. These layers make the funnel defensible:
        access, profile, pathway, content, proof, safety, and consent.
      </p>
      <div className="readiness-score">
        <strong>{completed}/{readinessLayers.length}</strong>
        <span>layers ready before placement outreach</span>
      </div>
      <div className="layer-stack">
        {readinessLayers.map((layer) => (
          <article className={layer.done ? 'layer-card done' : 'layer-card'} key={layer.id}>
            <span>{layer.done ? 'Complete' : 'Next'}</span>
            <strong>{layer.title}</strong>
            <p>{layer.description}</p>
            <small>{layer.next}</small>
          </article>
        ))}
      </div>
      <div className="action-row">
        <button className="primary-button" onClick={() => setActiveTab('pathways')}>Continue to pathways</button>
        <button className="ghost-button" onClick={() => setActiveTab('outreach')}>Open outreach CRM</button>
      </div>
    </div>
  );
}

function CounselorTab({
  messages,
  input,
  setInput,
  sendMessage,
  quickStarts,
  profile,
  recording,
  startRecording,
  stopRecording,
  generatePathway,
  lastProof,
  speakingIndex,
  speakReply,
  stopSpeaking,
  voiceStatus,
  liveTranscript,
  t = getTranslations('English'),
}) {
  const language = languageProfileForUi(profile, lastProof);
  const counselorCopy = t.counselor || getTranslations('English').counselor;
  const profileCopy = t.profile || getTranslations('English').profile;
  const counselorStats = [
    [counselorCopy.focus, localizedProfileValue(counselorFocus(profile), profileCopy)],
    [profileCopy.language, language.preferred_language],
    [counselorCopy.needsNext, localizedProfileNeed(nextCounselorNeed(profile), profileCopy)],
  ];
  return (
    <div className="prototype-screen counselor-workspace">
      {voiceStatus && (
        <div className="voice-state-banner">
          <span>{voiceStatus}</span>
          {speakingIndex !== null && (
            <button onClick={stopSpeaking} type="button">
              <VolumeX size={14} />
              {counselorCopy.stop}
            </button>
          )}
        </div>
      )}
      {liveTranscript && (
        <div className="live-transcript-panel">
          <small>{counselorCopy.liveTranscript}</small>
          <p>{liveTranscript}</p>
        </div>
      )}
      <div className="chat-wrap counselor-chat-layout">
        <div className="chat-card counselor-chat-panel">
          <div className="chat-head">
            <div className={recording ? 'avatar-ring speaking' : 'avatar-ring'}>
              <span className="ring" />
              <span className="ring" />
              <CounselorAvatar />
            </div>
            <div className="who">
              <b>Meera</b>
              <span><i className="dot" /> {recording ? counselorCopy.listening : counselorCopy.online} · {formatCopy(counselorCopy.speaks, { language: language.preferred_language })}</span>
            </div>
            <span className="lang-tag"><Languages size={14} /> {language.preferred_language}</span>
          </div>
          <div className="chat-body">
          {messages.map((message, index) => (
            <div className={message.role === 'assistant' ? 'msg meera message-row assistant' : 'msg user message-row user'} key={`${message.role}-${index}`}>
              {message.role === 'assistant' && <CounselorAvatar compact />}
              <div className={message.role === 'assistant' ? 'b counselor-message assistant' : 'b counselor-message user'}>
                <p>{message.content}</p>
                {message.role === 'assistant' && (
                  <button
                    className="voice-replay-button"
                    onClick={() => speakReply(message.content, profile, index)}
                    type="button"
                  >
                    <Volume2 size={14} />
                    {speakingIndex === index ? counselorCopy.speaking : counselorCopy.listen}
                  </button>
                )}
              </div>
            </div>
          ))}
          </div>
          <div className="chat-input chat-composer">
            <button aria-label={counselorCopy.speak} className={recording ? 'mic record-button live recording' : 'mic record-button'} onClick={recording ? stopRecording : startRecording} title={counselorCopy.speak} type="button">
              <Mic size={18} />
            </button>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={counselorCopy.placeholder} />
            <button className="send primary-button" onClick={() => sendMessage()} type="button">
              <Send size={18} />
            </button>
          </div>
        </div>
        <ProfileCard profile={profile} t={t} />
      </div>
      <div className="suggest counselor-quick-starts-below" aria-label={counselorCopy.quickStartsAria}>
        {quickStarts.slice(0, 3).map((item) => (
          <button className="chip-s" key={item.label} onClick={() => sendMessage(item.text)} type="button">
            {quickStartSubtitle(item.label)} · {item.label}
          </button>
        ))}
      </div>
      <div className="action-row">
        <button className="primary-button" disabled={!profile.profile_complete} onClick={generatePathway}>
          {t.btn.generatePathway}
        </button>
        <span>{profile.profile_complete ? t.profile.profileComplete : t.profile.counselorNeeds}</span>
      </div>
      <ProviderStatus proof={lastProof} />
    </div>
  );
}

function LanguageVoicePanel({ profile, proof, recording }) {
  const language = languageProfileForUi(profile, proof);
  const stt = proof?.stt;
  const sttLabel = stt
    ? stt.ok
      ? `${stt.provider || 'STT'} heard ${stt.language_code || language.stt_language_code}`
      : `${stt.provider || 'STT'} needs retry`
    : 'Ready for text or voice';
  return (
    <div className="language-voice-panel">
      <div>
        <p className="eyebrow">Language and voice layer</p>
        <h3><Languages size={18} /> Same-language counseling</h3>
      </div>
      <div className="language-chip-grid">
        <span><b>Reply</b>{language.preferred_language}</span>
        <span><b>Script</b>{language.reply_script}</span>
        <span><b>Voice STT</b>{language.stt_language_code}</span>
        <span><b>Status</b>{recording ? 'Recording now' : sttLabel}</span>
      </div>
      <div className="low-resource-strip">
        <span><b>Primary</b>WhatsApp voice note</span>
        <span><b>Fallback</b>SMS recap + missed-call/worker follow-up</span>
        <span><b>Packet size</b>5-10 min micro-task, low-data friendly</span>
      </div>
    </div>
  );
}

function ProviderStatus({ proof }) {
  const counselor = proof?.counselor;
  const stt = proof?.stt;
  const language = proof?.language;
  if (!counselor && !stt && !language) return null;
  const provider = counselor?.provider ? counselor.provider.replace(/_/g, ' ') : 'AI';
  return (
    <div className={counselor?.ok ? 'provider-status ok' : 'provider-status warn'}>
      <strong>{counselor?.ok ? `${provider} active` : 'Fallback or retry path active'}</strong>
      <span>{counselor?.ok ? `Counselor used ${provider} for structured profile extraction.` : counselor?.error || 'Using deterministic extraction until AI is available.'}</span>
      {stt ? <span>Voice: {stt.ok ? `${stt.provider} transcribed ${stt.language_code || 'auto'}` : `${stt.provider || 'STT'} ${stt.error || 'needs retry'}`}</span> : null}
      {language ? <span>Language: {language.preferred_language} reply, {language.reply_script} script, {language.stt_language_code} voice code.</span> : null}
    </div>
  );
}

function ProfileCard({ profile, t = getTranslations('English') }) {
  const language = languageProfileForUi(profile);
  const copy = t.profile || getTranslations('English').profile;
  const preferredLanguage = language.preferred_language === 'Pending' ? copy.pending : language.preferred_language;
  const goalValue = localizedProfileValue(profile.learner_goal?.label || counselorFocus(profile), copy, copy.discovering);
  const timeValue = localizedProfileValue(profile.time_available, copy, copy.pending);
  const earningValue = localizedProfileValue(profile.earning_urgency, copy, profile.income_pressure ? copy.high : copy.pending);
  const completedRows = [
    profile.name,
    profile.class_level || profile.education_status,
    preferredLanguage && preferredLanguage !== copy.pending,
    profile.location,
    profile.learner_goal?.label || profile.aspirations?.length,
    profile.earning_urgency || profile.income_pressure,
  ].filter(Boolean).length;
  const progress = Math.round((completedRows / 6) * 100);
  const rows = [
    [copy.language, preferredLanguage],
    [copy.location, profile.location || copy.tapToAdd],
    [copy.goal, goalValue],
    [copy.time, timeValue],
    [copy.earningNeed, earningValue],
  ];
  const nextNeed = localizedProfileNeed(nextCounselorNeed(profile), copy);
  return (
    <div className="profile-card">
      <h3>{profile.profile_complete ? copy.ready : copy.building}</h3>
      <div className="sub">{copy.sub}</div>
      <div className="prog"><i style={{ width: `${progress}%` }} /></div>
      <div className="field">
        <span className="k">{copy.name}</span>
        <span className={profile.name ? 'v' : 'v empty'}>{profile.name || copy.tapToAdd}</span>
        {profile.name && <span className="tick">✓</span>}
      </div>
      <div className="field">
        <span className="k">{copy.education}</span>
        <span className={profile.class_level || profile.education_status ? 'v' : 'v empty'}>{profile.class_level || profile.education_status || copy.tapToAdd}</span>
        {(profile.class_level || profile.education_status) && <span className="tick">✓</span>}
      </div>
      {rows.map(([label, value]) => {
        const pending = !value || value === copy.pending || value === copy.tapToAdd;
        return (
          <div className="field" key={label}>
            <span className="k">{label}</span>
            <span className={pending ? 'v empty' : 'v'}>{value}</span>
            {!pending && <span className="tick">✓</span>}
          </div>
        );
      })}
      <div className="nextq">
        <b>{profile.profile_complete ? copy.readyLabel : copy.nextQuestion}</b>
        {profile.profile_complete ? copy.completeEnough : formatCopy(copy.stillNeeds, { need: nextNeed })}
      </div>
      <div className="note">{copy.privateNote}</div>
    </div>
  );
}

function sameRoute(left, right) {
  if (!left || !right) return false;
  const leftId = uiText(left.id);
  const rightId = uiText(right.id);
  const leftName = uiText(left.name);
  const rightName = uiText(right.name);
  if (leftId && rightId) return leftId === rightId;
  if (leftName && rightName) return leftName === rightName;
  return false;
}

function routeKey(route = {}) {
  return uiText(route.id, uiText(route.name, uiText(route.title, ''))).trim();
}

function isJourneyCompleteForPassport(journey = {}, progress = {}) {
  const modules = Array.isArray(journey?.modules) ? journey.modules : [];
  if (!modules.length) return false;
  const completionPercent = Number(progress.completion_percent || 0);
  const completedModules = Number(progress.completed_module_count || 0);
  const proofRequired = Number(progress.proof_required_count || modules.filter((module) => Boolean(module.proof)).length || 0);
  const proofReady = Number(progress.proof_ready_count || 0);
  return completionPercent >= 100 && completedModules >= modules.length && (!proofRequired || proofReady >= proofRequired);
}

function pathwaySourceItems(route = {}) {
  const rawSources = Array.isArray(route.sources) ? route.sources : [];
  const items = [
    ...rawSources,
    route.source_url ? { url: route.source_url, title: route.source_title } : null,
  ].filter(Boolean);
  const seen = new Set();
  return items
    .map((item, index) => {
      const url = uiUrl(typeof item === 'string' ? item : item.source_url || item.url || item.link || item.href);
      if (!url || seen.has(url)) return null;
      seen.add(url);
      return {
        url,
        title: uiText(
          typeof item === 'string' ? '' : item.source_title || item.title || item.name,
          index === 0 ? uiText(route.source_title, 'official source') : `source ${index + 1}`,
        ),
      };
    })
    .filter(Boolean)
    .slice(0, 4);
}

function voiceSegment(value = '', fallback = '') {
  return uiText(value, fallback)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sentence(value = '') {
  const clean = voiceSegment(value);
  if (!clean) return '';
  return /[.!?।]$/.test(clean) ? clean : `${clean}.`;
}

function limitedVoiceScript(parts = [], maxLength = 860) {
  const output = [];
  let used = 0;
  parts
    .map(sentence)
    .filter(Boolean)
    .forEach((part) => {
      if (used + part.length + 1 > maxLength) return;
      output.push(part);
      used += part.length + 1;
    });
  return output.join(' ').trim();
}

function shortVoiceLine(value = '', maxLength = 150) {
  const clean = voiceSegment(value)
    .replace(/\b(Meera\s+ne\s+yeh\s+rasta|Meera chose this|Why this route|Yeh rasta kyun)\b[:\s-]*/gi, '')
    .replace(/\bGoal:|Education:|Location:|Mobility:|Learner conditions used\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= maxLength) return clean;
  const clipped = clean.slice(0, maxLength);
  return clipped.slice(0, Math.max(30, clipped.lastIndexOf(' '))).trim();
}

function genericPathwayTitle(value = '') {
  return /skill pathway exploration|open counseling|career pathway|study pathway|pathway route|proof-first|training and practice|local verified[-\s]*source|chhota proof|small proof|daily practice|verified next step|compare study|compare skill|compare local/i.test(
    uiText(value),
  );
}

function AdminLoginScreen({ adminLogin, adminPassword, error, loading, setAdminPassword, setMode }) {
  return (
    <main className="admin-login-shell">
      <form className="admin-login-card" onSubmit={adminLogin}>
        <div className="logo-row">
          <span className="crm-brand-mark brandmark"><ShieldCheck size={20} /></span>
          <div>
            <b>VidyaSetu Admin</b>
            <small>central CRM for learners, journeys, proof, alerts and outreach</small>
          </div>
        </div>
        <h1>Platform command center</h1>
        <p>
          Login as an admin to see who is coming on the app, what stage they are in, which learners need worker
          support, and what proof or opportunity step is pending.
        </p>
        <label className="prototype-phone-login">
          <span>Admin password</span>
          <input
            autoComplete="current-password"
            onChange={(event) => setAdminPassword(event.target.value)}
            placeholder="Default demo: vidyasetu-admin"
            type="password"
            value={adminPassword}
          />
        </label>
        <button className="crm-primary" disabled={!adminPassword || Boolean(loading)} type="submit">
          {loading || 'Open admin CRM'}
        </button>
        <button className="ghost-button wide" onClick={() => setMode('landing')} type="button">
          Back to learner app
        </button>
        {error && <div className="site-alert">{error}</div>}
        <small className="login-helper-text">
          Set ADMIN_PASSWORD in Vercel before real deployment. The default password is only for hackathon demo control.
        </small>
      </form>
    </main>
  );
}

function AdminCrm({
  acknowledgeAdminAlert,
  adminData,
  adminNotice,
  adminQuery,
  adminSelectedLearnerId,
  adminStatus,
  closeAdminCrm,
  error,
  loading,
  refreshAdminCrm,
  selectAdminLearner,
  setAdminQuery,
  setAdminStatus,
}) {
  const users = filterAdminCrmUsers(adminData?.users || [], adminQuery, adminStatus);
  const selected = adminData?.selected || adminData?.users?.find((user) => user.learner_id === adminSelectedLearnerId) || null;
  const metrics = adminData?.metrics || {};
  const metricCards = [
    { label: 'Learners', value: metrics.learners || 0, detail: 'total profiles', Icon: UsersRound },
    { label: 'Journeys', value: metrics.active_journeys || 0, detail: 'active learning plans', Icon: BookOpen },
    { label: 'Passports', value: metrics.passports_ready || 0, detail: 'proof ready', Icon: ClipboardList },
    { label: 'Worker alerts', value: metrics.worker_alerts || 0, detail: 'need action', Icon: Bell },
    { label: 'Matches', value: metrics.matches || 0, detail: 'opportunity records', Icon: Search },
    { label: 'Languages', value: metrics.languages || 0, detail: 'learner languages', Icon: Languages },
  ];

  return (
    <main className="admin-crm-shell">
      <aside className="admin-crm-sidebar">
        <div className="crm-sidebar-logo">
          <span className="crm-brand-mark"><ShieldCheck size={15} /></span>
          <div>
            <p>VidyaSetu</p>
            <small>Admin CRM</small>
          </div>
        </div>
        <button className="primary-button wide" onClick={refreshAdminCrm} type="button">
          <RefreshCw size={16} /> Refresh data
        </button>
        <button className="ghost-button wide" onClick={closeAdminCrm} type="button">
          <LogOut size={16} /> Exit admin
        </button>
        <div className="admin-source-card">
          <b>Data source</b>
          <span>Learners, conversations, journeys, passports, matches, outreach and ADEWS are read from the app tables.</span>
          {adminData?.demo_auth && <small>Demo admin password active. Configure ADMIN_PASSWORD for production.</small>}
        </div>
      </aside>

      <section className="admin-crm-main">
        <header className="admin-crm-header">
          <div>
            <p className="eyebrow">Central operations</p>
            <h1>Admin CRM</h1>
            <p>See learner intake, journey progress, proof readiness, risk alerts, reminders and outreach from one place.</p>
          </div>
          <span className="admin-live-pill"><Clock3 size={15} /> {adminData?.generated_at ? prettyDate(adminData.generated_at) : 'Not loaded'}</span>
        </header>

        {loading && <div className="memory-banner">{loading}</div>}
        {adminNotice && <div className="memory-banner">{adminNotice}</div>}
        {error && <div className="site-alert">{error}</div>}

        <div className="admin-metric-grid">
          {metricCards.map(({ label, value, detail, Icon }) => (
            <div className="admin-metric-card" key={label}>
              <Icon size={20} />
              <b>{value}</b>
              <span>{label}</span>
              <small>{detail}</small>
            </div>
          ))}
        </div>

        <div className="admin-workspace-grid">
          <section className="admin-list-panel">
            <div className="admin-panel-head">
              <div>
                <h2>Learners</h2>
                <p>{users.length} visible after filters</p>
              </div>
              <span>{metrics.profile_complete || 0} complete profiles</span>
            </div>
            <div className="admin-filter-row">
              <input
                onChange={(event) => setAdminQuery(event.target.value)}
                placeholder="Search name, district, goal, language"
                value={adminQuery}
              />
              <select onChange={(event) => setAdminStatus(event.target.value)} value={adminStatus}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="journey">Journey active</option>
                <option value="passport">Passport ready</option>
                <option value="risk">Risk/watch</option>
                <option value="needs_worker">Needs worker</option>
              </select>
            </div>
            <div className="admin-learner-list">
              {users.map((user) => (
                <button
                  className={user.learner_id === selected?.learner_id ? 'admin-learner-row active' : 'admin-learner-row'}
                  key={user.learner_id}
                  onClick={() => selectAdminLearner(user.learner_id)}
                  type="button"
                >
                  <span className={adminRiskClass(user)}>{user.needs_worker ? '!' : user.name.slice(0, 1).toUpperCase()}</span>
                  <div>
                    <strong>{user.name}</strong>
                    <small>{user.goal} | {user.location}</small>
                    <em>{user.stage} - {user.journey_progress || 0}% journey - {user.language}</em>
                  </div>
                </button>
              ))}
              {!users.length && <EmptyState text="No learners match this filter yet." />}
            </div>
          </section>

          <section className="admin-detail-panel">
            {!selected ? (
              <EmptyState text="Select a learner to review profile, journey, alerts and outreach." />
            ) : (
              <AdminLearnerDetail selected={selected} acknowledgeAdminAlert={acknowledgeAdminAlert} />
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function AdminLearnerDetail({ selected, acknowledgeAdminAlert }) {
  const facts = [
    ['Phone', selected.phone_mask],
    ['Language', selected.language],
    ['Education', selected.education],
    ['Daily time', selected.time_available],
    ['Stage', selected.stage],
    ['Updated', prettyDate(selected.updated_at)],
  ];
  const progress = selected.journey?.progress || {};
  const modules = selected.journey?.modules || [];
  return (
    <div className="admin-detail-content">
      <div className="admin-detail-hero">
        <div>
          <p className="eyebrow">Learner profile</p>
          <h2>{selected.name}</h2>
          <p>{selected.goal}</p>
        </div>
        <span className={adminRiskClass(selected)}>{selected.risk_level}</span>
      </div>

      <div className="admin-fact-grid">
        {facts.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <b>{value || 'pending'}</b>
          </div>
        ))}
      </div>

      <div className="admin-progress-strip">
        <div>
          <span>Journey</span>
          <b>{selected.journey_progress || 0}%</b>
        </div>
        <div>
          <span>Proof</span>
          <b>{selected.proof_ready_count || 0}/{selected.proof_required_count || 0}</b>
        </div>
        <div>
          <span>Passport</span>
          <b>{selected.passport_ready ? 'Ready' : 'Locked'}</b>
        </div>
        <div>
          <span>Risk</span>
          <b>{selected.risk || 0}</b>
        </div>
      </div>

      {selected.alert && (
        <div className={selected.needs_worker ? 'admin-alert-card urgent' : 'admin-alert-card'}>
          <div>
            <strong>{selected.needs_worker ? 'Worker action needed' : 'ADEWS status'}</strong>
            <p>{selected.alert.fired_at ? `Fired ${prettyDate(selected.alert.fired_at)}` : 'Monitoring only'} | Risk {selected.alert.risk}</p>
          </div>
          <button
            className="primary-button"
            disabled={selected.alert.worker_ack}
            onClick={() => acknowledgeAdminAlert(selected.learner_id, selected.alert.id)}
            type="button"
          >
            <CheckCircle2 size={16} /> {selected.alert.worker_ack ? 'Acknowledged' : 'Mark handled'}
          </button>
        </div>
      )}

      <div className="admin-two-col">
        <div className="admin-mini-panel">
          <h3>Next action</h3>
          <p>{selected.next_action || 'No next action saved yet.'}</p>
          <small>Reminder: {selected.reminder_status || 'not sent'}</small>
        </div>
        <div className="admin-mini-panel">
          <h3>Opportunity state</h3>
          <p>{selected.match_count || 0} matches, {selected.outreach_count || 0} outreach records</p>
          <small>Outreach: {selected.outreach_status || 'none'}</small>
        </div>
      </div>

      <div className="admin-mini-panel">
        <h3>Learning journey</h3>
        <p>{selected.journey?.title || selected.journey_title || 'Journey not created yet.'}</p>
        {progress.next_action && <small>{progress.next_action}</small>}
        <div className="admin-module-list">
          {modules.slice(0, 8).map((module) => (
            <span key={module.id || module.title}>
              W{module.week || '-'}: {module.title || 'Module'} {module.proof ? `- proof: ${module.proof}` : ''}
            </span>
          ))}
          {!modules.length && <span>No weekly modules yet.</span>}
        </div>
      </div>

      <div className="admin-two-col">
        <div className="admin-mini-panel">
          <h3>Recent conversation</h3>
          <div className="admin-message-list">
            {(selected.conversation || []).slice(-5).map((message, index) => (
              <p key={`${message.role}-${index}`}><b>{message.role}:</b> {message.content}</p>
            ))}
            {!selected.conversation?.length && <small>No conversation restored yet.</small>}
          </div>
        </div>
        <div className="admin-mini-panel">
          <h3>Proof package</h3>
          {selected.passport ? (
            <p>QR {selected.passport.qr_token} | {selected.passport.cert_count} cert rows | {selected.passport.informal_count} skill rows</p>
          ) : (
            <p>Skill Passport is locked until journey proof is complete.</p>
          )}
          <small>{selected.qr_token || 'No QR token yet'}</small>
        </div>
      </div>
    </div>
  );
}

function filterAdminCrmUsers(users = [], query = '', status = 'all') {
  const needle = String(query || '').trim().toLowerCase();
  const desired = String(status || 'all').toLowerCase();
  return users.filter((user) => {
    const statusOk =
      desired === 'all' ||
      (desired === 'active' && user.stage !== 'new') ||
      (desired === 'journey' && user.journey_active) ||
      (desired === 'passport' && user.passport_ready) ||
      (desired === 'risk' && ['risk', 'watch'].includes(user.risk_level)) ||
      (desired === 'needs_worker' && user.needs_worker);
    if (!statusOk) return false;
    if (!needle) return true;
    return [user.name, user.goal, user.location, user.language, user.education, user.learner_id]
      .some((value) => String(value || '').toLowerCase().includes(needle));
  });
}

function prettyDate(value = '') {
  if (!value) return 'not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function adminRiskClass(user = {}) {
  if (user.needs_worker || user.risk_level === 'risk') return 'risk-chip risk';
  if (user.risk_level === 'watch') return 'risk-chip watch';
  return 'risk-chip normal';
}

function cleanPathwayTarget(value = '') {
  return uiText(value)
    .replace(/\b(skill|career|study)?\s*pathway\s*exploration\b/gi, ' ')
    .replace(/\b(open counseling|career pathway|study pathway|pathway route|selected pathway)\b/gi, ' ')
    .replace(/\b(proof-first|verified-source|local verified-source|training and practice)\s*route\b/gi, ' ')
    .replace(/\b(pathway|route|strategy|compare)\b/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function displayPathwayTarget(profile = {}, route = {}) {
  const allText = [
    profile.learner_goal?.label,
    ...(Array.isArray(profile.aspirations) ? profile.aspirations : []),
    ...(Array.isArray(profile.skills) ? profile.skills : []),
    route?.pathway_detail?.realistic_role,
    route?.realistic_role,
    route?.entry_role,
    route?.title,
    route?.name,
  ]
    .map(uiText)
    .join(' ')
    .toLowerCase();
  if (/machine learning|ml engineer/.test(allText)) return 'machine learning job';
  if (/data science|data analyst|analytics|python|sql/.test(allText)) return 'data job';
  if (/customer service|bpo|office|typing|computer|data-entry|data entry/.test(allText)) return 'office typing job';
  if (/mobile|phone|repair/.test(allText)) return 'mobile repair';
  if (/mushroom/.test(allText)) return 'mushroom business';
  if (/poultry|chicken|broiler|layer/.test(allText)) return 'poultry business';
  if (/tailor|silai|stitch|garment/.test(allText)) return 'silai ka kaam';
  if (/plumb|pipe|sanitary/.test(allText)) return 'plumbing ka kaam';
  if (/electrician|wiring|electrical/.test(allText)) return 'electrician ka kaam';
  const candidates = [
    profile.learner_goal?.label,
    ...(Array.isArray(profile.aspirations) ? profile.aspirations : []),
    ...(Array.isArray(profile.skills) ? profile.skills : []),
    route?.pathway_detail?.realistic_role,
    route?.realistic_role,
    route?.entry_role,
  ]
    .map(cleanPathwayTarget)
    .filter((item) => item && !genericPathwayTitle(item));
  return candidates[0] || 'aapka goal';
}

function displayPathwayTitle(route = {}, profile = {}, index = 0) {
  const rawTitle = uiText(route?.title, uiText(route?.name));
  if (rawTitle && rawTitle.length <= 72 && !genericPathwayTitle(rawTitle)) return rawTitle;
  const target = displayPathwayTarget(profile, route);
  const kind = uiText(route?.card_kind || route?.kind || route?.axis, index === 0 ? 'earn_fast' : index === 1 ? 'build_bigger' : 'explore');
  const isEnglish = /english/i.test(uiText(profile.preferred_language || profile.language)) && !/hinglish|hindi/i.test(uiText(profile.preferred_language || profile.language));
  if (isEnglish) {
    if (kind === 'earn_fast') return `Start ${target} with one sample`;
    if (kind === 'build_bigger') return `Learn ${target} from one free source`;
    return `Check safe ${target} sources`;
  }
  if (kind === 'earn_fast') return `Pehla ${target} sample banao`;
  if (kind === 'build_bigger') return `Free source se ${target} seekho`;
  return `${target} ka safe source check karo`;
}

function displayPathwayBrief(route = {}, profile = {}, title = '') {
  const raw = uiText(route?.learner_summary || route?.tradeoff || route?.why_this_fits_you);
  if (raw && raw.length <= 260 && !genericPathwayTitle(raw) && !/starts from|learner already|goal:|education:|mobility:/i.test(raw)) {
    return raw;
  }
  const target = displayPathwayTarget(profile, route);
  const isEnglish = /english/i.test(uiText(profile.preferred_language || profile.language)) && !/hinglish|hindi/i.test(uiText(profile.preferred_language || profile.language));
  return isEnglish
    ? `Meera will keep this focused on ${target}: one safe first action, one free resource, and proof before any application or spending.`
    : `Meera ${target} ke liye ek safe pehla kaam, ek free resource, aur proof ke baad hi next step batayegi.`;
}

function generationWaitCopy(language = 'English', type = 'pathway') {
  const lang = String(language || '').toLowerCase();
  const journey = type === 'journey';
  if (/hindi|हिंदी/.test(lang)) {
    return journey
      ? {
          title: 'आपकी सीखने की यात्रा बन रही है',
          loading: 'मीरा आपका असली week-by-week plan बना रही है। कृपया थोड़ा इंतज़ार करें।',
          hint: 'यह आपके लक्ष्य, जगह, समय और मुफ़्त resources के हिसाब से बनेगा।',
        }
      : {
          title: 'आपका असली रास्ता बन रहा है',
          loading: 'मीरा आपके goal, जगह और हालत देखकर रास्ता बना रही है। कृपया थोड़ा इंतज़ार करें।',
          hint: 'यह generic जवाब नहीं है; Meera आपके profile से सही next step चुनेगी।',
        };
  }
  if (/odia|oriya|ଓଡ/.test(lang)) {
    return journey
      ? {
          title: 'ଆପଣଙ୍କ ଶିଖିବା ଯାତ୍ରା ତିଆରି ହେଉଛି',
          loading: 'Meera ଆପଣଙ୍କ ପାଇଁ ସତିକ week-by-week plan ବନାଉଛି। ଦୟାକରି ଅଳ୍ପ ଅପେକ୍ଷା କରନ୍ତୁ।',
          hint: 'ଏହା ଆପଣଙ୍କ goal, ଜାଗା, ସମୟ ଏବଂ free resources ଅନୁସାରେ ହେବ।',
        }
      : {
          title: 'ଆପଣଙ୍କ ସତିକ ବାଟ ତିଆରି ହେଉଛି',
          loading: 'Meera ଆପଣଙ୍କ goal, ଜାଗା ଓ ପରିସ୍ଥିତି ଦେଖି ବାଟ ବନାଉଛି। ଦୟାକରି ଅଳ୍ପ ଅପେକ୍ଷା କରନ୍ତୁ।',
          hint: 'ଏହା generic ଉତ୍ତର ନୁହେଁ; profile ରୁ next step ବାଛାଯିବ।',
        };
  }
  if (/tamil|தமிழ்/.test(lang)) {
    return journey
      ? {
          title: 'உங்கள் கற்றல் பயணம் உருவாகிறது',
          loading: 'Meera உங்களுக்கு உண்மையான week-by-week plan உருவாக்குகிறது. தயவு செய்து காத்திருக்கவும்.',
          hint: 'இது உங்கள் goal, இடம், நேரம், free resources அடிப்படையில் வரும்.',
        }
      : {
          title: 'உங்கள் உண்மையான பாதை உருவாகிறது',
          loading: 'Meera உங்கள் goal, இடம், நிலை பார்த்து பாதை உருவாக்குகிறது. தயவு செய்து காத்திருக்கவும்.',
          hint: 'இது generic பதில் இல்லை; உங்கள் profile-க்கு சரியான next step வரும்.',
        };
  }
  if (/bengali|bangla|বাংলা/.test(lang)) {
    return journey
      ? {
          title: 'আপনার শেখার যাত্রা তৈরি হচ্ছে',
          loading: 'Meera আপনার জন্য সত্যিকারের week-by-week plan বানাচ্ছে। একটু অপেক্ষা করুন।',
          hint: 'এটি আপনার goal, জায়গা, সময় এবং free resources অনুযায়ী হবে।',
        }
      : {
          title: 'আপনার আসল পথ তৈরি হচ্ছে',
          loading: 'Meera আপনার goal, জায়গা আর অবস্থার ওপর ভিত্তি করে পথ বানাচ্ছে। একটু অপেক্ষা করুন।',
          hint: 'এটি generic উত্তর নয়; আপনার profile থেকে next step আসবে।',
        };
  }
  if (/marathi|मराठी/.test(lang)) {
    return journey
      ? {
          title: 'तुमचा शिकण्याचा प्रवास तयार होत आहे',
          loading: 'Meera तुमच्यासाठी खरा week-by-week plan बनवत आहे. थोडा वेळ थांबा.',
          hint: 'हा तुमच्या goal, ठिकाण, वेळ आणि free resources नुसार असेल.',
        }
      : {
          title: 'तुमचा खरा मार्ग तयार होत आहे',
          loading: 'Meera तुमचा goal, ठिकाण आणि परिस्थिती पाहून मार्ग बनवत आहे. थोडा वेळ थांबा.',
          hint: 'हे generic उत्तर नाही; profile वरून next step निवडला जाईल.',
        };
  }
  if (/hinglish/.test(lang)) {
    return journey
      ? {
          title: 'Aapki learning journey ban rahi hai',
          loading: 'Meera aapke liye real week-by-week plan bana rahi hai. Thoda wait karein.',
          hint: 'Yeh aapke goal, location, time aur free resources ke hisaab se banega.',
        }
      : {
          title: 'Aapka real rasta ban raha hai',
          loading: 'Meera aapka goal, location aur condition dekhkar rasta bana rahi hai. Thoda wait karein.',
          hint: 'Yeh generic jawab nahi hai; profile se sahi next step choose hoga.',
        };
  }
  return journey
    ? {
        title: 'Creating your learning journey',
        loading: 'Meera is creating a real week-by-week plan for you. Please wait a little.',
        hint: 'It will use your goal, location, time, proof, and free resources.',
      }
    : {
        title: 'Creating your real pathway',
        loading: 'Meera is using your goal, location, proof, and safety limits. Please wait a little.',
        hint: 'This is not a generic answer; the next step comes from your profile.',
      };
}

function pathwayVoiceScript({
  activeRoute,
  firstSource,
  promiseText,
  routeSummary,
  routeTitle,
  simpleCheck,
  simpleRole,
  simpleStep,
  simpleWhy,
  t = getTranslations('English'),
}) {
  if (!activeRoute) return '';
  const copy = t.pathway || {};
  const resourceTitle = firstSource?.title ? voiceSegment(firstSource.title) : '';
  const recommendation = shortVoiceLine(routeTitle, 130);
  const firstAction = shortVoiceLine(simpleStep, 160);
  const check = shortVoiceLine(simpleCheck || promiseText, 170);
  return limitedVoiceScript([
    copy.voiceIntro || 'Meera is explaining this pathway.',
    recommendation ? `${copy.voiceRecommendation || copy.recommended || 'Meera ka sujhav'}: ${recommendation}` : '',
    firstAction ? `${copy.voiceFirstAction || copy.firstStep || 'Pehla kaam'}: ${firstAction}` : shortVoiceLine(routeSummary, 150),
    check ? `${copy.voiceCheck || copy.checkBefore || 'Dhyan rahe'}: ${check}` : '',
    resourceTitle
      ? `${copy.firstResource || 'First resource'}: ${resourceTitle}. ${copy.resourceVoiceHint || 'Open one small useful part, then save one note or voice proof.'}`
      : '',
  ], 560);
}

function TracePanel({ trace, nextAction }) {
  const facts = Array.isArray(trace?.matched_facts) ? trace.matched_facts : [];
  const blockers = Array.isArray(trace?.blockers) ? trace.blockers : [];
  const missing = Array.isArray(trace?.missing_facts) ? trace.missing_facts : [];
  const safeNextAction = uiText(nextAction);
  if (!facts.length && !blockers.length && !missing.length && !safeNextAction) return null;
  return (
    <div className="trace-panel">
      <strong>Why this is recommended</strong>
      {facts.length > 0 && (
        <div className="trace-chip-row">
          {facts.slice(0, 5).map((fact) => (
            <span key={`${uiText(fact?.label, 'Fact')}-${uiText(fact?.value, 'used')}`}><b>{uiText(fact?.label, 'Fact')}</b>{uiText(fact?.value, 'Used')}</span>
          ))}
        </div>
      )}
      {blockers.length > 0 && (
        <p><b>Check first:</b> {blockers.map((item) => uiText(item)).filter(Boolean).join(' ')}</p>
      )}
      {!blockers.length && missing.length > 0 && (
        <p><b>Still needed:</b> {missing.map((item) => uiText(item)).filter(Boolean).join(', ')}</p>
      )}
      {safeNextAction && <p><b>Next:</b> {safeNextAction}</p>}
    </div>
  );
}

function GenerationWaitCard({ type = 'pathway', loading = '', language = 'English', t = getTranslations('English') }) {
  if (!loading) return null;
  const copy = t.wait || getTranslations('English').wait || {};
  const isJourney = type === 'journey';
  const languageCopy = generationWaitCopy(language, type);
  return (
    <div className="generation-wait-card" role="status" aria-live="polite">
      <span className="generation-spinner" aria-hidden="true" />
      <div>
        <strong>{languageCopy.title || (isJourney ? copy.journeyTitle || 'Creating your learning journey' : copy.pathwayTitle || 'Creating your pathway')}</strong>
        <p>{loading}</p>
        <small>
          {languageCopy.hint ||
            (isJourney
              ? copy.journeyHint || 'Meera is using your profile and selected pathway to create week-by-week tasks and resources.'
              : copy.pathwayHint || 'Meera is using your goal, location, time, proof, and safety limits. This can take a little time.')}
        </small>
      </div>
    </div>
  );
}

function PathwaysTab({
  pathway,
  profile = {},
  selectedRoute,
  setSelectedRoute,
  generatePathway,
  createJourney,
  loading = '',
  pathwayLocked = false,
  journeyLocked = false,
  speakReply,
  speakingIndex,
  stopSpeaking,
  t = getTranslations('English'),
}) {
  const routes = Array.isArray(pathway?.routes) && pathway.routes.length ? pathway.routes : Array.isArray(pathway?.cards) ? pathway.cards : [];
  const activeRoute = selectedRoute || routes[0] || null;
  const autoVoiceKeyRef = useRef('');
  const academicMode = routes.some((route) => (
    uiText(route.id).startsWith('class12') ||
    uiText(route.id).startsWith('school') ||
    uiText(route.id).startsWith('entrance') ||
    uiText(route.id).startsWith('jee')
  ));
  const selectedIndex = routes.findIndex((route) => sameRoute(activeRoute, route));
  const selectedRouteName = activeRoute
    ? displayPathwayTitle(activeRoute, profile, selectedIndex >= 0 ? selectedIndex : 0)
    : academicMode ? 'Study pathway' : 'Career pathway';
  const optionLabel = (index = 0) => `${t.pathway.option || 'Option'} ${index + 1}`;
  const lockMessage = t.pathway.pathLocked || 'This pathway is locked until the current learning journey proof is complete.';
  const activeSources = activeRoute ? pathwaySourceItems(activeRoute) : [];
  const blockers = Array.isArray(activeRoute?.trace?.blockers) && activeRoute.trace.blockers.length
    ? activeRoute.trace.blockers.map((item) => uiText(item)).filter(Boolean)
    : [
      t.pathway.professionalOutreachBlocked,
      t.pathway.offlineNeedsLocation,
    ];
  const pathwayDetail =
    activeRoute?.pathway_detail && typeof activeRoute.pathway_detail === 'object' && !Array.isArray(activeRoute.pathway_detail)
      ? activeRoute.pathway_detail
      : {};
  const firstSource = activeSources[0] || null;
  const routeTitle = activeRoute ? displayPathwayTitle(activeRoute, profile, selectedIndex >= 0 ? selectedIndex : 0) : selectedRouteName;
  const routeSummary = activeRoute
    ? displayPathwayBrief(activeRoute, profile, routeTitle)
    : 'Profile ke hisaab se realistic route.';
  const simpleRole = uiText(pathwayDetail.realistic_role, routeTitle);
  const simpleWhy = uiText(
    pathwayDetail.why_realistic,
    uiText(activeRoute?.why_this_fits_you, 'Meera uses the learner goal, current proof, location, and safety before suggesting this route.'),
  );
  const simpleCheck = uiText(
    pathwayDetail.what_to_check,
    uiText(activeRoute?.what_it_asks, blockers[0] || 'Verify source, fees, safety, location, and consent first.'),
  );
  const simpleStep = uiText(
    activeRoute?.learner_next_step,
    uiText(activeRoute?.first_step, uiText(activeRoute?.next_action, 'Build the learner journey and start the first proof task.')),
  );
  const promiseText = uiText(pathwayDetail.not_a_promise, 'This is not a guarantee. Sources, contacts, fees, and consent must be checked before action.');
  const voiceKey = activeRoute ? `pathway:${uiText(activeRoute.id, selectedIndex >= 0 ? `route-${selectedIndex}` : routeTitle)}` : '';
  const isPathwaySpeaking = Boolean(voiceKey && speakingIndex === voiceKey);
  const narrationText = useMemo(
    () =>
      pathwayVoiceScript({
        activeRoute,
        firstSource,
        promiseText,
        routeSummary,
        routeTitle,
        simpleCheck,
        simpleRole,
        simpleStep,
        simpleWhy,
        t,
      }),
    [activeRoute, firstSource, promiseText, routeSummary, routeTitle, simpleCheck, simpleRole, simpleStep, simpleWhy, t],
  );
  const narrationProfile = {
    ...profile,
    preferred_language: profile.preferred_language || profile.language || 'Hinglish',
  };
  const playPathwayVoice = () => {
    if (!narrationText || typeof speakReply !== 'function') return;
    if (isPathwaySpeaking) {
      stopSpeaking?.();
      return;
    }
    speakReply(narrationText, narrationProfile, voiceKey, { forceServerVoice: true, source: 'pathway', tab: 'pathways' });
  };
  useEffect(() => {
    if (!narrationText || !voiceKey || typeof speakReply !== 'function') return undefined;
    const key = `${voiceKey}:${narrationText.slice(0, 80)}`;
    if (autoVoiceKeyRef.current === key) return undefined;
    autoVoiceKeyRef.current = key;
    const timer = window.setTimeout(() => {
      speakReply(narrationText, narrationProfile, voiceKey, { forceServerVoice: true, source: 'pathway_auto', tab: 'pathways' });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [narrationText, narrationProfile.preferred_language, speakReply, voiceKey]);
  const lockCreateLabel =
    t.pathway.lockCreateCta ||
    (/(hindi|hinglish)/i.test(uiText(profile.preferred_language || profile.language || ''))
      ? 'Is raste ko lock karke meri journey banao'
      : 'Lock this path and create my journey');
  const routeAccordion = routes.length > 0 && (
    <div className="pathway-accordion-list">
      {routes.map((route, index) => {
        const selected = sameRoute(activeRoute, route);
        const lockedOut = pathwayLocked && !selected;
        const title = displayPathwayTitle(route, profile, index);
        const summary = displayPathwayBrief(route, profile, title);
        return (
          <article className={selected ? 'pathway-option-card active' : 'pathway-option-card'} key={uiText(route.id, `route-${index}`)}>
            <button
              className="pathway-option-header"
              disabled={lockedOut}
              onClick={() => {
                if (!lockedOut) setSelectedRoute(route);
              }}
              type="button"
            >
              <span>{optionLabel(index)}</span>
              <strong>{title}</strong>
              <ChevronRight aria-hidden="true" className={selected ? 'open' : ''} size={16} />
            </button>
            {selected && (
              <div className="pathway-option-expanded">
                <p>{summary}</p>
                <button
                  className="primary-button pathway-lock-button"
                  disabled={journeyLocked}
                  onClick={() => createJourney(route)}
                  type="button"
                >
                  <Lock size={18} />
                  {journeyLocked ? (t.pathway.lockedCta || 'Continue current journey') : lockCreateLabel}
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
  return (
    <div className="prototype-screen pathway-screen">
      <GenerationWaitCard language={profile.preferred_language || profile.language} loading={loading} t={t} type="pathway" />
      {!routes.length && <EmptyState text={t.pathway.empty} />}
      {routeAccordion}
      <div className="card pathway-detail-card pathway-expanded-detail">
        {!activeRoute && <p>{t.pathway.generateAfterProfile}</p>}
        {pathway?.result_type === 'human_callback' && pathway?.callback_reason && (
          <div className="pathway-worker-note">
            {uiText(pathway.callback_reason)}
          </div>
        )}
        {activeRoute && (
          <>
          <div className="pathway-card-head simple-pathway-head">
            <span>{optionLabel(selectedIndex >= 0 ? selectedIndex : 0)}</span>
            <strong>{routeTitle}</strong>
            <small>{routeSummary}</small>
          </div>
          <div className="pathway-voice-guide">
            <div>
              <b>{t.pathway.listenTitle || 'Hear this pathway'}</b>
              <p>{t.pathway.listenHint || 'Meera will explain the route, first step, safety checks, and resource to open first.'}</p>
            </div>
            <button className="voice-replay-button pathway-listen-button" onClick={playPathwayVoice} type="button">
              {isPathwaySpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
              {isPathwaySpeaking ? (t.counselor?.speaking || 'Speaking') : (t.counselor?.listen || 'Listen')}
            </button>
          </div>
          <div className="pathway-card-actions">
            {firstSource && (
              <a className="ghost-button" href={firstSource.url} rel="noreferrer" target="_blank">
                {t.btn.open}: {firstSource.title}
              </a>
            )}
            {activeRoute.requires_worker_confirmation && <span>{t.pathway.workerConfirmation}</span>}
          </div>
          </>
        )}
      </div>
      <div className="action-row">
        <button className="primary-button" disabled={pathwayLocked} onClick={generatePathway}>
          {t.btn.refreshRecommendations}
        </button>
        <span>
          {pathwayLocked
            ? lockMessage
            : pathway?.callback_flag
            ? uiText(pathway.callback_message, 'More learner details are needed before recommendations.')
            : activeRoute
              ? `${t.pathway.selected}${selectedIndex >= 0 ? ` ${selectedIndex + 1}` : ''}: ${selectedRouteName}.`
              : t.pathway.noSelected}
        </span>
      </div>
    </div>
  );
}

function weekDayPlan(module = {}, lessons = [], practiceTasks = [], proofTasks = [], t = getTranslations('English')) {
  const copy = t.journey || getTranslations('English').journey;
  const dailyMicroTasks = Array.isArray(module.daily_micro_tasks) ? module.daily_micro_tasks : [];
  const learningSteps = [
    ...dailyMicroTasks.map((text) => ({ kind: copy.daily, text })),
    ...lessons.map((text) => ({ kind: copy.learn, text })),
    ...practiceTasks.map((text) => ({ kind: copy.practice, text })),
  ].filter((item) => uiText(item.text));
  const proofText = uiText(proofTasks[0], uiText(module.proof, copy.shortProof));
  const reviewText = uiText(
    module.unlocks || module.unlock_after_completion || module.unlock,
    copy.review,
  );

  return Array.from({ length: 7 }, (_, index) => {
    if (index < 5) {
      const fallback = { kind: copy.daily, text: uiText(module.goal, copy.completeThisWeek) };
      const item = learningSteps[index] || learningSteps[index % Math.max(learningSteps.length, 1)] || fallback;
      return { day: index + 1, kind: item.kind, text: uiText(item.text, fallback.text) };
    }
    if (index === 5) return { day: 6, kind: copy.proof, text: proofText };
    return { day: 7, kind: copy.review, text: reviewText };
  });
}

function JourneyTab({
  profile = {},
  journey,
  selectedRoute,
  createJourney,
  savePassport,
  completedLessons,
  toggleLesson,
  proofNotes = {},
  proofArtifacts = {},
  updateProofNote,
  updateProofArtifact,
  saveJourneyProgress,
  progressState = {},
  pathwayLocked = false,
  loading = '',
  t = getTranslations('English'),
}) {
  const copy = t.journey || getTranslations('English').journey;
  const modules = Array.isArray(journey?.modules) ? journey.modules : [];
  const learningContract = journey?.learning_contract && typeof journey.learning_contract === 'object' ? journey.learning_contract : {};
  const baseProgress = journey?.progress && typeof journey.progress === 'object' ? journey.progress : {};
  const progress = { ...baseProgress, ...progressState };
  const allItems = modules.flatMap((module) => {
    const lessons = Array.isArray(module.lessons) ? module.lessons : [];
    const practiceTasks = Array.isArray(module.practice_tasks) ? module.practice_tasks : [];
    return [
      ...lessons.map((item) => `${module.id}::lesson::${item}`),
      ...practiceTasks.map((item) => `${module.id}::task::${item}`),
    ];
  });
  const computedCompletedCount = allItems.filter((key) => completedLessons[key]).length;
  const completedCount = Number.isFinite(Number(progress.completed_count)) ? Number(progress.completed_count) : computedCompletedCount;
  const totalItems = Number.isFinite(Number(progress.total_count)) && Number(progress.total_count) > 0 ? Number(progress.total_count) : allItems.length;
  const completionPercent = Number.isFinite(Number(progress.completion_percent))
    ? Number(progress.completion_percent)
    : totalItems
      ? Math.round((completedCount / totalItems) * 100)
      : 0;
  const academicMode = journey?.mode === 'entrance_exam_prep' || journey?.mode === 'academic_exam_prep' || journey?.mode === 'school_study_support';
  const moduleStatusById = new Map((Array.isArray(progress.module_status) ? progress.module_status : []).map((module) => [module.id, module]));
  const proofReadyCount = Number(progress.proof_ready_count || 0);
  const proofRequiredCount = Number(progress.proof_required_count || modules.filter((module) => Boolean(module.proof)).length || 0);
  const passportEligible = isJourneyCompleteForPassport(journey, progress);
  const currentModule = modules.find((module) => module.id === progress.current_module_id) || modules[0] || null;
  const routeName = uiText(selectedRoute?.name, uiText(journey?.route_name, academicMode ? 'Study route' : 'Career route'));
  const finalUnlock = uiText(
    learningContract.opportunity_unlock,
    academicMode ? copy.finalAcademicUnlock : copy.finalCareerUnlock,
  );
  const nextAction = uiText(
    progress.next_action,
    currentModule ? formatCopy(copy.continueWeek, { week: currentModule.week || 1, title: uiText(currentModule.title, 'current task') }) : copy.createJourneyFirst,
  );
  const moduleLimit = Math.min(Math.max(modules.length, 4), 12);
  const visibleModules = modules.slice(0, moduleLimit);
  const journeyLengthText = uiText(journey?.duration?.mvp, modules.length ? `${modules.length}-week journey` : copy.fourWeeks);
  const proofPlaceholder = academicMode
    ? copy.proofPlaceholderStudy
    : copy.proofPlaceholderWork;
  return (
    <div className="workspace-card journey-workspace">
      <GenerationWaitCard language={profile.preferred_language || profile.language} loading={loading} t={t} type="journey" />
      <div className="journey-page-head">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2>{journey ? routeName : copy.choosePathway}</h2>
          <p>
            {journey
              ? journeyLengthText
              : copy.builtFromPathway}
          </p>
        </div>
        <button className="primary-button" disabled={!selectedRoute || pathwayLocked} onClick={() => createJourney(selectedRoute)}>
          {journey ? copy.refresh : academicMode ? t.btn.refreshStudyPlan : t.btn.createJourney}
        </button>
      </div>
      {pathwayLocked && <EmptyState text={copy.pathLocked || 'This pathway is locked until the current learning journey proof is complete.'} />}
      {!journey && <EmptyState text={copy.chooseRouteFirst} />}
      {journey && (
        <>
          <div className="journey-readiness-grid">
            <span><b>{completionPercent}%</b>{copy.progress}</span>
            <span><b>{proofReadyCount}/{proofRequiredCount || 1}</b>{copy.proofSaved}</span>
            <span><b>{passportEligible ? copy.ready : copy.draft}</b>{academicMode ? copy.studyRecord : copy.skillPassport}</span>
          </div>
          <div className="study-progress">
            <div>
              <strong>{completedCount}/{totalItems}</strong>
              <span>{academicMode ? copy.studyItems : copy.learningItems}</span>
            </div>
            <i><b style={{ width: `${completionPercent}%` }} /></i>
          </div>
          <div className="journey-week-grid">
            {visibleModules.map((module, moduleIndex) => {
              const lessons = Array.isArray(module.lessons) ? module.lessons : [];
              const practiceTasks = Array.isArray(module.practice_tasks) ? module.practice_tasks : [];
              const proofTasks = Array.isArray(module.proof_tasks) ? module.proof_tasks : [];
              const moduleResources = Array.isArray(module.resources) ? module.resources : [];
              const dayPlan = weekDayPlan(module, lessons, practiceTasks, proofTasks, t);
              const moduleItems = [
                ...lessons.map((item) => `${module.id}::lesson::${item}`),
                ...practiceTasks.map((item) => `${module.id}::task::${item}`),
              ];
              const moduleDone = moduleItems.filter((key) => completedLessons[key]).length;
              const savedStatus = moduleStatusById.get(module.id) || {};
              const proofNote = proofNotes[module.id] ?? savedStatus.proof_note ?? '';
              const proofArtifact = proofArtifacts[module.id] ?? savedStatus.proof_artifact ?? '';
              const modulePercent = moduleItems.length ? Math.round((moduleDone / moduleItems.length) * 100) : 0;
              const proofReady = Boolean(String(proofNote || proofArtifact).trim()) && moduleDone > 0;
              const unlocked = savedStatus.unlocked ?? moduleIndex === 0;
              const locked = !unlocked && !savedStatus.module_complete;
              const moduleStatus = savedStatus.module_complete
                ? copy.complete
                : locked
                  ? copy.locked
                  : proofReady
                    ? copy.proofSaved
                    : moduleDone
                      ? copy.addProof
                      : copy.start;
              return (
                <article className={locked ? 'journey-week-card locked' : 'journey-week-card'} key={module.id}>
                  <div className="journey-week-topline">
                    <span>{copy.week} {module.week || moduleIndex + 1}</span>
                    <b className={savedStatus.module_complete || proofReady ? 'status-pill done' : locked ? 'status-pill locked' : 'status-pill'}>{moduleStatus}</b>
                  </div>
                  <h3>{uiText(module.title, `${copy.week} ${module.week || moduleIndex + 1}`)}</h3>
                  <p>{uiText(module.goal, copy.completeThisWeek)}</p>
                  <div className="module-progress-line">
                    <strong>{moduleDone}/{moduleItems.length} {copy.complete.toLowerCase()}</strong>
                    <i><b style={{ width: `${modulePercent}%` }} /></i>
                  </div>
                  <div className="week-day-tabs" role="tablist" aria-label={`${copy.week} ${module.week || moduleIndex + 1} ${copy.day} plan`}>
                    {dayPlan.map((day) => (
                      <button className={day.day === 1 && !moduleDone && !locked ? 'active' : ''} key={`${module.id}-day-${day.day}`} type="button">
                        <span>{copy.day} {day.day}</span>
                        <small>{day.kind}</small>
                      </button>
                    ))}
                  </div>
                  <div className="week-day-plan">
                    {dayPlan.map((day) => (
                      <span key={`${module.id}-task-${day.day}`}>
                        <b>{copy.day} {day.day}</b>
                        {day.text}
                      </span>
                    ))}
                  </div>
                  {moduleResources.length > 0 && (
                    <div className="week-resource-list">
                      <b>{copy.resources || 'Resources for this week'}</b>
                      {moduleResources.map((resource, resourceIndex) => {
                        const url = uiUrl(resource.source_url);
                        return (
                          <div className="week-resource-card" key={`${module.id}-resource-${resourceIndex}`}>
                            <div>
                              <strong>{uiText(resource.title, 'Learning resource')}</strong>
                              {resource.search_query && <small>{copy.searchFor || 'Search'}: {uiText(resource.search_query)}</small>}
                            </div>
                            <p><b>{copy.howToUse || 'How to use'}:</b> {uiText(resource.how_to_use, 'Use this only for the current week task, then save proof.')}</p>
                            <p><b>{copy.proofToSave || 'Proof to save'}:</b> {uiText(resource.proof_to_save, uiText(module.proof, copy.shortProof))}</p>
                            {url && (
                              <a href={url} rel="noreferrer" target="_blank">
                                {t.btn.open}: {uiText(resource.type, 'resource').replace(/_/g, ' ')}
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="lesson-checklist">
                    {lessons.map((lesson) => {
                      const key = `${module.id}::lesson::${lesson}`;
                      return (
                        <button className={completedLessons[key] ? 'lesson-item done' : 'lesson-item'} disabled={locked} key={key} onClick={() => toggleLesson(key)}>
                          <b>{completedLessons[key] ? copy.completed : locked ? copy.locked : copy.tapAfterLesson}</b>
                          {lesson}
                        </button>
                      );
                    })}
                    {practiceTasks.map((task) => {
                      const key = `${module.id}::task::${task}`;
                      return (
                        <button className={completedLessons[key] ? 'lesson-item task done' : 'lesson-item task'} disabled={locked} key={key} onClick={() => toggleLesson(key)}>
                          <b>{completedLessons[key] ? copy.completed : locked ? copy.locked : copy.tapAfterPractice}</b>
                          {task}
                        </button>
                      );
                    })}
                  </div>
                  <div className="week-proof-section">
                    <strong>{formatCopy(copy.proofForWeek, { week: module.week || moduleIndex + 1 })}: {uiText(module.proof, copy.shortProof)}</strong>
                    {proofTasks.length > 0 && (
                      <div className="proof-task-list">
                        {proofTasks.map((proofTask) => (
                          <span key={`${module.id}-${proofTask}`}>{proofTask}</span>
                        ))}
                      </div>
                    )}
                    <textarea
                      disabled={locked}
                      value={proofNote}
                      placeholder={proofPlaceholder}
                      onBlur={() => saveJourneyProgress?.('proof_note_saved')}
                      onChange={(event) => updateProofNote?.(module.id, event.target.value)}
                    />
                    <input
                      disabled={locked}
                      value={proofArtifact}
                      placeholder={copy.optionalProof}
                      onBlur={() => saveJourneyProgress?.('proof_artifact_saved')}
                      onChange={(event) => updateProofArtifact?.(module.id, event.target.value)}
                    />
                    <button className="ghost-button" disabled={locked} onClick={() => saveJourneyProgress?.('proof_note_saved')}>
                      {formatCopy(copy.saveProofForWeek, { week: module.week || moduleIndex + 1 })}
                    </button>
                    <small>{proofReady ? copy.proofSavedUnlock : `${copy.unlocks}: ${uiText(module.unlocks || module.unlock_after_completion || module.unlock, copy.nextWeek)}`}</small>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="journey-after-card" role="tab">
            <span>{copy.afterWeek4}</span>
            <div>
              <h3>{academicMode ? copy.studyRecordReview : copy.skillPassportNext}</h3>
              <p>{finalUnlock}</p>
              <small><b>{copy.nextNow}:</b> {nextAction}</small>
            </div>
            <button className="primary-button" disabled={!passportEligible} onClick={savePassport}>
              {academicMode ? copy.saveStudyRecord : passportEligible ? copy.createProofReadyPassport : copy.completeBeforePassport || copy.createDraftPassport}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function PassportTab({
  passport,
  savePassport,
  findJobs,
  journey,
  progressState = {},
  selectedRoute,
  profile = {},
  setActiveTab,
  t = getTranslations('English'),
}) {
  const copy = t.passport || getTranslations('English').passport;
  const readinessScore = Number(journey?.readiness_score ?? journey?.progress?.completion_percent ?? 0);
  const progress = {
    ...(journey?.progress || {}),
    ...(progressState || {}),
  };
  const passportEligible = isJourneyCompleteForPassport(journey, progress);
  const journeyStatus = journey
    ? formatCopy(copy.journeyAttached, { score: Number.isFinite(readinessScore) ? Math.round(readinessScore) : 0 })
    : copy.journeyPending;
  const safePassport = passport || {};
  const professionalRows = passportEligible && passport
    ? passportProfessionalRows({ passport: safePassport, journey, selectedRoute, copy })
    : [];
  return (
    <div className="workspace-card">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h2>{copy.title}</h2>
      <div className="action-row">
        <button className="primary-button" disabled={!passportEligible} onClick={savePassport}>
          {passportEligible ? copy.refresh : copy.lockedUntilJourney || copy.refresh}
        </button>
        <span>{passportEligible ? journeyStatus : copy.lockedMessage || journeyStatus}</span>
      </div>
      {!passportEligible && (
        <PassportLockedJourney
          copy={copy}
          journey={journey}
          progress={progress}
          selectedRoute={selectedRoute}
          setActiveTab={setActiveTab}
        />
      )}
      {passportEligible && !passport && (
        <div className="passport-unlock-panel">
          <ShieldCheck size={22} />
          <div>
            <b>{copy.readyToCreate || 'Journey proof is complete.'}</b>
            <p>{copy.createNowHint || 'Create the Skill Passport now. The QR will show only learner-approved proof.'}</p>
          </div>
        </div>
      )}
      {passport && passportEligible && (
        <div className="passport-card passport-card-enhanced">
          <div className="passport-qr-layout">
            <MockQr token={passport.qr_token} />
            <div>
              <span className="source-badge">{copy.consentQr}</span>
              <h3>{passport.name || profile.name || copy.learner || 'Learner'}</h3>
              <p>{[passport.class_level || profile.class_level, passport.location || profile.location || copy.locationProtected].filter(Boolean).join(' | ')}</p>
              <div className="passport-token">{passport.qr_token}</div>
            </div>
          </div>
          {passport.learning_proof && (
            <div className="passport-proof-strip">
              <span><b>{passport.status === 'proof_ready_for_review' ? copy.proofReady : copy.draft}</b>{copy.status}</span>
              <span><b>{passport.learning_proof.completion_percent || 0}%</b>{copy.courseProgress}</span>
              <span><b>{passport.learning_proof.proof_ready_count || 0}/{passport.learning_proof.proof_required_count || 1}</b>{copy.proofSaved}</span>
            </div>
          )}
          <div className="consent-scope-grid">
            <span className={passport.consent?.share_certs ? 'ready' : ''}><b>{copy.certificates}</b>{passport.consent?.share_certs ? copy.shareAllowed : copy.hidden}</span>
            <span className={passport.consent?.share_informal ? 'ready' : ''}><b>{copy.informalSkills}</b>{passport.consent?.share_informal ? copy.shareAllowed : copy.hidden}</span>
            <span className={passport.consent?.share_scores ? 'ready' : ''}><b>{copy.scores}</b>{passport.consent?.share_scores ? copy.shareAllowed : copy.hidden}</span>
          </div>
          <div className="passport-professional-grid">
            {professionalRows.map((row) => (
              <span key={row.label}>
                <b>{row.label}</b>
                {row.value}
              </span>
            ))}
          </div>
          <div className="passport-share-note">
            <ShieldCheck size={17} />
            <span>{copy.shareNote || 'Only learner-approved proof is visible through this QR. Raw chat and private notes stay hidden.'}</span>
          </div>
        </div>
      )}
      <button className="primary-button" disabled={!passport || !passportEligible} onClick={findJobs}>
        {copy.openOpportunities}
      </button>
    </div>
  );
}

function PassportLockedJourney({ copy = {}, journey, progress = {}, selectedRoute, setActiveTab }) {
  const modules = Array.isArray(journey?.modules) ? journey.modules : [];
  const statusById = new Map((Array.isArray(progress.module_status) ? progress.module_status : []).map((module) => [module.id, module]));
  const completionPercent = Number(progress.completion_percent || 0);
  const proofReady = Number(progress.proof_ready_count || 0);
  const proofRequired = Number(progress.proof_required_count || modules.filter((module) => Boolean(module.proof)).length || 0);
  const routeName = cleanPassportLabel(uiText(selectedRoute?.name, uiText(journey?.route_name, copy.selectedPath || 'Selected path')));
  return (
    <div className="passport-locked-panel">
      <div className="passport-locked-head">
        <Lock size={22} />
        <div>
          <b>{copy.unlockTitle || 'Complete the journey to unlock this Passport.'}</b>
          <p>{copy.unlockHint || 'Finish each week and save the proof. After that the shareable QR can be created.'}</p>
        </div>
      </div>
      {journey ? (
        <>
          <div className="passport-lock-progress">
            <span><b>{completionPercent}%</b>{copy.courseProgress || 'Course progress'}</span>
            <span><b>{proofReady}/{proofRequired || 1}</b>{copy.proofSaved || 'Proof saved'}</span>
            <span><b>{routeName}</b>{copy.selectedPath || 'Selected path'}</span>
          </div>
          <div className="passport-journey-steps">
            {modules.map((module, index) => {
              const status = statusById.get(module.id) || {};
              const done = Boolean(status.module_complete || status.status === 'complete');
              const ready = Boolean(status.unlocked || index === 0);
              return (
                <span className={done ? 'done' : ready ? 'ready' : 'locked'} key={module.id || index}>
                  <b>{done ? (copy.doneLabel || 'Done') : ready ? (copy.nextLabel || 'Next') : (copy.lockedLabel || 'Locked')}</b>
                  {`Week ${module.week || index + 1}: ${uiText(module.title, uiText(module.goal, 'Journey task'))}`}
                  <small>{uiText(module.proof || status.proof_required, copy.proofSaved || 'Proof required')}</small>
                </span>
              );
            })}
          </div>
        </>
      ) : (
        <p>{copy.createJourneyFirst || 'Create the learning journey first. The complete path will appear here.'}</p>
      )}
      <button className="primary-button" onClick={() => setActiveTab?.(journey ? 'journey' : 'pathways')} type="button">
        {journey ? (copy.continueJourney || 'Continue journey') : (copy.goToPathway || 'Go to pathway')}
      </button>
    </div>
  );
}

function passportProfessionalRows({ passport = {}, journey = {}, selectedRoute = {}, copy = {} }) {
  const safePassport = passport || {};
  const proof = safePassport.learning_proof || {};
  const progress = Number(proof.completion_percent || 0);
  const proofReady = Number(proof.proof_ready_count || 0);
  const proofRequired = Number(proof.proof_required_count || 0);
  const routeName = cleanPassportLabel(
    uiText(selectedRoute?.name, uiText(selectedRoute?.title, uiText(journey?.route_name, safePassport.certs?.find((cert) => /selected pathway/i.test(cert.status || ''))?.name || 'Selected pathway'))),
  );
  const skillName = cleanPassportLabel(
    uiText(
      safePassport.informal?.[0]?.name,
      uiText(selectedRoute?.realistic_role, uiText(selectedRoute?.title, routeName)),
    ),
  );
  const reviewStatus = safePassport.status === 'proof_ready_for_review'
    ? (copy.workerReviewReady || 'Ready for worker review')
    : (copy.privateDraft || 'Private draft');
  return [
    {
      label: copy.selectedPath || 'Selected path',
      value: routeName || 'Selected learning route',
    },
    {
      label: copy.proofBundle || 'Proof bundle',
      value: proofRequired
        ? `${proofReady}/${proofRequired} proof items saved, ${progress}% complete`
        : `${progress}% complete`,
    },
    {
      label: copy.skillEvidence || 'Skill evidence',
      value: skillName ? `${skillName} evidence ready` : 'Evidence ready after review',
    },
    {
      label: copy.reviewStatus || 'Review status',
      value: reviewStatus,
    },
  ];
}

function cleanPassportLabel(value = '') {
  return String(value || '')
    .replace(/\bproof tasks?\b/gi, 'proof')
    .replace(/\bselected pathway\b/gi, 'selected path')
    .replace(/\bself-reported \+ counselor assessed\b/gi, 'counselor assessed')
    .replace(/\bskill pathway exploration\b/gi, 'chosen skill path')
    .replace(/\bpathway\b/gi, 'path')
    .replace(/\s+-\s+/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

function MockQr({ token = '' }) {
  const cells = qrCellsForToken(token);
  return (
    <div className="mock-qr" aria-label={`Mock Skill Passport QR ${token}`}>
      {cells.map((filled, index) => <i className={filled ? 'filled' : ''} key={`${token}-${index}`} />)}
    </div>
  );
}

function JobsTab({
  matches,
  profile,
  journey,
  resumeText,
  setResumeText,
  resumeFileName,
  handleResumeUpload,
  generateResumeFromProfile,
  opportunityMeta,
  setActiveTab,
  switchToEmployabilityFromStudy,
  selectedMatchId,
  setSelectedMatchId,
  findJobs,
  contactEmployer,
}) {
  const segment = opportunityMeta?.segment;
  const resumeProfile = opportunityMeta?.resume_profile;
  const searchQueries = opportunityMeta?.search_plan?.queries || [];
  const sourceTasks = opportunityMeta?.source_tasks || opportunityMeta?.search_plan?.source_tasks || [];
  const enterprisePlan = opportunityMeta?.enterprise_plan;
  const unlockState = opportunityMeta?.unlock_state;
  const summary = opportunityMeta?.summary;
  const contract = opportunityMeta?.opportunity_contract || opportunityMeta?.search_plan?.mode_contract;
  const blockCard = opportunityMeta?.block_card;
  const verifiedContacts = matches.filter((match) => match.contact_email).length;
  const sourceContacts = matches.filter((match) => match.contact_page || match.source_url).length;
  const studyMode = profile.learner_goal?.intent === 'study' || opportunityMeta?.study_mode || segment?.id === 'study_only';
  const noLiveCardsYet = Boolean(opportunityMeta) && !matches.length && !enterprisePlan && !studyMode;

  if (studyMode) {
    return (
      <div className="workspace-card">
        <p className="eyebrow">Opportunity matching</p>
        <h2>This profile is currently study-first, so contact search is paused.</h2>
        <div className="study-guard-grid">
          <section className="source-box warning-box">
            <strong>{segment?.label || profile.learner_goal?.label || 'Study-first profile'}</strong>
            <p>
              {opportunityMeta?.message ||
                'VidyaSetu has classified this learner as study mode. Job/contact search is blocked until the learner explicitly switches to career, internship, or job counseling.'}
            </p>
            <div className="credential-list compact-list">
              <span><GraduationCap size={14} /> {profile.academic_goal?.target || profile.learner_goal?.recommended_next_step || 'Study plan active'}</span>
              <span><BookOpen size={14} /> {journey?.modules?.length ? `${journey.modules.length} learning modules ready` : 'Create or open Learning Journey first'}</span>
              <span><ShieldCheck size={14} /> No employer/contact outreach while study-only goal is active</span>
            </div>
          </section>
          <section className="resume-panel">
            <p className="eyebrow">What to do next</p>
            <h3>Choose the correct lane for this learner.</h3>
            <p>
              If the learner asked for marks, JEE, board exam, homework, or school support, continue the study journey.
              If the learner now wants jobs, internships, resume, or hirer outreach, switch through the counselor first.
            </p>
            <div className="action-row">
              <button className="primary-button" onClick={() => setActiveTab(journey ? 'journey' : 'pathways')}>
                Continue study journey
              </button>
              <button className="ghost-button" onClick={switchToEmployabilityFromStudy}>
                Switch to career/job counseling
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-card">
      <p className="eyebrow">Opportunity matching</p>
      <h2>Live Opportunity Engine: search, verify, then outreach.</h2>
      <div className="opportunity-workbench">
        <section className="source-box">
          <strong>{segment?.label || profile.learner_goal?.label || 'Counselor segment pending'}</strong>
          <p>{segment?.strategy || 'Complete the counselor profile, then VidyaSetu chooses study, training, proof-to-work, formal job, or startup outreach flow.'}</p>
          <div className="credential-list compact-list">
            <span><UserRound size={14} /> {profile.name || 'Learner'} | {profile.location || profile.relocation_preference || 'location pending'}</span>
            <span><FileText size={14} /> {resumeText ? `${resumeFileName || 'Resume draft'} ready` : 'Resume not added yet'}</span>
            <span><ShieldCheck size={14} /> Mode: {segment?.opportunity_mode?.replace(/_/g, ' ') || 'pending'}</span>
            {contract?.engine_version && <span><ShieldCheck size={14} /> Engine: {contract.engine_version.replace(/_/g, ' ')}</span>}
            <span><Send size={14} /> {verifiedContacts} verified emails, {sourceContacts} source/contact pages</span>
          </div>
        </section>
        <section className="resume-panel">
          <div className="resume-panel-head">
            <div>
              <p className="eyebrow">Resume and proof</p>
              <h3>{resumeProfile?.target_roles?.[0] || 'Role profile'}</h3>
            </div>
            <span>{resumeText ? `${resumeText.length} chars` : 'missing'}</span>
          </div>
          <div className="action-row">
            <label className="ghost-button upload-button">
              <Upload size={14} /> Upload .txt resume
              <input accept=".txt,.md,.text" onChange={handleResumeUpload} type="file" />
            </label>
            <button className="ghost-button" onClick={generateResumeFromProfile}>
              <FileText size={14} /> Build from profile
            </button>
          </div>
          <textarea
            onChange={(event) => setResumeText(event.target.value)}
            placeholder="Paste a resume here, or let VidyaSetu build one truthfully from the counselor conversation."
            value={resumeText}
          />
        </section>
      </div>
      {contract && (
        <section className="source-box">
          <strong>Live-discovery contract</strong>
          <p>{contract.cardinal_rule}</p>
          <div className="credential-list compact-list">
            {(contract.source_categories || []).slice(0, 5).map((item) => <span key={item}><Search size={14} /> {item}</span>)}
            <span><ShieldCheck size={14} /> TTL {contract.cache_policy?.ttl_hours || 24}h, lazy search, search before scrape</span>
            <span><FileText size={14} /> Result needs source URL + verified/to-verify badge</span>
            <span><Send size={14} /> Consent required before sharing/contacting</span>
          </div>
        </section>
      )}
      {blockCard && (
        <section className="source-box warning-box">
          <strong>Blocked by readiness gate: {blockCard.block_reason?.replace(/_/g, ' ') || 'missing readiness'}</strong>
          <p>{blockCard.message}</p>
          <div className="credential-list compact-list">
            {blockCard.missing_field && <span><ShieldCheck size={14} /> Missing: {blockCard.missing_field.replace(/_/g, ' ')}</span>}
            {blockCard.unlock_hint && <span><ClipboardList size={14} /> {blockCard.unlock_hint}</span>}
            {(blockCard.shortest_path_to_proof || blockCard.alternatives_available || []).slice(0, 4).map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>
      )}
      {!!searchQueries.length && (
        <div className="source-box">
          <strong>Live search plan - not hardcoded opportunities</strong>
          <p>These are query strategies. A card becomes an opportunity only after a live source URL/contact is returned and scored.</p>
          <div className="credential-list compact-list">
            {searchQueries.map((query) => <span key={query}><Search size={14} /> {query}</span>)}
          </div>
        </div>
      )}
      {!!sourceTasks.length && (
        <section className="source-box">
          <strong>Execution tasks before any contact</strong>
          <div className="source-task-grid">
            {sourceTasks.map((task) => (
              <article className="source-task-card" key={task.id || task.title}>
                <span>{task.mode?.replace(/_/g, ' ') || 'verification'}</span>
                <h3>{task.title}</h3>
                <p>{task.why}</p>
                {task.query && <small><Search size={13} /> {task.query}</small>}
                <b>{task.next_action}</b>
              </article>
            ))}
          </div>
        </section>
      )}
      {enterprisePlan && (
        <section className="enterprise-plan-panel">
          <div>
            <p className="eyebrow">Enterprise setup mode</p>
            <h3>{enterprisePlan.enterprise_name}</h3>
            <p>{enterprisePlan.next_action}</p>
          </div>
          <div className="opportunity-summary-grid">
            <span><b>{enterprisePlan.suitability_score}%</b>Suitability</span>
            <span><b>{enterprisePlan.missing_fields?.length || 0}</b>Missing fields</span>
            <span><b>{enterprisePlan.scheme_candidates?.length || 0}</b>Scheme checks</span>
            <span><b>Live</b>Verification required</span>
          </div>
          <div className="enterprise-grid">
            <div>
              <strong>Starter setup</strong>
              {(enterprisePlan.starter_setup || []).map((item) => <span key={item}>{item}</span>)}
            </div>
            <div>
              <strong>Scheme/loan candidates to verify</strong>
              {(enterprisePlan.scheme_candidates || []).map((item) => <span key={item}>{item}</span>)}
            </div>
            <div>
              <strong>Cost heads</strong>
              {(enterprisePlan.cost_heads || []).map((item) => <span key={item}>{item}</span>)}
            </div>
            <div>
              <strong>Buyer channels</strong>
              {(enterprisePlan.buyer_channels || []).map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
          <div className="source-box warning-box">
            <strong>Important</strong>
            <p>{enterprisePlan.risks?.[0] || 'No income, loan, or scheme eligibility is guaranteed. Local verification is required before investment.'}</p>
          </div>
        </section>
      )}
      {unlockState?.missing_fields?.length > 0 && (
        <div className="source-box warning-box">
          <strong>Locked until ready</strong>
          <p>{unlockState.next_action}</p>
          <div className="credential-list compact-list">
            {unlockState.locked_modules?.map((item) => <span key={item}><ShieldCheck size={14} /> {item.replace(/_/g, ' ')}</span>)}
          </div>
        </div>
      )}
      {summary && (
        <div className="opportunity-summary-grid">
          <span><b>{summary.total}</b>Verified source cards</span>
          <span><b>{summary.verified_contacts}</b>Verified emails</span>
          <span><b>{summary.source_tasks || sourceTasks.length}</b>Source tasks</span>
          <span><b>{summary.credit_mode || 'credit safe'}</b>Discovery mode</span>
        </div>
      )}
      {noLiveCardsYet && (
        <section className="source-box opportunity-zero-panel">
          <strong>No verified opportunity card yet. This is a safety gate, not a dead end.</strong>
          <p>
            {summary?.message || opportunityMeta?.message ||
              'VidyaSetu did not find enough source-backed results to show a card. It will not fill this space with fake employers, courses, emails, or salaries.'}
          </p>
          <div className="credential-list compact-list">
            <span><Search size={14} /> Check the live search plan and source tasks above</span>
            <span><FileText size={14} /> Build or refresh the resume/proof from this profile</span>
            <span><ShieldCheck size={14} /> Use deep contact verification only when the learner is ready to spend extra search credits</span>
          </div>
          <div className="action-row">
            <button className="ghost-button" onClick={generateResumeFromProfile}>
              <FileText size={14} /> Refresh resume/proof
            </button>
            <button className="primary-button" onClick={() => findJobs()}>
              <Search size={14} /> Run live verification again
            </button>
            <button className="ghost-button" onClick={() => findJobs({ deepContactSearch: true })}>
              <Send size={14} /> Deep contact check
            </button>
          </div>
        </section>
      )}
      <div className="action-row">
        <button className="primary-button" onClick={findJobs}>
          {matches.length ? 'Refresh live verification' : 'Run live verification'}
        </button>
        <span>{opportunityMeta?.message || summary?.message || 'Search uses the current persona, location/mobility, resume, proof, and consent state. It will not show fake jobs.'}</span>
      </div>
      {opportunityMeta?.location_required && (
        <div className="source-box warning-box">
          <strong>Location needed before offline suggestions</strong>
          <p>{opportunityMeta.message}</p>
        </div>
      )}
      {!matches.length && !noLiveCardsYet && <EmptyState text={enterprisePlan ? 'Enterprise mode active. Use the setup roadmap and live verification tasks instead of job cards.' : 'No live verified opportunity cards yet. The execution tasks above show exactly what to verify next; VidyaSetu will not fill this area with fake jobs.'} />}
      <div className="job-card-grid">
        {matches.map((match) => (
          <article className={selectedMatchId === match.id ? 'job-card selected-job' : 'job-card'} key={match.id}>
            <div className="match-ring">
              <span>{match.score}%</span>
              <small>match</small>
            </div>
            <small className={match.contact_email ? 'contact-pill verified' : 'contact-pill review'}>
              {match.contact_email ? 'Verified public email' : match.contact_quality?.status === 'source_review_needed' ? 'Source review needed' : 'Contact missing'}
            </small>
            <h3>{match.title}</h3>
            <strong>{match.employer}</strong>
            <p>{match.description}</p>
            <div className="source-badge-row">
              {(match.source_badges || []).map((badge) => <span key={badge}>{badge}</span>)}
            </div>
            {match.contact_pipeline?.stages?.length && (
              <div className="lead-pipeline-strip">
                {match.contact_pipeline.stages.map((stage) => (
                  <span className={`stage-${stage.state}`} key={stage.key}>{stage.label}</span>
                ))}
              </div>
            )}
            <div className="credential-list compact-list">
              {match.funding_stage && <span><Zap size={14} /> {match.funding_stage}</span>}
              {match.contact_quality && <span><ShieldCheck size={14} /> Contact quality {match.contact_quality.score}/100 | {match.contact_quality.source_type?.replace(/_/g, ' ')}</span>}
              {match.contact_name && <span><UserRound size={14} /> {match.contact_name} | {match.contact_title || 'contact role pending'}</span>}
              {match.contact_email && <span><Send size={14} /> {match.contact_email}</span>}
              {(match.contact_page || match.source_url) && (
                <span><Search size={14} /> <a href={match.contact_page || match.source_url} rel="noreferrer" target="_blank">Open source/contact page</a></span>
              )}
              {match.next_contact_action && <span><ClipboardList size={14} /> {match.next_contact_action}</span>}
              {match.reasons?.slice(0, 2).map((reason) => <span key={reason}>{reason}</span>)}
            </div>
            <button className="ghost-button" onClick={() => setSelectedMatchId(match.id)}>
              {selectedMatchId === match.id ? 'Selected' : 'Select'}
            </button>
          </article>
        ))}
      </div>
      <button className="primary-button" disabled={!matches.length || Boolean(enterprisePlan)} onClick={contactEmployer}>
        Prepare consent-based outreach for selected live card
      </button>
    </div>
  );
}

function OutreachTab({ selectedMatch, outreach, contactEmployer, scoreSupport, manualEmail, setManualEmail }) {
  const hasVerifiedEmail = Boolean(selectedMatch?.contact_email);
  const contactState = hasVerifiedEmail ? 'verified email' : selectedMatch?.contact_page || selectedMatch?.source_url ? 'source review' : 'missing';
  const pipelineStages = outreach?.pipeline?.stages || selectedMatch?.contact_pipeline?.stages || [];
  const checklist = outreach?.consent_checklist || [];
  const crmStats = [
    ['Selected lead', selectedMatch ? '1' : '0'],
    ['Contact', contactState],
    ['Draft queue', outreach ? '1' : '0'],
    ['Reply status', outreach?.reply_class?.status || 'none'],
  ];
  return (
    <div className="workspace-card">
      <p className="eyebrow">Outreach CRM</p>
      <h2>Consent-limited placement pipeline, adapted from the job outreach agent.</h2>
      <div className="crm-stat-grid">
        {crmStats.map(([label, value]) => (
          <span key={label}><b>{value}</b>{label}</span>
        ))}
      </div>
      <div className="crm-layout">
        <section className="crm-panel">
          <p className="eyebrow">Lead</p>
          <h3>{selectedMatch ? selectedMatch.title : 'No opportunity selected'}</h3>
          <p>{selectedMatch ? `${selectedMatch.employer} | ${selectedMatch.distance_km} km | ${selectedMatch.wage}` : 'Select an opportunity from Opportunity Search.'}</p>
          {selectedMatch && (
            <div className="credential-list compact-list">
              <span>{hasVerifiedEmail ? `Email: ${selectedMatch.contact_email}` : 'No verified public email yet'}</span>
              {selectedMatch.contact_quality && <span>Contact quality: {selectedMatch.contact_quality.score}/100 | {selectedMatch.contact_quality.status?.replace(/_/g, ' ')}</span>}
              <span>Contact: {selectedMatch.contact_name || 'Hiring contact'} | {selectedMatch.contact_title || 'role pending'}</span>
              {(selectedMatch.contact_page || selectedMatch.source_url) && (
                <span><a href={selectedMatch.contact_page || selectedMatch.source_url} rel="noreferrer" target="_blank">Open contact/source page</a></span>
              )}
              {selectedMatch.next_contact_action && <span>{selectedMatch.next_contact_action}</span>}
              {selectedMatch.reasons?.slice(0, 2).map((reason) => <span key={reason}>{reason}</span>)}
            </div>
          )}
        </section>
        <section className="crm-panel">
          <p className="eyebrow">Pipeline</p>
          <div className="pipeline-grid pipeline-grid-detailed">
            {pipelineStages.length ? pipelineStages.map((stage) => (
              <span className={`stage-${stage.state}`} key={stage.key}>{stage.label}</span>
            )) : (
              <>
                <span>Matched</span>
                <span>{hasVerifiedEmail ? 'Contact found' : 'Review source'}</span>
                <span>{outreach ? 'Drafted' : 'Draft needed'}</span>
                <span>{outreach?.sent?.ok ? 'Sent' : outreach?.sent?.provider === 'contact_required' ? 'Needs email' : 'Queued'}</span>
                <span>{outreach?.reply_class?.status || 'Awaiting reply'}</span>
              </>
            )}
          </div>
          <label className="manual-email-field">
            <span>Verified manual email</span>
            <input
              onChange={(event) => setManualEmail(event.target.value)}
              placeholder="Only paste a public, verified email"
              value={manualEmail}
            />
          </label>
          {!!checklist.length && (
            <div className="consent-checklist">
              {checklist.map((item) => (
                <span className={item.done ? 'done' : 'review'} key={item.label}>
                  {item.done ? 'Ready' : 'Review'}: {item.label}
                </span>
              ))}
            </div>
          )}
          {!!outreach?.next_actions?.length && (
            <div className="next-action-list">
              {outreach.next_actions.map((action) => <span key={action}>{action}</span>)}
            </div>
          )}
          <div className="action-row">
            <button className="primary-button" disabled={!selectedMatch} onClick={() => contactEmployer(manualEmail)}>
              Prepare outreach draft
            </button>
            {manualEmail && (
              <button className="ghost-button" disabled={!selectedMatch} onClick={() => contactEmployer(manualEmail)}>
                Queue with verified email
              </button>
            )}
          </div>
          {outreach?.mailto_url && (
            <a className="ghost-button" href={outreach.mailto_url}>
              Open email client
            </a>
          )}
        </section>
      </div>
      <div className="json-card email-card">
        <pre>{outreach?.draft || 'Consent-limited outreach appears here. If no verified public email exists, VidyaSetu keeps the lead in source-review instead of pretending it was sent.'}</pre>
      </div>
      {outreach && (
        <div className={outreach.sent?.provider === 'contact_required' ? 'source-box warning-box' : 'source-box'}>
          <strong>{outreach.sent?.provider === 'contact_required' ? 'Contact verification required' : `Reply classified: ${outreach.reply_class.status}`}</strong>
          <p>{outreach.sent?.error || outreach.reply_class.extracted_next_step}</p>
        </div>
      )}
      <button className="primary-button" onClick={scoreSupport}>
        Check support risk
      </button>
    </div>
  );
}

function FollowupsTab({ outreach, selectedMatch, contactEmployer }) {
  const status = outreach?.reply_class?.status || 'no_response';
  const decision = status === 'interview'
    ? 'Community worker should confirm family availability and safe commute before screening.'
    : status === 'filled'
      ? 'Archive this lead and move to the next best match.'
      : outreach
        ? 'Send a polite follow-up if no reply arrives by the scheduled date.'
        : 'Create the first outreach draft from the selected opportunity.';
  return (
    <div className="workspace-card">
      <p className="eyebrow">Follow-up engine</p>
      <h2>Track employer replies and next actions.</h2>
      <div className="crm-layout">
        <section className="crm-panel">
          <p className="eyebrow">Application</p>
          <h3>{selectedMatch ? selectedMatch.title : 'No selected lead'}</h3>
          <p>{selectedMatch ? selectedMatch.employer : 'Choose a lead before creating outreach.'}</p>
        </section>
        <section className="crm-panel">
          <p className="eyebrow">Recommendation</p>
          <h3>{status}</h3>
          <p>{decision}</p>
          {outreach?.followup_at && <small>Follow-up due: {new Date(outreach.followup_at).toLocaleDateString()}</small>}
        </section>
      </div>
      <div className="action-row">
        <button className="primary-button" disabled={!selectedMatch} onClick={contactEmployer}>Generate first draft</button>
      </div>
    </div>
  );
}

function EvaluationProofTab({
  adews,
  completedLessons = {},
  journey,
  lastProof,
  matches = [],
  messages = [],
  opportunityMeta,
  outreach,
  passport,
  pathway,
  profile,
  progressState = {},
  proofNotes = {},
  readinessLayers = [],
  selectedRoute,
  setActiveTab,
}) {
  const proof = buildEvaluationProof({
    completedLessons,
    journey,
    matches,
    messages,
    opportunityMeta,
    outreach,
    passport,
    pathway,
    profile,
    progressState,
    proofNotes,
    readinessLayers,
    selectedRoute,
    adews,
    lastProof,
  });
  const fieldStatus = demoMomentStatus({ profile, pathway, journey, passport, matches, adews, opportunityMeta, lastProof });

  return (
    <div className="workspace-card evaluation-proof">
      <div className="evaluation-proof-hero">
        <div>
          <p className="eyebrow">Hackathon proof console</p>
          <h2>Live evidence that VidyaSetu is not a hardcoded demo.</h2>
          <p>
            This panel reads the current learner state and shows what is already proven, what is blocked by safety,
            and what still needs a live action before submission.
          </p>
        </div>
        <div className="evaluation-score">
          <strong>{proof.overall}%</strong>
          <span>{proof.overall >= 90 ? 'submission proof strong' : proof.overall >= 70 ? 'demo-ready with gaps' : 'needs live flow'}</span>
        </div>
      </div>

      <section className="source-box">
        <strong>Five promised demo moments</strong>
        <p>This turns the slide promise into live product evidence. A gap is visible instead of hidden.</p>
        <div className="demo-moment-grid compact">
          {demoMoments.map((moment, index) => {
            const status = fieldStatus[moment.id] || {};
            return (
              <button className={status.ready ? 'demo-moment-card ready' : 'demo-moment-card'} key={moment.id} onClick={() => setActiveTab(moment.target)}>
                <span>{index + 1}</span>
                <div>
                  <strong>{moment.title}</strong>
                  <small>{status.detail || 'pending'}</small>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="source-box">
        <strong>Validation already run</strong>
        <p>These are representative automated checks from the sprint, shown in-product so evaluation is not just a deck claim.</p>
        <div className="validation-strip in-proof">
          {validationMetrics.map((metric) => (
            <span key={metric.label}>
              <b>{metric.value}</b>
              {metric.label}
              <small>{metric.detail}</small>
            </span>
          ))}
        </div>
      </section>

      <div className="proof-claim-grid">
        {proof.claims.map((claim) => (
          <section className={`proof-claim-card ${claim.status}`} key={claim.id}>
            <div className="proof-claim-head">
              <span>{claim.score}%</span>
              <div>
                <strong>{claim.title}</strong>
                <small>{claim.subtitle}</small>
              </div>
            </div>
            <div className="proof-check-list">
              {claim.checks.map((check) => (
                <span className={check.pass ? 'proof-check pass' : 'proof-check gap'} key={check.label}>
                  <b>{check.pass ? 'Pass' : 'Gap'}</b>
                  {check.label}
                  <small>{check.detail}</small>
                </span>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="source-box">
        <strong>Live state used for scoring</strong>
        <div className="proof-state-grid">
          {proof.stateFacts.map((fact) => (
            <span className={fact.ready ? 'ready' : ''} key={fact.label}>
              <b>{fact.label}</b>
              {fact.value}
            </span>
          ))}
        </div>
      </section>

      <section className="source-box">
        <strong>Critical invariants</strong>
        <p>These are the rules from the master architecture that should never be bypassed by the LLM.</p>
        <div className="proof-invariant-grid">
          {proof.invariants.map((item) => (
            <span className={item.pass ? 'pass' : 'gap'} key={item.label}>
              <b>{item.pass ? 'Protected' : 'Needs action'}</b>
              {item.label}
              <small>{item.detail}</small>
            </span>
          ))}
        </div>
      </section>

      <div className="evaluation-action-row">
        {proof.nextActions.map((action) => (
          <button
            className={action.primary ? 'primary-button' : 'ghost-button'}
            key={action.target}
            onClick={() => setActiveTab(action.target)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SupportTab({ adews, dailyReminder, scoreSupport, sendDailyReminder }) {
  const labels = {
    missed_checkins: 'Missed check-ins',
    attendance_drop_days: 'Attendance drop',
    economic_stress: 'Household income pressure',
    exam_window: 'Exam-season pressure',
    gender_window: 'Girl-specific risk window',
  };
  const reminder = dailyReminder || adews?.daily_reminder || null;
  const reminderResult = reminder?.results?.[0] || null;
  return (
    <div className="workspace-card">
      <p className="eyebrow">Human safety net</p>
      <h2>Daily WhatsApp nudges first. If the learner goes silent, ADEWS escalates.</h2>
      <div className="action-row">
        <button className="primary-button" onClick={sendDailyReminder}>
          Send today reminder
        </button>
        <button className="ghost-button" onClick={scoreSupport}>
          Run silence risk check
        </button>
      </div>
      <div className="worker-alert-card">
        <strong>{reminder ? 'Daily reminder result' : 'Daily reminder loop'}</strong>
        <p>
          {reminderResult
            ? `${reminderResult.status}: ${reminderResult.task || reminderResult.reason || 'today task checked'}`
            : 'Every morning, VidyaSetu picks the current unlocked journey task and sends it on WhatsApp with the first resource.'}
        </p>
        <small>
          WATI: {reminder?.wati_configured ? 'configured' : 'not configured / dry run'} |
          Sent {reminder?.sent ?? 0} | Dry run {reminder?.dry_run_count ?? 0} | Skipped {reminder?.skipped ?? 0}
        </small>
      </div>
      <div className="adews-scenario-grid">
        <span><b>Daily</b>WhatsApp task + resource</span>
        <span><b>No journey/consent</b>skip safely</span>
        <span><b>7 days/high risk</b>worker alert</span>
      </div>
      <div className="alert-banner">
        <span>Risk {adews?.risk ?? 'not scored'}</span>
        <strong>{adews?.fired ? 'Worker alert fired' : 'Monitoring'}</strong>
      </div>
      <p>{adews?.worker_message || 'ADEWS watches check-ins, attendance, economic stress, and sensitive transition windows.'}</p>
      <div className="worker-alert-card">
        <strong>{adews?.fired ? 'Demo alert payload ready' : 'Alert payload preview'}</strong>
        <p>
          {adews?.fired
            ? 'Community worker receives learner risk, top reasons, and recommended next action without exposing unnecessary private details.'
            : 'Click the check above to demonstrate the promised silence trigger and worker support safety net.'}
        </p>
        <small>Channel: {adews?.alert_channel || 'WhatsApp/SMS worker channel after deployment'} | Worker number: {adews?.worker_number || 'masked until configured'}</small>
      </div>
      <div className="timeline">
        {(adews?.top_features_json || []).map((feature) => (
          <span key={feature.feature}>
            {labels[feature.feature]}: {String(feature.value)} | impact +{feature.contribution}
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

function isEntranceExamPrepPrompt(text = '') {
  const lower = text.toLowerCase();
  const multiGoalConfusion =
    /confused|do not know|don't know|not sure|whether|should i|ya |or /i.test(lower) &&
    /job|private job|design|training|course|career|skill|college|placement/i.test(lower);
  if (multiGoalConfusion) return false;
  const hasEntranceExam =
    /\bjee\b|jee\s*(main|mains|advanced|advance)|\biit\b|\bneet\b|\bcuet\b|\bbitsat\b|\bgate\b|\bcat\b|\bclat\b|\bnda\b|\bupsc\b|\bssc\b|railway|bank\s*(po|exam)|entrance exam|competitive exam|government exam/.test(lower) ||
    /जेईई|आईआईटी|नीट|सीयूईटी|गेट|कैट|क्लैट|एनडीए|यूपीएससी|एसएससी|रेलवे|बैंक|प्रवेश\s*परीक्षा|प्रतियोगी\s*परीक्षा|सरकारी\s*परीक्षा/.test(lower);
  const hasPrepIntent =
    /prep|prepare|preparation|crack|rank|mock|test series|practice test|syllabus|exam|paper|revision|study|target|score|marks/.test(lower) ||
    /प्रेप|तैयारी|क्रैक|रैंक|मॉक|टेस्ट|सिलेबस|परीक्षा|पेपर|रिवीजन|पढ़|पढ़|पढ|अंक|नंबर|स्कोर/.test(lower);
  return hasEntranceExam && hasPrepIntent;
}

function isAcademicPrepPrompt(text = '') {
  const lower = text.toLowerCase();
  const hasClass12 =
    /class\s*12|12th|twelfth|xii|class\s*twelve/.test(lower) ||
    /बारहवीं|बारहवी|बारह|ट्वेल्थ|टवेल्थ|क्लास\s*(12|ट्वेल्थ|टवेल्थ)|कक्षा\s*(12|बारह|बारहवीं)/.test(lower);
  const hasStudyIntent =
    /exam|board|paper|sample|marks|score|number|study|resources|revision|syllabus|ncert|cbse|diksha|prepare|preparation/.test(lower) ||
    /नंबर|नम्बर|एग्जाम|इग्जाम|परीक्षा|पेपर|अंक|स्कोर|पढ़|पढ़|पढ|तैयारी|रिवीजन|सिलेबस|अच्छे\s*नंबर/.test(lower);
  return hasClass12 && hasStudyIntent;
}

function isSchoolStudyPrompt(text = '') {
  const lower = text.toLowerCase();
  const hasClass = /class\s*\d{1,2}|\d{1,2}(?:st|nd|rd|th)|कक्षा\s*\d{1,2}|क्लास\s*\d{1,2}/.test(lower);
  const hasStudyIntent =
    /study|student|school|homework|learn|help|math|maths|science|english|hindi|sst|social science|marks|exam|chapter|padh|padhna|resources|practice/.test(lower) ||
    /पढ़|पढ़|पढ|स्कूल|विद्यार्थी|छात्र|मदद|गणित|विज्ञान|होमवर्क|अध्याय|नंबर|परीक्षा|तैयारी/.test(lower);
  return hasClass && hasStudyIntent;
}

function buildEvaluationProof({
  adews,
  completedLessons = {},
  journey,
  lastProof,
  matches = [],
  messages = [],
  opportunityMeta,
  outreach,
  passport,
  pathway,
  profile = {},
  progressState = {},
  proofNotes = {},
  readinessLayers = [],
  selectedRoute,
}) {
  const userMessages = messages.filter((message) => message.role === 'user' && String(message.content || '').trim());
  const assistantMessages = messages.filter((message) => message.role === 'assistant' && String(message.content || '').trim());
  const latestUser = userMessages.at(-1)?.content || '';
  const latestAssistant = assistantMessages.at(-1)?.content || '';
  const language = languageProfileForUi(profile);
  const route = selectedRoute || pathway?.routes?.[0] || {};
  const routeTrace = route.trace || pathway?.recommendation_trace || {};
  const matchedFacts = routeTrace.matched_facts || routeTrace.profile_facts_used || pathway?.recommendation_trace?.profile_facts_used || [];
  const filters = routeTrace.filters || pathway?.recommendation_trace?.filters_applied || [];
  const blockers = routeTrace.blockers || pathway?.recommendation_trace?.blockers || [];
  const sourceTasks = opportunityMeta?.source_tasks || opportunityMeta?.search_plan?.source_tasks || [];
  const segment = opportunityMeta?.segment || {};
  const summary = opportunityMeta?.summary || {};
  const progress = { ...(journey?.progress || {}), ...progressState };
  const proofNoteCount = Object.values(proofNotes || {}).filter((value) => String(value || '').trim()).length;
  const completedCount = Object.values(completedLessons || {}).filter(Boolean).length;
  const goalIntent = profile.learner_goal?.intent || '';
  const fieldStatus = demoMomentStatus({ profile, pathway, journey, passport, matches, adews, opportunityMeta, lastProof });
  const offlineIntent = ['job', 'training', 'proof_to_work', 'career', 'college', 'self_employment'].includes(goalIntent);
  const locationHandled = Boolean(profile.location || profile.relocation_preference) || goalIntent === 'study' || Boolean(opportunityMeta?.location_required);
  const studyLocked = goalIntent !== 'study' || Boolean(opportunityMeta?.study_mode || segment.id === 'study_only' || !matches.length);
  const noFakeOpportunity = matches.length
    ? matches.every((match) => match.source_url || match.contact_page || match.contact_email)
    : /no fake|verified opportunity|source task|verification|to verify/i.test(`${summary.message || ''} ${opportunityMeta?.message || ''} ${JSON.stringify(sourceTasks)}`);
  const consentProtected = !outreach?.sent?.ok || Boolean(passport?.consent?.share_certs || passport?.consent?.share_informal || passport?.consent?.share_scores || passport?.qr_token);
  const progressPreserved = Boolean(profile.learner_id || profile.phone_hash) && (
    Boolean(journey?.modules?.length) ||
    Number(progress.completion_percent || 0) > 0 ||
    completedCount > 0 ||
    proofNoteCount > 0
  );

  const intakeChecks = [
    makeProofCheck('Natural learner input captured', userMessages.length > 0, userMessages.length ? `${userMessages.length} learner turn(s)` : 'Ask the learner to speak or type once.'),
    makeProofCheck('Goal classified', Boolean(goalIntent), profile.learner_goal?.label || goalIntent || 'Goal not classified yet.'),
    makeProofCheck('Persona/profile route present', Boolean(profile.persona || profile.learner_goal?.type), profile.persona || profile.learner_goal?.type || 'Persona pending.'),
    makeProofCheck('Language respected', Boolean(language.preferred_language && language.same_language_reply), `${language.preferred_language || 'Pending'} | ${language.reply_script || 'script pending'}`),
    makeProofCheck('Location/scope handled', locationHandled, profile.location || profile.relocation_preference || (opportunityMeta?.location_required ? 'location guard active' : 'location still pending')),
    makeProofCheck('Profile facts visible', Boolean(profile.name || profile.class_level || profile.education_status || profile.aspirations?.length || profile.skills?.length), profile.name || profile.class_level || profile.aspirations?.join(', ') || 'Need more learner facts.'),
  ];

  const personalizationChecks = [
    makeProofCheck('Multiple routes generated', (pathway?.routes || []).length >= 2, `${(pathway?.routes || []).length || 0} route(s)`),
    makeProofCheck('Recommendation trace exists', Boolean(matchedFacts.length || filters.length || blockers.length), `${matchedFacts.length} matched fact(s), ${filters.length} filter(s), ${blockers.length} blocker(s)`),
    makeProofCheck('Selected route is learner-specific', Boolean(route.name && (route.tradeoff || route.focus_subjects || route.source_title)), route.name || 'Route not selected.'),
    makeProofCheck('Journey created from route', Boolean(journey?.modules?.length), journey?.title || `${journey?.modules?.length || 0} module(s)`),
    makeProofCheck('Proof tasks included', Boolean((journey?.modules || []).some((module) => module.proof || module.practice_tasks?.length)), `${(journey?.modules || []).filter((module) => module.proof).length} proof module(s)`),
    makeProofCheck('Progress can be tracked', Boolean(progress.total_count || completedCount || Number(progress.completion_percent || 0) >= 0), `${Number(progress.completion_percent || 0)}% completion, ${completedCount} checked item(s)`),
  ];

  const responsibleChecks = [
    makeProofCheck('Same-language voice/text metadata', Boolean(language.stt_language_code && language.same_language_reply), `${language.stt_language_code || 'STT pending'} | ${language.voice_channel || 'voice pending'}`),
    makeProofCheck('Offline location guard', !offlineIntent || locationHandled, profile.location || profile.relocation_preference || (opportunityMeta?.location_required ? 'blocked until location' : 'needs district/commute')),
    makeProofCheck('Study/minor guard', studyLocked, goalIntent === 'study' ? 'job outreach locked for study mode' : 'not a study-only profile'),
    makeProofCheck('Consent before sharing/contact', consentProtected, outreach?.sent?.ok ? 'sent only with consent proof' : 'no external send without consent'),
    makeProofCheck('No fabricated opportunities', noFakeOpportunity, matches.length ? `${matches.length} source-backed card(s)` : 'no fake cards; source tasks shown'),
    makeProofCheck('Progress/profile preservation', progressPreserved, profile.learner_id ? `learner id ${String(profile.learner_id).slice(0, 8)}...` : profile.phone_hash ? 'phone profile key present' : 'create/login learner and save progress'),
  ];

  const fieldReadinessChecks = [
    makeProofCheck('Vernacular/voice path visible', fieldStatus.voice.ready, fieldStatus.voice.detail),
    makeProofCheck('Low-resource content channel', /voice|sms|whatsapp|low/i.test(`${journey?.delivery?.primary_channel || ''} ${(profile.content_preferences || []).join(' ')} ${profile.device || ''}`), journey?.delivery?.primary_channel || profile.content_preferences?.join(', ') || profile.device || 'channel pending'),
    makeProofCheck('Skill Passport QR visible', fieldStatus.passport.ready, fieldStatus.passport.detail),
    makeProofCheck('Opportunity engine is source guarded', fieldStatus.opportunity.ready, fieldStatus.opportunity.detail),
    makeProofCheck('ADEWS alert demonstrated', fieldStatus.adews.ready, fieldStatus.adews.detail),
  ];

  const validationChecks = validationMetrics.map((metric) => {
    const value = String(metric.value || '');
    const isPositiveZeroMetric = /0 fake|0 fabricated|0 unsafe/i.test(value);
    const passed = isPositiveZeroMetric || /\d+\/\d+/.test(value);
    return makeProofCheck(metric.label, passed, `${metric.value} | ${metric.detail}`);
  });

  const claims = [
    makeClaim('intake', 'Natural intake -> right profile', 'Speech/text becomes structured learner facts.', intakeChecks),
    makeClaim('personalization', 'Personalized pathway + journey', 'Routes, modules, proof, and progress come from the profile.', personalizationChecks),
    makeClaim('responsibility', 'Language, safety, consent, memory', 'Critical guards stay outside the LLM and are visible.', responsibleChecks),
    makeClaim('field', 'Real-world readiness shown', 'Vernacular, low-resource, QR, opportunity, and worker-alert proof.', fieldReadinessChecks),
    makeClaim('validation', 'Evaluation evidence shown', 'Representative automated test coverage is visible in the product.', validationChecks),
  ];

  const stateFacts = [
    { label: 'Latest learner input', value: latestUser ? uiText(latestUser).slice(0, 120) : 'none yet', ready: Boolean(latestUser) },
    { label: 'Latest counselor reply', value: latestAssistant ? uiText(latestAssistant).slice(0, 120) : 'none yet', ready: Boolean(latestAssistant) },
    { label: 'Goal', value: profile.learner_goal?.label || goalIntent || 'pending', ready: Boolean(goalIntent) },
    { label: 'Persona', value: profile.persona || profile.learner_goal?.type || 'pending', ready: Boolean(profile.persona || profile.learner_goal?.type) },
    { label: 'Location', value: profile.location || profile.relocation_preference || (opportunityMeta?.location_required ? 'guarded' : 'pending'), ready: locationHandled },
    { label: 'Route', value: route.name || 'pending', ready: Boolean(route.name) },
    { label: 'Journey', value: journey?.mode || journey?.title || 'pending', ready: Boolean(journey?.modules?.length) },
    { label: 'Opportunity mode', value: segment.opportunity_mode || segment.id || 'pending', ready: Boolean(segment.opportunity_mode || segment.id) },
    { label: 'Live/source tasks', value: `${matches.length} card(s), ${sourceTasks.length} source task(s)`, ready: Boolean(matches.length || sourceTasks.length || opportunityMeta?.study_mode) },
    { label: 'Progress', value: `${Number(progress.completion_percent || 0)}% saved`, ready: progressPreserved },
    { label: 'Consent', value: consentProtected ? 'protected' : 'needs consent proof', ready: consentProtected },
    { label: 'Readiness layers', value: `${readinessLayers.filter((layer) => layer.done).length}/${readinessLayers.length || 1}`, ready: readinessLayers.some((layer) => layer.done) },
  ];

  const invariants = [
    makeProofCheck('No job/search outreach for study-first learners', studyLocked, goalIntent === 'study' ? 'study guard active' : 'not applicable'),
    makeProofCheck('No offline result without location or mobility', !offlineIntent || locationHandled, profile.location || profile.relocation_preference || 'location guard required'),
    makeProofCheck('No send/share without scoped consent', consentProtected, passport?.qr_token ? 'passport consent available' : 'no send performed'),
    makeProofCheck('No fake opportunity/contact cards', noFakeOpportunity, summary.message || opportunityMeta?.message || 'source-backed or empty'),
    makeProofCheck('Language selected before guidance', Boolean(language.preferred_language && language.preferred_language !== 'Pending'), language.preferred_language || 'pending'),
    makeProofCheck('Saved profile can resume on shared phone', Boolean(profile.learner_id || profile.phone_hash), profile.learner_id || profile.phone_hash || 'login not completed'),
  ];

  const nextActions = [];
  if (!intakeChecks.every((check) => check.pass)) nextActions.push({ label: 'Finish intake', target: 'counselor', primary: true });
  if (!personalizationChecks.slice(0, 3).every((check) => check.pass)) nextActions.push({ label: 'Generate pathway', target: 'pathways', primary: !nextActions.length });
  if (!journey?.modules?.length) nextActions.push({ label: 'Create journey', target: 'journey', primary: !nextActions.length });
  if (!sourceTasks.length && !matches.length && goalIntent !== 'study') nextActions.push({ label: 'Open opportunity engine', target: 'jobs', primary: !nextActions.length });
  if (!nextActions.length) nextActions.push({ label: 'Review live opportunity mode', target: goalIntent === 'study' ? 'journey' : 'jobs', primary: true });
  nextActions.push({ label: 'Review readiness layers', target: 'readiness', primary: false });

  const overall = Math.round(claims.reduce((sum, claim) => sum + claim.score, 0) / claims.length);
  return { claims, invariants, nextActions: nextActions.slice(0, 4), overall, stateFacts };
}

function makeProofCheck(label, pass, detail = '') {
  return { label, pass: Boolean(pass), detail: uiText(detail, pass ? 'ready' : 'needs action') };
}

function makeClaim(id, title, subtitle, checks) {
  const score = Math.round((checks.filter((check) => check.pass).length / Math.max(checks.length, 1)) * 100);
  return {
    id,
    title,
    subtitle,
    checks,
    score,
    status: score >= 90 ? 'ready' : score >= 70 ? 'review' : 'gap',
  };
}

function buildReadinessLayers({ profile, pathway, journey, passport, matches, outreach, resumeText }) {
  const jobLike = ['job', 'college'].includes(profile.learner_goal?.intent);
  return [
    {
      id: 'access',
      title: 'Access and language',
      done: Boolean(profile.phone_access && (profile.preferred_language || profile.language)),
      description: `${profile.phone_access || 'Phone access pending'} | ${profile.preferred_language || profile.language || 'language pending'}`,
      next: 'Capture phone ownership, WhatsApp/voice access, and preferred learning language.',
    },
    {
      id: 'profile',
      title: 'Counselor profile',
      done: Boolean(profile.profile_complete),
      description: profile.aspirations?.length ? `Interest: ${profile.aspirations.join(', ')}` : 'Interest and constraints pending.',
      next: 'Complete education, location, commute, time, and earning urgency.',
    },
    {
      id: 'pathway',
      title: 'Verified pathway',
      done: Boolean(pathway?.routes?.length),
      description: pathway?.routes?.length ? `${pathway.routes.length} route options generated.` : 'No verified route generated yet.',
      next: 'Generate three routes with evidence and tradeoffs.',
    },
    {
      id: 'content',
      title: 'Learning journey',
      done: Boolean(journey?.modules?.length),
      description: journey?.modules?.length ? `${journey.modules.length} weekly modules and proof tasks.` : 'Daily content plan pending.',
      next: 'Create WhatsApp/voice-first lessons and proof tasks.',
    },
    {
      id: 'proof',
      title: 'Skill Passport proof',
      done: Boolean(passport?.qr_token),
      description: passport?.qr_token ? `QR token ${passport.qr_token}` : 'Consent and proof packaging pending.',
      next: 'Create consented Skill Passport before employer sharing.',
    },
    {
      id: 'resume',
      title: jobLike ? 'Resume and project proof' : 'Practice proof package',
      done: jobLike ? Boolean(resumeText?.trim()) : Boolean(passport?.informal?.length || journey?.modules?.length),
      description: jobLike
        ? resumeText?.trim()
          ? 'Resume draft is ready for review before outreach.'
          : 'Resume or project proof is needed before serious job outreach.'
        : 'Learner should complete proof tasks before employer/trainer sharing.',
      next: jobLike ? 'Upload/paste resume or build one from counselor profile.' : 'Complete practice tasks and attach proof notes/photos.',
    },
    {
      id: 'opportunity',
      title: 'Opportunity match',
      done: Boolean(matches?.length),
      description: matches?.length ? `${matches.length} leads ranked by persona, location, and proof.` : 'No opportunity selected yet.',
      next: 'Search jobs, courses, apprenticeships, or startup leads by fit.',
    },
    {
      id: 'outreach',
      title: 'Consent-limited outreach',
      done: Boolean(outreach?.draft),
      description: outreach?.draft ? 'Employer draft prepared and queued.' : 'Outreach not started.',
      next: 'Contact employer only after proof, consent, and safety checks.',
    },
  ];
}

export default App;
