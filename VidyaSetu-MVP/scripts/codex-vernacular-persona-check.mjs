const base = process.env.TEST_BASE_URL || 'http://localhost:4175';

const personas = [
  {
    id: 'hi_mushroom_business',
    language: 'Hindi',
    text: 'मेरा नाम दिव्यमान है। मैंने पढ़ाई class 5 तक की है। मैं बस्ती जिले में रहता हूँ। मुझे मशरूम की खेती सीखकर छोटा business शुरू करना है। मेरे पास shared Android phone है, रोज 2 घंटे दे सकता हूँ, और 15 km तक जा सकता हूँ। loan लेने से पहले risk और buyer समझना चाहता हूँ।',
    terms: ['mushroom', 'मशरूम'],
    resourceTerms: ['mushroom', 'मशरूम', 'oyster', 'spawn'],
    script: /[\u0900-\u097F]/,
  },
  {
    id: 'or_poultry_business',
    language: 'Odia',
    text: 'ମୋ ନାମ ମୋହନ। ମୁଁ ବଲାଙ୍ଗିର ଜିଲ୍ଲାରେ ରହୁଛି। ମୁଁ poultry farming ଛୋଟ business ଆରମ୍ଭ କରିବାକୁ ଚାହୁଁଛି। Android phone ଅଛି, ଦିନକୁ 1 ଘଣ୍ଟା ଦେଇପାରିବି, 15 km ଯାଇପାରିବି। loan ପୂର୍ବରୁ buyer, feed cost ଓ risk ବୁଝିବାକୁ ଚାହେଁ।',
    terms: ['poultry', 'chicken', 'broiler', 'feed', 'ପୋଲ୍ଟ୍ରି'],
    resourceTerms: ['poultry', 'chicken', 'broiler', 'feed', 'KVK'],
    script: /[\u0B00-\u0B7F]/,
  },
  {
    id: 'ta_plumbing_training',
    language: 'Tamil',
    text: 'என் பெயர் லக்ஷ்மி. நான் தமிழ்நாடு திருச்சி அருகே இருக்கிறேன். பள்ளி படிப்பு அதிகம் இல்லை. Plumbing வேலை கற்றுக்கொண்டு helper வேலை செய்ய வேண்டும். shared phone உள்ளது, தினமும் அரை மணி நேரம் தர முடியும், 5 km பாதுகாப்பாக போக முடியும்.',
    terms: ['plumb', 'pipe', 'fitting', 'helper', 'பிளம்பிங்', 'குழாய்'],
    resourceTerms: ['plumbing', 'pipe fitting', 'sanitary', 'Skill India'],
    script: /[\u0B80-\u0BFF]/,
  },
  {
    id: 'bn_tiffin_business',
    language: 'Bengali',
    text: 'আমার নাম রিনা। আমি নদিয়া জেলায় থাকি। আমি বাড়ি থেকে tiffin service ছোট business শুরু করতে চাই। রান্না পারি, কিন্তু buyer, price, hygiene আর scheme/loan risk বুঝতে চাই। Android phone আছে, দিনে ২ ঘণ্টা সময় দিতে পারি।',
    terms: ['tiffin', 'food', 'cooking', 'hygiene', 'buyer', 'টিফিন', 'রান্না'],
    resourceTerms: ['tiffin', 'food business', 'fssai', 'hygiene', 'cooking'],
    script: /[\u0980-\u09FF]/,
  },
  {
    id: 'mr_mobile_repair',
    language: 'Marathi',
    text: 'माझे नाव समीर आहे। मी नागपूर जिल्ह्यात आहे। मला mobile repair शिकून जवळच्या दुकानात helper काम किंवा छोटा repair काम सुरू करायचे आहे। माझ्याकडे Android phone आहे, रोज 1 तास देऊ शकतो, 12 km commute करू शकतो।',
    terms: ['mobile', 'repair', 'phone', 'helper', 'मोबाईल'],
    resourceTerms: ['mobile repair', 'phone repair', 'Skill India', 'YouTube'],
    script: /[\u0900-\u097F]/,
  },
];

const voiceCodes = { Hindi: 'hi-IN', Odia: 'od-IN', Tamil: 'ta-IN', Bengali: 'bn-IN', Marathi: 'mr-IN' };

async function post(path, body) {
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
  }
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`${path} ${response.status}: ${data.error || response.statusText}`);
  return data;
}

function hay(value) {
  return JSON.stringify(value || '').toLowerCase();
}

function hasTerm(text, terms = []) {
  const lower = String(text || '').toLowerCase();
  return terms.some((term) => lower.includes(String(term).toLowerCase()));
}

function journeyResourceText(journey = {}) {
  return (journey.modules || [])
    .flatMap((module) => module.resources || [])
    .map((resource) =>
      [
        resource.title,
        resource.type,
        resource.source_url || resource.url,
        resource.search_query,
        resource.how_to_use,
        resource.proof_to_save,
      ]
        .filter(Boolean)
        .join(' '),
    )
    .join(' ');
}

