const base = process.env.SLICE4_BASE_URL || process.env.TEST_BASE_URL || 'https://vidyasetu-mvp.vercel.app';

async function post(url, body) {
  const response = await fetch(base + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`${url} ${response.status}: ${data.error || response.statusText}`);
  return data;
}

const personas = [
  {
    id: 'english_college_job',
    expectedLanguage: 'English',
    expectedScript: 'Latin',
    text:
      'My name is Asha. I am a BCom graduate in Lucknow. I want an accounts assistant job, I know Tally basics, I have a resume, I can travel 12 km safely, and I can practice 2 hours daily.',
  },
  {
    id: 'hinglish_shared_phone',
    expectedLanguage: 'Hinglish',
    expectedScript: 'Latin',
    text:
      'Mera naam Kavita hai. Main Class 12 ke baad typing aur data entry job dekh rahi hoon. Main Hindi English mix mein baat karti hoon, shared phone hai, Varanasi se hoon, 10 km travel safe hai.',
  },
  {
    id: 'hindi_school_study',
    expectedLanguage: 'Hindi',
    expectedScript: 'Devanagari',
    text:
      'मेरा नाम साक्षी है। मैं क्लास 12 में हूँ और मुझे फिजिक्स में अच्छे नंबर चाहिए। मेरे पास Android phone है और मैं रोज 3 घंटे पढ़ सकती हूँ।',
  },
  {
    id: 'odia_school_study',
    expectedLanguage: 'Odia',
    expectedScript: 'Odia',
    text:
      'ମୋ ନାମ ପ୍ରକାଶ। ମୁଁ କ୍ଲାସ 10 ରେ ପଢୁଛି, ବଲାଙ୍ଗିର ଓଡିଶାରୁ। ମୋତେ ଗଣିତ ଏବଂ ବିଜ୍ଞାନରେ ସହାୟତା ଦରକାର। shared phone ଅଛି, ଦିନକୁ 1 ଘଣ୍ଟା ପଢିପାରିବି।',
  },
  {
    id: 'bengali_training',
    expectedLanguage: 'Bengali',
    expectedScript: 'Bengali',
    text:
      'আমার নাম মিনা। আমি নদিয়া পশ্চিমবঙ্গ থেকে। আমি সেলাই training নিতে চাই, shared phone আছে, 8 km travel করতে পারি, প্রতিদিন 1 hour সময় দিতে পারি।',
  },
  {
    id: 'marathi_placement',
    expectedLanguage: 'Marathi',
    expectedScript: 'Devanagari',
    text:
      'माझे नाव नेहा आहे. मी पुण्याजवळ BSc final year मध्ये आहे. मला data analyst internship किंवा job पाहिजे. माझ्याकडे resume draft आहे, Python basic येते, रोज 2 तास देऊ शकते आणि मराठी मध्ये guidance पाहिजे.',
  },
  {
    id: 'tamil_vocational',
    expectedLanguage: 'Tamil',
    expectedScript: 'Tamil',
    text:
      'என் பெயர் லதா. நான் மதுரை அருகில் இருக்கிறேன். எனக்கு nursing assistant training வேண்டும், Android phone உள்ளது, தினமும் 1 hour கற்க முடியும், 15 km travel safe.',
  },
];

