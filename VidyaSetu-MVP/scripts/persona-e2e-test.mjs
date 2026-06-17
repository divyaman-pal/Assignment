const base = process.env.TEST_BASE_URL || 'http://localhost:4175';

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
    id: 'school8',
    kind: 'study',
    expectIntent: 'study',
    text: 'Mera naam Kavya hai. Main Class 8 mein hoon, Sitapur se. Mujhe Maths aur Science mein help chahiye, roz 45 minutes padh sakti hoon, mere paas mummy ka shared phone hai aur Hindi mein samjhana.',
  },
  {
    id: 'class12',
    kind: 'study',
    expectIntent: 'study',
    text: 'Mera naam Rohit hai. Main Patna se Class 12 CBSE PCM student hoon. Physics aur Maths mein good marks chahiye. Roz 3 hours de sakta hoon, Android phone hai.',
  },
  {
    id: 'dropout_tailor',
    kind: 'employability',
    expectIntent: 'proof_to_work',
    text: 'Main Shabnam hoon, Jaipur se. School chhod diya tha. Ghar par silai karti hoon par certificate nahi hai. Training ya ghar ke paas kaam chahiye, 8 km tak ja sakti hoon, roz 1 hour, shared phone hai.',
  },
  {
    id: 'iti_electrician',
    kind: 'job',
    expectIntent: 'job',
    text: 'Mera naam Deepak hai. Main Delhi se certified ITI electrician hoon, 2 saal ka experience hai. Sirf electrician job opportunities chahiye, 20 km commute kar sakta hoon, Android WhatsApp hai.',
  },
  {
    id: 'nursing_training',
    kind: 'training',
    expectIntent: 'training',
    text: 'Mera naam Pooja hai. Main Gorakhpur se hoon. Mujhe ANM/GNM nursing training chahiye, 12th pass hoon, roz 2 hours de sakti hoon, 15 km tak travel safe hai, Hindi mein content chahiye.',
  },
  {
    id: 'mobile_repair',
    kind: 'training',
    expectIntent: 'training',
    text: 'Main Sameer Nagpur se hoon. Mujhe mobile repair training karni hai, mere paas Android phone hai, roz 1 hour practice kar sakta hoon aur 12 km tak commute kar sakta hoon.',
  },
  {
    id: 'plumbing_training',
    kind: 'training',
    expectIntent: 'training',
    text: 'Main Lakshmi Tamil Nadu se hoon. School nahi gayi. Plumbing ka kaam seekhna hai, phone shared hai, roz aadha ghanta hai, ghar se 5 km safe ja sakti hoon.',
  },
  {
    id: 'btech_ds',
    kind: 'job',
    expectIntent: 'job',
    text: 'Mera naam Anshuman hai. Main Gorakhpur ke ek engineering college mein padhta hoon. Main Hindi English bol sakta hoon, mujhe Data Science mein naukri chahiye, din ke 10 se 12 hours de sakta hoon aur India mein kahin bhi job ke liye ready hoon.',
  },
  {
    id: 'btech_ds_followup',
    kind: 'job',
    expectIntent: 'job',
    text: 'Toh aap mujhe hirers se connect karoge?',
    turns: [
      'Mera naam Anshuman hai. Main Gorakhpur ke ek engineering college mein padhta hoon. Main Hindi English bol sakta hoon, mujhe Data Science mein naukri chahiye, din ke 10 se 12 hours de sakta hoon aur India mein kahin bhi job ke liye ready hoon.',
      'Toh aap mujhe hirers se connect karoge?',
    ],
  },
  {
    id: 'switch_study_to_job',
    kind: 'job',
    expectIntent: 'job',
    expectedLanguage: 'English',
    text: 'Now I also want a data entry job in Patna. I can type, I have a resume, and I can commute 10 km.',
    turns: [
      'My name is Riya. I am a Class 12 student in Patna. I need help with Maths and English, and I can study 2 hours daily.',
      'Now I also want a data entry job in Patna. I can type, I have a resume, and I can commute 10 km.',
    ],
  },
  {
    id: 'hindi_class12_question',
    kind: 'study',
    expectIntent: 'study',
    expectedScript: 'Devanagari',
    text: 'मेरा नाम साक्षी है। मैं क्लास 12 में हूँ और मुझे फिजिक्स में अच्छे नंबर चाहिए। मैं रोज़ 3 घंटे पढ़ सकती हूँ और मेरे पास Android phone है।',
  },
  {
    id: 'switch_ds_to_jee',
    kind: 'study',
    expectIntent: 'study',
    text: 'बट पहले मैं जेईई एडवांस प्रेप करके आईआईटी क्रैक करना चाहता हूँ।',
    turns: [
      'Mera naam Anshuman hai. Main Gorakhpur ke ek engineering college mein padhta hoon. Main Hindi English bol sakta hoon, mujhe Data Science mein naukri chahiye, din ke 10 se 12 hours de sakta hoon aur India mein kahin bhi job ke liye ready hoon.',
      'Offline mein main ghar se 15 se 20 kilometer tak travel kar sakta hoon aur India mein kahin bhi relocate karne ko ready hoon.',
      'बट पहले मैं जेईई एडवांस प्रेप करके आईआईटी क्रैक करना चाहता हूँ।',
    ],
  },
  {
    id: 'btech_web_intern',
    kind: 'college',
    expectIntent: 'college',
    text: 'My name is Neha. I am BTech second year student in Pune. I want web development internship or project work. I have laptop, GitHub basics, can give 3 hours daily, English and Hindi both okay.',
  },
  {
    id: 'no_location_job',
    kind: 'location_guard',
    expectIntent: 'job',
    text: 'Mujhe data entry job only chahiye. Typing aati hai, resume hai, 10 km commute kar sakta hoon, phone hai, par city abhi nahi batana.',
  },
  {
    id: 'bcom_tally',
    kind: 'job',
    expectIntent: 'job',
    text: 'Mera naam Aman hai. Main Lucknow se BCom graduate hoon, Tally aur GST aata hai. Accountant assistant job chahiye, 15 km commute kar sakta hoon, laptop access hai.',
  },
  {
    id: 'beauty_mehandi',
    kind: 'employability',
    expectIntent: 'proof_to_work',
    text: 'Main Rukmini Ranchi se hoon. Mehandi aur beauty ka kaam ghar par karti hoon, certificate nahi hai. Local salon ya wedding work chahiye, 10 km safe commute, roz 45 minutes, WhatsApp phone hai.',
  },
  {
    id: 'agri_drone',
    kind: 'career',
    expectIntent: 'career',
    text: 'Mera naam Mohan hai. Main Class 11 mein hoon, Balangir Odisha se. Mujhe agriculture, drone aur digital farm service mein interest hai. Android phone hai, Odia aur Hindi mein seekhna hai, roz 45 minutes de sakta hoon, 25 km tak travel kar sakta hoon.',
  },
  {
    id: 'open_counseling',
    kind: 'clarify',
    expectIntent: 'unknown',
    text: 'I am confused. I am from Raebareli and I do not know whether I should prepare for government exam, design, or private job. I need counseling.',
  },
  {
    id: 'remote_design',
    kind: 'job',
    expectIntent: 'job',
    text: 'My name is Iqra. I know Canva and basic graphic design. I want remote work from home or India-wide design job, no offline training. I can give 4 hours daily and have laptop and internet.',
  },
  {
    id: 'hospitality',
    kind: 'training',
    expectIntent: 'training',
    text: 'Mera naam Arif hai. Main Kolkata se hoon. Hotel cooking aur kitchen helper training chahiye, 1 hour daily, 10 km commute, phone WhatsApp hai.',
  },
  {
    id: 'driver_job',
    kind: 'job',
    expectIntent: 'job',
    text: 'Mera naam Sunil hai. Main Kanpur se hoon. Mere paas driving license hai aur 4 saal ka driver experience hai. Driver job chahiye, 25 km travel kar sakta hoon, phone hai.',
  },
  {
    id: 'bcom_final',
    kind: 'college',
    expectIntent: 'job',
    text: 'Main Priya Indore se BCom final year student hoon. Mujhe Tally GST aur finance internship/job chahiye. Roz 2 hours, laptop hai, 10 km tak commute possible hai.',
  },
  {
    id: 'no_location_training',
    kind: 'location_guard',
    expectIntent: 'training',
    text: 'Mujhe tailoring training chahiye. Roz 1 hour de sakti hoon, shared phone hai, but main apni city abhi nahi batana chahti.',
  },
  {
    id: 'class10_coding',
    kind: 'study',
    expectIntent: 'study',
    text: 'Main Aarav Class 10 student hoon, Jabalpur se. Maths aur coding dono mein help chahiye. Board exam bhi hai, roz 2 hours padh sakta hoon, Android phone hai.',
  },
  {
    id: 'informal_mechanic',
    kind: 'employability',
    expectIntent: 'proof_to_work',
    text: 'Main Imran Hyderabad se hoon. Bike mechanic ka kaam seekha hai workshop mein, certificate nahi hai. Local job ya RPL certificate chahiye, 18 km commute, roz 1 hour, phone hai.',
  },
  {
    id: 'enterprise_poultry',
    kind: 'enterprise',
    expectIntent: 'self_employment',
    text: 'Mera naam Mohan hai. Main Balangir Odisha se hoon. Apna poultry farm business start karna chahta hoon, mujhe setup, budget aur loan/scheme guidance chahiye. 15 km tak ja sakta hoon, Android phone hai, Hindi mein.',
  },
];

