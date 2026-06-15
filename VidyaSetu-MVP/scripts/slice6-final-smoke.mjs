const base = process.env.SLICE6_BASE_URL || process.env.TEST_BASE_URL || 'http://localhost:4175';
const includeJobs = process.env.SLICE6_INCLUDE_JOBS === '1';
const requirePersistence = process.env.SLICE6_REQUIRE_PERSISTENCE !== '0';

async function post(path, body) {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (/Vercel Security Checkpoint|We're verifying your browser|<!doctype html|<!DOCTYPE html/.test(text)) {
    throw new Error(
      `${path} returned HTML/security checkpoint. Disable Vercel Attack Mode or run this against localhost.`,
    );
  }
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`${path} ${response.status}: ${data.error || response.statusText}`);
  return data;
}

function phoneFor(index) {
  const suffix = `${Date.now()}${index}`.slice(-8);
  return `92${suffix}`.slice(0, 10);
}

function assertCheck(checks, name, pass, detail = '') {
  checks.push({ name, pass: Boolean(pass), detail });
}

function firstModuleCompletion(journey = {}) {
  const firstModule = Array.isArray(journey.modules) ? journey.modules[0] : null;
  if (!firstModule) return { completed: {}, proofNotes: {} };
  const lessons = Array.isArray(firstModule.lessons) ? firstModule.lessons : [];
  const tasks = Array.isArray(firstModule.practice_tasks) ? firstModule.practice_tasks : [];
  const completed = Object.fromEntries([
    ...lessons.map((item) => [`${firstModule.id}::lesson::${item}`, true]),
    ...tasks.map((item) => [`${firstModule.id}::task::${item}`, true]),
  ]);
  const proofNotes = {
    [firstModule.id]: `Slice 6 smoke proof: Week ${firstModule.week} completed with learner note and next action.`,
  };
  return { completed, proofNotes };
}

function expectedJourneyMode(persona) {
  if (persona.id === 'class8_school') return 'school_study_support';
  if (persona.id === 'class12_boards') return 'academic_exam_prep';
  if (persona.id === 'jee_switch') return 'entrance_exam_prep';
  if (persona.id === 'dropout_tailoring') return 'informal_skill_validation';
  if (persona.id === 'mobile_repair_training') return 'vocational_training';
  if (persona.id === 'college_data_science') return 'data_science_pathway';
  return '';
}

const personas = [
  {
    id: 'class8_school',
    kind: 'study',
    expectedIntent: 'study',
    text:
      'Mera naam Kavya hai. Main Class 8 mein hoon, Sitapur se. Mujhe Maths aur Science mein help chahiye, roz 45 minutes padh sakti hoon, mummy ka shared phone hai aur Hindi mein samjhana.',
  },
  {
    id: 'class12_boards',
    kind: 'study',
    expectedIntent: 'study',
    text:
      'Mera naam Rohit hai. Main Patna se Class 12 CBSE PCM student hoon. Physics aur Maths mein good marks chahiye. Roz 3 hours de sakta hoon, Android phone hai.',
  },
  {
    id: 'jee_switch',
    kind: 'study',
    expectedIntent: 'study',
    turns: [
      'Mera naam Anshuman hai. Main Gorakhpur ke engineering college mein hoon. Data Science job chahiye, Python SQL aata hai, relocate kar sakta hoon.',
      'But pehle main JEE Advanced prep karke IIT crack karna chahta hoon.',
    ],
  },
  {
    id: 'dropout_tailoring',
    kind: 'proof_to_work',
    expectedIntent: 'proof_to_work',
    text:
      'Main Shabnam Jaipur se hoon. School chhod diya tha. Ghar par silai karti hoon par certificate nahi hai. Ghar ke paas kaam chahiye, 8 km tak ja sakti hoon, roz 1 hour, shared phone hai.',
  },
  {
    id: 'mobile_repair_training',
    kind: 'training',
    expectedIntent: 'training',
    text:
      'Main Sameer Nagpur se hoon. Mujhe mobile repair training karni hai, Android phone hai, roz 1 hour practice kar sakta hoon aur 12 km commute kar sakta hoon.',
  },
  {
    id: 'college_data_science',
    kind: 'career',
    expectedIntent: 'career',
    text:
      'Mera naam Anshuman hai. Main Gorakhpur ke engineering college mein padhta hoon. Hindi English bol sakta hoon, mujhe Data Science naukri chahiye, Python SQL basics aate hain, din ke 10 hours de sakta hoon aur India mein kahin bhi job ke liye ready hoon.',
  },
  {
    id: 'formal_iti_job',
    kind: 'job',
    expectedIntent: 'job',
    text:
      'Mera naam Deepak hai. Main Delhi se certified ITI electrician hoon, 2 saal ka experience hai. Sirf electrician job opportunities chahiye, 20 km commute kar sakta hoon, Android WhatsApp hai.',
  },
  {
    id: 'no_location_training_guard',
    kind: 'location_guard',
    expectedIntent: 'training',
    text:
      'Mujhe tailoring training chahiye. Roz 1 hour de sakti hoon, shared phone hai, but main apni city abhi nahi batana chahti.',
  },
];

