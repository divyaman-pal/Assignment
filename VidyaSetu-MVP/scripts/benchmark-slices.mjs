const base = process.env.BENCHMARK_BASE_URL || 'https://vidyasetu-mvp.vercel.app';

async function post(path, body) {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`${path} ${response.status}: ${data.error || response.statusText}`);
  }
  return data;
}

function phoneFor(index) {
  const suffix = String((Date.now() + index) % 100000000).padStart(8, '0');
  return `98${suffix}`;
}

function assertCheck(checks, name, pass, detail = '') {
  checks.push({ name, pass: Boolean(pass), detail });
}

async function runCounselorTurn({ profile, messages, text }) {
  const nextMessages = [...messages, { role: 'user', content: text }];
  const data = await post('/api/counselor', {
    learner_id: profile.learner_id,
    phone_hash: profile.phone_hash,
    profile,
    messages: nextMessages,
  });
  return {
    profile: data.profile,
    messages: [...nextMessages, { role: 'assistant', content: data.reply }],
    reply: data.reply,
    intent: data.intent,
    proof: data.proof,
  };
}

async function accountContinuityBenchmark() {
  const checks = [];
  const phone = phoneFor(11);
  const first = await post('/api/signup', { phone, create_new: true });
  let profile = first.profile;
  let messages = first.messages || [];
  const firstLearnerId = profile.learner_id;

  const turn = await runCounselorTurn({
    profile,
    messages,
    text:
      'Mera naam Anshuman hai. Main Gorakhpur ke engineering college mein padhta hoon. Data Science job chahiye. Python SQL aata hai, 10 hours daily de sakta hoon, India-wide relocate kar sakta hoon.',
  });
  profile = turn.profile;
  messages = turn.messages;
  const pathway = await post('/api/pathway', { profile, question: 'Build my data science job pathway.' });
  const route = pathway.routes?.[0];
  const journey = route ? await post('/api/journey', { profile, route }) : null;
  const firstModule = journey?.journey?.modules?.[0];
  const firstLesson = firstModule?.lessons?.[0];
  const lessonKey = firstModule && firstLesson ? `${firstModule.id}::lesson::${firstLesson}` : 'manual::lesson::first';
  await post('/api/progress', {
    learner_id: profile.learner_id,
    completed_lessons: { [lessonKey]: true },
    active_tab: 'journey',
    last_action: 'benchmark_progress_saved',
  });

  const restored = await post('/api/signup', { phone });
  assertCheck(checks, 'same phone restores existing learner', restored.returning === true && restored.needs_selection === false);
  assertCheck(checks, 'same learner id restored', restored.profile?.learner_id === firstLearnerId, restored.profile?.learner_id);
  assertCheck(checks, 'conversation restored with assistant reply', (restored.messages || []).some((message) => message.role === 'assistant'));
  assertCheck(checks, 'pathway restored', (restored.workspace?.pathway?.routes || []).length > 0);
  assertCheck(checks, 'journey restored', Boolean(restored.workspace?.journey?.modules?.length));
  assertCheck(checks, 'lesson progress restored', restored.workspace?.completedLessons?.[lessonKey] === true, lessonKey);

  const second = await post('/api/signup', { phone, create_new: true });
  let secondProfile = second.profile;
  let secondMessages = second.messages || [];
  const secondTurn = await runCounselorTurn({
    profile: secondProfile,
    messages: secondMessages,
    text: 'Mera naam Sarita hai. Main Class 12 mein hoon, Hindi mein Physics ke marks improve karna chahti hoon. Roz 2 hours padh sakti hoon.',
  });
  secondProfile = secondTurn.profile;
  const sharedLogin = await post('/api/signup', { phone });
  assertCheck(checks, 'shared phone asks learner selection', sharedLogin.needs_selection === true, JSON.stringify(sharedLogin.learners || []));
  assertCheck(checks, 'shared phone lists at least two learners', (sharedLogin.learners || []).length >= 2);
  const restoredFirst = await post('/api/signup', { phone, learner_id: firstLearnerId });
  const restoredSecond = await post('/api/signup', { phone, learner_id: secondProfile.learner_id });
  assertCheck(checks, 'selecting first learner keeps Anshuman context', restoredFirst.profile?.learner_id === firstLearnerId);
  assertCheck(checks, 'selecting second learner keeps Sarita context', restoredSecond.profile?.learner_id === secondProfile.learner_id);
  assertCheck(checks, 'profiles are not mixed', restoredFirst.profile?.learner_id !== restoredSecond.profile?.learner_id);

  return {
    id: 'account_continuity_shared_phone',
    phone,
    pass: checks.every((check) => check.pass),
    checks,
  };
}