// Per-persona content-quality rules applied to the pathway+journey output.
// require: at least one match must be present. forbid: none may be present.
// require/requireAlso are checked against pathway routes + journey text.
// forbidInRoutes is checked against pathway ROUTE cards only (journey prose may
// legitimately say things like "no job outreach is unlocked").
const CONTENT_RULES = {
  switch_ds_to_jee: { require: /jee|iit|entrance/i, requireAlso: /mock|practice|error.?log|syllabus|concept/i, forbidInRoutes: /beauty|salon|mehandi|placement job/i },
  class12: { require: /ncert|diksha|sample paper|previous paper|revision|practice|\btest\b/i, forbidInRoutes: /salon|beautician|mehandi|placement job|data entry job/i },
  hindi_class12_question: { require: /ncert|diksha|sample paper|previous paper|revision|practice|\btest\b|परीक्षा|पेपर/i, forbidInRoutes: /salon|beautician|mehandi|placement job/i },
  class10_coding: { require: /ncert|diksha|practice|\btest\b|chapter|revision/i, forbidInRoutes: /salon|beautician|mehandi|placement job|data entry job/i },
  btech_ds: { require: /python|sql|project|portfolio|resume|github|internship|fresher|outreach|data science/i, forbidInRoutes: /beauty|salon|tailor/i },
  informal_mechanic: { require: /proof|sample|rpl|local work|apprentice|certificate/i },
  dropout_tailor: { require: /stitch|silai|tailor|sample|customer|rpl|local|proof/i },
  plumbing_training: { require: /plumb|pipe|fitting|helper|training|safety/i, forbidInRoutes: /beauty|salon|mehandi|computer basics|data entry/i },
  nursing_training: { require: /nursing|anm|gnm|patient|hygiene|centre|center/i, forbidInRoutes: /ncert|cbse|board exam|sample paper|beauty|salon|computer basics/i },
  agri_drone: { require: /agri|agriculture|drone|farm|field|service/i, forbidInRoutes: /beauty|salon|mehandi|computer basics|data entry/i },
  open_counseling: { require: /compare|choice|study|skill|job|route/i, forbidInRoutes: /beauty|salon|mehandi|placement job/i },
  enterprise_poultry: { require: /setup|budget|scheme|loan|buyer|customer|\brisk\b|mudra|30/i, forbidInRoutes: /employer outreach|hirer outreach|placement job/i },
};

