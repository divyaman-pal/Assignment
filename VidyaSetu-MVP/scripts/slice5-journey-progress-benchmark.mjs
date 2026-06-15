const base = process.env.SLICE5_BASE_URL || process.env.TEST_BASE_URL || 'https://vidyasetu-mvp.vercel.app';
const requirePersistence = process.env.SLICE5_REQUIRE_PERSISTENCE !== '0';
const requireRestore = process.env.SLICE5_REQUIRE_RESTORE !== '0';

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

function phoneFor(index) {
  const suffix = `${Date.now()}${index}`.slice(-8);
  return `93${suffix}`.slice(0, 10);
}

function assertCheck(checks, name, pass, detail = '') {
  checks.push({ name, pass: Boolean(pass), detail });
}

function itemKeysForModule(module = {}) {
  const lessons = Array.isArray(module.lessons) ? module.lessons : [];
  const tasks = Array.isArray(module.practice_tasks) ? module.practice_tasks : [];
  return [
    ...lessons.map((item) => `${module.id}::lesson::${item}`),
    ...tasks.map((item) => `${module.id}::task::${item}`),
  ];
}

function completedMapForModules(modules = [], count = 1) {
  return Object.fromEntries(
    modules
      .slice(0, count)
      .flatMap((module) => itemKeysForModule(module))
      .map((key) => [key, true]),
  );
}

function proofNotesForModules(modules = [], count = 1, prefix = 'Proof saved') {
  return Object.fromEntries(
    modules
      .slice(0, count)
      .map((module) => [
        module.id,
        `${prefix}: Week ${module.week} completed with learner note, score/sample, and next action.`,
      ]),
  );
}

const cases = [
  {
    id: 'class12_study_journey',
    modulesToComplete: 1,
    expectedMode: 'academic_exam_prep',
    expectPassportReady: true,
    profile: {
      name: 'Rohit',
      class_level: 'Class 12',
      education_status: 'CBSE Class 12 PCM',
      location: 'Patna',
      commute_km: 8,
      aspirations: ['Class 12 Physics and Maths good marks board exam preparation'],
      skills: ['NCERT basics'],
      device: 'Android phone',
      phone_access: 'own Android phone',
      time_available: '3 hours daily',
      earning_urgency: 'not sure',
      preferred_language: 'Hindi',
      language: 'Hindi',
      profile_complete: true,
      persona: 'board_exam_prep',
      learner_goal: { intent: 'study', type: 'class_12_exam_prep', label: 'Class 12 board exam preparation' },
      academic_goal: { type: 'class_12_exam_prep', subjects: ['Physics', 'Maths'], board: 'CBSE' },
    },
    route: {
      id: 'class12-ncert-sample-paper',
      name: 'Class 12 NCERT to sample-paper route',
      confidence: 0.89,
      distance: 'phone-first',
      time: '4 weeks starter loop',
      tradeoff: 'Best first route because it converts chapters, practice, and mistake logs into visible progress.',
    },
  },
  {
    id: 'data_science_proof_to_outreach',
    modulesToComplete: 2,
    expectedMode: 'data_science_pathway',
    expectPassportReady: true,
    profile: {
      name: 'Anshuman',
      class_level: 'BTech',
      education_status: 'Engineering college student',
      location: 'Gorakhpur',
      commute_km: 20,
      relocation_preference: 'India-wide',
      aspirations: ['Data Science job', 'data analyst internship', 'Python SQL portfolio'],
      skills: ['Python', 'SQL', 'statistics basics'],
      proof_available: ['one mini Python notebook'],
      device: 'laptop and Android phone',
      time_available: '10 hours daily',
      earning_urgency: 'after training',
      preferred_language: 'Hinglish',
      language: 'Hindi English',
      profile_complete: true,
      persona: 'college_career',
      learner_goal: { intent: 'career', type: 'college_internship_project', label: 'Data Science job pathway' },
    },
    route: {
      id: 'data-science-proof-sprint',
      name: 'Data Science project proof sprint',
      confidence: 0.9,
      distance: 'online plus India-wide outreach',
      time: '3 weeks',
      tradeoff: 'Builds portfolio proof before sending applications to founders or hiring managers.',
    },
  },
  {
    id: 'tailoring_informal_skill_passport',
    modulesToComplete: 2,
    expectedMode: 'informal_skill_validation',
    expectPassportReady: true,
    profile: {
      name: 'Shabnam',
      class_level: 'School dropout',
      education_status: 'Left school after Class 9',
      location: 'Jaipur',
      commute_km: 8,
      aspirations: ['silai tailoring certificate proof local work'],
      skills: ['blouse alteration', 'basic stitching'],
      proof_available: ['sample work at home'],
      device: 'shared family phone',
      phone_access: 'shared phone with WhatsApp voice notes',
      time_available: '1 hour daily',
      earning_urgency: '1-2 months',
      preferred_language: 'Hindi',
      language: 'Hindi',
      profile_complete: true,
      persona: 'informal_skill_rpl',
      learner_goal: { intent: 'proof_to_work', type: 'informal_skill_validation', label: 'Tailoring proof to local work' },
    },
    route: {
      id: 'tailoring-proof-passport',
      name: 'Tailoring proof to Skill Passport',
      confidence: 0.86,
      distance: 'phone-first proof capture',
      time: '3 weeks',
      tradeoff: 'Turns home stitching skill into shareable proof before any local outreach.',
    },
  },
];

