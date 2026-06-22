import { methodNotAllowed, readJson, sendJson, stableId } from './_lib/http.js';
import { insertRows, patchRows, selectRows } from './_lib/supabase.js';

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
      'Hello, I am Meera from VidyaSetu. We will talk one by one, not fill a long form. First, what name should I call you?',
    Hinglish:
      'Namaste, main VidyaSetu ki Meera hoon. Hum ek-ek baat poochhkar aapki jankari banayenge, lamba form nahi. Pehle batao, Meera aapko kis naam se bulaye?',
    Hindi:
      'नमस्ते, मैं VidyaSetu की मीरा हूँ। मैं एक-एक बात पूछकर आपकी जानकारी बनाऊँगी, लंबा फॉर्म नहीं। पहले बताइए, मीरा आपको किस नाम से बुलाए?',
    Marathi:
      'नमस्ते, मी VidyaSetu ची Meera आहे. मी एक-एक प्रश्न विचारून तुमची माहिती तयार करेन. आधी सांगा, Meera तुम्हाला कोणत्या नावाने बोलवू?',
    Odia:
      'ନମସ୍କାର, ମୁଁ VidyaSetu ର Meera. ମୁଁ ଗୋଟିଏ ପରେ ଗୋଟିଏ କଥା ପଚାରି ଆପଣଙ୍କ ସୂଚନା ତିଆରି କରିବି. ପ୍ରଥମେ କୁହନ୍ତୁ, Meera ଆପଣଙ୍କୁ କେଉଁ ନାମରେ ଡାକିବ?',
    Bengali:
      'নমস্কার, আমি VidyaSetu-র Meera. আমি এক এক করে প্রশ্ন করে আপনার তথ্য তৈরি করব. আগে বলুন, Meera আপনাকে কোন নামে ডাকবে?',
    Tamil:
      'வணக்கம், நான் VidyaSetu Meera. உங்கள் விவரங்களை ஒவ்வொரு படியாக உருவாக்குவோம். முதலில், Meera உங்களை எந்த பெயரில் அழைக்கலாம்?',
    Telugu:
      'నమస్తే, నేను VidyaSetu Meera. ఒక్కొక్క ప్రశ్న అడిగి మీ వివరాలు తయారు చేస్తాను. ముందుగా, Meera మిమ్మల్ని ఏ పేరుతో పిలవాలి?',
    Kannada:
      'ನಮಸ್ತೆ, ನಾನು VidyaSetu Meera. ಒಂದೊಂದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ತಯಾರಿಸುತ್ತೇನೆ. ಮೊದಲು, Meera ನಿಮ್ಮನ್ನು ಯಾವ ಹೆಸರಿನಿಂದ ಕರೆಯಲಿ?',
    Malayalam:
      'നമസ്കാരം, ഞാൻ VidyaSetu Meera. ഓരോ ചോദ്യം ചോദിച്ച് നിങ്ങളുടെ വിവരം തയ്യാറാക്കാം. ആദ്യം, Meera നിങ്ങളെ ഏത് പേരിൽ വിളിക്കണം?',
    Gujarati:
      'નમસ્તે, હું VidyaSetu ની Meera છું. હું એક-એક પ્રશ્ન પૂછીને તમારી માહિતી તૈયાર કરીશ. પહેલા કહો, Meera તમને કયા નામથી બોલાવે?',
    Punjabi:
      'ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ VidyaSetu ਦੀ Meera ਹਾਂ. ਮੈਂ ਇਕ-ਇਕ ਸਵਾਲ ਪੁੱਛ ਕੇ ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਤਿਆਰ ਕਰਾਂਗੀ. ਪਹਿਲਾਂ ਦੱਸੋ, Meera ਤੁਹਾਨੂੰ ਕਿਸ ਨਾਮ ਨਾਲ ਬੁਲਾਏ?',
  };
  return { role: 'assistant', content: messages[languageMeta(language).name] || messages.English };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const body = await readJson(req);
    const action = body.action || '';
    if (action === 'admin_login') {
      return handleAdminLogin(body, res);
    }
    if (action === 'admin_overview') {
      if (!adminAuthorized(body)) return sendJson(res, 401, { error: 'Admin login required.' });
      return sendJson(res, 200, await buildAdminOverview(body));
    }
    if (action === 'admin_ack_adews') {
      if (!adminAuthorized(body)) return sendJson(res, 401, { error: 'Admin login required.' });
      return sendJson(res, 200, await acknowledgeAdminAlert(body));
    }

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
  const memoryPathwayRoutes = Array.isArray(profile.memory_pathway?.routes) ? profile.memory_pathway.routes : [];
  const pathwayRoutes = pathwayRow?.routes_json?.length
    ? pathwayRow.routes_json
    : memoryPathwayRoutes.length
      ? memoryPathwayRoutes
      : selectedRoute
        ? [selectedRoute]
        : [];
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
  const workspaceMessages = conversationMessagesForWorkspace(profile, conversation, storedLanguage.name);
  const workspace = {
    profile,
    messages: workspaceMessages,
    pathway: pathwayRoutes.length
      ? {
          routes: pathwayRoutes,
          confidence: Number(pathwayRow?.confidence || profile.memory_pathway?.confidence || 0),
          callback_flag: Boolean(pathwayRow?.callback_flag || profile.memory_pathway?.callback_flag),
          provider: pathwayRow ? 'restored_pathways_table' : 'restored_learner_memory',
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
    activeTab: nextActiveTab({
      profile,
      pathwayRow,
      pathwayRoutes,
      journeyRow,
      journeyJson,
      passportRow,
      matches: hydratedMatches,
      outreach,
    }),
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

function conversationMessagesForWorkspace(profile = {}, conversationResult = {}, language = 'English') {
  const conversationMessages = conversationResult.ok && conversationResult.data?.[0]?.messages?.length
    ? conversationResult.data[0].messages
    : [];
  const profileMessages = Array.isArray(profile.memory_messages) ? profile.memory_messages : [];
  const messages = conversationMessages.length ? conversationMessages : profileMessages;
  const clean = compactWorkspaceMessages(messages);
  return clean.length ? clean : [starterMessageForLanguage(profile.preferred_language || profile.language || language)];
}

function compactWorkspaceMessages(messages = []) {
  return (Array.isArray(messages) ? messages : [])
    .filter((message) => message && (message.role === 'user' || message.role === 'assistant'))
    .slice(-50)
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').replace(/\s+/g, ' ').trim().slice(0, 1200),
    }))
    .filter((message) => message.content);
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