const filterIds = new Set(process.argv.slice(2).filter(Boolean));
const selectedPersonas = filterIds.size ? personas.filter((persona) => filterIds.has(persona.id)) : personas;

function expectedEnough(persona, result) {
  const failures = [];
  const finalReply = result.replies?.at(-1) || result.reply || '';
  const previousReply = result.replies?.at(-2) || '';
  if (/samajh gaya\.?\s*main pehle/i.test(finalReply)) {
    failures.push('generic counselor acknowledgement leaked');
  }
  if (previousReply && finalReply.trim().toLowerCase() === previousReply.trim().toLowerCase()) {
    failures.push('counselor repeated previous reply');
  }
  if (persona.expectedLanguage === 'English' && /\b(haan|aap|mujhe|chahiye|samajh|nahi|karunga|batao)\b/i.test(finalReply)) {
    failures.push('English persona received Hinglish counselor reply');
  }
  if (persona.expectedScript === 'Devanagari' && !/[\u0900-\u097F]/.test(finalReply)) {
    failures.push('Hindi persona did not receive Devanagari reply');
  }
  if (persona.expectIntent !== 'unknown' && result.intent !== persona.expectIntent) {
    if (!(persona.expectIntent === 'career' && ['career', 'training', 'proof_to_work'].includes(result.intent))) {
      failures.push(`intent ${result.intent} != ${persona.expectIntent}`);
    }
  }
  if (persona.kind === 'location_guard') {
    if (!result.callback && !result.locationRequired && result.routeCount > 0) failures.push('expected location guardrail');
  } else if (persona.kind !== 'clarify') {
    if (result.routeCount < 1) failures.push('no route generated');
  }
  if (
    ['job', 'employability'].includes(persona.kind) &&
    !result.locationRequired &&
    (result.jobCount || 0) < 1 &&
    !result.sourceTaskCount &&
    !result.blockReason
  ) {
    failures.push('no live cards, source tasks, or readiness block for employability persona');
  }
  if (JSON.stringify(result).includes('example.com')) {
    failures.push('fake example email leaked');
  }
  if (persona.kind === 'study' && result.jobCount > 0) failures.push('study persona produced jobs');
  if (persona.kind === 'study' && !result.studyJobGuard) failures.push('study persona missing job-search guardrail');

  const rule = CONTENT_RULES[persona.id];
  if (rule && persona.kind !== 'location_guard') {
    const haystack = `${result.pathwayText || ''} ${result.journeyText || ''}`;
    if (rule.require && !rule.require.test(haystack)) {
      failures.push(`content missing required terms: ${rule.require}`);
    }
    if (rule.requireAlso && !rule.requireAlso.test(haystack)) {
      failures.push(`content missing required terms: ${rule.requireAlso}`);
    }
    if (rule.forbidInRoutes && rule.forbidInRoutes.test(result.routeCardText || result.pathwayText || '')) {
      failures.push(`route cards contain forbidden terms: ${rule.forbidInRoutes}`);
    }
  }

  if (result.routeCount > 0 && result.routesHaveExplanations === false) {
    failures.push('routes missing explanation fields (why/next/outcome/locked)');
  }

  if (result.routeCount > 0 && result.pathwayDetailsValid === false) {
    failures.push('routes missing detailed pathway contract (role/conditions/checks/journey preview)');
  }

  if (result.moduleCount > 0) {
    if (!(result.moduleCount >= 3)) failures.push('journey has fewer than 3 modules');
    if (!result.journeyModulesValid) failures.push('journey modules missing lessons/completion/lesson_details/proof/unlock');
    if (!result.journeyHasStartHere) failures.push('journey missing start_here/today_task');
    if (!result.journeyHasProofAndUnlock) failures.push('journey missing proof tasks or unlock logic');
    if (!result.journeyResourcesValid) failures.push('journey modules missing weekly learning resources');
  }
  if (persona.id === 'btech_ds' && !JSON.stringify(result).toLowerCase().includes('data science')) {
    failures.push('data science not preserved');
  }
  if (
    persona.id === 'btech_ds' &&
    /(^|[^a-z])computer basics[^.]{0,80}(course|training|route|pathway|skill course|job)|(^|[^a-z])(course|training|route|pathway|skill course)[^.]{0,80}computer basics/i.test(
      result.routeCardText || '',
    )
  ) {
    failures.push('data science route recommended computer basics');
  }
  if (persona.id === 'btech_ds' && !String(result.segment || '').startsWith('startup_outreach')) {
    failures.push(`segment ${result.segment || 'missing'} is not startup outreach`);
  }
  if (persona.id === 'switch_ds_to_jee') {
    const serialized = JSON.stringify({
      reply: result.reply,
      routes: result.routes,
      journeyMode: result.journeyMode,
      aspirations: result.aspirations,
    }).toLowerCase();
    if (result.goalType !== 'entrance_exam_prep') failures.push(`goal ${result.goalType} != entrance_exam_prep`);
    if (result.journeyMode !== 'entrance_exam_prep') failures.push(`journey ${result.journeyMode} != entrance_exam_prep`);
    if (!/jee|iit|entrance/.test(serialized)) failures.push('JEE/entrance not present in final plan');
    if (/data science job|hirer outreach|employer outreach/.test(serialized)) failures.push('old job/outreach plan leaked into JEE switch');
  }
  if (persona.id === 'switch_study_to_job') {
    if (
      result.goalType === 'school_study_support' ||
      result.journeyMode === 'school_study_support' ||
      result.journeyMode === 'academic_exam_prep'
    ) {
      failures.push('stayed in study mode after explicit job switch');
    }
    if (!/data entry|job|resume/i.test(JSON.stringify(result))) {
      failures.push('job switch details not preserved');
    }
  }
  if (persona.id === 'nursing_training') {
    if (result.journeyMode !== 'vocational_training') failures.push(`nursing journey ${result.journeyMode || 'missing'} is not vocational_training`);
    if (/ncert|cbse|board exam|sample paper/i.test(`${result.pathwayText || ''} ${result.journeyText || ''}`)) failures.push('nursing route leaked school/board-study content');
  }
  if (persona.id === 'agri_drone') {
    if (result.journeyMode !== 'vocational_training') failures.push(`agri-drone journey ${result.journeyMode || 'missing'} is not vocational_training`);
    if (/computer basics|data entry|beauty|salon/i.test(result.routeCardText || '')) failures.push('agri-drone route drifted to unrelated vocation');
  }
  if (persona.id === 'plumbing_training') {
    if (result.journeyMode !== 'vocational_training') failures.push(`plumbing journey ${result.journeyMode || 'missing'} is not vocational_training`);
    if (!/plumb|pipe|fitting/i.test(`${result.pathwayText || ''} ${result.journeyText || ''}`)) failures.push('plumbing content missing');
    if (/beauty|salon|mehandi|computer basics|data entry/i.test(result.routeCardText || '')) failures.push('plumbing route drifted to unrelated vocation');
  }
  if (persona.id === 'open_counseling') {
    if (result.journeyMode !== 'career_exploration') failures.push(`open counseling journey ${result.journeyMode || 'missing'} is not career_exploration`);
    if (!/compare|choice|study|skill|job/i.test(result.pathwayText || '')) failures.push('open counseling did not produce comparison routes');
  }
  return failures;
}

