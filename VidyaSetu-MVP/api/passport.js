import { methodNotAllowed, readJson, sendJson } from './_lib/http.js';
import { insertRows, selectRows } from './_lib/supabase.js';
import { buildPassport } from './_lib/mvp.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const body = await readJson(req);
    const passport = buildPassport(body.profile, body.consent);
    const learnerId = body.profile?.learner_id || passport.learner_id;
    const latestJourney = learnerId
      ? await selectRows('learning_journeys', {
          filters: { learner_id: learnerId },
          order: 'updated_at.desc',
          limit: 1,
        })
      : { ok: false, data: [] };
    const latestJourneyRow = latestJourney.ok ? latestJourney.data?.[0] : null;
    const journey = body.journey || latestJourneyRow?.journey_json || {};
    const progress = safeObject(body.progress || body.journey?.progress || latestJourneyRow?.progress_json);
    const proofReadyCount = Number(progress.proof_ready_count || 0);
    const proofRequiredCount = Number(progress.proof_required_count || 0);
    const completionPercent = Number(progress.completion_percent || 0);
    const passportEligible = Boolean(progress.passport_eligible);
    const passportComplete = isJourneyCompleteForPassport(journey, progress);
    const academicMode = isAcademicJourney(journey);
    if (body.require_eligible === true && !passportComplete) {
      return sendJson(res, 409, {
        error: 'Complete the current learning journey proof before creating the Skill Passport.',
        learning: {
          completion_percent: completionPercent,
          proof_ready_count: proofReadyCount,
          proof_required_count: proofRequiredCount,
          passport_eligible: false,
          next_action: progress.next_action || 'Complete the learning journey proof first.',
        },
      });
    }

    if (body.selected_route?.name) {
      passport.certs = [
        { name: body.selected_route.name, status: 'selected pathway', verified_at: 'VidyaSetu route match' },
        ...(passport.certs || []),
      ];
    }
    if (journey?.readiness_score) {
      passport.assessment_scores = {
        ...(passport.assessment_scores || {}),
        journey_readiness: journey.readiness_score,
      };
      passport.informal = [
        ...(passport.informal || []),
        {
          name: `${journey.route_name || 'learning journey'} proof tasks`,
          verification_method: passportEligible
            ? 'Learner proof saved; worker review pending'
            : 'Draft journey; proof pending',
          score: journey.readiness_score,
        },
      ];
    }
    passport.status = passportEligible ? 'proof_ready_for_review' : 'draft_proof_pending';
    passport.learning_proof = {
      mode: journey.mode || 'journey_pending',
      completion_percent: completionPercent,
      proof_ready_count: proofReadyCount,
      proof_required_count: proofRequiredCount,
      completed_module_count: Number(progress.completed_module_count || 0),
      next_action: progress.next_action || 'Complete the first lesson and save proof before sharing.',
      placement_unlocked: Boolean(progress.placement_unlocked),
      learning_unlocked: Boolean(progress.learning_unlocked),
      passport_eligible: passportEligible,
    };
    passport.assessment_scores = {
      ...(passport.assessment_scores || {}),
      learning_completion: completionPercent,
      proof_readiness: proofRequiredCount ? Math.round((proofReadyCount / proofRequiredCount) * 100) : proofReadyCount ? 100 : 0,
    };
    passport.certs = [
      {
        name: academicMode ? 'Learning progress record' : 'Proof readiness record',
        status: passportEligible ? 'proof saved' : 'draft - proof pending',
        verified_at: `${completionPercent}% completion, ${proofReadyCount}/${proofRequiredCount || 1} proof notes`,
      },
      ...(passport.certs || []),
    ];

    const row = {
      learner_id: passport.learner_id,
      certs: passport.certs,
      informal: passport.informal,
      ncrf_credits: passport.ncrf_credits,
      consent_json: passport.consent,
      qr_token: passport.qr_token,
      updated_at: new Date().toISOString(),
    };

    const persistence = await insertRows('skill_passport', row, {
      upsert: true,
      onConflict: 'learner_id',
    });

    return sendJson(res, 200, {
      passport,
      proof: {
        persistence: {
          ok: persistence.ok,
          table: 'skill_passport',
          error: persistence.error,
        },
        learning: passport.learning_proof,
      },
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function isAcademicJourney(journey = {}) {
  return ['entrance_exam_prep', 'academic_exam_prep', 'school_study_support'].includes(journey.mode);
}

function isJourneyCompleteForPassport(journey = {}, progress = {}) {
  const modules = Array.isArray(journey?.modules) ? journey.modules : [];
  if (!modules.length) return false;
  const completionPercent = Number(progress.completion_percent || 0);
  const completedModules = Number(progress.completed_module_count || 0);
  const proofRequired = Number(progress.proof_required_count || modules.filter((module) => Boolean(module.proof)).length || 0);
  const proofReady = Number(progress.proof_ready_count || 0);
  return completionPercent >= 100 && completedModules >= modules.length && (!proofRequired || proofReady >= proofRequired);
}