async function runCase(testCase, index) {
  const checks = [];
  const phone = phoneFor(index);
  const signup = await post('/api/signup', { phone, create_new: true });
  const profile = {
    ...(signup.profile || {}),
    ...testCase.profile,
    phone,
    learner_id: signup.profile?.learner_id,
    phone_hash: signup.profile?.phone_hash,
  };

  const journeyResponse = await post('/api/journey', { profile, route: testCase.route });
  const journey = journeyResponse.journey || {};
  const modules = Array.isArray(journey.modules) ? journey.modules : [];
  const completedLessons = completedMapForModules(modules, testCase.modulesToComplete);
  const proofNotes = proofNotesForModules(modules, testCase.modulesToComplete, testCase.id);
  const progressResponse = await post('/api/progress', {
    learner_id: profile.learner_id,
    journey,
    completed_lessons: completedLessons,
    proof_notes: proofNotes,
    proof_artifacts: {},
    active_tab: 'journey',
    last_action: 'slice5_benchmark_progress_saved',
  });
  const progress = progressResponse.progress || {};
  const passportResponse = await post('/api/passport', {
    profile,
    selected_route: testCase.route,
    journey: { ...journey, progress },
    progress,
    completed_lessons: completedLessons,
    proof_notes: proofNotes,
    proof_artifacts: {},
    consent: { share_certs: true, share_informal: true, share_scores: true },
  });
  let restored = null;
  let restoreError = '';
  if (requireRestore) {
    try {
      restored = await post('/api/signup', { phone, learner_id: profile.learner_id });
    } catch (error) {
      restoreError = error.message;
    }
  }
  const firstCompletedKey = Object.keys(completedLessons)[0];
  const firstProofModule = modules[0]?.id;

  assertCheck(checks, 'journey created', Boolean(modules.length), `${modules.length} modules`);
  assertCheck(checks, 'journey has 4-week MVP contract', modules.length >= 4 && /week MVP/i.test(journey.duration?.mvp || ''), `${modules.length} modules | ${journey.duration?.mvp || ''}`);
  assertCheck(checks, 'journey contract source present', Boolean(journey.learning_contract?.week_shape && journey.learning_contract?.proof_gate), JSON.stringify(journey.learning_contract || {}));
  assertCheck(
    checks,
    'modules include complete learner-journey fields',
    modules.every((module) =>
      Array.isArray(module.daily_micro_tasks) &&
      module.daily_micro_tasks.length >= 3 &&
      Array.isArray(module.proof_tasks) &&
      module.proof_tasks.length >= 1 &&
      Boolean(module.completion_criteria) &&
      Boolean(module.low_data_alternative) &&
      Boolean(module.voice_whatsapp_version) &&
      Boolean(module.unlock_after_completion),
    ),
    JSON.stringify(modules.map((module) => ({
      id: module.id,
      micro: module.daily_micro_tasks?.length || 0,
      proof: module.proof_tasks?.length || 0,
      completion: Boolean(module.completion_criteria),
      lowData: Boolean(module.low_data_alternative),
      voice: Boolean(module.voice_whatsapp_version),
      unlock: Boolean(module.unlock_after_completion),
    }))),
  );
  assertCheck(checks, 'journey mode correct', journey.mode === testCase.expectedMode, journey.mode || '');
  if (requirePersistence) {
    assertCheck(checks, 'progress persisted ok', progressResponse.ok === true || progressResponse.proof?.persistence?.ok === true, JSON.stringify(progressResponse.proof || {}));
  } else {
    assertCheck(checks, 'progress endpoint returned state', Boolean(progressResponse.progress), JSON.stringify(progressResponse.proof || {}));
  }
  assertCheck(checks, 'completion percent above zero', Number(progress.completion_percent || 0) > 0, String(progress.completion_percent || 0));
  assertCheck(checks, 'proof notes counted', Number(progress.proof_ready_count || 0) >= testCase.modulesToComplete, String(progress.proof_ready_count || 0));
  assertCheck(checks, 'module status returned', Array.isArray(progress.module_status) && progress.module_status.length === modules.length, String(progress.module_status?.length || 0));
  assertCheck(checks, 'next action returned', Boolean(progress.next_action), progress.next_action || '');
  assertCheck(checks, 'passport readiness correct', Boolean(progress.passport_eligible) === testCase.expectPassportReady, String(progress.passport_eligible));
  assertCheck(checks, 'passport status uses progress', passportResponse.passport?.status === 'proof_ready_for_review', passportResponse.passport?.status || '');
  assertCheck(checks, 'passport has learning proof summary', Number(passportResponse.passport?.learning_proof?.completion_percent || 0) === Number(progress.completion_percent || 0), JSON.stringify(passportResponse.passport?.learning_proof || {}));
  if (requireRestore) {
    assertCheck(checks, 'restore request succeeded', Boolean(restored?.workspace), restoreError);
    assertCheck(checks, 'restored completed lesson', restored?.workspace?.completedLessons?.[firstCompletedKey] === true, firstCompletedKey || '');
    assertCheck(checks, 'restored proof note', restored?.workspace?.proofNotes?.[firstProofModule] === proofNotes[firstProofModule], firstProofModule || '');
    assertCheck(checks, 'restored progress summary', Number(restored?.workspace?.progress?.completion_percent || 0) === Number(progress.completion_percent || 0), JSON.stringify(restored?.workspace?.progress || {}));
    assertCheck(checks, 'restored journey carries progress', Number(restored?.workspace?.journey?.progress?.proof_ready_count || 0) >= testCase.modulesToComplete, JSON.stringify(restored?.workspace?.journey?.progress || {}));
    assertCheck(checks, 'restored passport learning proof', restored?.workspace?.passport?.learning_proof?.passport_eligible === true, JSON.stringify(restored?.workspace?.passport || {}));
  }

  return {
    id: testCase.id,
    phone,
    pass: checks.every((check) => check.pass),
    mode: journey.mode,
    completion: progress.completion_percent,
    proofReady: progress.proof_ready_count,
    passportStatus: passportResponse.passport?.status,
    checks,
  };
}

const startedAt = new Date().toISOString();
const results = [];
for (const [index, testCase] of cases.entries()) {
  try {
    const result = await runCase(testCase, index + 1);
    results.push(result);
    console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.id} mode=${result.mode} completion=${result.completion}% proof=${result.proofReady} passport=${result.passportStatus}`);
    result.checks.filter((check) => !check.pass).forEach((check) => console.log(`  - ${check.name}: ${check.detail}`));
  } catch (error) {
    results.push({ id: testCase.id, pass: false, error: error.message });
    console.log(`ERROR ${testCase.id}: ${error.message}`);
  }
}

const allChecks = results.flatMap((result) => result.checks || []);
const summary = {
  base,
  startedAt,
  completedAt: new Date().toISOString(),
  pass: results.every((result) => result.pass),
  totals: {
    cases: results.length,
    passed: results.filter((result) => result.pass).length,
    failed: results.filter((result) => !result.pass).length,
    checks: allChecks.length,
    failedChecks: allChecks.filter((check) => !check.pass).length,
  },
  results,
};

console.log(JSON.stringify(summary, null, 2));
if (!summary.pass) process.exit(1);