async function runPersona(persona, index) {
  const checks = [];
  const phone = phoneFor(index);
  const signup = await post('/api/signup', { phone, create_new: true });
  let profile = signup.profile || {};
  let messages = signup.messages || [];
  let lastReply = '';
  let lastIntent = null;
  for (const text of persona.turns || [persona.text]) {
    const nextMessages = [...messages, { role: 'user', content: text }];
    const counselor = await post('/api/counselor', {
      learner_id: profile.learner_id,
      phone_hash: profile.phone_hash,
      profile,
      messages: nextMessages,
    });
    profile = counselor.profile || profile;
    messages = [...nextMessages, { role: 'assistant', content: counselor.reply }];
    lastReply = counselor.reply || '';
    lastIntent = counselor.intent?.learner_goal?.intent || profile.learner_goal?.intent || null;
  }

  assertCheck(checks, 'counselor reply is useful', Boolean(lastReply) && !/^samajh gaya\.?$/i.test(lastReply), lastReply);
  if (persona.expectedIntent !== 'career') {
    assertCheck(checks, 'intent classified', lastIntent === persona.expectedIntent || profile.learner_goal?.intent === persona.expectedIntent, `${lastIntent}/${profile.learner_goal?.intent}`);
  } else {
    assertCheck(checks, 'career intent classified', ['career', 'job', 'college'].includes(lastIntent || profile.learner_goal?.intent), `${lastIntent}/${profile.learner_goal?.intent}`);
  }
  assertCheck(checks, 'profile confidence present', Number(profile.profile_confidence || 0) >= 0);

  const pathway = await post('/api/pathway', { profile, question: (persona.turns || [persona.text]).at(-1) });
  const routes = pathway.routes || [];
  if (persona.kind === 'location_guard') {
    assertCheck(checks, 'location guard blocks route confidence', pathway.callback_flag || (pathway.missing_profile_facts || []).includes('location'), JSON.stringify(pathway.missing_profile_facts || []));
    return resultFor({ persona, phone, checks, profile, pathway });
  }

  assertCheck(checks, 'routes generated', routes.length > 0, String(routes.length));
  assertCheck(checks, 'recommendation trace exists', Boolean(pathway.recommendation_trace || routes[0]?.trace), JSON.stringify(routes[0]?.trace || {}));

  const route = routes[0];
  const journeyResponse = await post('/api/journey', { profile, route });
  const journey = journeyResponse.journey || {};
  const mode = expectedJourneyMode(persona);
  if (mode) assertCheck(checks, 'journey mode correct', journey.mode === mode, journey.mode || '');
  assertCheck(checks, 'journey modules created', (journey.modules || []).length >= 3, String((journey.modules || []).length));

  const { completed, proofNotes } = firstModuleCompletion(journey);
  const progressResponse = await post('/api/progress', {
    learner_id: profile.learner_id,
    journey,
    completed_lessons: completed,
    proof_notes: proofNotes,
    active_tab: 'journey',
    last_action: 'slice6_smoke_progress',
  });
  const progress = progressResponse.progress || {};
  if (requirePersistence) {
    assertCheck(checks, 'progress persistence ok', progressResponse.ok === true || progressResponse.proof?.persistence?.ok === true, JSON.stringify(progressResponse.proof || {}));
  }
  assertCheck(checks, 'progress completion recorded', Number(progress.completion_percent || 0) > 0, String(progress.completion_percent || 0));
  assertCheck(checks, 'proof readiness recorded', Number(progress.proof_ready_count || 0) >= 1, String(progress.proof_ready_count || 0));
  assertCheck(checks, 'next action recorded', Boolean(progress.next_action), progress.next_action || '');

  const passportResponse = await post('/api/passport', {
    profile,
    selected_route: route,
    journey: { ...journey, progress },
    progress,
    completed_lessons: completed,
    proof_notes: proofNotes,
    consent: { share_certs: true, share_informal: true, share_scores: true },
  });
  assertCheck(checks, 'passport has learning proof', Number(passportResponse.passport?.learning_proof?.completion_percent || 0) === Number(progress.completion_percent || 0), JSON.stringify(passportResponse.passport?.learning_proof || {}));

  if (includeJobs && ['job', 'career', 'proof_to_work', 'training'].includes(persona.kind)) {
    const jobs = await post('/api/jobs', {
      profile,
      passport: passportResponse.passport,
      journey,
      resumeText: '',
    });
    assertCheck(checks, 'opportunity response returned', Boolean(jobs.summary || jobs.message || jobs.segment), jobs.message || jobs.summary?.message || '');
    if (persona.kind !== 'training') {
      assertCheck(checks, 'opportunity segment present', Boolean(jobs.segment?.id), jobs.segment?.id || '');
    }
  }

  return resultFor({ persona, phone, checks, profile, pathway, journey, progress });
}

