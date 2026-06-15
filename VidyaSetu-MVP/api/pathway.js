import { methodNotAllowed, readJson, sendJson } from './_lib/http.js';
import { insertRows } from './_lib/supabase.js';
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
          ok: persistence.ok,
          table: 'pathways',
          error: persistence.error,
        },
      },
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}
