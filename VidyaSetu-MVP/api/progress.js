import { methodNotAllowed, readJson, sendJson } from './_lib/http.js';
import { patchRows, selectRows } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const body = await readJson(req);
    const learnerId = body.learner_id || body.learnerId;
    if (!learnerId) {
      return sendJson(res, 400, { error: 'learner_id is required to save progress.' });
    }

    const journeyLookup = await selectRows('learning_journeys', {
      filters: { learner_id: learnerId },
      order: 'updated_at.desc',
      limit: 1,
    });
    const row = journeyLookup.ok ? journeyLookup.data?.[0] : null;
    const journeyJson = safeObject(body.journey || row?.journey_json);
    const previousProgress = safeObject(row?.progress_json || journeyJson.progress);
    const completedLessonMap = normalizeBooleanMap(body.completed_lessons ?? previousProgress.completed_lesson_map);
    const proofNotes = normalizeTextMap(body.proof_notes ?? previousProgress.proof_notes);
    const proofArtifacts = normalizeTextMap(body.proof_artifacts ?? previousProgress.proof_artifacts);
    const progress = buildProgressState({
      journey: journeyJson,
      previousProgress,
      completedLessonMap,
      proofNotes,
      proofArtifacts,
      activeTab: body.active_tab || 'journey',
      lastAction: body.last_action || 'lesson_progress_saved',
    });

    const learner = await selectRows('learners', { filters: { id: learnerId }, limit: 1 });
    const profile = learner.ok ? learner.data?.[0]?.profile_json || {} : {};
    const learnerMemoryPayload = {
      profile_json: {
        ...profile,
        memory_journey: Object.keys(journeyJson).length ? journeyJson : profile.memory_journey,
        memory_progress: progress,
        last_active_tab: body.active_tab || 'journey',
        last_action: body.last_action || 'lesson_progress_saved',
        updated_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };

    if (!row?.id) {
      const fallback = await patchRows('learners', { id: learnerId }, learnerMemoryPayload);
      return sendJson(res, 200, {
        ok: fallback.ok,
        progress,
        proof: proofEnvelope({
          ok: fallback.ok,
          table: 'learners.profile_json',
          error: fallback.error || journeyLookup.error || null,
          fallback: true,
          progress,
        }),
      });
    }

    const persistence = await patchRows('learning_journeys', { id: row.id }, {
      progress_json: progress,
      updated_at: new Date().toISOString(),
    });
    const learnerMemoryPersistence = await patchRows('learners', { id: learnerId }, learnerMemoryPayload);

    return sendJson(res, 200, {
      ok: persistence.ok || learnerMemoryPersistence.ok,
      progress,
      proof: proofEnvelope({
        ok: persistence.ok || learnerMemoryPersistence.ok,
        table: persistence.ok ? 'learning_journeys' : 'learners.profile_json',
        error: persistence.error || learnerMemoryPersistence.error || null,
        fallback: !persistence.ok && learnerMemoryPersistence.ok,
        progress,
      }),
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}

function buildProgressState({
  journey = {},
  previousProgress = {},
  completedLessonMap = {},
  proofNotes = {},
  proofArtifacts = {},
  activeTab = 'journey',
  lastAction = 'lesson_progress_saved',
}) {
  const modules = Array.isArray(journey.modules) ? journey.modules : [];
  const itemKeys = modules.flatMap((module) => moduleItems(module).map((item) => item.key));
  const completedKeys = itemKeys.length
    ? itemKeys.filter((key) => Boolean(completedLessonMap[key]))
    : Object.entries(completedLessonMap)
        .filter(([, done]) => Boolean(done))
        .map(([key]) => key);
  const totalCount = itemKeys.length || completedKeys.length;
  const completionPercent = totalCount ? Math.round((completedKeys.length / totalCount) * 100) : 0;
  const academicMode = isAcademicJourney(journey);

  let previousModuleComplete = true;
  const moduleStatus = modules.map((module, index) => {
    const items = moduleItems(module);
    const completed = items.filter((item) => Boolean(completedLessonMap[item.key])).length;
    const total = items.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    const proofNote = proofNotes[module.id] || '';
    const proofArtifact = proofArtifacts[module.id] || '';
    const proofReady = Boolean(String(proofNote || proofArtifact).trim()) && (completed > 0 || total === 0);
    const moduleComplete = total ? completed === total && proofReady : proofReady;
    const unlocked = index === 0 || previousModuleComplete;
    const status = moduleComplete ? 'complete' : unlocked ? (completed > 0 || proofReady ? 'in_progress' : 'ready') : 'locked';
    const summary = {
      id: module.id,
      week: module.week || index + 1,
      title: module.title || `Week ${index + 1}`,
      proof_required: module.proof || '',
      unlock: module.unlock || '',
      completed,
      total,
      completion_percent: percent,
      proof_note: proofNote,
      proof_artifact: proofArtifact,
      proof_ready: proofReady,
      module_complete: moduleComplete,
      unlocked,
      status,
    };
    previousModuleComplete = moduleComplete;
    return summary;
  });

  const proofRequiredCount = modules.filter((module) => Boolean(module.proof)).length;
  const proofReadyCount = moduleStatus.filter((module) => module.proof_ready).length;
  const completedModuleCount = moduleStatus.filter((module) => module.module_complete).length;
  const currentModule =
    moduleStatus.find((module) => module.unlocked && !module.module_complete) ||
    moduleStatus.find((module) => !module.module_complete) ||
    moduleStatus[moduleStatus.length - 1] ||
    null;
  const minimumProofs = Math.min(2, Math.max(1, proofRequiredCount));
  const passportEligible = academicMode
    ? completionPercent >= 25 || proofReadyCount >= 1
    : proofReadyCount >= minimumProofs || (completionPercent >= 30 && proofReadyCount >= 1);
  const placementUnlocked = !academicMode && passportEligible;
  const learningUnlocked = academicMode && passportEligible;

  return {
    ...previousProgress,
    completed_lesson_map: completedLessonMap,
    completed_lesson_keys: completedKeys,
    completed_count: completedKeys.length,
    total_count: totalCount,
    completion_percent: completionPercent,
    proof_notes: proofNotes,
    proof_artifacts: proofArtifacts,
    proof_ready_count: proofReadyCount,
    proof_required_count: proofRequiredCount,
    completed_module_count: completedModuleCount,
    module_status: moduleStatus,
    current_module_id: currentModule?.id || null,
    current_module_week: currentModule?.week || null,
    current_module_title: currentModule?.title || '',
    next_action: nextActionFor({ currentModule, academicMode }),
    unlock_label: previousProgress.unlock_label || (academicMode ? 'Study unlock rule' : 'Placement unlock rule'),
    placement_unlock_rule:
      previousProgress.placement_unlock_rule ||
      (academicMode
        ? 'Unlock the next study level after lesson checks, practice work, and one proof note are saved.'
        : 'Unlock employer outreach after enough lessons, two proof tasks, and worker safety review.'),
    passport_eligible: passportEligible,
    placement_unlocked: placementUnlocked,
    learning_unlocked: learningUnlocked,
    last_active_tab: activeTab,
    last_action: lastAction,
    updated_at: new Date().toISOString(),
  };
}

function nextActionFor({ currentModule, academicMode }) {
  if (!currentModule) {
    return academicMode
      ? 'Course complete. Save the study progress and choose the next subject or mock level.'
      : 'Journey complete. Save the Skill Passport and move to opportunity matching.';
  }
  if (!currentModule.unlocked) {
    return `Finish the previous week before Week ${currentModule.week} opens.`;
  }
  if (currentModule.total && currentModule.completed < currentModule.total) {
    return `Week ${currentModule.week}: complete the next lesson or practice task, then tap it done.`;
  }
  if (!currentModule.proof_ready) {
    return `Week ${currentModule.week}: add a short proof note, photo/link description, or score before moving ahead.`;
  }
  return academicMode
    ? `Week ${currentModule.week} is ready. Save progress and continue to the next study block.`
    : `Week ${currentModule.week} proof is ready. Continue until Skill Passport is eligible.`;
}

function moduleItems(module = {}) {
  const lessons = Array.isArray(module.lessons) ? module.lessons : [];
  const tasks = Array.isArray(module.practice_tasks) ? module.practice_tasks : [];
  return [
    ...lessons.map((item) => ({ kind: 'lesson', label: item, key: itemKey(module.id, 'lesson', item) })),
    ...tasks.map((item) => ({ kind: 'task', label: item, key: itemKey(module.id, 'task', item) })),
  ];
}

function itemKey(moduleId, kind, item) {
  return `${moduleId || 'module'}::${kind}::${item}`;
}

function isAcademicJourney(journey = {}) {
  return ['entrance_exam_prep', 'academic_exam_prep', 'school_study_support'].includes(journey.mode);
}

function normalizeBooleanMap(value) {
  const input = safeObject(value);
  return Object.fromEntries(Object.entries(input).map(([key, done]) => [key, Boolean(done)]));
}

function normalizeTextMap(value) {
  const input = safeObject(value);
  return Object.fromEntries(
    Object.entries(input)
      .map(([key, text]) => [key, String(text || '').trim()])
      .filter(([key]) => Boolean(key)),
  );
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function proofEnvelope({ ok, table, error, fallback, progress }) {
  return {
    persistence: {
      ok,
      table,
      error,
      fallback,
    },
    progress: {
      completion_percent: progress.completion_percent,
      completed_count: progress.completed_count,
      total_count: progress.total_count,
      proof_ready_count: progress.proof_ready_count,
      proof_required_count: progress.proof_required_count,
      passport_eligible: progress.passport_eligible,
      placement_unlocked: progress.placement_unlocked,
      next_action: progress.next_action,
    },
  };
}
