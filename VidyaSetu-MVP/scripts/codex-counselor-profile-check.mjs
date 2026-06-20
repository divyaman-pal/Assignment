const base = process.env.TEST_BASE_URL || 'http://localhost:4175';

const personas = [
  {
    id: 'hinglish_riya_office_job_video_question',
    language: 'Hinglish',
    turns: [
      'Mera naam Riya hai. Main Class 12 pass hoon, Varanasi ke paas rehti hoon. Mujhe computer basics, typing aur customer service job chahiye. Phone shared hai but WhatsApp voice note chal jata hai. Roz 1 hour practice kar sakti hoon. Ghar ke paas safe day shift chahiye.',
      'naukari turant chahiye',
      'nhi',
      'haa',
      'video bana ke kya krna h ?',
    ],
    expect: {
      goalType: 'local_office_job',
      goalTerms: ['computer', 'typing', 'customer'],
      aspirationTerms: ['computer', 'typing', 'customer'],
      finalReplyTerms: ['video', 'saboot'],
      rejectReplyTerms: ['mobile repair', 'skill pathway exploration'],
      rejectGoalTerms: ['mobile repair', 'skill pathway exploration', 'video creation'],
      rejectFirstReplyTerms: ['video sirf'],
    },
  },
  {
    id: 'hinglish_riya_next_action_after_complete',
    language: 'Hinglish',
    turns: [
      'Mera naam Riya hai. Main Class 12 pass hoon, Varanasi ke paas rehti hoon. Mujhe computer basics, typing aur customer service job chahiye. Phone shared hai but WhatsApp voice note chal jata hai. Roz 1 hour practice kar sakti hoon. Ghar ke paas safe day shift chahiye.',
      '10 km',
      'ab kya krna h ?',
    ],
    expect: {
      goalType: 'local_office_job',
      goalTerms: ['computer', 'typing', 'customer'],
      aspirationTerms: ['computer', 'typing', 'customer'],
      finalReplyTerms: ['Rasta', 'dabao'],
      rejectReplyTerms: ['Mauke sirf fit', 'mobile repair', 'skill pathway exploration'],
      rejectGoalTerms: ['mobile repair', 'skill pathway exploration'],
    },
  },
  {
    id: 'hi_mushroom_business_profile',
    language: 'Hindi',
    turns: [
      'मेरा नाम दिव्या है। मैं बस्ती जिले में रहती हूँ। मुझे मशरूम की खेती सीखकर छोटा व्यापार शुरू करना है। shared Android phone है, रोज 2 घंटे दे सकती हूँ, और 10 km जा सकती हूँ। loan लेने से पहले buyer और risk समझना चाहती हूँ।',
    ],
    expect: {
      goalType: 'self_employment_enterprise',
      goalTerms: ['mushroom'],
      aspirationTerms: ['mushroom'],
      rejectReplyTerms: ['resume', 'cv'],
    },
  },
  {
    id: 'or_poultry_business_profile',
    language: 'Odia',
    turns: [
      'ମୋ ନାମ ମୋହନ। ମୁଁ ବଲାଙ୍ଗିର ଜିଲ୍ଲାରେ ରହୁଛି। ମୁଁ poultry farming ଛୋଟ business କରିବାକୁ ଚାହେଁ। Android phone ଅଛି, ଦିନକୁ 1 ଘଣ୍ଟା ଦେଇପାରିବି, 15 km ଯାଇପାରିବି। loan ପୂର୍ବରୁ buyer, feed cost ଓ risk ବୁଝିବାକୁ ଚାହେଁ।',
    ],
    expect: {
      goalType: 'self_employment_enterprise',
      goalTerms: ['poultry'],
      aspirationTerms: ['poultry'],
      script: /[\u0B00-\u0B7F]/,
      rejectReplyTerms: ['resume', 'cv', 'theek hai'],
    },
  },
  {
    id: 'ta_plumbing_training_profile',
    language: 'Tamil',
    turns: [
      'என் பெயர் லட்சுமி. நான் திருச்சி அருகே இருக்கிறேன். பள்ளி படிப்பு அதிகம் இல்லை. Plumbing வேலை கற்றுக்கொண்டு helper வேலை செய்ய வேண்டும். shared phone உள்ளது, தினமும் அரை மணி நேரம் தர முடியும், 5 km பாதுகாப்பாக போக முடியும்.',
    ],
    expect: {
      goalType: 'vocational_training',
      goalTerms: ['plumbing'],
      aspirationTerms: ['plumbing'],
      script: /[\u0B80-\u0BFF]/,
      rejectReplyTerms: ['resume', 'cv', 'theek hai'],
    },
  },
  {
    id: 'bn_tiffin_business_profile',
    language: 'Bengali',
    turns: [
      'আমার নাম রিনা। আমি নদিয়া জেলায় থাকি। আমি বাড়ি থেকে tiffin service ছোট business শুরু করতে চাই। রান্না পারি, কিন্তু buyer, price, hygiene আর scheme/loan risk বুঝতে চাই। Android phone আছে, দিনে 2 ঘণ্টা সময় দিতে পারি।',
    ],
    expect: {
      goalType: 'self_employment_enterprise',
      goalTerms: ['tiffin'],
      aspirationTerms: ['tiffin'],
      script: /[\u0980-\u09FF]/,
      rejectReplyTerms: ['resume', 'cv', 'theek hai'],
    },
  },
  {
    id: 'mr_mobile_repair_profile',
    language: 'Marathi',
    turns: [
      'माझे नाव समीर आहे. मी नागपूर जिल्ह्यात आहे. मला mobile repair शिकून जवळच्या दुकानात helper काम करायचे आहे. Android phone आहे, रोज 1 तास देऊ शकतो, 12 km commute करू शकतो.',
    ],
    expect: {
      goalType: 'vocational_training',
      goalTerms: ['mobile repair'],
      aspirationTerms: ['mobile repair'],
      script: /[\u0900-\u097F]/,
      rejectReplyTerms: ['resume', 'cv', 'theek hai'],
    },
  },
];

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