function nextActiveTab({ profile = {}, pathwayRow, pathwayRoutes = [], journeyRow, journeyJson, passportRow, matches, outreach }) {
  const requested = String(profile.last_active_tab || '').trim();
  const validRequestedTabs = new Set(['counselor', 'pathways', 'journey', 'passport', 'jobs', 'support', 'overview']);
  const hasJourney = Boolean(journeyRow || (Array.isArray(journeyJson?.modules) && journeyJson.modules.length));
  const hasPathway = Boolean(pathwayRow || pathwayRoutes.length || profile.memory_selected_route);
  if (validRequestedTabs.has(requested)) {
    if (requested === 'journey' && hasJourney) return requested;
    if (requested === 'pathways' && hasPathway) return requested;
    if (requested === 'passport' && passportRow) return requested;
    if (requested === 'jobs' && matches?.length) return requested;
    if (['counselor', 'support', 'overview'].includes(requested)) return requested;
  }
  if (outreach) return 'outreach';
  if (matches?.length) return 'jobs';
  if (passportRow) return 'passport';
  if (hasJourney) return 'journey';
  if (hasPathway) return 'pathways';
  return 'overview';
}

function handleAdminLogin(body, res) {
  const password = String(body.password || body.admin_password || '').trim();
  if (!password || password !== adminPassword()) {
    return sendJson(res, 401, { error: 'Invalid admin password.' });
  }
  return sendJson(res, 200, {
    ok: true,
    admin_token: adminToken(),
    demo_auth: !process.env.ADMIN_PASSWORD,
    message: process.env.ADMIN_PASSWORD
      ? 'Admin session opened.'
      : 'Admin session opened with demo password. Set ADMIN_PASSWORD before production use.',
  });
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD || 'vidyasetu-admin';
}

