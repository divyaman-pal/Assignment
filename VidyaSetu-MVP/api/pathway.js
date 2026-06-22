import { methodNotAllowed, readJson, sendJson } from './_lib/http.js';
import { insertRows, patchRows, selectRows } from './_lib/supabase.js';
import { generatePathways } from './_lib/services.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const body = await readJson(req);
    const profile = body.profile || {};
    const generated = await generatePathways(profile, body.question || '');
    const payload = {
      learner_id: profile.learner_id || null,
      routes_json: generated.data.routes || [],
      confidence: generated.data.confidence || 0,
      callback_flag: Boolean(generated.data.callback_flag),
    };
    const persistence = await insertRows('pathways', payload);
    let learnerMemoryPersistence = { ok: false, error: profile.learner_id ? null : 'No learner_id' };
    if (profile.learner_id) {
      const learner = await selectRows('learners', { filters: { id: profile.learner_id }, limit: 1 });
      const storedProfile = learner.ok ? learner.data?.[0]?.profile_json || {} : {};
      learnerMemoryPersistence = await patchRows('learners', { id: profile.learner_id }, {
        profile_json: {
          ...storedProfile,
          ...profile,
          memory_pathway: {
            routes: generated.data.routes || [],
            confidence: generated.data.confidence || 0,
            callback_flag: Boolean(generated.data.callback_flag),
            saved_at: new Date().toISOString(),
          },
          last_active_tab: 'pathways',
          last_action: 'pathway_generated',
          updated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      });
    }

    return sendJson(res, 200, {
      ...generated.data,
      proof: {
        generation: {
          ok: generated.ok,
          provider: generated.provider,
          model: generated.model || null,
          fallback_chain: generated.fallback_chain || [],
          error: generated.error,
        },
        evidence: {
          provider: generated.data.evidence_provider || 'fallback_kb',
          error: generated.data.evidence_error || null,
        },
        persistence: {
          ok: persistence.ok || learnerMemoryPersistence.ok,
          table: persistence.ok ? 'pathways' : 'learners.profile_json',
          error: persistence.error,
          learner_memory: {
            ok: learnerMemoryPersistence.ok,
            table: 'learners.profile_json',
            error: learnerMemoryPersistence.error || null,
          },
        },
      },
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}