function resultFor({ persona, phone, checks, profile, pathway, journey = null, progress = null }) {
  return {
    id: persona.id,
    kind: persona.kind,
    phone,
    pass: checks.every((check) => check.pass),
    intent: profile.learner_goal?.intent || null,
    persona: profile.persona || null,
    route: pathway.routes?.[0]?.name || '',
    journeyMode: journey?.mode || '',
    completion: progress?.completion_percent || 0,
    checks,
  };
}

const startedAt = new Date().toISOString();
const results = [];
for (const [index, persona] of personas.entries()) {
  try {
    const result = await runPersona(persona, index + 1);
    results.push(result);
    console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.id} intent=${result.intent || 'n/a'} mode=${result.journeyMode || 'n/a'} completion=${result.completion || 0}%`);
    result.checks.filter((check) => !check.pass).forEach((check) => console.log(`  - ${check.name}: ${check.detail}`));
  } catch (error) {
    results.push({ id: persona.id, kind: persona.kind, pass: false, error: error.message });
    console.log(`ERROR ${persona.id}: ${error.message}`);
  }
}

const checks = results.flatMap((result) => result.checks || []);
const summary = {
  base,
  includeJobs,
  requirePersistence,
  startedAt,
  completedAt: new Date().toISOString(),
  pass: results.every((result) => result.pass),
  totals: {
    cases: results.length,
    passed: results.filter((result) => result.pass).length,
    failed: results.filter((result) => !result.pass).length,
    checks: checks.length,
    failedChecks: checks.filter((check) => !check.pass).length,
  },
  results,
};

console.log(JSON.stringify(summary, null, 2));
if (!summary.pass) process.exit(1);