function adminToken() {
  return process.env.ADMIN_SESSION_TOKEN || 'vidyasetu-admin-session';
}

function adminAuthorized(body = {}) {
  return String(body.admin_token || body.token || '') === adminToken();
}

async function buildAdminOverview(body = {}) {
  const limit = Math.max(25, Math.min(300, Number(body.limit || 200)));
  const selectedLearnerId = body.learner_id || body.selected_learner_id || '';
  const [learners, journeys, passports, alerts, matches, outreach, conversations] = await Promise.all([
    selectRows('learners', { order: 'updated_at.desc', limit }),
    selectRows('learning_journeys', { order: 'updated_at.desc', limit }),
    selectRows('skill_passport', { order: 'updated_at.desc', limit }),
    selectRows('adews_scores', { order: 'updated_at.desc', limit }),
    selectRows('matches', { order: 'updated_at.desc', limit }),
    selectRows('outreach', { order: 'updated_at.desc', limit }),
    selectRows('conversations', { order: 'updated_at.desc', limit }),
  ]);

  const learnerRows = learners.ok ? learners.data || [] : [];
  const journeyFallbackRows = adminJourneyFallbackRowsFromLearners(learnerRows);
  const conversationFallbackRows = adminConversationFallbackRowsFromLearners(learnerRows);
  const rows = {
    learners: learnerRows,
    journeys: journeys.ok ? journeys.data || [] : journeyFallbackRows,
    passports: passports.ok ? passports.data || [] : [],
    alerts: alerts.ok ? alerts.data || [] : [],
    matches: matches.ok ? matches.data || [] : [],
    outreach: outreach.ok ? outreach.data || [] : [],
    conversations: conversations.ok ? conversations.data || [] : conversationFallbackRows,
  };
  const matchById = Object.fromEntries(rows.matches.map((match) => [match.id, match]));
  const grouped = {
    journeys: latestByLearner(rows.journeys),
    passports: latestByLearner(rows.passports),
    alerts: latestByLearner(rows.alerts),
    conversations: latestByLearner(rows.conversations),
    matches: groupByLearner(rows.matches),
    outreach: groupOutreachByLearner(rows.outreach, matchById),
  };
  const users = rows.learners.map((learner) => adminLearnerSummary(learner, grouped));
  const filteredUsers = filterAdminUsers(users, body.query || '', body.status || '');
  const selected = selectedLearnerId
    ? adminLearnerDetail(rows.learners.find((learner) => learner.id === selectedLearnerId), grouped)
    : adminLearnerDetail(rows.learners[0], grouped);

  return {
    ok: true,
    generated_at: new Date().toISOString(),
    demo_auth: !process.env.ADMIN_PASSWORD,
    persistence: {
      learners: proofForAdmin(learners),
      learning_journeys: proofForAdmin(journeys, {
        fallbackRows: journeyFallbackRows,
        fallbackSource: 'learners.profile_json.memory_journey',
      }),
      skill_passport: proofForAdmin(passports),
      adews_scores: proofForAdmin(alerts),
      matches: proofForAdmin(matches),
      outreach: proofForAdmin(outreach),
      conversations: proofForAdmin(conversations, {
        fallbackRows: conversationFallbackRows,
        fallbackSource: 'learners.profile_json.memory_messages',
      }),
    },
    metrics: adminMetrics(users, rows),
    users: filteredUsers,
    selected,
  };
}

async function acknowledgeAdminAlert(body = {}) {
  const learnerId = body.learner_id || '';
  const scoreId = body.score_id || body.alert_id || '';
  let targetId = scoreId;
  if (!targetId && learnerId) {
    const latest = await selectRows('adews_scores', {
      filters: { learner_id: learnerId },
      order: 'updated_at.desc',
      limit: 1,
    });
    targetId = latest.ok ? latest.data?.[0]?.id || '' : '';
  }
  if (!targetId) {
    return { ok: false, error: 'No alert found to acknowledge.' };
  }
  const result = await patchRows('adews_scores', { id: targetId }, {
    worker_ack: true,
    updated_at: new Date().toISOString(),
  });
  return {
    ok: result.ok,
    score_id: targetId,
    error: result.error,
  };
}

