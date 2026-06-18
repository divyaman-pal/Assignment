import { methodNotAllowed, readJson, sendJson } from './_lib/http.js';
import { insertRows, patchRows } from './_lib/supabase.js';
import { buildLearningJourney } from './_lib/mvp.js';
import { languageInstruction } from './_lib/language.js';
import { callAnthropicJson, callClaudeJson } from './_lib/services.js';
import { tier3PlannerGuide } from './_lib/tier3-roadmaps.js';

const DEFAULT_JOURNEY_CLAUDE_TIMEOUT_MS = 90_000;
const MAX_JOURNEY_CLAUDE_TIMEOUT_MS = 110_000;

function journeyClaudeTimeoutMs() {
  const configured = Number(process.env.JOURNEY_CLAUDE_TIMEOUT_MS || DEFAULT_JOURNEY_CLAUDE_TIMEOUT_MS);
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_JOURNEY_CLAUDE_TIMEOUT_MS;
  return Math.min(configured, MAX_JOURNEY_CLAUDE_TIMEOUT_MS);
}

function stabilizeJourneySchema(base = {}, localized = {}, options = {}) {
  const localizedObject = localized && typeof localized === 'object' && !Array.isArray(localized) ? localized : {};
  const baseDelivery = base.delivery && typeof base.delivery === 'object' && !Array.isArray(base.delivery) ? base.delivery : {};
  const localizedDelivery =
    localizedObject.delivery && typeof localizedObject.delivery === 'object' && !Array.isArray(localizedObject.delivery)
      ? localizedObject.delivery
      : {};
  const baseProgress = base.progress && typeof base.progress === 'object' && !Array.isArray(base.progress) ? base.progress : {};
  const localizedProgress =
    localizedObject.progress && typeof localizedObject.progress === 'object' && !Array.isArray(localizedObject.progress)
      ? localizedObject.progress
      : {};
  const baseDuration = base.duration && typeof base.duration === 'object' && !Array.isArray(base.duration) ? base.duration : {};
  const localizedDuration =
    localizedObject.duration && typeof localizedObject.duration === 'object' && !Array.isArray(localizedObject.duration)
      ? localizedObject.duration
      : {};
  const baseLearningContract =
    base.learning_contract && typeof base.learning_contract === 'object' && !Array.isArray(base.learning_contract)
      ? base.learning_contract
      : {};
  const localizedLearningContract =
    localizedObject.learning_contract && typeof localizedObject.learning_contract === 'object' && !Array.isArray(localizedObject.learning_contract)
      ? localizedObject.learning_contract
      : {};
  const stable = {
    ...base,
    ...localizedObject,
    mode: base.mode,
    route_id: base.route_id,
    readiness_score: Number(localizedObject.readiness_score ?? base.readiness_score ?? 0),
    duration: {
      ...baseDuration,
      ...localizedDuration,
    },
    learning_contract: {
      ...baseLearningContract,
      ...localizedLearningContract,
      resource_policy: baseLearningContract.resource_policy || localizedLearningContract.resource_policy,
    },
    delivery: {
      ...baseDelivery,
      ...localizedDelivery,
    },
    progress: {
      ...baseProgress,
      ...localizedProgress,
      completed_lessons: Array.isArray(localizedProgress.completed_lessons)
        ? localizedProgress.completed_lessons
        : Array.isArray(baseProgress.completed_lessons)
          ? baseProgress.completed_lessons
          : [],
      completed_tasks: Array.isArray(localizedProgress.completed_tasks)
        ? localizedProgress.completed_tasks
        : Array.isArray(baseProgress.completed_tasks)
          ? baseProgress.completed_tasks
          : [],
    },
  };

  const moduleSource =
    options.allowModuleCountChange && Array.isArray(localizedObject.modules) && localizedObject.modules.length
      ? localizedObject.modules
      : base.modules || [];
  stable.modules = moduleSource.map((sourceModule, moduleIndex) => {
    const baseModule =
      options.allowModuleCountChange && sourceModule
        ? {
            id: sourceModule.id || `journey-week-${moduleIndex + 1}`,
            week: sourceModule.week || moduleIndex + 1,
            lessons: [],
            daily_micro_tasks: [],
            practice_tasks: [],
            proof_tasks: [],
          }
        : sourceModule;
    const nextModule =
      Array.isArray(localizedObject.modules) && localizedObject.modules[moduleIndex] && typeof localizedObject.modules[moduleIndex] === 'object'
        ? localizedObject.modules[moduleIndex]
        : {};
    const baseLessons = Array.isArray(baseModule.lessons) ? baseModule.lessons : [];
    const nextLessons = Array.isArray(nextModule.lessons) ? nextModule.lessons : [];
    const baseMicroTasks = Array.isArray(baseModule.daily_micro_tasks) ? baseModule.daily_micro_tasks : [];
    const nextMicroTasks = Array.isArray(nextModule.daily_micro_tasks) ? nextModule.daily_micro_tasks : [];
    const basePracticeTasks = Array.isArray(baseModule.practice_tasks) ? baseModule.practice_tasks : [];
    const nextPracticeTasks = Array.isArray(nextModule.practice_tasks) ? nextModule.practice_tasks : [];
    const baseProofTasks = Array.isArray(baseModule.proof_tasks) ? baseModule.proof_tasks : [];
    const nextProofTasks = Array.isArray(nextModule.proof_tasks) ? nextModule.proof_tasks : [];
    return {
      ...baseModule,
      ...nextModule,
      id: baseModule.id,
      week: baseModule.week,
      lessons: baseLessons.map((baseLesson, lessonIndex) =>
        typeof nextLessons[lessonIndex] === 'string' ? nextLessons[lessonIndex] : baseLesson,
      ),
      daily_micro_tasks: baseMicroTasks.map((baseTask, taskIndex) =>
        typeof nextMicroTasks[taskIndex] === 'string' ? nextMicroTasks[taskIndex] : baseTask,
      ),
      practice_tasks: basePracticeTasks.map((baseTask, taskIndex) =>
        typeof nextPracticeTasks[taskIndex] === 'string' ? nextPracticeTasks[taskIndex] : baseTask,
      ),
      proof_tasks: baseProofTasks.map((baseTask, taskIndex) =>
        typeof nextProofTasks[taskIndex] === 'string' ? nextProofTasks[taskIndex] : baseTask,
      ),
      completion_criteria:
        typeof nextModule.completion_criteria === 'string' && nextModule.completion_criteria.trim()
          ? nextModule.completion_criteria
          : baseModule.completion_criteria,
      low_data_alternative:
        typeof nextModule.low_data_alternative === 'string' && nextModule.low_data_alternative.trim()
          ? nextModule.low_data_alternative
          : baseModule.low_data_alternative,
      voice_whatsapp_version:
        typeof nextModule.voice_whatsapp_version === 'string' && nextModule.voice_whatsapp_version.trim()
          ? nextModule.voice_whatsapp_version
          : baseModule.voice_whatsapp_version,
      unlock_after_completion:
        typeof nextModule.unlock_after_completion === 'string' && nextModule.unlock_after_completion.trim()
          ? nextModule.unlock_after_completion
          : baseModule.unlock_after_completion,
    };
  });

  return syncJourneyProgress(stable);
}

