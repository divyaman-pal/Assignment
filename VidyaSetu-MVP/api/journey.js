import { methodNotAllowed, readJson, sendJson } from './_lib/http.js';
import { insertRows, patchRows } from './_lib/supabase.js';
import { buildLearningJourney } from './_lib/mvp.js';
import { languageInstruction } from './_lib/language.js';
import { callAnthropicJson, callClaudeJson } from './_lib/services.js';
import { tier3PlannerGuide } from './_lib/tier3-roadmaps.js';
import { runDailyReminderJob } from './adews.js';

const DEFAULT_JOURNEY_CLAUDE_TIMEOUT_MS = 90_000;
const MAX_JOURNEY_CLAUDE_TIMEOUT_MS = 150_000;

function journeyClaudeTimeoutMs() {
  const configured = Number(process.env.JOURNEY_CLAUDE_TIMEOUT_MS || DEFAULT_JOURNEY_CLAUDE_TIMEOUT_MS);
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_JOURNEY_CLAUDE_TIMEOUT_MS;
  return Math.min(configured, MAX_JOURNEY_CLAUDE_TIMEOUT_MS);
}

function journeyClaudeAttemptTimeoutMs() {
  const configured = Number(process.env.JOURNEY_CLAUDE_ATTEMPT_TIMEOUT_MS || 120_000);
  const attemptTimeout = Number.isFinite(configured) && configured > 0 ? configured : 120_000;
  return Math.min(journeyClaudeTimeoutMs(), attemptTimeout);
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
    const useGeneratedShape = Boolean(options.allowModuleCountChange);
    return {
      ...baseModule,
      ...nextModule,
      id: baseModule.id,
      week: baseModule.week,
      lessons: useGeneratedShape && nextLessons.length
        ? nextLessons
        : baseLessons.map((baseLesson, lessonIndex) =>
            typeof nextLessons[lessonIndex] === 'string' ? nextLessons[lessonIndex] : baseLesson,
          ),
      daily_micro_tasks: useGeneratedShape && nextMicroTasks.length
        ? nextMicroTasks
        : baseMicroTasks.map((baseTask, taskIndex) =>
            typeof nextMicroTasks[taskIndex] === 'string' ? nextMicroTasks[taskIndex] : baseTask,
          ),
      practice_tasks: useGeneratedShape && nextPracticeTasks.length
        ? nextPracticeTasks
        : basePracticeTasks.map((baseTask, taskIndex) =>
            typeof nextPracticeTasks[taskIndex] === 'string' ? nextPracticeTasks[taskIndex] : baseTask,
          ),
      proof_tasks: useGeneratedShape && nextProofTasks.length
        ? nextProofTasks
        : baseProofTasks.map((baseTask, taskIndex) =>
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
  }).map((module, moduleIndex) => enrichJourneyModule(module, moduleIndex));
  if (stable.modules.length && !/week MVP/i.test(String(stable.duration?.mvp || ''))) {
    stable.duration = {
      ...(stable.duration || {}),
      mvp: `${stable.modules.length}-week MVP journey`,
    };
  }

  return syncJourneyProgress(stable);
}

