const base = process.env.SLICE3_BASE_URL || process.env.TEST_BASE_URL || 'https://vidyasetu-mvp.vercel.app';

async function post(url, body) {
  const response = await fetch(base + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${url} ${response.status}: ${data.error || response.statusText}`);
  return data;
}

const personas = [
  {
    id: 'study_guard_class12',
    kind: 'study',
    text: 'Mera naam Rohan hai. Main Patna se Class 12 CBSE PCM student hoon. Physics Maths mein marks improve karne hain, roz 3 hours padh sakta hoon, Android phone hai.',
  },
  {
    id: 'no_location_job_guard',
    kind: 'location_guard',
    text: 'Mujhe data entry job only chahiye. Typing aati hai, resume hai, 10 km commute kar sakta hoon, phone hai, par city abhi nahi batana.',
  },
  {
    id: 'btech_ds_startup',
    kind: 'startup',
    text: 'Mera naam Anshuman hai. Main Gorakhpur ke engineering college mein hoon. Data Science job chahiye, Python SQL basics aate hain, India mein kahin bhi relocate kar sakta hoon, 10 hours daily de sakta hoon.',
  },
  {
    id: 'bcom_tally_formal',
    kind: 'formal',
    text: 'Mera naam Aman hai. Main Lucknow se BCom graduate hoon, Tally aur GST aata hai. Accounts assistant job chahiye, 15 km commute kar sakta hoon, laptop access hai.',
  },
  {
    id: 'mobile_repair_training',
    kind: 'training',
    text: 'Main Sameer Nagpur se hoon. Mujhe mobile repair training karni hai, Android phone hai, roz 1 hour practice kar sakta hoon aur 12 km commute kar sakta hoon.',
  },
  {
    id: 'tailoring_informal',
    kind: 'informal',
    text: 'Main Shabnam Jaipur se hoon. School chhod diya tha. Ghar par silai karti hoon par certificate nahi hai. Ghar ke paas kaam chahiye, 8 km tak ja sakti hoon, roz 1 hour, shared phone hai.',
  },
  {
    id: 'mushroom_enterprise',
    kind: 'enterprise',
    text: 'Main Pooja Sitapur se hoon. Ghar par mushroom farming ka chhota business start karna chahti hoon. Mere paas ek kamra hai, 15000 budget hai, loan ya scheme samajhna hai, training ke liye 15 km travel kar sakti hoon.',
  },
];

function assertCheck(checks, name, pass, detail = '') {
  checks.push({ name, pass: Boolean(pass), detail });
}

function hasFakeEmail(value) {
  return /example\.com|test\.com|yourname|fake@|demo@/i.test(JSON.stringify(value));
}

function validUuid(value = '') {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
}

async function buildProfile(persona, index) {
  const phone = `9877${String(Date.now()).slice(-4)}${String(index).padStart(2, '0')}`.slice(0, 10);
  const signup = await post('/api/signup', { phone, fresh: true });
  let profile = signup.profile || {};
  let messages = signup.messages?.length ? [...signup.messages] : [];
  messages.push({ role: 'user', content: persona.text });
  const counselor = await post('/api/counselor', {
    learner_id: profile.learner_id,
    profile,
    messages,
  });
  profile = counselor.profile;
  messages.push({ role: 'assistant', content: counselor.reply });
  return { phone, profile, messages, counselor };
}

async function buildJourneyAndPassport(profile, persona) {
  const pathway = await post('/api/pathway', { profile, question: persona.text });
  const route = pathway.routes?.[0] || null;
  if (!route) return { pathway, route: null, journey: null, passport: null };
  const journey = await post('/api/journey', { profile, route });
  const passport =
    persona.kind === 'study'
      ? null
      : await post('/api/passport', {
          profile,
          selected_route: route,
          journey: journey.journey,
          consent: { share_certs: true, share_informal: true, share_scores: false },
        });
  return { pathway, route, journey: journey.journey, passport: passport?.passport || null };
}

async function maybeResume(profile, journey, persona) {
  if (!['startup', 'formal'].includes(persona.kind)) return '';
  const resume = await post('/api/resume', { profile, journey, resumeText: '' });
  return resume.resume?.text || '';
}

function checkJobs(persona, jobs, checks) {
  const contract = jobs.opportunity_contract || jobs.search_plan?.mode_contract || {};
  assertCheck(checks, 'opportunity contract returned', Boolean(contract.engine_version), contract.engine_version || '');
  assertCheck(
    checks,
    'contract bans fabricated opportunities',
    /No fabricated|fabricated opportunity|source_url/i.test(JSON.stringify(contract)),
  );
  if (persona.kind === 'study') {
    assertCheck(checks, 'study mode blocks opportunity search', jobs.study_mode && (jobs.matches || []).length === 0);
    return;
  }
  if (persona.kind === 'location_guard') {
    assertCheck(checks, 'location guard blocks offline matching', jobs.location_required && (jobs.matches || []).length === 0);
    return;
  }

  const matches = jobs.matches || [];
  const sourceTasks = jobs.source_tasks || jobs.search_plan?.source_tasks || jobs.enterprise_plan?.source_tasks || [];
  const first = matches[0] || {};
  assertCheck(checks, 'segment present', Boolean(jobs.segment?.id), jobs.segment?.id || '');
  assertCheck(checks, 'claude primary planner declared', /claude_primary/.test(jobs.search_plan?.method || ''), jobs.search_plan?.method || '');
  if (jobs.search_plan?.planner?.ok) {
    assertCheck(checks, 'primary planner used claude when available', jobs.search_plan.planner.provider === 'anthropic', jobs.search_plan.planner.provider || '');
  }
  assertCheck(checks, 'source categories present', (jobs.search_plan?.source_categories || contract.source_categories || []).length > 0);
  assertCheck(
    checks,
    'live opportunity framework returned',
    matches.length > 0 || sourceTasks.length > 0 || Boolean(jobs.enterprise_plan),
    `matches=${matches.length} sourceTasks=${sourceTasks.length} enterprise=${Boolean(jobs.enterprise_plan)}`,
  );
  assertCheck(checks, 'summary returned', Boolean(jobs.summary?.message), jobs.summary?.message || '');
  assertCheck(checks, 'no fake email leaked', !hasFakeEmail(jobs));
  if (matches.length > 0) {
    assertCheck(checks, 'every match has source url', matches.every((match) => Boolean(match.source_url)));
    assertCheck(
      checks,
      'every match has verification stamp',
      matches.every((match) => Boolean(match.live_verified_at) || match.requires_live_verification === true),
    );
    assertCheck(checks, 'contact quality attached', matches.every((match) => match.contact_quality?.status && Number(match.contact_quality?.score) > 0));
    assertCheck(checks, 'contact pipeline attached', matches.every((match) => match.contact_pipeline?.stages?.length >= 5));
    assertCheck(checks, 'source/contact review available', matches.some((match) => match.contact_page || match.source_url || match.contact_email));
    if (jobs.proof?.persistence?.matches?.ok) {
      assertCheck(checks, 'persisted match id returned', validUuid(first.match_id || first.id), first.match_id || first.id || '');
    }
  } else {
    assertCheck(
      checks,
      'no fake card fallback when live search has no lead',
      /no fake|demo|source task|verify|verification/i.test(jobs.summary?.message || jobs.message || JSON.stringify(sourceTasks)),
      jobs.summary?.message || jobs.message || '',
    );
  }
  if (persona.kind === 'startup') {
    assertCheck(checks, 'startup segment selected', String(jobs.segment?.id || '').startsWith('startup_outreach'), jobs.segment?.id || '');
    assertCheck(checks, 'startup search asks for founder/funding', /startup|founder|funding|funded/i.test(JSON.stringify(jobs.search_plan?.queries || [])));
    assertCheck(checks, 'data role preserved', /data|analyst|science|python|sql/i.test(JSON.stringify([matches, sourceTasks, jobs.search_plan?.queries || []])));
  }
  if (persona.kind === 'formal') {
    assertCheck(
      checks,
      'formal segment selected',
      String(jobs.segment?.id || '').startsWith('formal_job') || jobs.segment?.opportunity_mode === 'formal_job',
      jobs.segment?.id || '',
    );
    assertCheck(checks, 'accounts role preserved', /account|tally|gst|finance/i.test(JSON.stringify([matches, sourceTasks, jobs.search_plan?.queries || []])));
  }
  if (persona.kind === 'training') {
    assertCheck(checks, 'training segment selected', jobs.segment?.id === 'training_to_placement', jobs.segment?.id || '');
    assertCheck(checks, 'training/apprenticeship source present', /training|skill|apprentice|mobile repair/i.test(JSON.stringify([matches, sourceTasks, jobs.search_plan?.queries || []])));
  }
  if (persona.kind === 'informal') {
    assertCheck(checks, 'informal proof segment selected', jobs.segment?.id === 'informal_proof_to_work', jobs.segment?.id || '');
    assertCheck(checks, 'proof/RPL/local work source present', /proof|rpl|msme|silai|tailor|skill/i.test(JSON.stringify([matches, sourceTasks, jobs.search_plan?.queries || []])));
  }
  if (persona.kind === 'enterprise') {
    assertCheck(checks, 'enterprise segment selected', jobs.segment?.opportunity_mode === 'self_employment_enterprise', jobs.segment?.id || '');
    assertCheck(checks, 'enterprise setup plan returned', Boolean(jobs.enterprise_plan?.starter_setup?.length), JSON.stringify(jobs.enterprise_plan || {}));
    assertCheck(checks, 'scheme and buyer verification included', /scheme|loan|buyer|supplier|KVK|DIC|MUDRA|PMEGP/i.test(JSON.stringify(jobs.enterprise_plan || {})));
  }
}

async function checkOutreachAndRestore(persona, phone, profile, jobs, passport, journey, checks) {
  if (!['startup', 'formal', 'training', 'informal'].includes(persona.kind)) return;
  const selected = jobs.matches?.[0];
  if (!selected) return;
  const safeNoSendMatch = { ...selected, contact_email: '' };
  const outreach = await post('/api/outreach', {
    profile,
    passport: passport || profile,
    journey,
    match: safeNoSendMatch,
    match_id: selected.match_id || selected.id,
    resumeText: profile.resume_text || '',
  });
  assertCheck(checks, 'outreach draft generated', Boolean(outreach.draft));
  assertCheck(checks, 'outreach pipeline returned', outreach.pipeline?.stages?.length >= 5, outreach.pipeline?.status || '');
  assertCheck(checks, 'no automatic send without email', outreach.sent?.provider === 'contact_required' && !outreach.sent?.ok, outreach.sent?.provider || '');
  assertCheck(checks, 'consent checklist returned', outreach.consent_checklist?.length >= 4);
  assertCheck(checks, 'outreach persisted', Boolean(outreach.proof?.persistence?.ok), outreach.proof?.persistence?.error || '');

  if (persona.kind === 'startup') {
    const restored = await post('/api/signup', { phone });
    assertCheck(checks, 'opportunity matches restore on login', (restored.workspace?.matches || []).length > 0);
    assertCheck(checks, 'outreach restores on login', Boolean(restored.workspace?.outreach?.draft || restored.workspace?.outreach?.payload_json));
  }
}

async function runPersona(persona, index) {
  const checks = [];
  const { phone, profile, counselor } = await buildProfile(persona, index);
  assertCheck(checks, 'counselor profile built', Boolean(profile.learner_goal?.intent), profile.learner_goal?.intent || '');
  const { pathway, journey, passport } = await buildJourneyAndPassport(profile, persona);
  if (persona.kind !== 'location_guard') {
    assertCheck(checks, 'pathway generated or guarded', pathway.routes?.length > 0 || pathway.callback_flag);
  }
  const resumeText = await maybeResume(profile, journey, persona);
  const jobs = await post('/api/jobs', {
    profile,
    passport: passport || profile,
    journey,
    resumeText,
  });
  checkJobs(persona, jobs, checks);
  await checkOutreachAndRestore(persona, phone, { ...profile, resume_text: resumeText }, jobs, passport, journey, checks);
  const pass = checks.every((check) => check.pass);
  return {
    id: persona.id,
    kind: persona.kind,
    pass,
    phone,
    intent: counselor.intent?.learner_goal?.intent || profile.learner_goal?.intent,
    goal: profile.learner_goal?.type,
    segment: jobs.segment?.id || '',
    matches: jobs.matches?.length || 0,
    provider: jobs.proof?.discovery?.provider,
    firecrawlCalls: jobs.proof?.discovery?.firecrawl_calls || 0,
    checks,
  };
}

const startedAt = new Date().toISOString();
const results = [];
for (const [index, persona] of personas.entries()) {
  try {
    const result = await runPersona(persona, index);
    results.push(result);
    console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.id} segment=${result.segment || 'n/a'} matches=${result.matches} provider=${result.provider || 'n/a'}`);
    result.checks.filter((check) => !check.pass).forEach((check) => {
      console.log(`  - ${check.name}: ${check.detail}`);
    });
  } catch (error) {
    results.push({ id: persona.id, kind: persona.kind, pass: false, error: error.message });
    console.log(`ERROR ${persona.id}: ${error.message}`);
  }
}

const summary = {
  base,
  startedAt,
  completedAt: new Date().toISOString(),
  pass: results.every((result) => result.pass),
  totals: {
    personas: results.length,
    passed: results.filter((result) => result.pass).length,
    failed: results.filter((result) => !result.pass).length,
    checks: results.reduce((sum, result) => sum + (result.checks?.length || 0), 0),
    failedChecks: results.reduce((sum, result) => sum + (result.checks || []).filter((check) => !check.pass).length, 0),
    firecrawlCalls: results.reduce((sum, result) => sum + (result.firecrawlCalls || 0), 0),
  },
  results,
};

console.log('SUMMARY_JSON ' + JSON.stringify(summary));