const personas = [
  {
    id: 'class8_study',
    expectedPersona: 'school_study_support',
    text:
      'Mera naam Kavya hai. Main Class 8 mein hoon, Sitapur se. Mujhe Maths aur Science mein help chahiye, roz 45 minutes padh sakti hoon, mummy ka shared phone hai aur Hindi mein samjhana.',
  },
  {
    id: 'class12_boards',
    expectedPersona: 'board_exam_prep',
    text:
      'Mera naam Rohit hai. Main Patna se Class 12 CBSE PCM student hoon. Physics aur Maths mein good marks chahiye. Roz 3 hours de sakta hoon, Android phone hai.',
  },
  {
    id: 'jee_switch',
    expectedPersona: 'entrance_exam_prep',
    turns: [
      'Mera naam Anshuman hai. Main Gorakhpur ke engineering college mein hoon. Data Science job chahiye, Python SQL aata hai, relocate kar sakta hoon.',
      'But pehle main JEE Advanced prep karke IIT crack karna chahta hoon.',
    ],
  },
  {
    id: 'dropout_tailoring',
    expectedPersona: 'informal_skill_rpl',
    text:
      'Main Shabnam hoon, Jaipur se. School chhod diya tha. Ghar par silai karti hoon par certificate nahi hai. Training ya ghar ke paas kaam chahiye, 8 km tak ja sakti hoon, roz 1 hour, shared phone hai.',
  },
  {
    id: 'mobile_repair',
    expectedPersona: 'vocational_training',
    text:
      'Main Sameer Nagpur se hoon. Mujhe mobile repair training karni hai, Android phone hai, roz 1 hour practice kar sakta hoon aur 12 km commute kar sakta hoon.',
  },
  {
    id: 'btech_data_science',
    expectedPersona: 'college_career',
    text:
      'Mera naam Anshuman hai. Main Gorakhpur ke engineering college mein padhta hoon. Hindi English bol sakta hoon, mujhe Data Science naukri chahiye, din ke 10 se 12 hours de sakta hoon aur India mein kahin bhi job ke liye ready hoon.',
  },
  {
    id: 'no_location_job',
    expectedPersona: 'job_search_only',
    text:
      'Mujhe data entry job only chahiye. Typing aati hai, resume hai, 10 km commute kar sakta hoon, phone hai, par city abhi nahi batana.',
  },
  {
    id: 'bcom_tally',
    expectedPersona: 'college_career',
    text:
      'Mera naam Aman hai. Main Lucknow se BCom graduate hoon, Tally aur GST aata hai. Accountant assistant job chahiye, 15 km commute kar sakta hoon, laptop access hai.',
  },
  {
    id: 'remote_design',
    expectedPersona: 'job_search_only',
    text:
      'My name is Iqra. I know Canva and basic graphic design. I want remote work from home or India-wide design job, no offline training. I can give 4 hours daily and have laptop and internet.',
  },
  {
    id: 'open_counseling',
    expectedPersona: 'unsure_exploration',
    text:
      'I am confused. I am from Raebareli and I do not know whether I should prepare for government exam, design, or private job. I need counseling.',
  },
];

