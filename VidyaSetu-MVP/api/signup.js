import { methodNotAllowed, readJson, sendJson, stableId } from './_lib/http.js';
import { insertRows, selectRows } from './_lib/supabase.js';

const LANGUAGE_META = {
  English: { stt: 'en-IN', script: 'Latin' },
  Hinglish: { stt: 'hi-IN', script: 'Latin' },
  Hindi: { stt: 'hi-IN', script: 'Devanagari' },
  Marathi: { stt: 'mr-IN', script: 'Devanagari' },
  Odia: { stt: 'od-IN', script: 'Odia' },
  Bengali: { stt: 'bn-IN', script: 'Bengali' },
  Tamil: { stt: 'ta-IN', script: 'Tamil' },
  Telugu: { stt: 'te-IN', script: 'Telugu' },
  Kannada: { stt: 'kn-IN', script: 'Kannada' },
  Malayalam: { stt: 'ml-IN', script: 'Malayalam' },
  Gujarati: { stt: 'gu-IN', script: 'Gujarati' },
  Punjabi: { stt: 'pa-IN', script: 'Gurmukhi' },
};

function languageMeta(language = 'English') {
  const raw = String(language || '').toLowerCase();
  const key = Object.keys(LANGUAGE_META).find((item) => item.toLowerCase() === raw) ||
    Object.keys(LANGUAGE_META).find((item) => raw.includes(item.toLowerCase())) ||
    'English';
  return { name: key, ...LANGUAGE_META[key] };
}