function proofForAdmin(result = {}, { fallbackRows = [], fallbackSource = '' } = {}) {
  const usedFallback = !result.ok && Array.isArray(fallbackRows) && fallbackRows.length > 0;
  return {
    ok: Boolean(result.ok || usedFallback),
    count: result.ok && Array.isArray(result.data) ? result.data.length : fallbackRows.length,
    fallback: Boolean(result.fallback || usedFallback),
    fallback_source: usedFallback ? fallbackSource : null,
    error: result.ok ? null : result.error || null,
  };
}

function adminJourneyFallbackRowsFromLearners(learners = []) {
  return learners
    .map((learner) => {
      const profile = learner.profile_json || {};
      const journey = profile.memory_journey || null;
      if (!journey || !Array.isArray(journey.modules) || !journey.modules.length) return null;
      return {
        id: `memory_journey_${learner.id}`,
        learner_id: learner.id,
        route_json: profile.memory_selected_route || {},
        journey_json: journey,
        modules_json: journey.modules || [],
        progress_json: profile.memory_progress || journey.progress || {},
        route_name: journey.route_name || profile.memory_selected_route?.name || '',
        created_at: profile.memory_reminders?.started_at || learner.created_at,
        updated_at: profile.updated_at || profile.last_updated || learner.updated_at || learner.created_at,
      };
    })
    .filter(Boolean);
}

function adminConversationFallbackRowsFromLearners(learners = []) {
  return learners
    .map((learner) => {
      const profile = learner.profile_json || {};
      const messages = Array.isArray(profile.memory_messages) ? profile.memory_messages : [];
      if (!messages.length) return null;
      return {
        id: `memory_conversation_${learner.id}`,
        learner_id: learner.id,
        phone_hash: learner.phone_hash || profile.phone_hash || '',
        messages,
        profile_json: profile,
        last_summary: profile.memory_last_reply || '',
        created_at: learner.created_at,
        updated_at: profile.memory_last_message_at || profile.updated_at || profile.last_updated || learner.updated_at,
      };
    })
    .filter(Boolean);
}

function groupByLearner(rows = []) {
  return rows.reduce((acc, row) => {
    const id = row.learner_id || row.profile_json?.learner_id || '';
    if (!id) return acc;
    if (!acc[id]) acc[id] = [];
    acc[id].push(row);
    return acc;
  }, {});
}

function latestByLearner(rows = []) {
  const grouped = groupByLearner(rows);
  return Object.fromEntries(
    Object.entries(grouped).map(([learnerId, learnerRows]) => [
      learnerId,
      [...learnerRows].sort((left, right) => String(right.updated_at || right.created_at || '').localeCompare(String(left.updated_at || left.created_at || '')))[0],
    ]),
  );
}

function groupOutreachByLearner(rows = [], matchById = {}) {
  return rows.reduce((acc, row) => {
    const match = matchById[row.match_id] || {};
    const id = row.learner_id || match.learner_id || '';
    if (!id) return acc;
    if (!acc[id]) acc[id] = [];
    acc[id].push(row);
    return acc;
  }, {});
}

function filterAdminUsers(users = [], query = '', status = '') {
  const needle = String(query || '').trim().toLowerCase();
  const desired = String(status || '').trim().toLowerCase();
  return users.filter((user) => {
    const statusOk =
      !desired ||
      desired === 'all' ||
      (desired === 'risk' && user.risk_level === 'risk') ||
      (desired === 'active' && user.stage !== 'new') ||
      (desired === 'passport' && user.passport_ready) ||
      (desired === 'journey' && user.journey_active) ||
      (desired === 'needs_worker' && user.needs_worker);
    if (!statusOk) return false;
    if (!needle) return true;
    return [
      user.name,
      user.location,
      user.goal,
      user.education,
      user.language,
      user.learner_id,
      user.phone_mask,
    ].some((value) => String(value || '').toLowerCase().includes(needle));
  });
}