async function runPersona(persona, index) {
  const phone = `91000${String(index).padStart(5, '0')}`;
  const out = { id: persona.id, kind: persona.kind, replies: [] };
  const signup = await post('/api/signup', { phone, fresh: true });
  let profile = signup.profile || { phone };
  let messages = signup.messages?.length ? [...signup.messages] : [{ role: 'assistant', content: 'Namaste, apni zarurat bataiye.' }];
  let counselor = null;
  const turns = persona.turns?.length ? persona.turns : [persona.text];
  for (const turn of turns) {
    messages = [...messages, { role: 'user', content: turn }];
    counselor = await post('/api/counselor', {
      learner_id: profile.learner_id,
      phone_hash: `hash_${phone}`,
      profile,
      messages,
    });
    profile = counselor.profile;
    out.replies.push(counselor.reply || '');
    messages = [...messages, { role: 'assistant', content: counselor.reply }];
  }
  out.counselorProvider = counselor.proof?.counselor?.provider;
  out.counselorOk = counselor.proof?.counselor?.ok;
  out.intent = counselor.intent?.learner_goal?.intent || profile.learner_goal?.intent;
  out.goalType = counselor.intent?.learner_goal?.type || profile.learner_goal?.type;
  out.complete = counselor.profile_complete;
  out.missing = counselor.missing_fields || [];
  out.location = profile.location || '';
  out.relocation = profile.relocation_preference || '';
  out.language = profile.preferred_language || profile.language || '';
  out.aspirations = profile.aspirations || [];
  out.reply = String(counselor.reply || '').slice(0, 220);

  const pathway = await post('/api/pathway', { profile, question: persona.text || turns.at(-1) });
  out.pathwayProvider = pathway.proof?.generation?.provider;
  out.pathwayOk = pathway.proof?.generation?.ok;
  out.routeCount = pathway.routes?.length || 0;
  out.callback = Boolean(pathway.callback_flag);
  out.callbackMessage = pathway.callback_message || '';
  out.routes = (pathway.routes || []).map((route) => route.name).slice(0, 3);
  out.locationRequired = Boolean(pathway.location_required) || out.locationRequired;
  out.pathwayText = JSON.stringify(pathway.routes || []).toLowerCase();
  out.routeCardText = JSON.stringify(
    (pathway.routes || []).map((route) => ({
      name: route.name,
      title: route.title,
      tradeoff: route.tradeoff,
      source_title: route.source_title,
      income_path: route.income_path,
      first_step: route.first_step,
    })),
  ).toLowerCase();
  out.pathwayDetailsValid = (pathway.routes || []).every((route) => {
    const detail = route.pathway_detail || {};
    return (
      Boolean(detail.realistic_role) &&
      Boolean(detail.why_realistic) &&
      Boolean(
        Array.isArray(detail.learner_conditions)
          ? detail.learner_conditions.length > 0
          : detail.learner_conditions,
      ) &&
      Boolean(Array.isArray(detail.what_to_check) ? detail.what_to_check.length > 0 : detail.what_to_check) &&
      Array.isArray(detail.journey_preview) &&
      detail.journey_preview.length > 0 &&
      Boolean(detail.not_a_promise)
    );
  });
  out.routeValidation = pathway.route_validation || null;
  out.routesHaveExplanations = (pathway.routes || []).every(
    (route) => route.why_this_route && route.next_action && route.expected_outcome && route.locked_until,
  );

  const firstRoute = pathway.routes?.[0] || null;
  if (firstRoute) {
    const journey = await post('/api/journey', { profile, route: firstRoute });
    out.journeyMode = journey.journey?.mode;
    out.moduleCount = journey.journey?.modules?.length || 0;
    out.readiness = journey.journey?.readiness_score;
    const journeyModules = Array.isArray(journey.journey?.modules) ? journey.journey.modules : [];
    out.journeyText = JSON.stringify(journey.journey || {}).toLowerCase();
    out.journeyHasStartHere = Boolean(journey.journey?.start_here && journey.journey?.today_task);
    out.journeyModulesValid =
      journeyModules.length >= 3 &&
      journeyModules.every(
        (module) =>
          Array.isArray(module.lessons) &&
          module.lessons.length > 0 &&
          Boolean(module.completion_criteria) &&
          Array.isArray(module.lesson_details) &&
          module.lesson_details.length > 0 &&
          Boolean(module.proof_task) &&
          Boolean(module.unlocks),
      );
    out.journeyHasProofAndUnlock =
      journeyModules.every((module) => Boolean(module.proof_task)) &&
      journeyModules.every((module) => Boolean(module.unlocks)) &&
      Boolean(journey.journey?.progress?.placement_unlock_rule || journey.journey?.progress?.unlock_label);
    out.journeyResourcesValid =
      journeyModules.length > 0 &&
      journeyModules.every(
        (module) =>
          Array.isArray(module.resources) &&
          module.resources.length > 0 &&
          module.resources.every(
            (resource) =>
              resource &&
              resource.title &&
              /^https?:\/\//.test(resource.source_url || resource.url || '') &&
              resource.how_to_use &&
              resource.proof_to_save,
          ),
      );
    if (persona.kind !== 'study') {
      const passport = await post('/api/passport', {
        profile,
        selected_route: firstRoute,
        journey: journey.journey,
        consent: { share_certs: true, share_informal: true, share_scores: false },
      });
      out.passport = Boolean(passport.passport?.qr_token);
      const jobs = await post('/api/jobs', { profile, passport: passport.passport, journey: journey.journey });
      out.locationRequired = Boolean(jobs.location_required);
      out.segment = jobs.segment?.id;
      out.contactStatuses = (jobs.matches || []).map((match) => match.contact_status || 'missing').slice(0, 3);
      out.jobCount = jobs.matches?.length || 0;
      out.jobs = (jobs.matches || []).map((match) => match.title).slice(0, 3);
      out.sourceTaskCount = (jobs.source_tasks || jobs.search_plan?.source_tasks || []).length;
      out.blockReason = jobs.block_card?.block_reason || '';
      out.jobsProvider = jobs.proof?.discovery?.provider;
      if (jobs.matches?.length) {
        const outreach = await post('/api/outreach', {
          match: jobs.matches[0],
          passport: passport.passport,
          journey: journey.journey,
        });
        out.outreachProvider = outreach.sent?.provider;
        out.outreachStatus = outreach.reply_class?.status;
        out.outreachDraft = Boolean(outreach.draft);
      }
    } else {
      const jobs = await post('/api/jobs', { profile, passport: profile, journey: journey.journey });
      out.studyJobGuard = Boolean(jobs.study_mode);
      out.locationRequired = Boolean(jobs.location_required);
      out.jobCount = jobs.matches?.length || 0;
      out.segment = jobs.segment?.id;
      out.jobsProvider = jobs.proof?.discovery?.provider;
    }
  } else if (persona.kind === 'location_guard' || persona.kind === 'job') {
    const jobs = await post('/api/jobs', { profile, passport: profile });
    out.locationRequired = Boolean(jobs.location_required);
    out.segment = jobs.segment?.id;
    out.contactStatuses = (jobs.matches || []).map((match) => match.contact_status || 'missing').slice(0, 3);
    out.jobCount = jobs.matches?.length || 0;
    out.sourceTaskCount = (jobs.source_tasks || jobs.search_plan?.source_tasks || []).length;
    out.blockReason = jobs.block_card?.block_reason || '';
    out.jobsProvider = jobs.proof?.discovery?.provider;
  }

  out.failures = expectedEnough(persona, out);
  out.pass = out.failures.length === 0;
  return out;
}