function enrichJourneyModule(module = {}, moduleIndex = 0) {
  const lessons = Array.isArray(module.lessons) ? module.lessons.filter(Boolean) : [];
  const proofTasks = Array.isArray(module.proof_tasks) ? module.proof_tasks.filter(Boolean) : [];
  const proof = String(module.proof || module.proof_task || proofTasks[0] || 'short proof note').trim();
  const unlock = String(module.unlocks || module.unlock_after_completion || module.unlock || `Week ${moduleIndex + 2}`).trim();
  const completion = String(module.completion_criteria || 'Finish the lesson, practice once, and save proof.').trim();
  const lessonDetails = Array.isArray(module.lesson_details) && module.lesson_details.length
    ? module.lesson_details
    : lessons.map((lesson) => ({
        title: lesson,
        completion_criteria: completion,
        proof_required: proof,
      }));
  return {
    ...module,
    lessons,
    practice_tasks: Array.isArray(module.practice_tasks) && module.practice_tasks.length
      ? module.practice_tasks.filter(Boolean)
      : ['Finish one small practice task and save proof.'],
    proof_tasks: proofTasks.length ? proofTasks : [proof],
    why_it_matters:
      module.why_it_matters ||
      `This week matters because it turns ${module.goal || module.title || 'the selected pathway'} into one small proof-backed step.`,
    completion_criteria: module.completion_criteria || completion,
    proof,
    proof_task: module.proof_task || proof,
    unlocks: module.unlocks || unlock,
    unlock_after_completion: module.unlock_after_completion || unlock,
    lesson_details: lessonDetails.map((lesson) => {
      if (lesson && typeof lesson === 'object' && !Array.isArray(lesson)) {
        return {
          ...lesson,
          title: lesson.title || lesson.label || lesson.name || 'Lesson',
          completion_criteria: lesson.completion_criteria || completion,
          proof_required: lesson.proof_required || proof,
        };
      }
      return {
        title: String(lesson || 'Lesson'),
        completion_criteria: completion,
        proof_required: proof,
      };
    }),
  };
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

const JOURNEY_GENERATOR_TOOL_SCHEMA = {
  type: 'object',
  required: ['modules'],
  additionalProperties: true,
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    mode: { type: 'string' },
    route_id: { type: 'string' },
    route_name: { type: 'string' },
    readiness_score: { type: 'number' },
    duration: { type: 'object', additionalProperties: true },
    delivery: { type: 'object', additionalProperties: true },
    learning_contract: { type: 'object', additionalProperties: true },
    modules: {
      type: 'array',
      minItems: 4,
      items: { type: 'object', additionalProperties: true },
    },
    progress: { type: 'object', additionalProperties: true },
  },
};

