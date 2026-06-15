import { methodNotAllowed, readJson, sendJson } from './_lib/http.js';
import { insertRows, patchRows } from './_lib/supabase.js';
import { buildLearningJourney } from './_lib/mvp.js';
import { languageInstruction } from './_lib/language.js';
import { callFireworksJson } from './_lib/services.js';

function stabilizeJourneySchema(base = {}, localized = {}) {
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

  stable.modules = (base.modules || []).map((baseModule, moduleIndex) => {
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

  return stable;
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
    const generated =
      process.env.ENABLE_AI_JOURNEY_LOCALIZATION === 'true' || body.ai_localize === true
        ? await callFireworksJson({
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
    const journey = stabilizeJourneySchema(fallbackJourney, generated.data);

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