const scriptPatterns = {
  Devanagari: /[\u0900-\u097F]/,
  Odia: /[\u0B00-\u0B7F]/,
  Bengali: /[\u0980-\u09FF]/,
  Tamil: /[\u0B80-\u0BFF]/,
  Latin: /^[\u0000-\u024F\s.,!?'"():;+\-/%0-9A-Za-z]+$/,
};

const indicScriptRanges = {
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

function assertCheck(checks, name, pass, detail = '') {
  checks.push({ name, pass: Boolean(pass), detail });
}

function phoneFor(index) {
  const suffix = `${Date.now()}${index}`.slice(-8);
  return `94${suffix}`.slice(0, 10);
}

function expectedLanguageSeen(actual = '', expected = '') {
  const normalized = String(actual || '').toLowerCase();
  if (expected === 'Hinglish') return /hinglish|hindi \+ english/.test(normalized);
  return normalized.includes(expected.toLowerCase());
}

function hasExpectedScript(text = '', script = '') {
  const pattern = scriptPatterns[script];
  if (!pattern) return true;
  const value = String(text || '').replace(/[\u0964\u0965]/g, '');
  if (!pattern.test(value)) return false;
  if (script === 'Latin') return !/[\u0900-\u0D7F]/.test(value);
  const foreignRanges = Object.entries(indicScriptRanges)
    .filter(([name]) => name !== script)
    .map(([, range]) => range)
    .join('');
  return !new RegExp(`[${foreignRanges}]`).test(value);
}

function isGeneric(text = '') {
  return /^samajh gaya\.?$/i.test(String(text || '').trim()) || /main pehle aapka exact goal clear/i.test(text);
}

async function runPersona(persona, index) {
  const checks = [];
  const phone = phoneFor(index);
  const signup = await post('/api/signup', { phone, create_new: true });
  const profile = signup.profile || {};
  const messages = [...(signup.messages || []), { role: 'user', content: persona.text }];
  const counselor = await post('/api/counselor', {
    learner_id: profile.learner_id,
    phone_hash: profile.phone_hash,
    profile,
    messages,
  });
  const language = counselor.language || counselor.proof?.language || counselor.profile?.language_profile || {};
  const profileLanguage = counselor.profile?.preferred_language || counselor.profile?.language || '';

  assertCheck(checks, 'counselor replied', Boolean(counselor.reply), counselor.reply || '');
  assertCheck(checks, 'reply is not generic repeat', !isGeneric(counselor.reply), counselor.reply || '');
  assertCheck(checks, 'profile language persisted', expectedLanguageSeen(profileLanguage, persona.expectedLanguage), profileLanguage);
  assertCheck(checks, 'language proof returned', expectedLanguageSeen(language.preferred_language, persona.expectedLanguage), JSON.stringify(language));
  assertCheck(checks, 'reply script metadata correct', language.reply_script === persona.expectedScript, language.reply_script || '');
  assertCheck(checks, 'voice stt code returned', Boolean(language.stt_language_code), language.stt_language_code || '');
  assertCheck(checks, 'same-language flag true', language.same_language_reply === true, String(language.same_language_reply));
  assertCheck(checks, 'reply uses expected script', hasExpectedScript(counselor.reply, persona.expectedScript), counselor.reply);
  if (persona.expectedScript === 'Latin') {
    assertCheck(checks, 'latin reply does not switch to Indic script', !/[\u0900-\u0D7F]/.test(counselor.reply), counselor.reply);
  }

  return {
    id: persona.id,
    pass: checks.every((check) => check.pass),
    phone,
    language: language.preferred_language,
    script: language.reply_script,
    sttCode: language.stt_language_code,
    provider: counselor.proof?.counselor?.provider,
    checks,
  };
}

async function runVoiceRetry() {
  const checks = [];
  const profile = {
    learner_id: null,
    preferred_language: 'Hindi',
    language: 'Hindi',
    language_profile: { preferred_language: 'Hindi', reply_script: 'Devanagari', stt_language_code: 'hi-IN' },
  };
  const response = await post('/api/counselor', {
    profile,
    messages: [],
    audioBase64: 'data:audio/webm;base64,AAAA',
    fileName: 'too-short.webm',
    languageCode: 'hi-IN',
  });
  assertCheck(checks, 'short audio does not hit model path', response.proof?.counselor?.provider === 'voice_retry', response.proof?.counselor?.provider || '');
  assertCheck(checks, 'short audio is validation failure', response.proof?.stt?.provider === 'audio_validation', response.proof?.stt?.provider || '');
  assertCheck(checks, 'retry stays in Hindi script', /[\u0900-\u097F]/.test(response.reply || ''), response.reply || '');
  assertCheck(checks, 'voice language code preserved', response.proof?.stt?.language_code === 'hi-IN', response.proof?.stt?.language_code || '');
  return {
    id: 'voice_retry_short_audio',
    pass: checks.every((check) => check.pass),
    language: response.language?.preferred_language,
    script: response.language?.reply_script,
    checks,
  };
}

const startedAt = new Date().toISOString();
const results = [];
for (const [index, persona] of personas.entries()) {
  try {
    const result = await runPersona(persona, index);
    results.push(result);
    console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.id} language=${result.language || 'n/a'} script=${result.script || 'n/a'} provider=${result.provider || 'n/a'}`);
    result.checks.filter((check) => !check.pass).forEach((check) => console.log(`  - ${check.name}: ${check.detail}`));
  } catch (error) {
    results.push({ id: persona.id, pass: false, error: error.message });
    console.log(`ERROR ${persona.id}: ${error.message}`);
  }
}

try {
  const voiceResult = await runVoiceRetry();
  results.push(voiceResult);
  console.log(`${voiceResult.pass ? 'PASS' : 'FAIL'} ${voiceResult.id} language=${voiceResult.language || 'n/a'} script=${voiceResult.script || 'n/a'}`);
  voiceResult.checks.filter((check) => !check.pass).forEach((check) => console.log(`  - ${check.name}: ${check.detail}`));
} catch (error) {
  results.push({ id: 'voice_retry_short_audio', pass: false, error: error.message });
  console.log(`ERROR voice_retry_short_audio: ${error.message}`);
}

const summary = {
  base,
  startedAt,
  completedAt: new Date().toISOString(),
  pass: results.every((result) => result.pass),
  totals: {
    cases: results.length,
    passed: results.filter((result) => result.pass).length,
    failed: results.filter((result) => !result.pass).length,
    checks: results.reduce((sum, result) => sum + (result.checks?.length || 0), 0),
  },
  results,
};

console.log(JSON.stringify(summary, null, 2));
if (!summary.pass) process.exit(1);