function syncJourneyProgress(journey = {}) {
  const modules = Array.isArray(journey.modules) ? journey.modules : [];
  const totalCount = modules.reduce((sum, module) => {
    const lessons = Array.isArray(module.lessons) ? module.lessons.length : 0;
    const practice = Array.isArray(module.practice_tasks) ? module.practice_tasks.length : 0;
    return sum + lessons + practice;
  }, 0);
  const proofRequired = modules.filter((module) => module.proof || (Array.isArray(module.proof_tasks) && module.proof_tasks.length)).length;
  return {
    ...journey,
    duration: {
      ...(journey.duration || {}),
      mvp: journey.duration?.mvp || `${modules.length || 4}-week journey`,
    },
    learning_contract: {
      ...(journey.learning_contract || {}),
      week_shape:
        journey.learning_contract?.week_shape ||
        'Each week has daily tasks, one practice task, resources, proof, and an unlock rule.',
    },
    progress: {
      ...(journey.progress || {}),
      total_count: Number(journey.progress?.total_count || 0) || totalCount,
      proof_required_count: Number(journey.progress?.proof_required_count || 0) || proofRequired,
      completion_percent: Number(journey.progress?.completion_percent || 0),
      completed_count: Number(journey.progress?.completed_count || 0),
      proof_ready_count: Number(journey.progress?.proof_ready_count || 0),
    },
  };
}

