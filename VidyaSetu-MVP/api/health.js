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
      openai: configured('OPENAI_API_KEY'),
      anthropic: configured('ANTHROPIC_API_KEY'),
      sarvam: configured('SARVAM_API_KEY'),
      fireworks: configured('FIREWORKS_API_KEY'),
      firecrawl: configured('FIRECRAWL_API_KEY'),
      agentmail: configured('AGENTMAIL_API_KEY') && process.env.AGENTMAIL_API_KEY !== 'placeholder',
      whatsapp_sender: configured('WHATSAPP_SENDER_ID'),
      sarvam_tts: configured('SARVAM_API_KEY'),
    },
    ai_policy: {
      primary_reasoning_provider: 'anthropic_claude',
      fallback_order: ['anthropic', 'openai', 'fireworks', 'deterministic'],
      live_search_policy: 'OpenAI web search for broad live discovery; Firecrawl only for shortlisted pages or explicit deep contact verification.',
      voice_policy: 'Browser speech first for zero-cost playback; Sarvam TTS fallback when browser voice is unavailable.',
    },
  });
}