function hasUsableGeneratedModules(journey = {}) {
  const modules = coerceJourneyModules(journey);
  if (modules.length < 4) return false;
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

function coerceJourneyModules(journey = {}) {
  if (Array.isArray(journey)) return journey;
  if (!journey || typeof journey !== 'object') return [];
  const direct = Array.isArray(journey.modules)
    ? journey.modules
    : Array.isArray(journey.weeks)
      ? journey.weeks
      : Array.isArray(journey.weekly_modules)
        ? journey.weekly_modules
        : Array.isArray(journey.week_modules)
          ? journey.week_modules
          : Array.isArray(journey.learning_modules)
            ? journey.learning_modules
            : Array.isArray(journey.journey_modules)
              ? journey.journey_modules
              : Array.isArray(journey.weekly_plan)
                ? journey.weekly_plan
                : [];
  if (direct.length) return direct;
  const nested = Object.values(journey)
    .filter((value) => value && typeof value === 'object' && !Array.isArray(value))
    .flatMap((value) => coerceJourneyModules(value));
  if (nested.length >= 4) return nested;
  return Object.values(journey)
    .filter((value) => value && typeof value === 'object' && !Array.isArray(value))
    .filter((value) => value.week || value.title || value.goal || Array.isArray(value.daily_micro_tasks));
}

function completeGeneratedModules(journey = {}, profile = {}, route = {}, targetWeeks = 4) {
  const modules = coerceJourneyModules(journey);
  if (modules.length < 3 || modules.length >= targetWeeks) return { journey, padded: false };
  const completed = [...modules];
  while (completed.length < targetWeeks) {
    completed.push(paddingJourneyModule(profile, route, completed.length + 1));
  }
  return {
    journey: {
      ...(journey || {}),
      modules: completed,
      duration: {
        ...(journey.duration || {}),
        mvp: journey.duration?.mvp || `${completed.length}-week journey`,
      },
    },
    padded: true,
  };
}

function paddingJourneyModule(profile = {}, route = {}, week = 4) {
  const language = String(profile.preferred_language || profile.language || '').toLowerCase();
  const goal = profile.learner_goal?.label || route.pathway_detail?.realistic_role || route.name || 'selected goal';
  const search = encodeURIComponent(`${goal} beginner free learning local buyer supplier risk`);
  const common = {
    id: `week-${week}`,
    week,
    resources: [{
      title: `${goal} review resource`,
      type: 'free_video_search',
      source_url: `https://www.youtube.com/results?search_query=${search}`,
      search_query: `${goal} beginner free learning local buyer supplier risk`,
      how_to_use: 'Use one small part only, pause, note three points, and save proof.',
      proof_to_save: 'Progress note and next-step decision.',
    }],
  };
  if (/odia/.test(language)) {
    return {
      ...common,
      title: 'ପ୍ରଗତି review ଓ ପରବର୍ତ୍ତୀ ନିଷ୍ପତ୍ତି',
      goal: `${goal} ପାଇଁ ଯାହା ଶିଖିଲେ ତାହା review କରି ଛୋଟ next step ବାଛନ୍ତୁ.`,
      lessons: ['ଖର୍ଚ୍ଚ, buyer, supplier ଓ risk ତାଲିକା review କରନ୍ତୁ.', 'Loan କିମ୍ବା ଖର୍ଚ୍ଚ ପୂର୍ବରୁ worker/family ସହ ଯାଞ୍ଚ କରନ୍ତୁ.'],
      daily_micro_tasks: ['Day 1: ସବୁ proof ଗୋଟେ ଜାଗାରେ ଲେଖନ୍ତୁ.', 'Day 2: buyer/supplier ତାଲିକା check କରନ୍ତୁ.', 'Day 3: start/stop/learn-more decision ଲେଖନ୍ତୁ.'],
      practice_tasks: ['ଗୋଟେ page ରେ ଖର୍ଚ୍ଚ, risk, next step ଲେଖନ୍ତୁ.'],
      proof: 'Review note + next-step decision',
      proof_tasks: ['Review note ଓ next-step decision save କରନ୍ତୁ.'],
      completion_criteria: 'Cost, buyer/supplier, risk, and next step are written.',
      low_data_alternative: 'Video ନ ଚାଲିଲେ voice note ରେ 3 point record କରନ୍ତୁ.',
      voice_whatsapp_version: 'ଏହି ସପ୍ତାହରେ ମୁଁ ମୋ proof ଦେଖି next step ବାଛିଲି.',
      unlock_after_completion: 'Worker/source review ପରେ next local step.',
    };
  }
  return {
    ...common,
    title: 'Review progress and choose next step',
    goal: `Review proof for ${goal} and choose the safest next step.`,
    lessons: ['Review cost, buyer/source, supplier, safety, and proof.', 'Do not spend or share details before source/worker review.'],
    daily_micro_tasks: ['Day 1: Put all proof in one place.', 'Day 2: Check buyer/source and cost doubts.', 'Day 3: Write start/stop/learn-more decision.'],
    practice_tasks: ['Write one page with cost, risk, proof, and next step.'],
    proof: 'Progress review + next-step decision',
    proof_tasks: ['Save review note and next-step decision.'],
    completion_criteria: 'Cost, source, risk, proof, and next step are written.',
    low_data_alternative: 'If video does not play, record a 1-minute voice note.',
    voice_whatsapp_version: 'This week I reviewed my proof and chose the next safe step.',
    unlock_after_completion: 'Worker/source review before the next local step.',
  };
}

function journeyTargetWeeks(profile = {}, route = {}, fallbackJourney = {}) {
  const text = [
    profile.learner_goal?.label,
    profile.learner_goal?.type,
    route.name,
    route.tradeoff,
    route.pathway_detail?.realistic_role,
    route.income_path,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const formalCertification =
    /diploma|iti|board exam|government exam|exam readiness|licensed|licence|license|electrician|solar|nursing|paramedic/.test(
      text,
    );
  if (formalCertification && Array.isArray(fallbackJourney.modules) && fallbackJourney.modules.length > 4) {
    return Math.min(fallbackJourney.modules.length, 12);
  }
  return 4;
}

function journeyBuilderSystemPrompt(profile = {}, route = {}, { useTool = false } = {}) {
  const lang = languageInstruction(profile, route.name || route.tradeoff || '');
  const emit = useTool ? 'Use the emit_json tool.' : 'Return valid JSON only.';
  return `${lang}
CONTEXT
You are Meera, VidyaSetu's learner-journey builder for Tier-3 and rural India.
Two steps already happened: you spoke with the learner and understood their life, then they picked one pathway toward a livelihood goal. This is the final step: turn that one pathway into a 4-week, day-by-day roadmap this exact learner can actually follow on a phone.
Picture the learner: phone-first, low budget, more comfortable listening than reading, limited English, often the first in their family to attempt this. They need tiny doable steps, free or official resources, and a feeling of real progress every single day.

INPUT
You are given the learner profile, selected pathway, target week count, and a roadmap catalog/resource guide. Use the learner's language, goal, location, daily time, phone access, commute distance, education level, and any assets or constraints. Use the selected pathway's name, realistic role, first step, and verification needs. Use only the roadmap catalog/resource guide, selected route source, or safe free/official goal-specific search URLs for weekly resources. Never invent links, names, phone numbers, centres, contacts, jobs, wages, fees, or approvals.

OUTPUT
${emit} Follow the given JSON shape exactly: a top-level "modules" array of week objects. Produce 4 week-modules unless the input target_weeks asks for more. Each week object must have: title, goal, 2 short lessons, day-wise daily_micro_tasks ending with a Sunday review where possible, 1 practice task, proof, proof_tasks, exactly 1 resource with title/type/source_url/search_query/how_to_use/proof_to_save, completion_criteria, low_data_alternative, voice_whatsapp_version, unlock_after_completion. All learner-facing text must be in the learner's language/script; official names and URLs stay unchanged.

RULES
1. Personalise to this learner and this goal. If the goal is oyster mushroom, every week, task, and resource must be mushroom-specific. Never fall back to generic "enterprise setup", "career exploration", or "do a Skill India course" when a goal-specific free/official source exists.
2. Every week must move forward. No repeated or filler weeks. Natural arc: Week 1 learn and set up; middle weeks practise and make the first real attempt, such as first batch, first sale, first application, first sample, or first source check; final week stabilise and plan what comes next.
3. Inside a week, make the daily shape feel simple: understand; watch or listen to one small part of the resource; do one tiny safe task; ask or review with a helpline, centre, trusted person, buyer, worker, or source; save proof; short Sunday review.
4. Exactly 1 resource per week. Prefer the official portal, helpline, or local centre when appropriate: KVK, ITI, bank, CSC, Kisan Call Centre, NCS, Skill India, or another route-specific official/free source. For a hands-on skill, a precise YouTube search URL is allowed. Always fill how_to_use: watch one part, pause, write 2-3 points, do the tiny task, save proof.
5. One clear, photographable or recordable proof each week must gate the next week: before/after photo, 1-minute voice note, screenshot, sample work, score, notebook page, or submitted-form proof. Reflect it in completion_criteria and unlock_after_completion.
6. Keep every learner-facing sentence short enough to be spoken aloud. Use concrete verbs. No jargon, long paragraphs, or English-heavy strategy words.
7. Guardrails. Business/scheme weeks must check buyer, supplier, cost, risk, and official eligibility before spending or taking a loan. Job weeks must include proof, commute/safety, source verification, and consent before outreach. Regulated fields must route to official portals or recognised centres and stay within the learner's trained scope.
8. Never invent jobs, employers, fees, salaries, contacts, loan approvals, centres, or guaranteed outcomes. If something must be confirmed locally, make "go confirm it" the task itself.
9. Always provide low_data_alternative and voice_whatsapp_version so the journey works on weak networks and daily reminders.

EXAMPLE SHAPE ONLY - adapt fully, never copy content:
{"week":2,"title":"Pehla mushroom batch lagao","goal":"Apne shaded kamre mein oyster mushroom ka pehla chhota batch shuru karna","lessons":["Spawn, straw aur bag kaise taiyaar karte hain","Roz ki nami aur safai ka dhyan"],"daily_micro_tasks":["Day 1: oyster mushroom setup ka ek part dekho, 3 point likho","Day 2: spawn aur straw ka cost likho aur 1 supplier confirm karo","Day 3: ek bag mein straw bharke spawn lagao","Day 4: Kisan Call Centre ko call karke nami/temperature poocho","Day 5: bag ki photo lo aur date likho","Sunday: hafte ka review - kya theek raha, kya badalna hai"],"practice_tasks":["Khud ek poora mushroom bag taiyaar karo"],"proof":"Pehle din ke bag ki photo with date","proof_tasks":["Bag photo save karo"],"resources":[{"title":"Skill India Digital - Mushroom Cultivation","type":"official","source_url":"https://www.skillindiadigital.gov.in","search_query":"oyster mushroom cultivation training","how_to_use":"Ek hi part dekho, pause karke 3 point likho, phir ek bag khud lagao","proof_to_save":"Notes + bag ki photo"}],"completion_criteria":"Ek mushroom bag laga diya aur photo save ki","low_data_alternative":"Video na chale to KVK ya Kisan Call Centre se steps poocho","voice_whatsapp_version":"Is hafte maine apna pehla mushroom bag lagaya","unlock_after_completion":"Week 3: roz ki care aur growth tracking"}`;
}

function buildClaudeJourneyPrompt(profile = {}, route = {}, fallbackJourney = {}) {
  const guide = tier3PlannerGuide(profile, route.name || route.tradeoff || '', route);
  const targetWeeks = journeyTargetWeeks(profile, route, fallbackJourney);
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
    target_weeks: targetWeeks,
  })}