const JOURNEY_TOOL_SCHEMA = {
  type: 'object',
  required: ['title', 'duration', 'modules'],
  additionalProperties: true,
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    mode: { type: 'string' },
    route_id: { type: 'string' },
    route_name: { type: 'string' },
    readiness_score: { type: 'number' },
    duration: {
      type: 'object',
      additionalProperties: true,
      properties: {
        mvp: { type: 'string' },
        full: { type: 'string' },
      },
    },
    delivery: { type: 'object', additionalProperties: true },
    learning_contract: { type: 'object', additionalProperties: true },
    modules: {
      type: 'array',
      minItems: 4,
      items: {
        type: 'object',
        required: ['title', 'goal', 'lessons', 'daily_micro_tasks', 'practice_tasks', 'proof', 'proof_tasks', 'resources'],
        additionalProperties: true,
        properties: {
          id: { type: 'string' },
          week: { type: 'number' },
          title: { type: 'string' },
          goal: { type: 'string' },
          lessons: { type: 'array', items: { type: 'string' } },
          daily_micro_tasks: { type: 'array', items: { type: 'string' } },
          practice_tasks: { type: 'array', items: { type: 'string' } },
          proof: { type: 'string' },
          proof_tasks: { type: 'array', items: { type: 'string' } },
          resources: {
            type: 'array',
            items: {
              type: 'object',
              required: ['title', 'how_to_use', 'proof_to_save'],
              additionalProperties: true,
              properties: {
                title: { type: 'string' },
                type: { type: 'string' },
                source_url: { type: 'string' },
                search_query: { type: 'string' },
                how_to_use: { type: 'string' },
                proof_to_save: { type: 'string' },
              },
            },
          },
          completion_criteria: { type: 'string' },
          low_data_alternative: { type: 'string' },
          voice_whatsapp_version: { type: 'string' },
          unlock_after_completion: { type: 'string' },
        },
      },
    },
    progress: { type: 'object', additionalProperties: true },
  },
};

function hasUsableGeneratedModules(journey = {}) {
  const modules = Array.isArray(journey.modules) ? journey.modules : [];
  if (!modules.length) return false;
  return modules.every(
    (module) =>
      typeof module?.title === 'string' &&
      module.title.trim() &&
      typeof module?.goal === 'string' &&
      module.goal.trim() &&
      Array.isArray(module.lessons) &&
      module.lessons.length &&
      Array.isArray(module.daily_micro_tasks) &&
      module.daily_micro_tasks.length &&
      Array.isArray(module.practice_tasks) &&
      module.practice_tasks.length &&
      typeof module.proof === 'string' &&
      module.proof.trim(),
  );
}