const results = [];
for (const [index, persona] of selectedPersonas.entries()) {
  try {
    const result = await runPersona(persona, index);
    results.push(result);
    console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.id} intent=${result.intent} goal=${result.goalType} routes=${result.routeCount} jobs=${result.jobCount || 0} provider=${result.counselorProvider}/${result.pathwayProvider}/${result.jobsProvider || 'n/a'}`);
    if (!result.pass) console.log(`  failures=${result.failures.join('; ')}`);
  } catch (error) {
    const result = { id: persona.id, kind: persona.kind, pass: false, error: error.message };
    results.push(result);
    console.log(`ERROR ${result.id} ${result.error}`);
  }
}

const summary = {
  total: results.length,
  passed: results.filter((result) => result.pass).length,
  failed: results.filter((result) => !result.pass).length,
  failedIds: results
    .filter((result) => !result.pass)
    .map((result) => ({
      id: result.id,
      failures: result.failures,
      error: result.error,
      intent: result.intent,
      missing: result.missing,
    routes: result.routes,
    jobs: result.jobs,
    segment: result.segment,
    sourceTaskCount: result.sourceTaskCount,
    blockReason: result.blockReason,
    contactStatuses: result.contactStatuses,
    reply: result.reply,
    replies: result.replies,
  })),
  providerCounts: results.reduce((acc, result) => {
    const key = `${result.counselorProvider || 'none'}|${result.pathwayProvider || 'none'}|${result.jobsProvider || 'none'}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}),
  compact: results.map((result) => ({
    id: result.id,
    pass: result.pass,
    intent: result.intent,
    goalType: result.goalType,
    complete: result.complete,
    missing: result.missing,
    location: result.location,
    relocation: result.relocation,
    language: result.language,
    routes: result.routeCount,
    journey: result.journeyMode,
    jobs: result.jobCount || 0,
    sourceTasks: result.sourceTaskCount || 0,
    blockReason: result.blockReason || '',
    segment: result.segment,
    contacts: result.contactStatuses,
    studyJobGuard: result.studyJobGuard || false,
    locationRequired: result.locationRequired || false,
    counselor: result.counselorProvider,
    pathway: result.pathwayProvider,
    jobsProvider: result.jobsProvider,
  })),
};

console.log('SUMMARY_JSON ' + JSON.stringify(summary));
