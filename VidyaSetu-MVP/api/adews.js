import { methodNotAllowed, readJson, sendJson } from './_lib/http.js';
import { insertRows, patchRows } from './_lib/supabase.js';
import { computeAdews } from './_lib/mvp.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const body = await readJson(req);
    const score = computeAdews(body.features);
    const row = {
      learner_id: body.learner_id || null,
      risk: score.risk,
      top_features_json: score.top_features_json,
      fired_at: score.fired ? new Date().toISOString() : null,
      worker_ack: Boolean(body.worker_ack),
    };
    const persistence = await insertRows('adews_scores', row);

    return sendJson(res, 200, {
      ...score,
      worker_number: process.env.WHATSAPP_SENDER_ID
        ? `configured:${process.env.WHATSAPP_SENDER_ID.slice(-4)}`
        : 'not_configured',
      alert_channel: process.env.WHATSAPP_SENDER_ID ? 'whatsapp_demo_sender' : 'console_only',
      proof: {
        persistence: {
          ok: persistence.ok,
          table: 'adews_scores',
          error: persistence.error,
        },
      },
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}

export async function ackScore(scoreId) {
  return patchRows('adews_scores', { id: scoreId }, { worker_ack: true });
}