Return one JSON object only through the emit_json tool. It must contain exactly ${targetWeeks} "modules" for this MVP journey. Use more than 4 only when target_weeks above is more than 4. Every module/week must have: title, goal, 2 short lessons, 5 day-wise daily_micro_tasks, 1 practice task, proof, proof_tasks, exactly 1 resource with title/type/source_url/search_query/how_to_use/proof_to_save, completion_criteria, low_data_alternative, voice_whatsapp_version, unlock_after_completion. Keep every learner-facing sentence short enough to be spoken aloud. No fake jobs, centres, fees, salaries, contacts, or guaranteed outcomes. Unsafe trade = safety/supervised practice.

Product quality rules:
- Build for a rural, low-literacy, voice-first learner. Use short concrete verbs. Avoid abstract strategy words, resume jargon, and long paragraphs.
- Use the learner's exact goal and selected route. If the goal is mushroom farming, every week/resource must be mushroom-specific. Do not substitute generic "enterprise setup", "Skill India course", or "career exploration" unless no better free/official source exists.
- Each week should feel useful by itself: Day 1 understand, Day 2 watch/listen one small resource part, Day 3 do a safe tiny task, Day 4 ask/review, Day 5 save proof.
- Resources must be free, official, or goal-specific video/search links. For YouTube resources, set source_url to a search URL and search_query to the exact local-language goal (example: "mushroom farming business setup beginner Hindi oyster mushroom low cost"). Explain how to consume: watch only one matching part, pause, write 3 points, do the tiny task, save proof.
- For business/scheme users, include buyer/supplier/cost/risk and official scheme eligibility checks before loan/spending. For job users, include proof, commute/safety, source verification, and consent before outreach.
- Keep learner-facing text in the selected language/script. Official names/URLs can remain unchanged.