function starterMessageForLanguage(language = 'English') {
  const messages = {
    English:
      'Hello, I am Meera from VidyaSetu. We will go step by step, not as a long form. First, what name should I call you?',
    Hinglish:
      'Namaste, main VidyaSetu ki Meera hoon. Hum ek-ek karke profile banayenge, long form nahi. Pehle batao, Meera aapko kis naam se bulaye?',
    Hindi:
      'नमस्ते, मैं VidyaSetu की मीरा हूँ. हम एक-एक करके profile बनाएंगे, long form नहीं. पहले बताइए, मीरा आपको किस नाम से बुलाए?',
    Marathi:
      'नमस्ते, मी VidyaSetu ची Meera आहे. आपण एक-एक करून profile बनवू. आधी सांगा, Meera तुम्हाला कोणत्या नावाने बोलवू?',
    Odia:
      'ନମସ୍କାର, ମୁଁ VidyaSetu ର Meera. ଆମେ step by step profile ବନାଇବୁ. ପ୍ରଥମେ କୁହନ୍ତୁ, Meera ଆପଣଙ୍କୁ କେଉଁ ନାମରେ ଡାକିବ?',
    Bengali:
      'নমস্কার, আমি VidyaSetu-র Meera. আমরা ধাপে ধাপে profile বানাবো. আগে বলুন, Meera আপনাকে কোন নামে ডাকবে?',
    Tamil:
      'வணக்கம், நான் VidyaSetu Meera. உங்கள் விவரங்களை ஒவ்வொரு படியாக உருவாக்குவோம். முதலில், Meera உங்களை எந்த பெயரில் அழைக்கலாம்?',
    Telugu:
      'నమస్తే, నేను VidyaSetu Meera. మనం step by step profile తయారు చేద్దాం. ముందుగా, Meera మిమ్మల్ని ఏ పేరుతో పిలవాలి?',
    Kannada:
      'ನಮಸ್ತೆ, ನಾನು VidyaSetu Meera. ನಾವು step by step profile ಮಾಡೋಣ. ಮೊದಲು, Meera ನಿಮ್ಮನ್ನು ಯಾವ ಹೆಸರಿನಿಂದ ಕರೆಯಲಿ?',
    Malayalam:
      'നമസ്കാരം, ഞാൻ VidyaSetu Meera. നമുക്ക് step by step profile ഉണ്ടാക്കാം. ആദ്യം, Meera നിങ്ങളെ ഏത് പേരിൽ വിളിക്കണം?',
    Gujarati:
      'નમસ્તે, હું VidyaSetu ની Meera છું. આપણે step by step profile બનાવીએ. પહેલા કહો, Meera તમને કયા નામથી બોલાવે?',
    Punjabi:
      'ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ VidyaSetu ਦੀ Meera ਹਾਂ. ਅਸੀਂ step by step profile ਬਣਾਵਾਂਗੇ. ਪਹਿਲਾਂ ਦੱਸੋ, Meera ਤੁਹਾਨੂੰ ਕਿਸ ਨਾਮ ਨਾਲ ਬੁਲਾਏ?',
  };
  return { role: 'assistant', content: messages[languageMeta(language).name] || messages.English };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const body = await readJson(req);
    const phone = String(body.phone || '').replace(/\D/g, '').slice(-10);
    if (phone.length !== 10) {
      return sendJson(res, 400, { error: 'Enter a valid 10-digit mobile number.' });
    }

    const accountPhoneHash = basePhoneHash(phone);
    const requestedLearnerId = body.learner_id || body.learnerId || '';
    const createNew = Boolean(body.create_new || body.fresh === true || body.reset === true);
    const requestedLanguage = languageMeta(body.preferred_language || body.language || 'English').name;

    if (requestedLearnerId && !createNew) {
      const learner = await findLearnerById(requestedLearnerId);
      if (!learner) {
        return sendJson(res, 404, { error: 'Learner profile not found for this phone.' });
      }
      return sendJson(res, 200, await hydrateLearnerWorkspace({ learner, phone, accountPhoneHash, returning: true }));
    }

    if (!createNew) {
      const learners = await findLearnersForPhone(accountPhoneHash);
      if (learners.length === 1) {
        return sendJson(
          res,
          200,
          await hydrateLearnerWorkspace({ learner: learners[0], phone, accountPhoneHash, returning: true }),
        );
      }
      if (learners.length > 1) {
        return sendJson(res, 200, {
          returning: true,
          needs_selection: true,
          phone,
          phone_hash: accountPhoneHash,
          learners: learners.map(learnerSummary),
          message: 'Choose which learner should continue on this shared phone.',
          proof: {
            memory: {
              ok: true,
              provider: 'phone_hash_prefix_lookup',
              count: learners.length,
            },
          },
        });
      }
    }

    const profile = starterProfile({ phone, accountPhoneHash, preferredLanguage: requestedLanguage });
    const persistence = await insertRows('learners', {
      name: profile.name,
      phone_hash: profile.phone_hash,
      language: profile.language,
      location: profile.location,
      profile_json: profile,
    });
    const persisted = persistence.ok ? persistence.data?.[0] : null;
    profile.learner_id = persisted?.id || stableId('learner');

    return sendJson(res, 200, {
      returning: false,
      needs_selection: false,
      profile,
      messages: [starterMessageForLanguage(profile.preferred_language)],
      workspace: emptyWorkspace({ profile, activeTab: 'counselor' }),
      proof: {
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

function basePhoneHash(phone) {
  return `demo_hash_${phone}`;
}

function learnerPhoneHash(accountPhoneHash) {
  return `${accountPhoneHash}::${stableId('learner')}`;
}

function starterProfile({ phone, accountPhoneHash, preferredLanguage = 'English' }) {
  const language = languageMeta(preferredLanguage);
  return {
    learner_id: null,
    phone_hash: learnerPhoneHash(accountPhoneHash),
    phone_account_hash: accountPhoneHash,
    phone,
    name: '',
    age: null,
    class_level: '',
    education_status: '',
    location: '',
    commute_km: null,
    commute_constraint: 'safe commute preferred',
    relocation_preference: '',
    aspirations: [],
    skills: [],
    proof_available: [],
    phone_access: '',
    device: 'mobile phone',
    time_available: '',
    earning_urgency: '',
    income_pressure: false,
    language: language.name,
    preferred_language: language.name,
    language_profile: {
      preferred_language: language.name,
      reply_script: language.script,
      stt_language_code: language.stt,
      voice_channel: 'voice + text',
      same_language_reply: true,
    },
    content_preferences: [],
    support_needs: [],
    missing_fields: [],
    profile_confidence: 0,
    persona: 'unsure_exploration',
    last_updated: new Date().toISOString(),
    profile_complete: false,
  };
}

async function findLearnersForPhone(accountPhoneHash) {
  const prefixLookup = await selectRows('learners', {
    filters: { phone_hash: { op: 'like', value: `${accountPhoneHash}*` } },
    order: 'updated_at.desc',
    limit: 20,
  });
  if (prefixLookup.ok && prefixLookup.data?.length) {
    return prefixLookup.data;
  }

  const legacyLookup = await selectRows('learners', {
    filters: { phone_hash: accountPhoneHash },
    order: 'updated_at.desc',
    limit: 20,
  });
  return legacyLookup.ok ? legacyLookup.data || [] : [];
}

async function findLearnerById(learnerId) {
  const result = await selectRows('learners', {
    filters: { id: learnerId },
    limit: 1,
  });
  return result.ok ? result.data?.[0] || null : null;
}

function learnerSummary(learner = {}) {
  const profile = learner.profile_json || {};
  return {
    id: learner.id,
    name: profile.name || learner.name || 'Learner',
    location: profile.location || learner.location || 'Location pending',
    goal: profile.learner_goal?.label || profile.academic_goal?.target || (profile.aspirations || [])[0] || 'Goal pending',
    education: profile.class_level || profile.education_status || 'Education pending',
    updated_at: learner.updated_at,
  };
}

async function hydrateLearnerWorkspace({ learner, phone, accountPhoneHash, returning }) {
  const storedLanguage = languageMeta(learner.profile_json?.preferred_language || learner.profile_json?.language || 'English');
  const profile = {
    ...starterProfile({ phone, accountPhoneHash, preferredLanguage: storedLanguage.name }),
    ...(learner.profile_json || {}),
    learner_id: learner.id,
    phone,
    phone_hash: learner.phone_hash,
    phone_account_hash: accountPhoneHash,
  };

  const [conversation, pathway, journey, passport, matches, adews] = await Promise.all([
    selectRows('conversations', { filters: { learner_id: learner.id }, order: 'updated_at.desc', limit: 1 }),
    selectRows('pathways', { filters: { learner_id: learner.id }, order: 'updated_at.desc', limit: 1 }),
    selectRows('learning_journeys', { filters: { learner_id: learner.id }, order: 'updated_at.desc', limit: 1 }),
    selectRows('skill_passport', { filters: { learner_id: learner.id }, limit: 1 }),
    selectRows('matches', { filters: { learner_id: learner.id }, order: 'updated_at.desc', limit: 6 }),
    selectRows('adews_scores', { filters: { learner_id: learner.id }, order: 'updated_at.desc', limit: 1 }),
  ]);

  const pathwayRow = pathway.ok ? pathway.data?.[0] : null;
  const journeyRow = journey.ok ? journey.data?.[0] : null;
  const passportRow = passport.ok ? passport.data?.[0] : null;
  const matchRows = matches.ok ? matches.data || [] : [];
  const hydratedMatches = await hydrateMatches(matchRows);
  const outreach = await hydrateOutreach(matchRows);
  const journeyJson = journeyRow?.journey_json || profile.memory_journey || null;
  const progressJson = journeyRow?.progress_json || profile.memory_progress || journeyJson?.progress || {};
  const selectedRoute = journeyRow?.route_json || profile.memory_selected_route || pathwayRow?.routes_json?.[0] || null;
  const completedLessons = progressJson?.completed_lesson_map || progressJson?.completed_lessons_map || {};
  const proofNotes = progressJson?.proof_notes || {};
  const proofArtifacts = progressJson?.proof_artifacts || {};
  if (journeyJson && Object.keys(progressJson).length) {
    journeyJson.progress = {
      ...(journeyJson.progress || {}),
      ...progressJson,
    };
  }
  const restoredPassport = passportRow
    ? {
        learner_id: learner.id,
        certs: passportRow.certs || [],
        informal: passportRow.informal || [],
        ncrf_credits: passportRow.ncrf_credits || 0,
        consent: passportRow.consent_json || {},
        qr_token: passportRow.qr_token,
        status: progressJson?.passport_eligible ? 'proof_ready_for_review' : 'draft_proof_pending',
        learning_proof: buildLearningProof(progressJson, journeyJson),
      }
    : null;
  const workspace = {
    profile,
    messages: conversation.ok && conversation.data?.[0]?.messages?.length ? conversation.data[0].messages : [starterMessageForLanguage(profile.preferred_language)],
    pathway: pathwayRow
      ? {
          routes: pathwayRow.routes_json || [],
          confidence: Number(pathwayRow.confidence || 0),
          callback_flag: Boolean(pathwayRow.callback_flag),
          provider: 'restored_memory',
        }
      : null,
    selectedRoute,
    journey: journeyJson,
    passport: restoredPassport,
    matches: hydratedMatches,
    selectedMatchId: hydratedMatches[0]?.id || '',
    outreach,
    adews: adews.ok ? adews.data?.[0] || null : null,
    completedLessons,
    proofNotes,
    proofArtifacts,
    progress: progressJson,
    resumeText: profile.resume_text || '',
    resumeFileName: profile.resume_file_name || '',
    opportunityMeta: profile.opportunity_meta || null,
    activeTab: nextActiveTab({ pathwayRow, journeyRow, passportRow, matches: hydratedMatches, outreach }),
  };

  return {
    returning,
    needs_selection: false,
    profile,
    messages: workspace.messages,
    workspace,
    proof: {
      memory: {
        ok: true,
        provider: 'supabase_workspace_hydration',
        tables: {
          conversations: conversation.ok,
          pathways: pathway.ok,
          learning_journeys: journey.ok,
          skill_passport: passport.ok,
          matches: matches.ok,
          adews_scores: adews.ok,
        },
      },
    },
  };
}

function emptyWorkspace({ profile, activeTab }) {
  return {
    profile,
    messages: [starterMessageForLanguage(profile.preferred_language)],
    pathway: null,
    selectedRoute: null,
    journey: null,
    passport: null,
    matches: [],
    selectedMatchId: '',
    outreach: null,
    adews: null,
    completedLessons: {},
    proofNotes: {},
    proofArtifacts: {},
    progress: {},
    resumeText: '',
    resumeFileName: '',
    opportunityMeta: null,
    activeTab,
  };
}

function buildLearningProof(progress = {}, journey = {}) {
  return {
    mode: journey?.mode || 'journey_pending',
    completion_percent: Number(progress?.completion_percent || 0),
    proof_ready_count: Number(progress?.proof_ready_count || 0),
    proof_required_count: Number(progress?.proof_required_count || 0),
    completed_module_count: Number(progress?.completed_module_count || 0),
    next_action: progress?.next_action || 'Continue the saved learning journey.',
    placement_unlocked: Boolean(progress?.placement_unlocked),
    learning_unlocked: Boolean(progress?.learning_unlocked),
    passport_eligible: Boolean(progress?.passport_eligible),
  };
}

async function hydrateMatches(matchRows = []) {
  const hydrated = [];
  for (const match of matchRows) {
    const job = match.job_id
      ? await selectRows('jobs', { filters: { id: match.job_id }, limit: 1 })
      : { ok: false, data: [] };
    const jobJson = job.ok ? job.data?.[0]?.raw_json || {} : {};
    hydrated.push({
      ...jobJson,
      id: match.id,
      job_id: match.job_id,
      score: Number(match.score || jobJson.score || 0),
      reasons: match.reasons || jobJson.reasons || [],
      pipeline_status: match.status || jobJson.pipeline_status || 'matched',
    });
  }
  return hydrated;
}

async function hydrateOutreach(matchRows = []) {
  for (const match of matchRows) {
    const outreach = await selectRows('outreach', {
      filters: { match_id: match.id },
      order: 'updated_at.desc',
      limit: 1,
    });
    const row = outreach.ok ? outreach.data?.[0] : null;
    if (row) {
      return {
        id: row.id,
        channel: row.channel,
        sent_at: row.sent_at,
        reply_text: row.reply_text,
        reply_class: row.reply_class,
        followup_at: row.followup_at,
        ...(row.payload_json || {}),
      };
    }
  }
  return null;
}

function nextActiveTab({ pathwayRow, journeyRow, passportRow, matches, outreach }) {
  if (outreach) return 'outreach';
  if (matches?.length) return 'jobs';
  if (passportRow) return 'passport';
  if (journeyRow) return 'journey';
  if (pathwayRow) return 'pathways';
  return 'overview';
}