function evaluateTracePersona(persona, { profile, pathway, reply }) {
  const checks = [];
  const route = pathway.routes?.[0];
  const routeTrace = route?.trace || {};
  const personaMatched =
    profile.persona === persona.expectedPersona ||
    pathway.persona === persona.expectedPersona ||
    routeTrace.persona === persona.expectedPersona ||
    (persona.id === 'bcom_tally' && ['college_career', 'formal_skill_job_search', 'job_search_only'].includes(profile.persona));
  assertCheck(checks, 'persona classified', personaMatched, `${profile.persona}/${pathway.persona}/${routeTrace.persona}`);
  assertCheck(checks, 'profile confidence present', typeof profile.profile_confidence === 'number' && profile.profile_confidence >= 0);
  assertCheck(checks, 'profile missing fields present', Array.isArray(profile.missing_fields));
  assertCheck(checks, 'pathway has recommendation trace', Boolean(pathway.recommendation_trace?.profile_facts_used?.length));
  if (persona.id === 'no_location_job') {
    assertCheck(checks, 'location guardrail triggered', pathway.callback_flag === true || pathway.missing_profile_facts?.includes('location'));
  } else {
    assertCheck(checks, 'routes generated', (pathway.routes || []).length > 0);
    assertCheck(checks, 'route trace has matched facts', Boolean(routeTrace.matched_facts?.length));
    assertCheck(checks, 'route has next action', Boolean(route?.next_action));
  }
  assertCheck(checks, 'counselor not generic repeat', !/^samajh gaya\.?$/i.test(String(reply || '').trim()));
  if (persona.expectedPersona.includes('study') || persona.expectedPersona.includes('prep')) {
    assertCheck(checks, 'study route avoids job wording', !/employer outreach|hirer|job outreach/i.test(JSON.stringify(pathway.routes || [])));
  }
  return checks;
}

async function tracePersonaBenchmark() {
  const results = [];
  for (const [index, persona] of personas.entries()) {
    const phone = phoneFor(100 + index);
    const signup = await post('/api/signup', { phone, create_new: true });
    let profile = signup.profile;
    let messages = signup.messages || [];
    let lastReply = '';
    const turns = persona.turns || [persona.text];
    for (const text of turns) {
      const turn = await runCounselorTurn({ profile, messages, text });
      profile = turn.profile;
      messages = turn.messages;
      lastReply = turn.reply;
    }
    const pathway = await post('/api/pathway', { profile, question: turns.at(-1) });
    const checks = evaluateTracePersona(persona, { profile, pathway, reply: lastReply });
    results.push({
      id: persona.id,
      expectedPersona: persona.expectedPersona,
      actualPersona: profile.persona,
      pathwayPersona: pathway.persona,
      routePersona: pathway.routes?.[0]?.trace?.persona,
      routeCount: pathway.routes?.length || 0,
      callback: Boolean(pathway.callback_flag),
      missing: profile.missing_fields || [],
      pathwayMissing: pathway.missing_profile_facts || [],
      firstRoute: pathway.routes?.[0]?.name || '',
      firstTraceFacts: pathway.routes?.[0]?.trace?.matched_facts || [],
      pass: checks.every((check) => check.pass),
      checks,
    });
  }
  return {
    id: 'trace_personas',
    pass: results.every((result) => result.pass),
    results,
  };
}

const startedAt = new Date().toISOString();
const account = await accountContinuityBenchmark();
const trace = await tracePersonaBenchmark();
const summary = {
  base,
  startedAt,
  completedAt: new Date().toISOString(),
  account,
  trace,
  pass: account.pass && trace.pass,
  totals: {
    checks: [
      ...account.checks,
      ...trace.results.flatMap((result) => result.checks),
    ].length,
    failedChecks: [
      ...account.checks,
      ...trace.results.flatMap((result) => result.checks),
    ].filter((check) => !check.pass).length,
    tracePersonas: trace.results.length,
    tracePersonaPassed: trace.results.filter((result) => result.pass).length,
  },
};

console.log(JSON.stringify(summary, null, 2));