Tool input shape:
{"id":"","title":"","mode":"${fallbackJourney.mode || 'career_pathway'}","route_id":"${fallbackJourney.route_id || route.id || 'selected_route'}","route_name":"","readiness_score":0,"duration":{"mvp":"${targetWeeks}-week journey","full":""},"delivery":{"primary_channel":"voice + WhatsApp + low data","accessibility":"phone-first"},"learning_contract":{"week_shape":"","resource_policy":"","proof_gate":"","opportunity_unlock":""},"modules":[{"id":"week-1","week":1,"title":"","goal":"","lessons":["",""],"daily_micro_tasks":["Day 1:","Day 2:","Day 3:","Day 4:","Day 5:"],"practice_tasks":[""],"proof":"","proof_tasks":[""],"resources":[{"title":"","type":"official|free_video_search|practice","source_url":"https://...","search_query":"","how_to_use":"","proof_to_save":""}],"completion_criteria":"","low_data_alternative":"","voice_whatsapp_version":"","unlock_after_completion":""}],"progress":{"completion_percent":0,"completed_count":0,"proof_ready_count":0,"passport_eligible":false,"placement_unlocked":false,"next_action":"Week 1: start Day 1"}}`;
}

function buildCompactClaudeJourneyPrompt(profile = {}, route = {}, fallbackJourney = {}) {
  const guide = tier3PlannerGuide(profile, route.name || route.tradeoff || '', route);
  const targetWeeks = journeyTargetWeeks(profile, route, fallbackJourney);
  return `Return one valid JSON object with a top-level "modules" array. Do not include markdown.
Learner=${JSON.stringify({
    language: profile.preferred_language || profile.language || 'learner language',
    goal: profile.learner_goal?.label || (profile.aspirations || [])[0] || route.name || '',
    education: profile.class_level || profile.education_status || '',
    location: profile.location || '',
    time_available: profile.time_available || '',
    phone_access: profile.phone_access || profile.device || '',
    commute_km: profile.commute_km || '',
    support_needs: profile.support_needs || [],
  })}