function adminLearnerSummary(learner = {}, grouped = {}) {
  const profile = learner.profile_json || {};
  const learnerId = learner.id || profile.learner_id || '';
  const journeyRow = grouped.journeys?.[learnerId] || null;
  const passportRow = grouped.passports?.[learnerId] || null;
  const alertRow = grouped.alerts?.[learnerId] || null;
  const matchRows = grouped.matches?.[learnerId] || [];
  const outreachRows = grouped.outreach?.[learnerId] || [];
  const progress = journeyRow?.progress_json || profile.memory_progress || {};
  const journey = journeyRow?.journey_json || profile.memory_journey || {};
  const hasJourney = Boolean(journeyRow || (Array.isArray(journey.modules) && journey.modules.length));
  const risk = Number(alertRow?.risk || 0);
  const workerAck = Boolean(alertRow?.worker_ack);
  const proofReady = Number(progress.proof_ready_count || 0);
  const proofRequired = Number(progress.proof_required_count || 0);
  const journeyProgress = Number(progress.completion_percent || journey.progress?.completion_percent || 0);
  const needsWorker = Boolean((alertRow?.fired_at || risk >= 60) && !workerAck);
  const stage = adminStage({ profile, hasJourney, passportRow, matchRows, outreachRows });
  return {
    learner_id: learnerId,
    name: profile.name || learner.name || 'Unnamed learner',
    phone_mask: maskAdminPhone(profile.phone || learner.phone || ''),
    language: profile.preferred_language || profile.language || learner.language || 'Language pending',
    location: profile.location || learner.location || profile.relocation_preference || 'Location pending',
    goal: profile.learner_goal?.label || profile.academic_goal?.target || (profile.aspirations || [])[0] || 'Goal pending',
    education: profile.class_level || profile.education_status || 'Education pending',
    time_available: profile.time_available || 'Time pending',
    profile_complete: Boolean(profile.profile_complete),
    profile_confidence: Number(profile.profile_confidence || 0),
    stage,
    journey_active: hasJourney,
    journey_title: journey.title || journey.route_name || journeyRow?.route_name || '',
    journey_progress: Number.isFinite(journeyProgress) ? journeyProgress : 0,
    proof_ready_count: proofReady,
    proof_required_count: proofRequired,
    passport_ready: Boolean(passportRow?.qr_token || progress.passport_eligible),
    qr_token: passportRow?.qr_token || '',
    match_count: matchRows.length,
    outreach_count: outreachRows.length,
    outreach_status: outreachRows[0]?.sent_at ? 'sent' : outreachRows.length ? 'draft/review' : 'none',
    risk,
    risk_level: risk >= 60 || alertRow?.fired_at ? 'risk' : risk >= 30 ? 'watch' : 'normal',
    worker_ack: workerAck,
    needs_worker: needsWorker,
    last_action: profile.last_action || progress.last_action || '',
    next_action: progress.next_action || nextAdminAction({ profile, hasJourney, passportRow, matchRows, outreachRows, needsWorker }),
    reminder_status: profile.reminder_state?.last_daily_reminder_status || profile.memory_reminders?.last_daily_reminder_status || 'not sent',
    updated_at: learner.updated_at || profile.updated_at || profile.last_updated || learner.created_at,
  };
}

