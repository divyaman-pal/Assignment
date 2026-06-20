import { sendJson } from './_lib/http.js';
import { hasSupabaseConfig } from './_lib/supabase.js';

function configured(name) {
  return Boolean(process.env[name]);
}

export default async function handler(_req, res) {
  sendJson(res, 200, {
    ok: true,
    services: {
      supabase: hasSupabaseConfig(),
      anthropic: configured('ANTHROPIC_API_KEY'),
      anthropic_web_search: configured('ANTHROPIC_API_KEY'),
      sarvam: configured('SARVAM_API_KEY'),
      agentmail: configured('AGENTMAIL_API_KEY') && process.env.AGENTMAIL_API_KEY !== 'placeholder',
      whatsapp_sender: configured('WHATSAPP_SENDER_ID'),
      wati: configured('WATI_API_BASE_URL') && configured('WATI_API_TOKEN'),
      daily_reminder_cron: true,
      sarvam_tts: configured('SARVAM_API_KEY'),
    },
    ai_policy: {
      primary_reasoning_provider: 'anthropic_claude',
      fallback_order: ['anthropic', 'deterministic'],
      live_search_policy: 'Claude web search only for live discovery; deterministic verified-resource fallbacks when Claude/search is unavailable.',
      voice_policy: 'Sarvam TTS for vernacular playback when available; browser speech only as clean fallback.',
    },
  });
}