function includesAny(value, terms = []) {
  const lower = String(value || '').toLowerCase();
  return terms.some((term) => lower.includes(String(term).toLowerCase()));
}

function includesAll(value, terms = []) {
  const lower = String(value || '').toLowerCase();
  return terms.every((term) => lower.includes(String(term).toLowerCase()));
}

function profileText(profile = {}) {
  return [
    profile.learner_goal?.type,
    profile.learner_goal?.label,
    profile.learner_goal?.intent,
    ...(profile.aspirations || []),
    ...(profile.skills || []),
    ...(profile.proof_available || []),
    profile.location,
    profile.time_available,
    profile.phone_access,
  ]
    .filter(Boolean)
    .join(' ');
}

async function runPersona(persona, index) {
  const phone = `93${String(Date.now()).slice(-7)}${index}`.slice(0, 10);
  const signup = await post('/api/signup', {
    phone,
    fresh: true,
    preferred_language: persona.language,
  });
  let profile = { ...(signup.profile || {}), preferred_language: persona.language, language: persona.language };
  let messages = signup.messages?.length ? [...signup.messages] : [];
  const replies = [];

  for (const turn of persona.turns) {
    messages.push({ role: 'user', content: turn });
    const counselor = await post('/api/counselor', {
      learner_id: profile.learner_id,
      phone_hash: profile.phone_hash,
      profile,
      messages,
    });
    profile = { ...(counselor.profile || profile), preferred_language: persona.language, language: persona.language };
    replies.push(counselor.reply || '');
    messages.push({ role: 'assistant', content: counselor.reply || '' });
  }

  const text = profileText(profile);
  const finalReply = replies.at(-1) || '';
  const result = {
    id: persona.id,
    language: persona.language,
    goal: profile.learner_goal || null,
    aspirations: profile.aspirations || [],
    skills: profile.skills || [],
    profileComplete: Boolean(profile.profile_complete),
    missingFields: profile.missing_fields || [],
    finalReply,
    replies,
    checks: {},
  };

  const expected = persona.expect || {};
  result.checks.goalType = expected.goalType ? profile.learner_goal?.type === expected.goalType : true;
  result.checks.goalTerms = expected.goalTerms ? includesAny(text, expected.goalTerms) : true;
  result.checks.aspirationTerms = expected.aspirationTerms
    ? includesAny((profile.aspirations || []).join(' '), expected.aspirationTerms)
    : true;
  result.checks.finalReplyTerms = expected.finalReplyTerms ? includesAll(finalReply, expected.finalReplyTerms) : true;
  result.checks.rejectReplyTerms = expected.rejectReplyTerms ? !includesAny(finalReply, expected.rejectReplyTerms) : true;
  result.checks.rejectFirstReplyTerms = expected.rejectFirstReplyTerms ? !includesAny(replies[0] || '', expected.rejectFirstReplyTerms) : true;
  result.checks.rejectGoalTerms = expected.rejectGoalTerms ? !includesAny(text, expected.rejectGoalTerms) : true;
  result.checks.script = expected.script ? expected.script.test(finalReply) : true;
  result.pass = Object.values(result.checks).every(Boolean);
  return result;
}

const selected = process.argv[2] ? personas.filter((persona) => persona.id === process.argv[2]) : personas;
const results = [];
for (const [index, persona] of selected.entries()) {
  try {
    const result = await runPersona(persona, index + 1);
    results.push(result);
    console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.id} goal=${result.goal?.type || 'none'} label=${result.goal?.label || ''}`);
    if (!result.pass) console.log(JSON.stringify(result, null, 2));
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
