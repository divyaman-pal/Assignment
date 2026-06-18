import { methodNotAllowed, readJson, sendJson } from './_lib/http.js';
import { insertRows, patchRows } from './_lib/supabase.js';
import { scoreJobs } from './_lib/mvp.js';
import { callClaudeJson, discoverWithFirecrawl, discoverWithOpenAIWeb } from './_lib/services.js';
import { phrase } from './_lib/language.js';

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const ENGINE_VERSION = 'live_opportunity_engine_v1';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const body = await readJson(req);
    const profile = body.profile || {};
    const passport = body.passport || {};
    const journey = body.journey || null;
    const resumeText = String(body.resumeText || '').trim();
    const goal = profile.learner_goal || {};

    if (goal.intent === 'study') {
      const segment = segmentFor(profile, resumeText);
      return sendJson(res, 200, {
        jobs: [],
        matches: [],
        location_required: false,
        study_mode: true,
        segment,
        opportunity_contract: buildModeContract({ profile, segment, resumeProfile: {}, searchPlan: {} }),
        block_card: buildDiscoveryBlockCard({ profile, segment, resumeProfile: {}, passport, searchPlan: {} }),
        message: phrase(profile, profile.academic_goal?.target || '', 'study_ready', {
          focus: profile.academic_goal?.subjects?.join(', ') || profile.class_level || 'study',
        }),
        recommended_next_step: phrase(profile, '', 'career_switch', {}),
        proof: { discovery: { ok: true, provider: 'study_guardrail', error: null } },
      });
    }

    const hasJobMobility = goal.intent === 'job' && profile.relocation_preference;
    if ((goal.needs_location_for_offline || ['job', 'training', 'proof_to_work', 'career', 'self_employment'].includes(goal.intent)) && !profile.location && !hasJobMobility) {
      const segment = segmentFor(profile, resumeText);
      return sendJson(res, 200, {
        jobs: [],
        matches: [],
        location_required: true,
        segment,
        opportunity_contract: buildModeContract({ profile, segment, resumeProfile: {}, searchPlan: {} }),
        block_card: {
          block_reason: 'location',
          missing_field: 'location_district',
          pending_action: 'ask_location_and_commute',
          message: phrase(profile, '', 'need_location', {}),
          unlock_hint: 'Ask for district/city and safe commute range before offline/local search.',
          alternatives_available: ['online learning', 'remote-only search if relevant', 'resume/proof preparation'],
        },
        message: phrase(profile, '', 'need_location', {}),
        proof: { discovery: { ok: true, provider: 'location_guardrail', error: null } },
      });
    }

    const segment = segmentFor(profile, resumeText);
    const resumeProfile = buildResumeProfile(profile, resumeText, journey, passport);
    const deterministicSearchPlan = buildSearchPlan({ profile, segment, resumeProfile, query: body.query });
    const searchPlan = await refineSearchPlanWithPrimaryLLM({
      profile,
      segment,
      resumeProfile,
      searchPlan: deterministicSearchPlan,
    });
    const blockCard = buildDiscoveryBlockCard({ profile, segment, resumeProfile, passport, searchPlan });
    const enterprisePlan = segment.opportunity_mode === 'self_employment_enterprise'
      ? buildEnterprisePlan({ profile, segment, resumeProfile, searchPlan })
      : null;

    if (blockCard) {
      const summary = buildBlockedOpportunitySummary({ segment, searchPlan, blockCard, enterprisePlan });
      const opportunityMeta = {
        segment,
        resume_profile: resumeProfile,
        search_plan: searchPlan,
        opportunity_contract: searchPlan.mode_contract,
        source_tasks: searchPlan.source_tasks,
        enterprise_plan: enterprisePlan,
        block_card: blockCard,
        unlock_state: buildUnlockState({ profile, segment, resumeProfile, passport, matches: [] }),
        summary,
        updated_at: new Date().toISOString(),
      };
      let learnerPersistence = { ok: false, error: null };
      if (profile.learner_id) {
        learnerPersistence = await patchRows('learners', { id: profile.learner_id }, {
          profile_json: {
            ...profile,
            resume_text: resumeText || profile.resume_text || '',
            opportunity_meta: opportunityMeta,
            last_active_tab: 'jobs',
            last_action: 'opportunity_search_blocked_until_ready',
            updated_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        });
      }
      return sendJson(res, 200, {
        jobs: [],
        matches: [],
        segment,
        resume_profile: resumeProfile,
        search_plan: searchPlan,
        opportunity_contract: searchPlan.mode_contract,
        source_tasks: searchPlan.source_tasks,
        enterprise_plan: enterprisePlan,
        block_card: blockCard,
        unlock_state: opportunityMeta.unlock_state,
        summary,
        message: summary.message,
        recommended_next_step: summary.next_action,
        proof: {
          discovery: {
            ok: true,
            provider: 'blocked_by_opportunity_contract',
            reasoning_provider: searchPlan.planner?.provider || 'deterministic_contract',
            error: null,
            live_results: 0,
            firecrawl_calls: 0,
            credit_mode: searchPlan.credit_mode,
          },
          persistence: {
            jobs: { ok: true, table: 'jobs', error: null },
            matches: { ok: true, table: 'matches', error: null },
            learner_memory: { ok: learnerPersistence.ok, table: 'learners.profile_json', error: learnerPersistence.error },
          },
        },
      });
    }

    const discoveries = await runCreditSafeDiscovery(searchPlan, { segment, deepContactSearch: Boolean(body.deepContactSearch) });
    const webResults = uniqueResults(discoveries.flatMap((item) => item.data || []));
    const liveLeads = webResults.flatMap((item, index) => resultToLead(item, index, { profile, segment, resumeProfile }));
    const jobs = profileAwareJobs(liveLeads, profile, segment, resumeProfile).slice(0, 6);
    const matches = scoreJobs(jobs, passport, profile).map((match, index) =>
      decorateOpportunityMatch(match, index, { profile, passport, segment, resumeProfile }),
    );

    const jobPersistence = jobs.length
      ? await insertRows(
          'jobs',
          jobs.map((job) => ({
            source_url: job.source_url,
            employer: job.employer,
            title: job.title,
            wage: job.wage,
            constraints: job.constraints || [],
            raw_json: job,
          })),
        )
      : { ok: true, data: [], error: null };

    const matchRows = matches.map((match, index) => ({
      learner_id: profile.learner_id || null,
      job_id: jobPersistence.ok ? jobPersistence.data?.[index]?.id : null,
      score: match.score,
      reasons: match.reasons,
      status: 'matched',
    }));
    const matchPersistence = matchRows.length ? await insertRows('matches', matchRows) : { ok: true, data: [], error: null };
    const persistedMatches = matches.map((match, index) => {
      const matchRow = matchPersistence.ok ? matchPersistence.data?.[index] : null;
      const jobRow = jobPersistence.ok ? jobPersistence.data?.[index] : null;
      return {
        ...match,
        id: matchRow?.id || match.id,
        match_id: matchRow?.id || null,
        lead_id: match.lead_id || match.id,
        job_id: jobRow?.id || null,
      };
    });
    const summary = buildOpportunitySummary({
      matches: persistedMatches,
      segment,
      discoveries,
      webResults,
      searchPlan,
      enterprisePlan,
    });
    const opportunityMeta = {
      segment,
      resume_profile: resumeProfile,
      search_plan: searchPlan,
      opportunity_contract: searchPlan.mode_contract,
      source_tasks: searchPlan.source_tasks,
      enterprise_plan: enterprisePlan,
      unlock_state: buildUnlockState({ profile, segment, resumeProfile, passport, matches: persistedMatches }),
      summary,
      updated_at: new Date().toISOString(),
    };
    let learnerPersistence = { ok: false, error: null };
    if (profile.learner_id) {
      learnerPersistence = await patchRows('learners', { id: profile.learner_id }, {
        profile_json: {
          ...profile,
          resume_text: resumeText || profile.resume_text || '',
          opportunity_meta: opportunityMeta,
          last_active_tab: 'jobs',
          last_action: 'opportunity_search_completed',
          updated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      });
    }

    return sendJson(res, 200, {
      jobs,
      matches: persistedMatches,
      segment,
      resume_profile: resumeProfile,
      search_plan: searchPlan,
      opportunity_contract: searchPlan.mode_contract,
      source_tasks: searchPlan.source_tasks,
      enterprise_plan: enterprisePlan,
      unlock_state: opportunityMeta.unlock_state,
      summary,
      message: summary.message,
      recommended_next_step: summary.next_action,
      proof: {
        discovery: {
          ok: discoveries.some((item) => item.ok),
          provider: discoveries.find((item) => item.ok)?.provider || discoveries[0]?.provider || 'fallback',
          reasoning_provider: searchPlan.planner?.provider || 'deterministic_contract',
          error: discoveries.find((item) => item.error)?.error || null,
          live_results: webResults.length,
          firecrawl_calls: discoveries.filter((item) => String(item.provider || '').startsWith('firecrawl')).length,
          credit_mode: searchPlan.credit_mode,
        },
        persistence: {
          jobs: { ok: jobPersistence.ok, table: 'jobs', error: jobPersistence.error },
          matches: { ok: matchPersistence.ok, table: 'matches', error: matchPersistence.error },
          learner_memory: { ok: learnerPersistence.ok, table: 'learners.profile_json', error: learnerPersistence.error },
        },
      },
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}

async function refineSearchPlanWithPrimaryLLM({ profile = {}, segment = {}, resumeProfile = {}, searchPlan = {} }) {
  const fallback = {
    queries: searchPlan.queries || [],
    source_categories: searchPlan.source_categories || [],
    verification_rules: searchPlan.verification_rules || [],
    scoring_rules: searchPlan.scoring_rules || [],
    no_result_fallback_actions: searchPlan.no_result_fallback_actions || [],
    risk_filters: searchPlan.risk_filters || [],
    planner_notes: [
      'Use deterministic opportunity contract if the primary model is unavailable.',
      'Do not emit named companies, contacts, jobs, schemes, seats, buyers, or suppliers in the plan.',
    ],
  };

  const generated = await callClaudeJson({
    fallback,
    maxTokens: 1100,
    system:
      'You are VidyaSetu opportunity-engine planner. Claude is the primary reasoning model. Plan live discovery only; never invent or name any concrete company, person, email, job, course seat, buyer, supplier, scheme approval, salary, or deadline. Return JSON with only strategies, source categories, verification rules, scoring rules, no-result actions, risk filters, and optional improved search queries.',
    prompt: `Opportunity mode:\n${JSON.stringify(segment)}\n\nLearner profile:\n${JSON.stringify(profile)}\n\nResume/proof profile:\n${JSON.stringify(resumeProfile)}\n\nDeterministic search plan:\n${JSON.stringify(searchPlan)}\n\nReturn JSON: {"queries":string[],"source_categories":string[],"verification_rules":string[],"scoring_rules":string[],"no_result_fallback_actions":string[],"risk_filters":string[],"planner_notes":string[]}.`,
  });

  const data = generated.data || fallback;
  const cleanQueries = safePlanList(data.queries).filter((query) => !looksLikeConcreteOpportunity(query));
  const merged = {
    ...searchPlan,
    queries: (cleanQueries.length ? cleanQueries : searchPlan.queries || []).slice(0, 2),
    source_categories: mergePlanLists(searchPlan.source_categories, data.source_categories),
    verification_rules: mergePlanLists(searchPlan.verification_rules, data.verification_rules),
    scoring_rules: mergePlanLists(searchPlan.scoring_rules, data.scoring_rules),
    no_result_fallback_actions: mergePlanLists(searchPlan.no_result_fallback_actions, data.no_result_fallback_actions),
    risk_filters: mergePlanLists(searchPlan.risk_filters, data.risk_filters),
    planner_notes: safePlanList(data.planner_notes).slice(0, 5),
    planner: {
      ok: generated.ok,
      provider: generated.provider,
      model: generated.model || null,
      fallback_chain: generated.fallback_chain || [],
      error: generated.error || null,
    },
  };
  return {
    ...merged,
    mode_contract: buildModeContract({ profile, segment, resumeProfile, searchPlan: merged }),
  };
}

function safePlanList(value = []) {
  return (Array.isArray(value) ? value : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 10);
}

function mergePlanLists(primary = [], secondary = []) {
  return [...new Set([...safePlanList(primary), ...safePlanList(secondary)])].slice(0, 10);
}

function looksLikeConcreteOpportunity(text = '') {
  return /@|(?:\+91|\b\d{10}\b)|salary|interview guaranteed|confirmed seat|guaranteed job|approved loan/i.test(String(text));
}

function buildModeContract({ profile = {}, segment = {}, resumeProfile = {}, searchPlan = {} }) {
  const mode = segment.opportunity_mode || segment.id || 'pending';
  return {
    engine_version: ENGINE_VERSION,
    mode,
    cardinal_rule: 'No fabricated opportunity, contact, course seat, scheme, buyer, supplier, salary, deadline, or loan approval.',
    live_result_requirements: [
      'Every concrete result must come from live search at request time or a fresh cache entry.',
      'Every result must include source_url.',
      'Every result must include live_verified_at or requires_live_verification=true.',
      'Uncertain contacts, inferred emails, schemes, fees, deadlines, salaries, buyers, and suppliers remain marked to verify.',
    ],
    required_profile_fields: requiredFieldsForMode(mode),
    unlock_condition: unlockConditionForMode(mode, segment),
    block_conditions: blockConditionsForMode(mode),
    source_categories: searchPlan.source_categories?.length ? searchPlan.source_categories : sourceCategoriesForMode(mode),
    verification_rules: searchPlan.verification_rules?.length ? searchPlan.verification_rules : verificationRulesForMode(mode),
    scoring_rules: searchPlan.scoring_rules?.length ? searchPlan.scoring_rules : scoringRulesForMode(mode),
    result_schema_fields: resultSchemaFieldsForMode(mode),
    cache_policy: {
      ttl_hours: cacheTtlHoursForMode(mode),
      lazy_discovery: true,
      search_before_scrape: true,
      max_fetches_per_call: 15,
      firecrawl_policy: 'Use only for shortlisted contact-heavy pages or official verification when broad search is insufficient.',
    },
    consent_policy: {
      needed_to_view_results: false,
      needed_before_contact_or_sharing: true,
      consent_scope: 'per recipient, data, purpose, and action',
      blanket_consent_allowed: false,
    },
    no_result_fallback: {
      actions: searchPlan.no_result_fallback_actions?.length
        ? searchPlan.no_result_fallback_actions
        : fallbackActionsForMode(mode),
      message: 'Show what was searched, what could not be verified, and the safest next action. Never fill empty space with fake cards.',
    },
    safety_filters: searchPlan.risk_filters?.length ? searchPlan.risk_filters : riskFiltersForMode(mode),
    profile_facts_used: {
      goal: profile.learner_goal?.label || profile.learner_goal?.intent || 'pending',
      location: profile.location || profile.relocation_preference || 'pending',
      commute_km: profile.commute_km || null,
      target_roles: resumeProfile.target_roles || [],
      proof: resumeProfile.proof || profile.proof_available || [],
    },
  };
}

function requiredFieldsForMode(mode = '') {
  const common = ['goal', 'language'];
  if (mode === 'study_only') return ['class/education', 'language', 'target_exam_if_any'];
  if (mode === 'professional_outreach') return [...common, 'target_role', 'resume', 'project_or_proof', 'location_or_remote_preference', 'outreach_consent_before_send'];
  if (mode === 'local_employment') return [...common, 'trade_or_skill', 'location_district', 'commute_range_km', 'proof_or_certificate_status', 'shift_safety_constraints'];
  if (mode === 'training_course') return [...common, 'target_skill', 'location_or_online_preference', 'eligibility_education', 'budget', 'daily_time'];
  if (mode === 'apprenticeship') return [...common, 'trade_or_field', 'education', 'location_for_offline_hosts', 'documents', 'consent_before_contact'];
  if (mode === 'self_employment_enterprise') return [...common, 'enterprise_idea', 'location', 'space_resources', 'capital_or_loan_need', 'existing_skill', 'risk_tolerance'];
  if (mode === 'scheme_or_loan_support') return [...common, 'underlying_plan', 'location', 'eligibility_info'];
  if (mode === 'proof_first_rpl' || mode === 'informal_work') return [...common, 'skill', 'proof_available', 'location', 'availability', 'safety_constraints'];
  if (mode === 'blocked_until_resume_or_proof') return ['resume_or_proof_item'];
  if (mode === 'blocked_until_location') return ['location_district', 'commute_range_km_if_offline'];
  return [...common, 'location_or_remote_preference', 'proof_or_resume_status'];
}

function unlockConditionForMode(mode = '', segment = {}) {
  if (mode === 'professional_outreach') return 'Resume ready plus at least one truthful project/proof; sending requires scoped consent.';
  if (mode === 'local_employment') return 'District and commute are present; skill/proof status is known; contact requires scoped consent.';
  if (mode === 'training_course') return 'Target skill is known; offline routes require location; accredited source must be verifiable.';
  if (mode === 'self_employment_enterprise') return 'Enterprise idea, location, space/resources, budget/loan need, and risk checks are known before scheme/loan advice.';
  if (mode === 'study_only') return 'Always safe for study personas; employment/search modules stay locked until explicit switch.';
  if (segment.resume_required) return 'Resume or proof must be produced before discovery.';
  return 'Profile has enough goal, location/remote scope, and proof context to search safely.';
}

function blockConditionsForMode(mode = '') {
  const blocks = ['No contact/send action without scoped consent.', 'No result card without source_url.'];
  if (['local_employment', 'training_course', 'proof_first_rpl', 'informal_work', 'self_employment_enterprise'].includes(mode)) {
    blocks.push('Offline/local discovery is blocked until district/city is known.');
  }
  if (['professional_outreach', 'formal_job', 'blocked_until_resume_or_proof'].includes(mode)) {
    blocks.push('Professional outreach is blocked until resume/proof is ready.');
  }
  if (mode === 'self_employment_enterprise') {
    blocks.push('Never emit job cards for enterprise intent; build setup, buyer/supplier, scheme, and risk verification tasks.');
  }
  return blocks;
}

function sourceCategoriesForMode(mode = '') {
  if (mode === 'professional_outreach') return ['company career pages', 'startup/company directories', 'funding/news signals', 'official job platforms', 'public team/about/contact pages'];
  if (mode === 'local_employment') return ['NCS', 'Apprenticeship India', 'local employer directories', 'MSME/industrial cluster sources', 'shop/clinic/salon/logistics public pages'];
  if (mode === 'training_course') return ['Skill India Digital', 'NSDC', 'eSkill India', 'PMKVY-linked listings', 'state skill missions', 'ITI/polytechnic/accredited providers'];
  if (mode === 'apprenticeship') return ['NAPS/Apprenticeship India', 'NATS', 'Skill India', 'state skill missions', 'local ITI/polytechnic sources'];
  if (mode === 'self_employment_enterprise') return ['KVK', 'DIC', 'official scheme portals', 'banks/CSC', 'local buyer/supplier public sources', 'sector training sources'];
  if (mode === 'scheme_or_loan_support') return ['PMEGP/KVIC', 'MUDRA', 'PMFME', 'National Livestock Mission', 'state scheme portals', 'DIC', 'official bank/CSC guidance'];
  return ['official portals', 'reputable public web', 'local source pages', 'source tasks'];
}

function verificationRulesForMode(mode = '') {
  const rules = [
    'Source authenticity: official, registered, reputable, or public source page.',
    'Freshness: result is fresh within mode TTL or marked requires_live_verification.',
    'Relevance: role/skill/trade/enterprise must match learner profile.',
    'Safety: reject upfront-fee, guaranteed-job, guaranteed-loan, and exploitative signals.',
  ];
  if (mode === 'professional_outreach') rules.push('Public contact only; inferred emails are marked to verify and never auto-sent.');
  if (mode === 'local_employment') rules.push('Commute and shift/safety constraints are hard filters.');
  if (mode === 'training_course') rules.push('Accreditation/cost/eligibility must be verified before recommending travel or fees.');
  if (mode === 'self_employment_enterprise') rules.push('Costs, schemes, buyers, suppliers, and income assumptions are informational and require local verification.');
  return rules;
}

function scoringRulesForMode(mode = '') {
  if (mode === 'professional_outreach') return ['0.30 role fit', '0.20 stage/company fit', '0.20 location/remote fit', '0.15 hiring signal recency', '0.15 contactability'];
  if (mode === 'local_employment') return ['0.30 commute fit', '0.25 proof fit', '0.25 safety/constraint compliance', '0.10 legitimacy', '0.10 freshness'];
  if (mode === 'training_course') return ['0.30 eligibility fit', '0.25 cost fit', '0.20 location/mode fit', '0.15 accreditation', '0.10 freshness'];
  if (mode === 'apprenticeship') return ['0.30 eligibility fit', '0.25 location/online fit', '0.20 stipend/relevance', '0.15 deadline validity', '0.10 freshness'];
  if (mode === 'self_employment_enterprise') return ['0.40 enterprise relevance', '0.30 locality fit', '0.30 source authenticity'];
  return ['relevance', 'verification strength', 'location/constraint fit', 'freshness'];
}

function resultSchemaFieldsForMode(mode = '') {
  const envelope = ['result_id', 'title', 'type', 'source_name', 'source_url', 'location_relevance', 'why_matched', 'required_proof', 'missing_requirements', 'confidence_score', 'live_verified_at', 'requires_live_verification', 'next_action', 'consent_required', 'risk_warning'];
  if (mode === 'professional_outreach') return [...envelope, 'company_name', 'role_context', 'company_score', 'contact', 'draft_message', 'attachments_pending_consent'];
  if (mode === 'local_employment') return [...envelope, 'employer_or_source', 'category', 'distance_km', 'commute_fit', 'constraint_compliant', 'required_documents', 'contact_script'];
  if (mode === 'training_course') return [...envelope, 'provider', 'mode', 'duration', 'cost', 'eligibility', 'documents', 'deadline', 'accreditation'];
  if (mode === 'self_employment_enterprise') return ['enterprise_setup_plan', ...envelope, 'starter_setup', 'cost_heads', 'buyer_channels', 'supplier_channels', 'scheme_candidates', 'risks'];
  return envelope;
}

function cacheTtlHoursForMode(mode = '') {
  if (['training_course', 'apprenticeship', 'self_employment_enterprise'].includes(mode)) return 72;
  if (mode === 'scheme_or_loan_support') return 168;
  return 24;
}

function fallbackActionsForMode(mode = '') {
  if (mode === 'professional_outreach') return ['Use official application channel if available', 'Broaden sector or region with learner permission', 'Save search and retry later', 'Route back to proof/resume strengthening'];
  if (mode === 'local_employment') return ['Ask permission to broaden commute radius', 'Check apprenticeship/training route', 'Save search and notify later', 'Do not show unverified employers'];
  if (mode === 'training_course') return ['Show official portals to monitor', 'Offer online alternative', 'Save search and notify later', 'Do not claim a seat or deadline'];
  if (mode === 'self_employment_enterprise') return ['Verify KVK/DIC/bank/official portal locally', 'Use buyer/supplier category checklist', 'Run small pilot before investment', 'Do not promise profit or loan approval'];
  return ['Ask for missing profile field', 'Show source categories tried', 'Save search and notify later'];
}

function riskFiltersForMode(mode = '') {
  const filters = ['upfront fee or deposit demand', 'guaranteed job/income/loan claim', 'private/gated contact scraping', 'missing source URL'];
  if (mode === 'local_employment') filters.push('night shift or over-commute when learner has safety constraints');
  if (mode === 'training_course') filters.push('unaccredited guaranteed-placement institute');
  if (mode === 'self_employment_enterprise') filters.push('profit guarantee', 'loan approval guarantee', 'large investment before pilot');
  return filters;
}

function buildDiscoveryBlockCard({ profile = {}, segment = {}, resumeProfile = {}, passport = {}, searchPlan = {} }) {
  const mode = segment.opportunity_mode || segment.id;
  if (profile.learner_goal?.intent === 'study' || mode === 'study_only') {
    return {
      block_reason: 'study_only',
      missing_field: '',
      pending_action: 'continue_learning_journey',
      message: 'This learner is in study mode. Opportunity discovery stays locked until the learner explicitly asks for job, internship, training, or enterprise counseling.',
      unlock_hint: 'Switch through the counselor if the learner now wants employability support.',
      alternatives_available: ['learning_journey', 'progress_tracking', 'exam_or_subject_support'],
    };
  }
  if (segment.resume_required && resumeProfile.gaps?.length) {
    return {
      block_reason: 'resume_or_proof',
      missing_field: 'resume_or_project_proof',
      pending_action: 'build_resume_or_proof',
      message: 'Professional outreach is locked because the learner does not yet have a usable resume/proof artifact.',
      unlock_hint: 'Build a truthful resume from the profile or complete a proof task before live company/contact discovery.',
      shortest_path_to_proof: ['Generate resume from counselor profile', 'Add one project/sample/certificate', 'Create Skill Passport', 'Run live opportunity search again'],
      current_confidence: resumeProfile.gaps?.length ? 0.4 : 0.72,
      source_tasks: searchPlan.source_tasks || [],
    };
  }
  if (mode === 'proof_first_rpl' && !passport.qr_token && !passport.informal?.length && !profile.proof_available?.length) {
    return {
      block_reason: 'resume_or_proof',
      missing_field: 'proof_or_sample_work',
      pending_action: 'capture_skill_proof',
      message: 'Local work discovery is locked until the learner has a proof note, sample work, certificate, or worker-reviewed Skill Passport.',
      unlock_hint: 'Capture one photo/note/sample of work or build an RPL/proof journey first.',
      shortest_path_to_proof: ['Create proof task', 'Get worker/counselor review', 'Generate Skill Passport', 'Search local leads'],
      current_confidence: 0.35,
      source_tasks: searchPlan.source_tasks || [],
    };
  }
  return null;
}

function buildBlockedOpportunitySummary({ segment = {}, searchPlan = {}, blockCard = {}, enterprisePlan = null }) {
  return {
    total: 0,
    verified_contacts: 0,
    source_review_needed: 0,
    blocked_contacts: 0,
    source_tasks: searchPlan.source_tasks?.length || enterprisePlan?.source_tasks?.length || 0,
    mode: segment.opportunity_mode || segment.id,
    provider: 'blocked_by_opportunity_contract',
    reasoning_provider: searchPlan.planner?.provider || 'deterministic_contract',
    live_results: 0,
    firecrawl_calls: 0,
    credit_mode: searchPlan.credit_mode,
    contract_version: ENGINE_VERSION,
    message: `${segment.label || 'Opportunity engine'} is blocked by the live-discovery contract: ${blockCard.message}`,
    next_action: blockCard.unlock_hint || 'Complete the missing readiness field, then run live verification again.',
  };
}

function decorateOpportunityMatch(match = {}, index = 0, { profile, passport, segment, resumeProfile }) {
  const contactQuality = buildContactQuality(match, segment);
  const consentReady = hasPlacementConsent(passport, segment);
  const proofReady = proofReadyForSegment({ match, profile, passport, segment, resumeProfile });
  const contactPipeline = buildContactPipeline({
    match,
    contactQuality,
    consentReady,
    proofReady,
    resumeReady: !segment.resume_required || resumeProfile.gaps?.length === 0,
  });
  return {
    ...match,
    lead_id: match.id,
    segment_id: segment.id,
    pipeline_status: index === 0 ? 'best_fit' : 'shortlisted',
    outreach_ready: contactPipeline.send_ready || contactPipeline.draft_ready,
    resume_required: segment.resume_required,
    proof_ready: proofReady,
    consent_ready: consentReady,
    contact_quality: contactQuality,
    contact_pipeline: contactPipeline,
    next_contact_action: contactPipeline.next_action,
    source_badges: sourceBadges(match, segment, contactQuality),
  };
}

function buildContactQuality(match = {}, segment = {}) {
  const url = match.contact_page || match.source_url || '';
  const sourceType = sourceTypeFromUrl(url, match.source_title, segment);
  const hasEmail = Boolean(match.contact_email);
  const hasSource = Boolean(url);
  const score = hasEmail ? 95 : hasSource ? (sourceType === 'public_search' ? 58 : 74) : 20;
  const status = hasEmail
    ? 'verified_public_email'
    : hasSource
      ? 'source_review_needed'
      : 'contact_missing';
  return {
    status,
    score,
    source_type: sourceType,
    evidence: [
      match.source_title || '',
      url ? domainName(url) : '',
      hasEmail ? 'public email found' : '',
    ].filter(Boolean),
    warning: hasEmail
      ? 'Email appears in the public source. Confirm consent before sending.'
      : hasSource
        ? 'Open the source page and verify a public email/contact before sending.'
        : 'No public source available; do not send outreach yet.',
  };
}

function buildContactPipeline({ match = {}, contactQuality = {}, consentReady = false, proofReady = false, resumeReady = false }) {
  const hasSource = Boolean(match.contact_page || match.source_url);
  const hasEmail = Boolean(match.contact_email);
  const stages = [
    { key: 'matched', label: 'Fit scored', state: 'done' },
    { key: 'source', label: 'Source found', state: hasSource ? 'done' : 'blocked' },
    { key: 'contact', label: hasEmail ? 'Contact verified' : hasSource ? 'Contact review' : 'Contact missing', state: hasEmail ? 'done' : hasSource ? 'review' : 'blocked' },
    { key: 'proof', label: proofReady && resumeReady ? 'Proof ready' : 'Proof review', state: proofReady && resumeReady ? 'done' : 'review' },
    { key: 'consent', label: consentReady ? 'Consent checked' : 'Consent review', state: consentReady ? 'done' : 'review' },
    { key: 'draft', label: 'Draft possible', state: hasSource || hasEmail ? 'ready' : 'blocked' },
    { key: 'send', label: hasEmail ? 'Send possible' : 'Send blocked', state: hasEmail ? 'ready' : 'blocked' },
  ];
  const nextAction = hasEmail
    ? 'Prepare consent-limited draft. Send only after final learner approval.'
    : hasSource
      ? 'Open the source page, verify a public contact email, or add a manual verified email.'
      : 'Search another source before outreach.';
  return {
    stages,
    draft_ready: hasSource || hasEmail,
    send_ready: hasEmail,
    next_action: nextAction,
    contact_status: contactQuality.status,
  };
}

function hasPlacementConsent(passport = {}, segment = {}) {
  if (segment.id === 'study_only') return false;
  const consent = passport.consent || {};
  return Boolean(consent.share_certs || consent.share_informal || consent.share_scores || passport.qr_token);
}

function proofReadyForSegment({ profile = {}, passport = {}, segment = {}, resumeProfile = {} }) {
  if (segment.resume_required) return !resumeProfile.gaps?.length;
  if (segment.id === 'informal_proof_to_work') {
    return Boolean(passport.qr_token || passport.informal?.length || profile.proof_available?.length);
  }
  if (segment.id === 'training_to_placement') return Boolean(profile.aspirations?.length || profile.skills?.length);
  return Boolean(passport.qr_token || profile.proof_available?.length || profile.skills?.length);
}

function sourceBadges(match = {}, segment = {}, contactQuality = {}) {
  return [
    segment.label,
    contactQuality.source_type?.replace(/_/g, ' '),
    match.funding_stage,
    match.contact_email ? 'email found' : 'source review',
  ].filter(Boolean).slice(0, 4);
}

function sourceTypeFromUrl(url = '', title = '', segment = {}) {
  const text = `${url} ${title}`.toLowerCase();
  if (/ncs\.gov\.in/.test(text)) return 'official_job_portal';
  if (/skillindiadigital|pmkvy|nsdc/.test(text)) return 'official_training_source';
  if (/apprenticeshipindia/.test(text)) return 'official_apprenticeship_source';
  if (/inc42|yourstory|techcrunch|funding|raises|funded/.test(text)) return 'startup_funding_news';
  if (/wellfound|greenhouse|lever|careers|jobs/.test(text)) return 'job_board_or_careers';
  if (/udyam|msme/.test(text)) return 'msme_reference';
  if (/google\.com\/search/.test(text)) return 'public_search';
  if (segment.id?.startsWith('startup')) return 'startup_source';
  return url ? 'public_web_source' : 'missing_source';
}

function buildOpportunitySummary({ matches = [], segment = {}, discoveries = [], webResults = [], searchPlan = {}, enterprisePlan = null }) {
  const verified = matches.filter((match) => match.contact_email).length;
  const review = matches.filter((match) => !match.contact_email && (match.contact_page || match.source_url)).length;
  const blocked = matches.length - verified - review;
  const provider = discoveries.find((item) => item.ok)?.provider || 'search_plan_only';
  const nextAction = verified
    ? 'Select the strongest verified contact and prepare outreach draft.'
    : review
      ? 'Open source pages, verify a public email, or add a manual verified email before sending.'
      : enterprisePlan
        ? enterprisePlan.next_action
        : searchPlan.source_tasks?.[0]?.next_action || 'Run a more specific live search with role, location, proof, and consent details.';
  const noLiveMessage = enterprisePlan
    ? `${segment.label || 'Enterprise setup'} is in setup mode: no job cards are shown. Use the live verification tasks for training, schemes, local offices, suppliers, and buyers.`
    : `${segment.label || 'Opportunity engine'} found ${webResults.length} live source result(s), but ${matches.length} verified opportunity card(s). No fake or demo opportunity is shown; follow the source tasks to verify real leads.`;
  return {
    total: matches.length,
    verified_contacts: verified,
    source_review_needed: review,
    blocked_contacts: blocked,
    source_tasks: searchPlan.source_tasks?.length || 0,
    mode: segment.opportunity_mode || segment.id,
    provider,
    reasoning_provider: searchPlan.planner?.provider || 'deterministic_contract',
    live_results: webResults.length,
    firecrawl_calls: discoveries.filter((item) => String(item.provider || '').startsWith('firecrawl')).length,
    credit_mode: searchPlan.credit_mode,
    contract_version: searchPlan.engine_version || ENGINE_VERSION,
    source_categories: (searchPlan.source_categories || []).slice(0, 5),
    message: matches.length
      ? `${segment.label || 'Opportunity search'} produced ${matches.length} live-derived lead(s): ${verified} verified email, ${review} source-review, ${blocked} blocked.`
      : noLiveMessage,
    next_action: nextAction,
  };
}

function segmentFor(profile = {}, resumeText = '') {
  const goal = profile.learner_goal || {};
  const text = `${profile.class_level || ''} ${profile.education_status || ''} ${goal.type || ''} ${goal.label || ''} ${(profile.aspirations || []).join(' ')} ${(profile.skills || []).join(' ')} ${(profile.proof_available || []).join(' ')}`.toLowerCase();
  const hasResume = resumeText.length > 240 || /resume|cv/.test(`${(profile.proof_available || []).join(' ')}`.toLowerCase());
  const techOrCollege = /btech|b\.tech|engineering|bca|mca|computer science|data science|software|python|sql|analytics|machine learning|\bai\b/.test(text);
  const localSkilled = /iti|electrician|fitter|welder|mechanic|nursing|healthcare|mobile repair|tailor|tailoring|silai|beauty|salon|retail|delivery|driver|technician/.test(text);
  const formal = /formal_skill_job_search|bcom|b\.com|graduate|degree|diploma|certificate|certified|license|experience|tally|gst|driver|electrician/.test(text);
  const enterprise = isEnterpriseIntent(text, goal);

  if (goal.intent === 'study') {
    return {
      id: 'study_only',
      label: 'Study first',
      opportunity_mode: 'study_only',
      strategy: 'No job search until learner switches to employability mode.',
      resume_required: false,
      outreach_channel: 'none',
    };
  }
  if (enterprise) {
    return {
      id: 'self_employment_enterprise',
      label: enterpriseLabel(text),
      opportunity_mode: 'self_employment_enterprise',
      strategy: 'Build an enterprise setup roadmap instead of job cards: live-verify training, schemes, local offices, suppliers, buyers, risks, and first 30/90 day actions.',
      resume_required: false,
      outreach_channel: 'scheme_training_buyer_inquiry',
    };
  }
  if (['job', 'college'].includes(goal.intent) && techOrCollege) {
    return {
      id: hasResume ? 'startup_outreach_ready' : 'startup_outreach_resume_needed',
      label: hasResume ? 'Job-ready startup outreach' : 'Resume-first startup outreach',
      opportunity_mode: 'professional_outreach',
      strategy: 'Find recently funded startups, founder/hiring contacts, public emails, and role-specific outreach angles.',
      resume_required: true,
      outreach_channel: 'founder_or_hiring_manager_email',
    };
  }
  if (['job', 'college'].includes(goal.intent) && localSkilled) {
    return {
      id: hasResume || profile.proof_available?.length ? 'formal_local_employment_ready' : 'formal_local_employment_proof_needed',
      label: hasResume || profile.proof_available?.length ? 'Local employment / apprenticeship' : 'Proof-first local employment',
      opportunity_mode: 'local_employment',
      strategy: 'Search local employers, contractors, shops, hospitals, training centers, and apprenticeships by district and commute; use call/WhatsApp scripts before email.',
      resume_required: false,
      outreach_channel: 'call_whatsapp_or_verified_contact',
    };
  }
  if (['job', 'college'].includes(goal.intent) && formal) {
    return {
      id: hasResume ? 'formal_job_ready' : 'formal_job_resume_needed',
      label: hasResume ? 'Formal job search' : 'Resume builder before formal job search',
      opportunity_mode: 'formal_job',
      strategy: 'Search role-specific jobs and employer contacts, then generate a simple resume if missing.',
      resume_required: true,
      outreach_channel: 'employer_email_or_contact_page',
    };
  }
  if (goal.intent === 'job') {
    return {
      id: hasResume ? 'direct_job_ready' : 'direct_job_resume_needed',
      label: hasResume ? 'Direct job search' : 'Resume builder before direct job search',
      opportunity_mode: 'formal_job',
      strategy: 'Search role-specific jobs or remote gigs, verify employer/contact source, then draft consent-limited outreach.',
      resume_required: true,
      outreach_channel: 'employer_email_or_contact_page',
    };
  }
  if (goal.intent === 'training') {
    return {
      id: 'training_to_placement',
      label: 'Training to placement',
      opportunity_mode: 'training_course',
      strategy: 'Find local training centers, apprenticeships, and placement-linked programs before employer outreach.',
      resume_required: false,
      outreach_channel: 'training_center_contact',
    };
  }
  if (goal.intent === 'proof_to_work') {
    return {
      id: 'informal_proof_to_work',
      label: 'Informal skill proof to work',
      opportunity_mode: 'proof_first_rpl',
      strategy: 'Build proof first, then match local shops, MSMEs, RPL centers, or apprenticeships.',
      resume_required: false,
      outreach_channel: 'worker_reviewed_local_contact',
    };
  }
  return {
    id: hasResume ? 'career_exploration_ready' : 'career_exploration_profile_needed',
    label: hasResume ? 'Career exploration with resume' : 'Career exploration needs profile',
    opportunity_mode: hasResume ? 'formal_job' : 'blocked_until_resume_or_proof',
    strategy: 'Compare training, job, and apprenticeship routes after the counselor clarifies the goal.',
    resume_required: !hasResume,
    outreach_channel: 'after_goal_confirmation',
  };
}

function buildResumeProfile(profile = {}, resumeText = '', journey = null, passport = {}) {
  const aspirations = profile.aspirations?.length ? profile.aspirations : ['entry-level role'];
  const skills = [
    ...(profile.skills || []),
    ...(passport?.informal || []).map((item) => item.name).filter(Boolean),
    ...aspirations,
  ];
  const firstRole = aspirations[0] || 'entry-level role';
  const summaryFromResume = resumeText.split(/\n+/).map((line) => line.trim()).find((line) => line.length > 60);
  return {
    target_roles: deriveTargetRoles(profile, resumeText),
    top_skills: [...new Set(skills.map((item) => String(item).trim()).filter(Boolean))].slice(0, 8),
    seniority: /intern|student|college|btech|class/i.test(`${profile.class_level} ${profile.education_status}`) ? 'intern/junior' : 'entry/junior',
    location: profile.relocation_preference || profile.location || 'India',
    summary:
      summaryFromResume ||
      `${profile.name || 'Learner'} is looking for ${firstRole} with ${profile.time_available || 'available'} practice time and ${profile.language || 'local language'} support.`,
    resume_source: resumeText.length > 240 ? 'uploaded_or_pasted_resume' : 'counselor_profile_generated',
    gaps: resumeText.length > 240 ? [] : ['resume_text_missing_or_short'],
    proof:
      journey?.readiness_score
        ? [`${journey.readiness_score}% journey readiness`, ...(profile.proof_available || [])]
        : profile.proof_available || [],
  };
}

function deriveTargetRoles(profile = {}, resumeText = '') {
  const text = `${resumeText} ${(profile.aspirations || []).join(' ')} ${(profile.skills || []).join(' ')}`.toLowerCase();
  if (/data science|machine learning|data analyst|analytics|python|sql/.test(text)) return ['Data Analyst Intern', 'Data Science Intern', 'Junior Data Analyst'];
  if (/software|web|react|javascript|frontend|backend|btech|engineering/.test(text)) return ['Software Engineering Intern', 'Frontend Intern', 'Junior Software Developer'];
  if (/computer basics|typing|customer service|data entry|computer operator|front desk|reception|billing|bpo|call center|office assistant|retail billing/.test(text)) {
    return ['Data Entry Operator', 'Customer Service Assistant', 'Computer Operator', 'Front Desk Assistant', 'Retail Billing Assistant'];
  }
  if (/accounting|tally|gst|finance|bcom/.test(text)) return ['Accounts Assistant', 'GST Billing Assistant', 'Finance Intern'];
  if (/driver|driving|license/.test(text)) return ['Driver', 'Fleet Driver', 'Delivery Driver'];
  if (/electrician|iti/.test(text)) return ['Electrician Assistant', 'ITI Electrician', 'Maintenance Technician'];
  if (/mobile|repair/.test(text)) return ['Mobile Repair Trainee', 'Repair Counter Assistant'];
  if (/tailor|silai|stitch/.test(text)) return ['Tailoring Trainee', 'Stitching Assistant'];
  return [(profile.aspirations || ['Entry-level Assistant'])[0]];
}

function isEnterpriseIntent(text = '', goal = {}) {
  const value = `${text} ${goal.type || ''} ${goal.label || ''}`.toLowerCase();
  const explicitEnterprise =
    /self.?employment|business|enterprise|startup setup|start.*own|apna kaam|ghar se kaam|home unit|open.*shop|apni.*shop|shop.*start|poultry|mushroom|goat|dairy|food processing|pickle|papad|bakery|farming enterprise|loan|mudra|pmegp|pmfme|kvk|dic/.test(value);
  const explicitEmploymentOrProof =
    /local job|job chahiye|naukri|rpl|certificate|proof|sample|workshop mein|workshop experience|seekha hai|apprentice|apprenticeship/.test(value);
  const strongEnterpriseSignal =
    /loan|mudra|pmegp|business|enterprise|start.*own|apna kaam|ghar se kaam|home unit|poultry|mushroom|goat|dairy|food processing|pickle|papad|bakery/.test(value);
  return explicitEnterprise &&
    (!explicitEmploymentOrProof || strongEnterpriseSignal) &&
    !/startup outreach|startup job|founder outreach|software startup|data science job/.test(value);
}

function enterpriseLabel(text = '') {
  if (/poultry|chicken|broiler|layer/.test(text)) return 'Poultry enterprise setup';
  if (/mushroom/.test(text)) return 'Mushroom enterprise setup';
  if (/goat/.test(text)) return 'Goat farming enterprise setup';
  if (/food processing|pickle|papad|bakery|masala/.test(text)) return 'Food processing micro-enterprise';
  if (/tailor|silai|stitch/.test(text)) return 'Tailoring home-unit setup';
  if (/beauty|salon|wellness/.test(text)) return 'Beauty home-service setup';
  if (/mobile repair|repair shop/.test(text)) return 'Mobile repair shop setup';
  return 'Self-employment enterprise setup';
}

function buildSearchPlan({ profile, segment, resumeProfile, query }) {
  const location = profile.relocation_preference || profile.location || 'India';
  const role = resumeProfile.target_roles[0] || (profile.aspirations || ['job'])[0];
  const skills = resumeProfile.top_skills.slice(0, 3).join(' ');
  const base = query ? [query] : [];
  let queries = [];

  if (segment.id.startsWith('startup_outreach')) {
    queries = [
      `${role} ${skills} recently funded startup India founder email hiring`,
      `site:inc42.com OR site:yourstory.com startup funding ${skills} hiring ${new Date().getFullYear()}`,
      `site:wellfound.com OR site:greenhouse.io OR site:lever.co ${role} ${skills} startup India`,
      `TechCrunch startup raises funding ${skills} hiring founder email ${new Date().getFullYear()}`,
    ];
  } else if (segment.opportunity_mode === 'local_employment') {
    queries = [
      `${location} ${role} apprenticeship local employer contact`,
      `${location} ${skills || role} contractor shop factory hospital training hiring contact`,
      `site:apprenticeshipindia.gov.in ${location} ${role}`,
      `site:ncs.gov.in ${location} ${role} vacancy`,
    ];
  } else if (segment.id.startsWith('formal_job') || segment.id.startsWith('direct_job')) {
    queries = [
      `${location} ${role} job opening contact email`,
      `${location} ${skills} hiring employer contact ${role}`,
      `site:ncs.gov.in ${location} ${role} vacancy`,
    ];
  } else if (segment.id === 'training_to_placement') {
    queries = [
      `${location} ${(profile.aspirations || []).join(' ')} training center placement contact`,
      `${location} apprenticeship ${(profile.aspirations || []).join(' ')} employer contact`,
      `PMKVY Skill India ${location} ${(profile.aspirations || []).join(' ')} center`,
    ];
  } else if (segment.opportunity_mode === 'self_employment_enterprise') {
    queries = [
      `${location} ${enterpriseKeyword(profile)} training KVK DIC official scheme`,
      `${enterpriseKeyword(profile)} PMEGP MUDRA PMFME official eligibility India`,
      `${location} ${enterpriseKeyword(profile)} buyers suppliers training official`,
    ];
  } else {
    queries = [
      `${location} ${(profile.aspirations || []).join(' ')} apprenticeship job contact`,
      `${location} MSME ${(profile.aspirations || []).join(' ')} hiring contact`,
      `${location} ${(profile.aspirations || []).join(' ')} RPL training work opportunity`,
    ];
  }

  const allQueries = [...base, ...queries].filter(Boolean);
  const firecrawlQueries = segment.id.startsWith('startup_outreach')
    ? allQueries.filter((item) => /founder|email|funding|startup/i.test(item)).slice(0, 1)
    : [];

  const mode = segment.opportunity_mode || segment.id;
  const sourceCategories = sourceCategoriesForMode(mode);
  const verificationRules = verificationRulesForMode(mode);
  const scoringRules = scoringRulesForMode(mode);
  const fallbackActions = fallbackActionsForMode(mode);
  const riskFilters = riskFiltersForMode(mode);

  return {
    engine_version: ENGINE_VERSION,
    method: 'claude_primary_planner_openai_web_search_firecrawl_shortlist',
    credit_mode: 'firecrawl_minimal',
    opportunity_mode: mode,
    queries: allQueries.slice(0, 2),
    firecrawl_queries: firecrawlQueries,
    source_categories: sourceCategories,
    verification_rules: verificationRules,
    scoring_rules: scoringRules,
    result_schema_fields: resultSchemaFieldsForMode(mode),
    cache_ttl_hours: cacheTtlHoursForMode(mode),
    max_fetches_per_call: 15,
    no_result_fallback_actions: fallbackActions,
    risk_filters: riskFilters,
    consent_policy: {
      required_before_contact_or_sharing: true,
      scope: 'per recipient + data + purpose + action',
      blanket_consent_allowed: false,
    },
    source_tasks: buildSourceTasks({ profile, segment, resumeProfile, queries: allQueries }),
    safety: [
      'Do not fabricate email addresses.',
      'Do not fabricate companies, training centers, courses, buyers, suppliers, schemes, salaries, deadlines, or loan approvals.',
      'Only live search results become opportunity cards; source plans are not jobs.',
      'Every concrete result must include source_url and live_verified_at or requires_live_verification=true.',
      'Prefer public company pages, job boards, funding news, and official/government sources.',
      'Use location only for offline jobs/training.',
      'Require consent before sending learner details.',
      'For self-employment, show setup roadmap and verification tasks instead of job cards.',
      'Use Firecrawl only for contact-heavy startup/employer discovery, not broad pathway search.',
    ],
  };
}

function enterpriseKeyword(profile = {}) {
  const text = `${(profile.aspirations || []).join(' ')} ${(profile.skills || []).join(' ')} ${profile.learner_goal?.label || ''}`.toLowerCase();
  if (/poultry|chicken|broiler|layer/.test(text)) return 'poultry farming';
  if (/mushroom/.test(text)) return 'mushroom farming';
  if (/goat/.test(text)) return 'goat farming';
  if (/food processing|pickle|papad|bakery|masala/.test(text)) return 'food processing micro enterprise';
  if (/tailor|silai|stitch/.test(text)) return 'tailoring home business';
  if (/beauty|salon|wellness/.test(text)) return 'beauty home service';
  if (/mobile repair|repair shop/.test(text)) return 'mobile repair shop';
  return (profile.aspirations || ['micro enterprise'])[0];
}

function buildSourceTasks({ profile = {}, segment = {}, resumeProfile = {}, queries = [] }) {
  const location = profile.location || profile.relocation_preference || 'location pending';
  const role = resumeProfile.target_roles?.[0] || (profile.aspirations || ['opportunity'])[0];
  const base = [
    {
      id: 'verify_profile_readiness',
      title: 'Verify readiness before search',
      mode: segment.opportunity_mode || segment.id,
      source_category: 'VidyaSetu guardrail',
      query: '',
      why: 'Opportunity search must use the learner goal, location/mobility, proof, resume, and consent state.',
      next_action: segment.resume_required && resumeProfile.gaps?.length
        ? 'Build or upload a truthful resume before professional outreach.'
        : 'Continue to live source verification.',
      required_fields: ['goal', segment.opportunity_mode === 'professional_outreach' ? 'resume/projects' : 'location/commute/proof'],
      requires_live_verification: false,
    },
  ];

  if (segment.opportunity_mode === 'professional_outreach') {
    return [
      ...base,
      {
        id: 'live_company_source_search',
        title: 'Find role-matched companies/startups',
        mode: 'professional_outreach',
        source_category: 'company/career/funding public web',
        query: queries[0] || `${role} startup hiring founder contact`,
        why: 'The old outreach agent behavior belongs here: find companies, public contact pages, founder/recruiter signals, then score fit.',
        next_action: 'Run live search; only convert results with real URLs into outreach leads.',
        required_fields: ['target role', 'skills/projects', 'resume'],
        requires_live_verification: true,
      },
      {
        id: 'discover_public_contact',
        title: 'Discover public founder/recruiter contact',
        mode: 'professional_outreach',
        source_category: 'company/team/careers/contact pages',
        query: queries[1] || `${role} hiring manager email company careers`,
        why: 'No email is invented. If no public contact is found, keep the lead in source-review.',
        next_action: 'Verify contact source, generate personalized draft, then ask learner consent.',
        required_fields: ['public source URL', 'resume/Skill Passport consent'],
        requires_live_verification: true,
      },
    ];
  }

  if (segment.opportunity_mode === 'local_employment') {
    return [
      ...base,
      {
        id: 'local_employer_search',
        title: `Search local employers around ${location}`,
        mode: 'local_employment',
        source_category: 'NCS, Apprenticeship India, local employer public web',
        query: queries[0] || `${location} ${role} local employer contact`,
        why: 'ITI/local-skilled learners need district + commute filtering, not generic founder email outreach.',
        next_action: 'Find local sources, verify distance/commute, then prepare call or WhatsApp script.',
        required_fields: ['district/city', 'commute range', 'certificate/proof'],
        requires_live_verification: true,
      },
      {
        id: 'apprenticeship_check',
        title: 'Check apprenticeship route',
        mode: 'apprenticeship',
        source_category: 'Apprenticeship portals and employer pages',
        query: queries[2] || `${location} ${role} apprenticeship`,
        why: 'For ITI/mechanic/electrician style profiles, apprenticeship can be more realistic than cold email.',
        next_action: 'Verify eligibility, documents, stipend, and safety before sharing details.',
        required_fields: ['education/certificate', 'location', 'documents'],
        requires_live_verification: true,
      },
    ];
  }

  if (segment.opportunity_mode === 'training_course') {
    return [
      ...base,
      {
        id: 'training_source_search',
        title: `Verify training options near ${location}`,
        mode: 'training_course',
        source_category: 'Skill India, NSDC, state skill portals, provider pages',
        query: queries[0] || `${location} ${role} training center placement`,
        why: 'Training suggestions must verify location, fees, duration, placement claims, and commute.',
        next_action: 'Show training only after source verification; otherwise keep as verification task.',
        required_fields: ['location', 'commute', 'time', 'device/data'],
        requires_live_verification: true,
      },
      {
        id: 'placement_link_check',
        title: 'Check placement/apprenticeship bridge',
        mode: 'training_course',
        source_category: 'provider placement page, NCS, Apprenticeship India',
        query: queries[1] || `${location} ${role} apprenticeship placement`,
        why: 'A course is not enough; the platform should verify the next placement step.',
        next_action: 'Check whether placement support is real before recommending travel or fees.',
        required_fields: ['proof plan', 'training source', 'safety/commute'],
        requires_live_verification: true,
      },
    ];
  }

  if (segment.opportunity_mode === 'self_employment_enterprise') {
    return [
      ...base,
      {
        id: 'enterprise_training_scheme_check',
        title: 'Verify training, scheme, and loan sources',
        mode: 'self_employment_enterprise',
        source_category: 'KVK, DIC, PMEGP, MUDRA, PMFME, state portals',
        query: queries[0] || `${location} ${enterpriseKeyword(profile)} KVK DIC scheme`,
        why: 'Enterprise users need setup support, not job cards.',
        next_action: 'Verify eligibility, local office, documents, and training before any loan/scheme suggestion.',
        required_fields: ['location', 'space/capital', 'business idea', 'documents'],
        requires_live_verification: true,
      },
      {
        id: 'buyers_suppliers_check',
        title: 'Find buyer and supplier verification path',
        mode: 'self_employment_enterprise',
        source_category: 'local market/FPO/SHG/buyer/supplier public sources',
        query: queries[2] || `${location} ${enterpriseKeyword(profile)} buyers suppliers`,
        why: 'A business plan must include market access and risk, not only training or loan.',
        next_action: 'Build first 30/90 day plan after local buyer/supplier verification.',
        required_fields: ['local market', 'starter setup', 'risk checklist'],
        requires_live_verification: true,
      },
    ];
  }

  return [
    ...base,
    {
      id: 'proof_first_local_search',
      title: `Build proof and verify local work sources around ${location}`,
      mode: segment.opportunity_mode || 'proof_first_rpl',
      source_category: 'RPL, Skill India, local MSME/shop public web',
      query: queries[0] || `${location} ${role} RPL training work opportunity`,
      why: 'Informal workers need proof before local contact sharing.',
      next_action: 'Complete proof task, then search and verify local work/training contacts.',
      required_fields: ['proof/sample work', 'location', 'commute', 'consent'],
      requires_live_verification: true,
    },
  ];
}

function buildEnterprisePlan({ profile = {}, segment = {}, searchPlan = {} }) {
  const keyword = enterpriseKeyword(profile);
  const location = profile.location || '';
  const missing = [
    !location ? 'district/city' : '',
    !profile.commute_km && !profile.relocation_preference ? 'travel range for training/local office visits' : '',
    !/space|land|room|shed|home|ghar|farm/i.test(`${profile.support_needs?.join(' ')} ${profile.proof_available?.join(' ')} ${profile.learner_goal?.label || ''}`) ? 'available space/resources' : '',
    !/capital|loan|saving|budget|money|paisa|fund/i.test(`${profile.earning_urgency || ''} ${profile.learner_goal?.label || ''} ${(profile.aspirations || []).join(' ')}`) ? 'starter budget or loan need' : '',
  ].filter(Boolean);
  const planId = `enterprise_${stableSlug(keyword)}_${stableSlug(location || 'location_pending')}`;
  return {
    id: planId,
    enterprise_name: segment.label || `${titleCase(keyword)} setup`,
    suitability_score: missing.length ? Math.max(45, 82 - missing.length * 10) : 82,
    required_fields: ['district/city', 'available space/resources', 'starter budget or loan need', 'training access', 'buyer/customer channel'],
    missing_fields: missing,
    starter_setup: starterSetupForEnterprise(keyword),
    training_to_verify: [
      `${location || 'local'} KVK / skill center training availability`,
      'Practical mentor or field visit before spending money',
      'Any certificate/training requirement from official/local source',
    ],
    scheme_candidates: schemeCandidatesForEnterprise(keyword),
    loan_candidates: ['MUDRA or bank micro-loan only after eligibility and repayment capacity check', 'PMEGP only if official eligibility and project category match'],
    cost_heads: costHeadsForEnterprise(keyword),
    buyer_channels: buyerChannelsForEnterprise(keyword, location),
    supplier_channels: supplierChannelsForEnterprise(keyword, location),
    first_30_days_plan: [
      'Confirm location, space, family support, and starter budget.',
      'Verify one official training/support source and one local mentor.',
      'Prepare small proof/business note: what will be sold, to whom, and first buyer channel.',
      'Do not take a loan until cost, buyer, and risk checks are complete.',
    ],
    first_90_days_plan: [
      'Complete training or mentor validation.',
      'Start with a small pilot batch/service, not full-scale investment.',
      'Record expenses, buyer conversations, and proof photos.',
      'Review repayment risk before scaling.',
    ],
    risks: [
      'Income is not guaranteed; local demand and disease/quality/market risk must be checked.',
      'Loan/scheme eligibility requires live verification from official source or local office.',
      'Do not buy equipment/livestock/materials until supplier and buyer channels are verified.',
    ],
    documents_needed: ['ID/address proof', 'bank account', 'basic project note', 'training/proof if required', 'scheme-specific documents after verification'],
    local_offices_to_verify: ['KVK or agriculture/allied office if relevant', 'District Industries Centre', 'bank/CSC/official scheme portal', 'local training provider'],
    source_tasks: searchPlan.source_tasks || [],
    requires_live_verification: true,
    next_action: missing.length
      ? `Ask for ${missing.slice(0, 2).join(' and ')} before showing scheme/loan steps.`
      : 'Run live verification for training, scheme eligibility, suppliers, and buyer channels before any investment advice.',
  };
}

function starterSetupForEnterprise(keyword = '') {
  if (/poultry/.test(keyword)) return ['Small pilot batch plan', 'Clean shed/space check', 'Feed/water/equipment list', 'Disease-risk and veterinary support check'];
  if (/mushroom/.test(keyword)) return ['Clean room/space check', 'Spawn/source verification', 'Humidity/temperature plan', 'Local buyer validation'];
  if (/food processing/.test(keyword)) return ['Product choice and hygiene plan', 'Small equipment list', 'Packaging/labeling check', 'FSSAI/registration check if selling formally'];
  if (/tailoring/.test(keyword)) return ['Machine/tools check', '3 sample designs', 'WhatsApp catalogue', 'local buyer/customer list'];
  if (/beauty/.test(keyword)) return ['Service menu', 'starter kit list', 'safety/hygiene checklist', 'first 10 customer outreach plan'];
  if (/mobile repair/.test(keyword)) return ['Toolkit list', 'practice phones/samples', 'spare parts supplier check', 'counter/shop/apprentice option'];
  return ['Small pilot setup', 'training check', 'cost head list', 'first customer/buyer validation'];
}

function schemeCandidatesForEnterprise(keyword = '') {
  const common = ['MUDRA micro-credit eligibility check', 'PMEGP eligibility check', 'District Industries Centre guidance'];
  if (/food processing/.test(keyword)) return ['PMFME eligibility check', ...common];
  if (/poultry|goat|dairy/.test(keyword)) return ['National Livestock Mission/state animal husbandry scheme check', ...common];
  if (/mushroom|agri|farm/.test(keyword)) return ['KVK/agriculture department training and state scheme check', ...common];
  return common;
}

function costHeadsForEnterprise(keyword = '') {
  if (/poultry/.test(keyword)) return ['shed/space preparation', 'chicks/birds', 'feed and water', 'vaccination/veterinary support', 'transport', 'loss buffer'];
  if (/mushroom/.test(keyword)) return ['space cleaning', 'spawn', 'bags/substrate', 'humidity/temperature control', 'packaging', 'transport'];
  if (/food processing/.test(keyword)) return ['raw material', 'basic equipment', 'packaging', 'hygiene/compliance', 'transport', 'market samples'];
  if (/tailoring/.test(keyword)) return ['machine/tools', 'fabric/thread', 'sample work', 'alteration kit', 'delivery/customer communication'];
  if (/beauty/.test(keyword)) return ['starter kit', 'hygiene supplies', 'practice models', 'local promotion', 'travel safety'];
  return ['starter equipment', 'raw material', 'training/mentor', 'transport', 'marketing', 'risk buffer'];
}

function buyerChannelsForEnterprise(keyword = '', location = '') {
  const place = location || 'local area';
  if (/poultry/.test(keyword)) return [`${place} meat/egg retailers`, 'nearby households/hotels', 'local aggregator/buyer verification'];
  if (/mushroom/.test(keyword)) return [`${place} vegetable vendors`, 'restaurants/hotels', 'weekly market buyers'];
  if (/food processing/.test(keyword)) return ['local kirana stores', 'SHG/FPO channels', 'WhatsApp/local customer orders'];
  if (/tailoring/.test(keyword)) return ['neighbors and family referrals', 'boutiques/tailor shops', 'school uniform/alteration customers'];
  if (/beauty/.test(keyword)) return ['home-service customers', 'salons for assistant work', 'local women groups/referrals'];
  return ['local buyers', 'WhatsApp/customer referrals', 'shops or aggregators after verification'];
}

function supplierChannelsForEnterprise(keyword = '', location = '') {
  const place = location || 'local area';
  if (/poultry/.test(keyword)) return [`${place} hatchery/feed supplier`, 'veterinary support source', 'equipment supplier'];
  if (/mushroom/.test(keyword)) return ['spawn supplier', 'substrate/raw material supplier', 'packaging supplier'];
  if (/food processing/.test(keyword)) return ['raw material supplier', 'packaging supplier', 'local equipment seller'];
  if (/tailoring/.test(keyword)) return ['fabric/thread supplier', 'machine repair contact', 'packaging/delivery support'];
  return [`${place} supplier search`, 'verified local vendor', 'official/mentor-recommended source'];
}

function buildUnlockState({ profile = {}, segment = {}, resumeProfile = {}, passport = {}, matches = [] }) {
  const missing = [];
  if (!profile.location && ['local_employment', 'training_course', 'proof_first_rpl', 'self_employment_enterprise'].includes(segment.opportunity_mode)) {
    missing.push('location');
  }
  if (segment.resume_required && resumeProfile.gaps?.length) missing.push('resume');
  if (segment.opportunity_mode === 'proof_first_rpl' && !passport.qr_token && !profile.proof_available?.length) missing.push('proof/sample work');
  if (!matches.length && !['study_only'].includes(segment.opportunity_mode)) missing.push('live verified source');
  return {
    opportunity_mode: segment.opportunity_mode || segment.id,
    locked_modules: [
      profile.learner_goal?.intent === 'study' ? 'job_outreach' : '',
      missing.includes('location') ? 'offline_recommendations' : '',
      missing.includes('resume') ? 'professional_send' : '',
      missing.includes('proof/sample work') ? 'local_contact_sharing' : '',
      matches.length ? '' : 'send_without_verified_source',
    ].filter(Boolean),
    unlocked_modules: [
      'counselor_profile',
      profile.profile_complete ? 'pathway_generation' : '',
      passport.qr_token || profile.proof_available?.length ? 'proof_review' : '',
      matches.length ? 'outreach_draft_after_consent' : 'live_search_plan',
    ].filter(Boolean),
    missing_fields: missing,
    next_action: missing.length ? `Complete: ${missing.join(', ')}` : 'Select a verified live result and confirm consent before outreach.',
  };
}

async function runCreditSafeDiscovery(searchPlan = {}, { segment, deepContactSearch = false } = {}) {
  const openAiQueries = (searchPlan.queries || []).slice(0, Number(process.env.OPENAI_JOB_SEARCH_QUERY_LIMIT || 1));
  const openAiDiscoveries = await Promise.all(openAiQueries.map((query) => discoverWithOpenAIWeb(query, [])));

  const needsFirecrawl =
    deepContactSearch ||
    (segment.id.startsWith('startup_outreach') && process.env.ENABLE_FIRECRAWL_STARTUP_AUTO === 'true') ||
    (segment.id.startsWith('formal_job_ready') && Boolean(process.env.ENABLE_FIRECRAWL_FORMAL_READY === 'true'));
  const firecrawlQueries = needsFirecrawl ? (searchPlan.firecrawl_queries || []).slice(0, 1) : [];
  const firecrawlDiscoveries = await Promise.all(
    firecrawlQueries.map((query) => discoverWithFirecrawl(query, [], {
      limit: Number(process.env.FIRECRAWL_JOB_SEARCH_LIMIT || 2),
      scrape: Boolean(deepContactSearch && process.env.ENABLE_FIRECRAWL_SCRAPE === 'true'),
    })),
  );

  return [...openAiDiscoveries, ...firecrawlDiscoveries];
}

function resultToLead(item = {}, index = 0, { profile, segment, resumeProfile }) {
  const text = `${item.title || ''}\n${item.description || ''}\n${item.markdown || ''}`;
  const url = item.url || item.source_url || '';
  if (segment.opportunity_mode === 'self_employment_enterprise') return [];
  if (!url) return [];
  if (!isResultRelevantForSegment(text, url, segment, resumeProfile)) return [];
  const company = cleanCompanyName(item.title || domainName(url) || `Web lead ${index + 1}`);
  const emails = extractEmails(text);
  const email = emails[0] || '';
  const linkedinUrl = extractUrl(text, /https?:\/\/(?:www\.)?linkedin\.com\/[^\s)"'<>]+/i);
  const contact = extractContact(text);
  const role = inferLeadRole(text, resumeProfile);
  const sourceTitle = item.title || domainName(url) || 'Public web source';
  const sourceType = sourceTypeFromUrl(url, sourceTitle, segment);
  const verifiedAt = new Date().toISOString();
  const requiresLiveVerification = !email || /public_search|missing|unknown|funding_news/i.test(sourceType);
  const requiredProof = requiredProofForSegment(segment, resumeProfile);
  const missingRequirements = missingRequirementsForLead({ email, segment, resumeProfile, profile });
  return {
    id: `web_${index}_${stableSlug(company)}`,
    result_id: `web_${index}_${stableSlug(company)}`,
    type: segment.opportunity_mode || segment.id,
    lead_type: segment.id.startsWith('startup') ? 'recently_funded_startup' : segment.id,
    employer: company,
    company,
    title: role,
    source_name: sourceTitle,
    wage: inferCompensation(text, segment),
    distance_km: profile.relocation_preference || /remote/i.test(text) ? 0 : profile.commute_km || 20,
    location_relevance: profile.relocation_preference || /remote/i.test(text)
      ? 'remote_or_relocation_fit'
      : profile.location
        ? `around ${profile.location}`
        : 'location_needs_review',
    why_matched: whyLeadMatched({ text, segment, resumeProfile, profile }),
    required_proof: requiredProof,
    missing_requirements: missingRequirements,
    confidence_score: Math.min(0.92, Math.max(0.5, inferRelevance(text, resumeProfile) / 100)),
    constraints: [
      email ? 'verified public email' : 'contact source needs review',
      segment.label,
      profile.relocation_preference || profile.location || 'location flexible',
    ],
    source_url: url,
    source_title: sourceTitle,
    contact_email: email,
    contact_name: contact.name,
    contact_title: contact.title,
    contact_page: url,
    linkedin_url: linkedinUrl,
    email_source: email ? sourceTitle : '',
    contact_status: email ? 'verified_public_email' : 'source_contact_needed',
    funding_stage: inferFundingStage(text),
    relevance_score: inferRelevance(text, resumeProfile),
    description: summarizeLead(text, resumeProfile, segment),
    live_verified_at: verifiedAt,
    requires_live_verification: requiresLiveVerification,
    next_action: email
      ? 'Review the source, edit the draft, and ask learner consent before sending.'
      : 'Open the source page and verify a public contact channel before outreach.',
    consent_required: true,
    risk_warning: requiresLiveVerification ? 'This lead is live-discovered but still needs human/source verification before contact.' : null,
  };
}

function requiredProofForSegment(segment = {}, resumeProfile = {}) {
  if (segment.opportunity_mode === 'professional_outreach') {
    return ['resume', ...(resumeProfile.proof?.length ? ['project_or_portfolio_proof'] : ['one truthful project/proof'])];
  }
  if (segment.opportunity_mode === 'local_employment') return ['skill proof/certificate', 'ID/address proof', 'availability'];
  if (segment.opportunity_mode === 'training_course') return ['education/eligibility details', 'budget/fee preference', 'time availability'];
  if (segment.opportunity_mode === 'proof_first_rpl') return ['sample work/proof note', 'Skill Passport or worker review'];
  return ['profile facts', 'consent before sharing'];
}

function missingRequirementsForLead({ email = '', segment = {}, resumeProfile = {}, profile = {} }) {
  const missing = [];
  if (segment.resume_required && resumeProfile.gaps?.length) missing.push('resume/proof');
  if (!email && ['professional_outreach', 'formal_job', 'local_employment'].includes(segment.opportunity_mode)) {
    missing.push('verified public contact');
  }
  if (!profile.location && ['local_employment', 'training_course', 'proof_first_rpl'].includes(segment.opportunity_mode)) {
    missing.push('location');
  }
  missing.push('scoped consent before contact');
  return [...new Set(missing)];
}

function whyLeadMatched({ text = '', segment = {}, resumeProfile = {}, profile = {} }) {
  const role = resumeProfile.target_roles?.[0] || (profile.aspirations || ['the learner goal'])[0];
  const location = profile.relocation_preference || profile.location || 'the selected location/remote scope';
  if (segment.opportunity_mode === 'professional_outreach') {
    return `Live source matched ${role} or adjacent skills and can be reviewed for ${location}.`;
  }
  if (segment.opportunity_mode === 'local_employment') {
    return `Live source matched ${role} and must be checked against commute, proof, and safety constraints.`;
  }
  if (segment.opportunity_mode === 'training_course') {
    return `Live source matched training/apprenticeship keywords for ${role}; eligibility, fee, and accreditation still need source verification.`;
  }
  if (/remote/i.test(text)) return `Live source appears remote-friendly for ${role}; verify role details before applying.`;
  return `Live source matched the learner's stated goal: ${role}.`;
}

function isResultRelevantForSegment(text = '', url = '', segment = {}, resumeProfile = {}) {
  const haystack = `${text} ${url}`.toLowerCase();
  if (!url && !text.trim()) return false;
  if (segment.opportunity_mode === 'professional_outreach') {
    const roleHits = (resumeProfile.top_skills || []).some((skill) => haystack.includes(String(skill).toLowerCase())) ||
      /startup|funding|founder|hiring|career|jobs|wellfound|greenhouse|lever|data|software|analyst|intern/.test(haystack);
    const unrelated = /beauty|salon|tailor|poultry|mushroom|goat|farm|hotel|cook|electrician|driver/.test(haystack);
    return roleHits && !unrelated;
  }
  if (segment.opportunity_mode === 'local_employment') {
    return /job|hiring|vacancy|apprentice|apprenticeship|career|contractor|electrician|mechanic|fitter|welder|technician|nursing|retail|delivery|repair|tailor|beauty|ncs|apprenticeshipindia/.test(haystack);
  }
  if (segment.opportunity_mode === 'training_course') {
    return /training|course|skill|pmkvy|nsdc|skillindia|apprentice|apprenticeship|center|institute/.test(haystack);
  }
  if (segment.opportunity_mode === 'proof_first_rpl') {
    return /rpl|recognition|skill|training|msme|shop|local|work|apprentice|tailor|beauty|repair|udyam/.test(haystack);
  }
  return /job|career|hiring|training|apprentice|skill|contact|source/.test(haystack);
}

function profileAwareJobs(jobs, profile = {}, segment, resumeProfile) {
  const aspirations = (profile.aspirations || []).join(' ').toLowerCase();
  const deduped = dedupeLeads(jobs);
  if (/data science|machine learning|data analyst|analytics|python|sql|\bai\b|artificial intelligence/.test(aspirations)) {
    return deduped
      .filter((job) => {
        const haystack = `${job.title} ${job.description} ${job.employer} ${job.lead_type}`;
        const relevant = /data|analyst|analytics|machine learning|python|sql|software|startup|intern|fresher/i.test(haystack);
        const unrelated = /beauty|salon|mehandi|repair|tailor|cook|hotel|agri|drone|cyber cafe/i.test(haystack);
        return relevant && !unrelated;
      })
      .slice(0, 6);
  }
  if (/computer|digital|typing|data/.test(aspirations) && !/data science|analytics|python|sql/.test(aspirations)) {
    return deduped
      .filter((job) => {
        const haystack = `${job.title} ${job.description} ${job.employer} ${job.lead_type} ${job.source_url}`.toLowerCase();
        const relevant =
          /data entry|computer operator|customer service|customer care|front desk|reception|receptionist|billing|office assistant|back office|bpo|call center|retail billing|typing|cyber cafe|csc/.test(
            haystack,
          );
        const unrelated =
          /electrician|electrical|wireman|\biti\b|fitter|welder|plumber|mechanic|driver|delivery|cook|hotel|salon|beauty|mehandi|tailor|mobile repair/.test(
            haystack,
          );
        return relevant && !unrelated;
      })
      .slice(0, 6);
  }
  return deduped.slice(0, 6);
}

function uniqueResults(results = []) {
  const seen = new Set();
  return results.filter((item) => {
    const key = item.url || item.source_url || item.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeLeads(leads = []) {
  const seen = new Set();
  return leads.filter((lead) => {
    const key = `${lead.employer}|${lead.title}|${lead.source_url}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractEmails(text = '') {
  return [...new Set((text.match(EMAIL_RE) || []).map((email) => email.toLowerCase()))].filter((email) => {
    return !/example\.com|test\.com|domain\.com|email\.com|yourname|noreply|no-reply/.test(email);
  });
}

function extractContact(text = '') {
  const person =
    text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}),?\s+(?:co-)?founder|(?:founder|ceo|cto)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i);
  const name = person?.[1] || person?.[2] || 'Hiring contact';
  const title = /cto|technology/i.test(text) ? 'CTO / Engineering lead' : /founder|ceo/i.test(text) ? 'Founder / CEO' : 'Hiring team';
  return { name, title };
}

function extractUrl(text = '', pattern) {
  return text.match(pattern)?.[0]?.replace(/[),.]+$/, '') || '';
}

function cleanCompanyName(value = '') {
  return value
    .replace(/\s*\|.*$/, '')
    .replace(/\s*-\s*(Careers|Jobs|Hiring|LinkedIn|Crunchbase|TechCrunch|Inc42|YourStory).*$/i, '')
    .replace(/\braises\b.*$/i, '')
    .trim()
    .slice(0, 64) || 'Company lead';
}

function domainName(url = '') {
  try {
    return new URL(url).hostname.replace(/^www\./, '').split('.')[0];
  } catch {
    return '';
  }
}

function stableSlug(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 32) || 'lead';
}

function titleCase(value = '') {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inferLeadRole(text = '', resumeProfile = {}) {
  const lower = text.toLowerCase();
  const role = resumeProfile.target_roles?.[0] || 'Entry role';
  if (/internship|intern/.test(lower) && /data|analyst|science/.test(lower)) return 'Data Science / Analyst Intern';
  if (/data analyst|analytics/.test(lower)) return 'Data Analyst';
  if (/software|frontend|backend|developer|engineer/.test(lower)) return 'Software / Engineering Intern';
  if (/accounts|accountant|billing|gst|tally/.test(lower)) return 'Accounts / Billing Assistant';
  if (/driver|delivery|fleet/.test(lower)) return 'Driver / Fleet Role';
  return role;
}

function inferCompensation(text = '', segment = {}) {
  const wage = text.match(/(?:rs\.?|inr|₹)\s?[\d,]+(?:\s?-\s?(?:rs\.?|inr|₹)?\s?[\d,]+)?(?:\/month|\/day| per month| stipend)?/i)?.[0];
  if (wage) return wage;
  if (segment.id?.startsWith('startup')) return 'Startup stipend or fresher salary';
  if (segment.id?.includes('training')) return 'Training-first; stipend/placement varies';
  return 'Market wage / employer-listed pay';
}

function inferFundingStage(text = '') {
  if (/series a/i.test(text)) return 'Series A';
  if (/series b/i.test(text)) return 'Series B';
  if (/seed/i.test(text)) return 'Seed';
  if (/\byc\b|y combinator/i.test(text)) return 'YC';
  if (/funding|raised|raises|funded/i.test(text)) return 'Recently funded';
  return 'Public source';
}

function inferRelevance(text = '', resumeProfile = {}) {
  const lower = text.toLowerCase();
  const hits = (resumeProfile.top_skills || []).filter((skill) => lower.includes(String(skill).toLowerCase())).length;
  return Math.min(10, 5 + hits);
}

function summarizeLead(text = '', resumeProfile = {}, segment = {}) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const base = cleaned.slice(0, 260) || `${segment.strategy} Matched to ${resumeProfile.target_roles?.join(', ') || 'learner goal'}.`;
  return base.length < 80 ? `${base} Public source needs review before outreach.` : base;
}