Selected route=${JSON.stringify({
    name: route.name,
    first_step: route.first_step,
    realistic_role: route.pathway_detail?.realistic_role,
    what_to_check: route.pathway_detail?.what_to_check,
    source_url: route.source_url,
  })}
Roadmap catalog=${guide.guide}
target_weeks=${targetWeeks}

Return exactly ${targetWeeks} week modules in the learner language/script. Each week must be specific to the exact goal, not generic enterprise/career content. For each week use 2 short lessons, 5-6 day-wise daily_micro_tasks ending with a Sunday review, 1 practice task, 1 proof, proof_tasks, and exactly 1 free/official/goal-specific resource. Use YouTube search URLs for specific free videos when official resources are not enough. Explain how to consume the resource: watch/listen one small part, pause, do the tiny task, save proof. No fake jobs, contacts, fees, income, loan approval, or centre claims.

JSON shape:
{"title":"","duration":{"mvp":"${targetWeeks}-week journey"},"modules":[{"id":"week-1","week":1,"title":"","goal":"","lessons":["",""],"daily_micro_tasks":["Day 1:","Day 2:","Day 3:","Day 4:","Day 5:","Sunday:"],"practice_tasks":[""],"proof":"","proof_tasks":[""],"resources":[{"title":"","type":"official|free_video_search|practice","source_url":"https://www.youtube.com/results?search_query=","search_query":"","how_to_use":"","proof_to_save":""}],"completion_criteria":"","low_data_alternative":"","voice_whatsapp_version":"","unlock_after_completion":""}],"progress":{"completion_percent":0,"completed_count":0,"proof_ready_count":0,"passport_eligible":false,"placement_unlocked":false,"next_action":"Week 1: start Day 1"}}`;
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
    let generated = useClaudeJourney
      ? await callAnthropicJson({
          fallback: fallbackJourney,
          maxTokens: Number(process.env.JOURNEY_CLAUDE_MAX_TOKENS || 9_000),
          timeoutMs: journeyClaudeAttemptTimeoutMs(),
          useTool: false,
          models: [
            process.env.ANTHROPIC_FAST_MODEL,
            'claude-haiku-4-5-20251001',
            process.env.ANTHROPIC_PLANNER_MODEL,
            process.env.ANTHROPIC_MODEL,
            'claude-sonnet-4-5',
          ],
          toolSchema: JOURNEY_GENERATOR_TOOL_SCHEMA,
          system: journeyBuilderSystemPrompt(profile, route, { useTool: false }),
          prompt: buildCompactClaudeJourneyPrompt(profile, route, fallbackJourney),
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
    if (process.env.JOURNEY_CLAUDE_SECOND_ATTEMPT === 'true' && useClaudeJourney && (!generated.ok || !hasUsableGeneratedModules(generated.data))) {
      const compactRetry = await callAnthropicJson({
        fallback: fallbackJourney,
        maxTokens: Number(process.env.JOURNEY_CLAUDE_RETRY_MAX_TOKENS || 6_500),
        timeoutMs: journeyClaudeAttemptTimeoutMs(),
        useTool: true,
        models: [
          process.env.ANTHROPIC_PLANNER_MODEL,
          process.env.ANTHROPIC_MODEL,
          process.env.ANTHROPIC_FAST_MODEL,
          'claude-sonnet-4-5',
          'claude-haiku-4-5-20251001',
        ],
        toolSchema: JOURNEY_GENERATOR_TOOL_SCHEMA,
        system: journeyBuilderSystemPrompt(profile, route, { useTool: true }),
        prompt: buildCompactClaudeJourneyPrompt(profile, route, fallbackJourney),
      });
      generated = compactRetry.ok && hasUsableGeneratedModules(compactRetry.data)
        ? compactRetry
        : {
            ...generated,
            error: [generated.error, `compact retry: ${compactRetry.error}`].filter(Boolean).join(' | '),
          };
    }
    const targetWeeks = journeyTargetWeeks(profile, route, fallbackJourney);
    let paddedGeneratedModules = false;
    if (useClaudeJourney && generated.ok && !Array.isArray(generated.data?.modules)) {
      const coercedModules = coerceJourneyModules(generated.data);
      if (coercedModules.length) generated.data = { ...(generated.data || {}), modules: coercedModules };
    }
    if (useClaudeJourney && generated.ok) {
      const completed = completeGeneratedModules(generated.data, profile, route, targetWeeks);
      generated.data = completed.journey;
      paddedGeneratedModules = completed.padded;
    }
    const usableGeneratedModules = useClaudeJourney && generated.ok && hasUsableGeneratedModules(generated.data);
    const generationOk = useClaudeJourney ? usableGeneratedModules : generated.ok;
    const generatedData =
      useClaudeJourney && generated.ok && !usableGeneratedModules
        ? { ...generated.data, modules: fallbackJourney.modules, duration: fallbackJourney.duration }
        : generated.data;
    const journey = stabilizeJourneySchema(fallbackJourney, generatedData, { allowModuleCountChange: usableGeneratedModules });
    if (usableGeneratedModules) {
      journey.duration = {
        ...(journey.duration || {}),
        mvp: /week MVP/i.test(String(generated.data?.duration?.mvp || ''))
          ? generated.data.duration.mvp
          : `${journey.modules.length}-week MVP journey`,
      };
    }

    let persistence = await insertRows('learning_journeys', {
      learner_id: profile.learner_id || null,
      route_json: route,
      journey_json: journey,
      modules_json: journey.modules,
      progress_json: journey.progress,
      readiness_score: journey.readiness_score,
    });
    const now = new Date().toISOString();
    const reminderState = {
      ...(profile.reminder_state || profile.memory_reminders || {}),
      enabled: true,
      daily_enabled: true,
      started_at: profile.reminder_state?.started_at || profile.memory_reminders?.started_at || now,
      started_reason: 'pathway_locked',
      selected_route_name: route.name || journey.route_name || '',
      pathway_locked_at: now,
    };
    let learnerMemoryPersistence = { ok: false, error: profile.learner_id ? null : 'No learner_id' };
    if (profile.learner_id) {
      learnerMemoryPersistence = await patchRows('learners', { id: profile.learner_id }, {
        profile_json: {
          ...profile,
          memory_selected_route: route,
          memory_journey: journey,
          memory_progress: journey.progress || {},
          reminder_state: reminderState,
          memory_reminders: reminderState,
          whatsapp_reminders_enabled: true,
          last_active_tab: 'journey',
          last_action: 'journey_created',
          updated_at: now,
        },
        updated_at: now,
      });
      if (!persistence.ok && learnerMemoryPersistence.ok) {
        persistence = {
          ok: true,
          table: 'learners.profile_json',
          error: null,
        };
      }
    }
    const immediateReminder = profile.learner_id
      ? await runDailyReminderJob({
          learnerId: profile.learner_id,
          limit: 1,
          forceEnabled: true,
          dryRun: body.reminder_dry_run === true,
        })
      : {
          ok: false,
          job: 'daily-reminders',
          error: 'No learner_id for immediate reminder.',
          sent: 0,
        };

    return sendJson(res, 200, {
      journey,
      proof: {
        generation: {
          ok: generationOk,
          provider: generated.provider,
          model: generated.model || null,
          fallback_chain: generated.fallback_chain || [],
          used_generated_modules: usableGeneratedModules,
          used_completion_padding: paddedGeneratedModules,
          used_fallback_modules: useClaudeJourney && !usableGeneratedModules,
          error: generationOk
            ? null
            : generated.error ||
              `Claude journey parsed but did not produce usable modules (modules=${coerceJourneyModules(generated.data).length}; keys=${Object.keys(generated.data || {}).join(',')}; preview=${JSON.stringify(generated.data || {}).slice(0, 260)}); deterministic fallback used.`,
        },
        persistence: {
          ok: persistence.ok,
          table: persistence.table || 'learning_journeys',
          error: persistence.error,
          fallback: !persistence.ok && learnerMemoryPersistence.ok ? 'learners.profile_json' : null,
          learner_memory: {
            ok: learnerMemoryPersistence.ok,
            table: 'learners.profile_json',
            error: learnerMemoryPersistence.error || null,
          },
        },
        reminder: {
          ok: Boolean(immediateReminder.ok),
          provider: 'wati',
          sent: Number(immediateReminder.sent || 0),
          dry_run: Boolean(immediateReminder.dry_run),
          skipped: Number(immediateReminder.skipped || 0),
          failed: Number(immediateReminder.failed || 0),
          error: immediateReminder.error || null,
        },
      },
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}