function buildClaudeJourneyPrompt(profile = {}, route = {}, fallbackJourney = {}) {
  const guide = tier3PlannerGuide(profile, route.name || route.tradeoff || '', route);
  return `Profile=${JSON.stringify({
    language: profile.preferred_language || profile.language || 'learner language',
    education: profile.class_level || profile.education_status || '',
    goal: profile.learner_goal?.label || (profile.aspirations || [])[0] || route.name || '',
    skills: profile.skills || [],
    proof_available: profile.proof_available || [],
    location: profile.location || '',
    commute_km: profile.commute_km || '',
    time_available: profile.time_available || '',
    phone_access: profile.phone_access || profile.device || '',
    earning_urgency: profile.earning_urgency || '',
    support_needs: profile.support_needs || [],
  })}
Route=${JSON.stringify({
    id: route.id,
    name: route.name,
    tradeoff: route.tradeoff,
    time: route.time,
    distance: route.distance,
    first_step: route.first_step,
    income_path: route.income_path,
    locked_until: route.locked_until,
    realistic_role: route.pathway_detail?.realistic_role,
  })}
Roadmap guide=${guide.guide}
Base=${JSON.stringify({
    id: fallbackJourney.id,
    mode: fallbackJourney.mode,
    route_id: fallbackJourney.route_id,
  })}

Use the emit_json tool. Its top-level input must contain "modules": the learner journey weeks in the learner language/script. Week count must match the role: 4 for a short proof sprint, 8/10/12 if the roadmap says so. Every week: title, goal, 2 lessons, 5 daily_micro_tasks, 1 practice task, proof/proof_tasks, 1-2 resources with how_to_use/proof_to_save, completion_criteria, low_data_alternative, voice_whatsapp_version, unlock_after_completion. No fake jobs, centres, fees, salaries, contacts, or guaranteed outcomes. Unsafe trade = safety/supervised practice.

Tool input shape:
{"id":"","title":"","mode":"${fallbackJourney.mode || 'career_pathway'}","route_id":"${fallbackJourney.route_id || route.id || 'selected_route'}","route_name":"","readiness_score":0,"duration":{"mvp":"8-week journey","full":""},"delivery":{"primary_channel":"voice + WhatsApp + low data","accessibility":"phone-first"},"learning_contract":{"week_shape":"","resource_policy":"","proof_gate":"","opportunity_unlock":""},"modules":[{"id":"week-1","week":1,"title":"","goal":"","lessons":["",""],"daily_micro_tasks":["Day 1:","Day 2:","Day 3:","Day 4:","Day 5:"],"practice_tasks":[""],"proof":"","proof_tasks":[""],"resources":[{"title":"","type":"official|free_video_search|practice","source_url":"https://...","search_query":"","how_to_use":"","proof_to_save":""}],"completion_criteria":"","low_data_alternative":"","voice_whatsapp_version":"","unlock_after_completion":""}],"progress":{"completion_percent":0,"completed_count":0,"proof_ready_count":0,"passport_eligible":false,"placement_unlocked":false,"next_action":"Week 1: start Day 1"}}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const body = await readJson(req);
    const profile = body.profile || {};
    const route = body.route || {};
    const fallbackJourney = buildLearningJourney(profile, route);
    const useClaudeJourney = body.disable_ai_journey !== true && process.env.DISABLE_AI_JOURNEY !== 'true';
    const generated = useClaudeJourney
      ? await callAnthropicJson({
          fallback: fallbackJourney,
          maxTokens: Number(process.env.JOURNEY_CLAUDE_MAX_TOKENS || 6_000),
          timeoutMs: journeyClaudeTimeoutMs(),
          models: [process.env.ANTHROPIC_PLANNER_MODEL || process.env.ANTHROPIC_FAST_MODEL || 'claude-haiku-4-5-20251001'],
          toolSchema: JOURNEY_TOOL_SCHEMA,
          system: `You create VidyaSetu learner journeys for Tier-3 India. ${languageInstruction(profile, route.name || route.tradeoff || '')} Use the learner profile and selected pathway, not generic templates. Return valid JSON only.`,
          prompt: buildClaudeJourneyPrompt(profile, route, fallbackJourney),
        })
      : process.env.ENABLE_AI_JOURNEY_LOCALIZATION === 'true' || body.ai_localize === true
        ? await callClaudeJson({
            fallback: fallbackJourney,
            maxTokens: 1200,
            system: `You localize and personalize VidyaSetu learning journeys. ${languageInstruction(profile, route.name || route.tradeoff || '')} Preserve the exact JSON schema, enum-like values, ids, mode, route_id, numeric readiness_score, URLs, source names, module count, lesson/task structure, and completion/progress fields. Do not invent certifications, employers, or fees. Translate only learner-facing labels, module titles, lesson names, practice_tasks, proof names, and feedback into the same language/style. Return strict JSON only.`,
            prompt: `Profile:\n${JSON.stringify(profile)}\n\nSelected route:\n${JSON.stringify(route)}\n\nJourney JSON to preserve and localize:\n${JSON.stringify(fallbackJourney)}`,
          })
        : {
            data: fallbackJourney,
            ok: true,
            provider: 'deterministic_journey',
            model: null,
            fallback_chain: [],
            error: null,
          };
    const usableGeneratedModules = useClaudeJourney && generated.ok && hasUsableGeneratedModules(generated.data);
    const generatedData =
      useClaudeJourney && generated.ok && !usableGeneratedModules
        ? { ...generated.data, modules: fallbackJourney.modules, duration: fallbackJourney.duration }
        : generated.data;
    const journey = stabilizeJourneySchema(fallbackJourney, generatedData, { allowModuleCountChange: usableGeneratedModules });

    let persistence = await insertRows('learning_journeys', {
      learner_id: profile.learner_id || null,
      route_json: route,
      journey_json: journey,
      modules_json: journey.modules,
      progress_json: journey.progress,
      readiness_score: journey.readiness_score,
    });
    let fallbackPersistence = { ok: false, error: null };
    if (!persistence.ok && profile.learner_id) {
      fallbackPersistence = await patchRows('learners', { id: profile.learner_id }, {
        profile_json: {
          ...profile,
          memory_selected_route: route,
          memory_journey: journey,
          memory_progress: journey.progress || {},
          last_active_tab: 'journey',
          last_action: 'journey_created',
          updated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      });
      if (fallbackPersistence.ok) {
        persistence = {
          ok: true,
          table: 'learners.profile_json',
          error: null,
        };
      }
    }

    return sendJson(res, 200, {
      journey,
      proof: {
        generation: {
          ok: generated.ok,
          provider: generated.provider,
          model: generated.model || null,
          fallback_chain: generated.fallback_chain || [],
          error: generated.error,
        },
        persistence: {
          ok: persistence.ok,
          table: persistence.table || 'learning_journeys',
          error: persistence.error,
          fallback: fallbackPersistence.ok ? 'learners.profile_json' : null,
        },
      },
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}