function adminLearnerDetail(learner = null, grouped = {}) {
  if (!learner) return null;
  const summary = adminLearnerSummary(learner, grouped);
  const learnerId = summary.learner_id;
  const profile = learner.profile_json || {};
  const journeyRow = grouped.journeys?.[learnerId] || null;
  const passportRow = grouped.passports?.[learnerId] || null;
  const alertRow = grouped.alerts?.[learnerId] || null;
  const conversationRow = grouped.conversations?.[learnerId] || null;
  const matchRows = grouped.matches?.[learnerId] || [];
  const outreachRows = grouped.outreach?.[learnerId] || [];
  const progress = journeyRow?.progress_json || profile.memory_progress || {};
  const journey = journeyRow?.journey_json || profile.memory_journey || {};
  return {
    ...summary,
    profile: redactProfile(profile),
    journey: {
      id: journeyRow?.id || '',
      title: journey.title || journey.route_name || '',
      mode: journey.mode || '',
      modules: Array.isArray(journey.modules)
        ? journey.modules.map((module) => ({
            id: module.id,
            week: module.week,
            title: module.title,
            proof: module.proof,
            unlock: module.unlock,
          }))
        : [],
      progress,
    },
    passport: passportRow
      ? {
          id: passportRow.id,
          qr_token: passportRow.qr_token,
          cert_count: passportRow.certs?.length || 0,
          informal_count: passportRow.informal?.length || 0,
          consent: passportRow.consent_json || {},
          updated_at: passportRow.updated_at,
        }
      : null,
    alert: alertRow
      ? {
          id: alertRow.id,
          risk: alertRow.risk,
          fired_at: alertRow.fired_at,
          worker_ack: Boolean(alertRow.worker_ack),
          top_features_json: alertRow.top_features_json || [],
          updated_at: alertRow.updated_at,
        }
      : null,
    matches: matchRows.slice(0, 8).map((match) => ({
      id: match.id,
      score: match.score,
      status: match.status,
      reasons: match.reasons || [],
      updated_at: match.updated_at,
    })),
    outreach: outreachRows.slice(0, 8).map((item) => ({
      id: item.id,
      channel: item.channel,
      sent_at: item.sent_at,
      reply_class: item.reply_class,
      followup_at: item.followup_at,
      updated_at: item.updated_at,
    })),
    conversation: Array.isArray(conversationRow?.messages)
      ? conversationRow.messages.slice(-8).map((message) => ({
          role: message.role,
          content: String(message.content || '').slice(0, 420),
        }))
      : [],
  };
}

function adminMetrics(users = [], rows = {}) {
  return {
    learners: users.length,
    profile_complete: users.filter((user) => user.profile_complete).length,
    active_journeys: users.filter((user) => user.journey_active).length,
    passports_ready: users.filter((user) => user.passport_ready).length,
    worker_alerts: users.filter((user) => user.needs_worker).length,
    matches: rows.matches?.length || 0,
    outreach_records: rows.outreach?.length || 0,
    languages: new Set(users.map((user) => user.language).filter(Boolean)).size,
  };
}

function adminStage({ profile, hasJourney, passportRow, matchRows, outreachRows }) {
  if (outreachRows?.some((row) => row.sent_at)) return 'outreach sent';
  if (matchRows?.length) return 'opportunity review';
  if (passportRow?.qr_token) return 'passport ready';
  if (hasJourney) return 'learning journey';
  if (profile.profile_complete) return 'pathway ready';
  return 'new';
}

function nextAdminAction({ profile, hasJourney, passportRow, matchRows, outreachRows, needsWorker }) {
  if (needsWorker) return 'Worker should call/check this learner.';
  if (!profile.profile_complete) return 'Counselor intake is incomplete.';
  if (!hasJourney) return 'Generate pathway and learning journey.';
  if (!passportRow) return 'Monitor journey proof before Skill Passport.';
  if (!matchRows?.length) return 'Run opportunity/source review if learner consent exists.';
  if (!outreachRows?.length) return 'Prepare consent-limited outreach draft.';
  return 'Track reply and next follow-up.';
}

function redactProfile(profile = {}) {
  return {
    ...profile,
    phone: maskAdminPhone(profile.phone || ''),
    phone_hash: profile.phone_hash ? `${String(profile.phone_hash).slice(0, 18)}...` : '',
    phone_account_hash: profile.phone_account_hash ? `${String(profile.phone_account_hash).slice(0, 18)}...` : '',
  };
}

function maskAdminPhone(phone = '') {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits ? `******${digits.slice(-4)}` : 'not captured';
}
