import { methodNotAllowed, readJson, sendJson, stableId } from './_lib/http.js';
import { insertRows } from './_lib/supabase.js';
import { generateProfile, transcribeSarvamAudio } from './_lib/services.js';
import { languageVoiceProfile, withLanguageMetadata } from './_lib/language.js';

const TTS_LANGUAGE_CODES = {
  english: 'en-IN',
  hinglish: 'hi-IN',
  hindi: 'hi-IN',
  marathi: 'mr-IN',
  odia: 'od-IN',
  oriya: 'od-IN',
  bengali: 'bn-IN',
  bangla: 'bn-IN',
  tamil: 'ta-IN',
  telugu: 'te-IN',
  kannada: 'kn-IN',
  malayalam: 'ml-IN',
  gujarati: 'gu-IN',
  punjabi: 'pa-IN',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const body = await readJson(req);
    if (body.action === 'tts') {
      return sendSarvamVoice(res, body);
    }

    const stt = body.transcript
      ? { transcript: body.transcript, ok: true, provider: 'provided_transcript', error: null }
      : await transcribeSarvamAudio({
          audioBase64: body.audioBase64,
          fileName: body.fileName,
          languageCode: body.languageCode,
        });

    const transcript = stt.transcript || '';
    const extraction = await generateProfile(transcript);
    const profile = withLanguageMetadata(
      { ...extraction.data, learner_id: body.learner_id || stableId('learner') },
      transcript,
    );
    const learner = {
      name: profile.name || 'Learner',
      phone_hash: body.phone_hash || 'demo_phone_hash',
      language: profile.preferred_language || profile.language || 'Hindi or local language',
      location: profile.location || '',
      profile_json: profile,
    };

    const persistence = body.learner_id
      ? { ok: true, data: [{ id: body.learner_id }], error: null }
      : await insertRows('learners', learner);
    const persisted = persistence.ok ? persistence.data?.[0] : null;
    const persistedProfile = {
      ...profile,
      learner_id: body.learner_id || persisted?.id || profile.learner_id || stableId('learner'),
    };

    return sendJson(res, 200, {
      transcript,
      profile: persistedProfile,
      proof: {
        stt,
        language: languageVoiceProfile(persistedProfile, transcript),
        extraction: {
          ok: extraction.ok,
          provider: extraction.provider,
          error: extraction.error,
        },
        persistence: {
          ok: persistence.ok,
          table: 'learners',
          error: persistence.error,
        },
      },
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}

async function sendSarvamVoice(res, body = {}) {
  const key = process.env.SARVAM_API_KEY;
  if (!key) {
    return sendJson(res, 503, { ok: false, error: 'Sarvam voice is not configured.' });
  }

  const text = sanitizeVoiceText(body.text);
  if (!text) return sendJson(res, 400, { ok: false, error: 'Text is required for voice playback.' });

  const languageCode = inferTtsLanguageCode(body.profile, body.language);
  const response = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: {
      'api-subscription-key': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      target_language_code: languageCode,
      model: process.env.SARVAM_TTS_MODEL || 'bulbul:v3',
      speaker: process.env.SARVAM_TTS_SPEAKER || 'neha',
      pace: 0.9,
      speech_sample_rate: 24000,
      output_audio_codec: 'wav',
      temperature: 0.45,
    }),
    signal: AbortSignal.timeout(Number(process.env.SARVAM_TTS_TIMEOUT_MS || 12000)),
  });

  const payload = await response.json().catch(() => ({}));
  const audio = payload.audios?.[0];
  if (!response.ok || !audio) {
    return sendJson(res, response.ok ? 502 : response.status, {
      ok: false,
      error: payload.error?.message || payload.message || 'Sarvam voice could not generate audio.',
    });
  }

  return sendJson(res, 200, {
    ok: true,
    provider: 'sarvam',
    request_id: payload.request_id || null,
    audio,
    mime_type: 'audio/wav',
    language_code: languageCode,
  });
}

function sanitizeVoiceText(value = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 900);
}

function inferTtsLanguageCode(profile = {}, explicit = '') {
  const languageProfileCode = profile?.language_profile?.stt_language_code;
  if (languageProfileCode) return String(languageProfileCode || '').trim() || 'hi-IN';

  const raw = String(
    explicit ||
      profile?.preferred_language ||
      profile?.language ||
      profile?.language_profile?.preferred_language ||
      '',
  ).toLowerCase();

  const direct = Object.entries(TTS_LANGUAGE_CODES).find(([key]) => raw.includes(key));
  return direct ? direct[1] : 'hi-IN';
}