async function runPersona(persona, index) {
  const phone = `94${String(Date.now()).slice(-7)}${index}`.slice(0, 10);
  const signup = await post('/api/signup', { phone, fresh: true });
  let profile = { ...(signup.profile || {}), preferred_language: persona.language, language: persona.language };
  let messages = signup.messages?.length ? signup.messages : [];
  messages = [...messages, { role: 'user', content: persona.text }];

  const counselor = await post('/api/counselor', {
    learner_id: profile.learner_id,
    phone_hash: `hash_${phone}`,
    profile,
    messages,
  });
  profile = { ...(counselor.profile || profile), preferred_language: persona.language, language: persona.language };

  const pathway = await post('/api/pathway', { profile, question: persona.text });
  const route = pathway.routes?.[0];
  if (!route) throw new Error('No pathway route generated.');

  const journey = await post('/api/journey', { profile, route });
  const ttsText = `${route.name || route.title || ''}. ${route.first_step || route.learner_next_step || ''}`.slice(0, 420);
  const tts = await post('/api/intake', { action: 'tts', text: ttsText, profile, language: persona.language });

  const routeText = hay(pathway.routes);
  const journeyText = hay(journey.journey);
  const resources = journeyResourceText(journey.journey);
  const counselorReplyText = counselor.reply || '';
  const routeFacingText = (pathway.routes || [])
    .map((item) => `${item.name || ''} ${item.learner_summary || ''} ${item.first_step || ''}`)
    .join(' ');
  const journeyFacingText = (journey.journey?.modules || [])
    .map((module) => `${module.title || ''} ${module.goal || ''} ${(module.lessons || []).join(' ')} ${(module.daily_micro_tasks || []).join(' ')}`)
    .join(' ');

  const result = {
    id: persona.id,
    language: persona.language,
    counselorProvider: counselor.proof?.counselor?.provider || null,
    counselorReply: counselorReplyText.slice(0, 180),
    profileGoal: profile.learner_goal || null,
    routeNames: (pathway.routes || []).map((item) => item.name).slice(0, 3),
    journeyMode: journey.journey?.mode || '',
    journeyWeeks: journey.journey?.modules?.length || 0,
    firstWeeks: (journey.journey?.modules || []).slice(0, 2).map((module) => ({
      week: module.week,
      title: module.title,
      resources: (module.resources || []).slice(0, 2).map((resource) => ({
        title: resource.title,
        query: resource.search_query,
        url: resource.source_url || resource.url,
      })),
    })),
    pathwayGenerationOk: Boolean(pathway.proof?.generation?.ok),
    journeyGenerationOk: Boolean(journey.proof?.generation?.ok),
    pathwayError: pathway.proof?.generation?.error || '',
    journeyError: journey.proof?.generation?.error || '',
    routeHasScript: persona.script.test(routeFacingText),
    journeyHasScript: persona.script.test(journeyFacingText),
    counselorHasScript: persona.script.test(counselorReplyText),
    noCounselorHinglishFiller: !/^\s*(theek|thik|haan|haanji|ok|okay|got it|samajh|jankari|save kar|sahi hai)\b/i.test(counselorReplyText),
    enterpriseNoResumeAsk:
      profile.learner_goal?.intent !== 'self_employment' ||
      !/\b(resume|certificate|project|cv)\b/i.test(counselorReplyText),
    routeSpecific: hasTerm(routeText, persona.terms),
    journeySpecific: hasTerm(journeyText, persona.terms),
    resourceSpecific: hasTerm(resources, persona.resourceTerms || persona.terms),
    noGenericEnterpriseResource: !/enterprise setup video|generic enterprise|career exploration|skill pathway exploration/.test(`${resources} ${routeText}`.toLowerCase()),
    ttsProvider: tts.provider || '',
    sarvamAudio: Boolean(tts.audio && tts.provider === 'sarvam'),
    voiceCleanFallback: Boolean(tts.fallback),
    ttsLanguageCode: tts.language_code || voiceCodes[persona.language] || '',
    ttsError: tts.error || '',
  };
  result.contentPass =
    result.pathwayGenerationOk &&
    result.journeyGenerationOk &&
    result.counselorHasScript &&
    result.noCounselorHinglishFiller &&
    result.enterpriseNoResumeAsk &&
    result.routeHasScript &&
    result.journeyHasScript &&
    result.routeSpecific &&
    result.journeySpecific &&
    result.resourceSpecific &&
    result.noGenericEnterpriseResource &&
    result.journeyWeeks >= 4;
  result.voicePass = result.sarvamAudio || result.voiceCleanFallback;
  result.pass = result.contentPass && result.voicePass;
  return result;
}

const selected = process.argv[2] ? personas.filter((persona) => persona.id === process.argv[2]) : personas;
const results = [];
for (const [index, persona] of selected.entries()) {
  try {
    const result = await runPersona(persona, index + 1);
    results.push(result);
    console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.id} content=${result.contentPass} voice=${result.voicePass} routes=${result.routeNames.join(' | ')}`);
    if (!result.pass) {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    const result = { id: persona.id, pass: false, error: error.message };
    results.push(result);
    console.log(`ERROR ${persona.id}: ${error.message}`);
  }
}

const summary = {
  total: results.length,
  passed: results.filter((result) => result.pass).length,
  failed: results.filter((result) => !result.pass).length,
  results,
};

console.log('SUMMARY_JSON ' + JSON.stringify(summary));
if (summary.failed) process.exit(1);
