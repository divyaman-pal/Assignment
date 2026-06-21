import { methodNotAllowed, readJson, sendJson } from './_lib/http.js';
import { insertRows, patchRows, selectRows } from './_lib/supabase.js';
import { computeAdews } from './_lib/mvp.js';

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return methodNotAllowed(res);
  }

  try {
    const url = new URL(req.url || '/api/adews', 'http://localhost');
    const body = req.method === 'POST' ? await readJson(req) : {};
    const job = body.job || url.searchParams.get('job') || '';
    if (job === 'daily-reminders') {
      const learnerScoped = Boolean(body.learner_id || url.searchParams.get('learner_id'));
      if (!learnerScoped && !cronAuthorized(req, url)) {
        return sendJson(res, 401, { error: 'Unauthorized reminder job.' });
      }
      const result = await runDailyReminderJob({
        dryRun: body.dry_run ?? url.searchParams.get('dry_run') === 'true',
        learnerId: body.learner_id || url.searchParams.get('learner_id') || '',
        limit: body.limit || url.searchParams.get('limit') || undefined,
      });
      return sendJson(res, 200, result);
    }

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

function cronAuthorized(req, url) {
  const secret = process.env.CRON_SECRET || process.env.ADEWS_CRON_SECRET || '';
  if (!secret) return true;
  const auth = req.headers?.authorization || req.headers?.Authorization || '';
  const querySecret = url.searchParams.get('cron_secret') || '';
  return auth === `Bearer ${secret}` || querySecret === secret;
}

export async function runDailyReminderJob({ dryRun = false, learnerId = '', limit, forceEnabled = false } = {}) {
  const scanLimit = Math.max(1, Math.min(250, Number(limit || process.env.REMINDER_SCAN_LIMIT || 100)));
  const liveSendEnabled = dailyReminderLiveSendEnabled();
  const learners = learnerId
    ? await selectRows('learners', { filters: { id: learnerId }, limit: 1 })
    : await selectRows('learners', { order: 'updated_at.desc', limit: scanLimit });

  if (!learners.ok) {
    return {
      ok: false,
      job: 'daily-reminders',
      error: learners.error,
      scanned: 0,
      sent: 0,
      dry_run: Boolean(dryRun || !watiConfigured() || !liveSendEnabled),
      live_send_enabled: liveSendEnabled,
    };
  }

  const todayKey = localDateKey();
  const results = [];
  for (const learner of learners.data || []) {
    const result = await maybeSendDailyReminder({
      learner,
      todayKey,
      dryRun: dryRun || !liveSendEnabled,
      forceEnabled,
    });
    results.push(result);
  }

  const sent = results.filter((item) => item.status === 'sent').length;
  const dry = results.filter((item) => item.status === 'dry_run').length;
  return {
    ok: true,
    job: 'daily-reminders',
    scanned: results.length,
    sent,
    dry_run_count: dry,
    skipped: results.filter((item) => item.status === 'skipped').length,
    failed: results.filter((item) => item.status === 'failed').length,
    wati_configured: watiConfigured(),
    dry_run: Boolean(dryRun || !watiConfigured() || !liveSendEnabled),
    live_send_enabled: liveSendEnabled,
    results,
  };
}

async function maybeSendDailyReminder({ learner = {}, todayKey = localDateKey(), dryRun = false, forceEnabled = false }) {
  const profile = learner.profile_json || {};
  const learnerId = learner.id || profile.learner_id || '';
  const phone = normalizeWhatsAppPhone(profile.phone || learner.phone || '');
  const reminderState = profile.reminder_state || profile.memory_reminders || {};
  if (!learnerId) return skipped('missing_learner_id');
  if (!reminderLearnerAllowed(learnerId)) return skipped('learner_not_in_reminder_allowlist', learnerId);
  if (profile.reminders_opt_out || profile.whatsapp_opt_out || profile.consent?.whatsapp_reminders === false) {
    return skipped('learner_opted_out', learnerId);
  }
  if (!forceEnabled && !remindersEnabled(profile, reminderState)) {
    return skipped('daily_reminders_not_enabled_until_pathway_lock', learnerId);
  }
  if (!phone) return skipped('missing_phone', learnerId);
  if (!reminderPhoneAllowed(phone)) return skipped('phone_not_in_reminder_allowlist', learnerId);
  if (reminderState.last_daily_reminder_date === todayKey) {
    return skipped('already_sent_today', learnerId);
  }

  const workspace = await loadLearnerJourney(learnerId, profile);
  if (!workspace.journey?.modules?.length) return skipped('no_active_journey', learnerId);

  const reminder = buildDailyReminder({ profile, journey: workspace.journey, progress: workspace.progress });
  if (!reminder.message) return skipped('no_task_found', learnerId);

  const shouldDryRun = dryRun || !watiConfigured();
  const sendResult = shouldDryRun
    ? { ok: true, dry_run: true, provider: 'wati', message: reminder.message }
    : await sendWatiMessage({ phone, reminder, profile });
  const status = sendResult.ok ? (shouldDryRun ? 'dry_run' : 'sent') : 'failed';
  const now = new Date().toISOString();
  const nextReminderState = {
    ...reminderState,
    last_daily_reminder_date: todayKey,
    last_daily_reminder_at: now,
    last_daily_reminder_status: status,
    last_daily_reminder_task: reminder.task,
  };

  if (sendResult.ok && status === 'sent') {
    await patchRows('learners', { id: learnerId }, {
      profile_json: {
        ...profile,
        reminder_state: nextReminderState,
        memory_reminders: nextReminderState,
        updated_at: now,
      },
      updated_at: now,
    });
    await insertRows('adews_scores', {
      learner_id: learnerId,
      risk: 0,
      top_features_json: [
        { feature: 'daily_whatsapp_reminder', value: status, contribution: 0 },
        { feature: 'module', value: reminder.module_title, contribution: 0 },
      ],
      fired_at: null,
      worker_ack: true,
    });
  }

  return {
    status,
    learner_id: learnerId,
    phone: maskPhone(phone),
    task: reminder.task,
    module: reminder.module_title,
    resource: reminder.resource_title,
    message: shouldDryRun ? reminder.message : undefined,
    provider: sendResult.provider || 'wati',
    error: sendResult.ok ? null : sendResult.error,
  };
}

async function loadLearnerJourney(learnerId, profile = {}) {
  const journeyLookup = await selectRows('learning_journeys', {
    filters: { learner_id: learnerId },
    order: 'updated_at.desc',
    limit: 1,
  });
  const row = journeyLookup.ok ? journeyLookup.data?.[0] : null;
  const journey = row?.journey_json || profile.memory_journey || {};
  const progress = row?.progress_json || profile.memory_progress || journey.progress || {};
  return { journey, progress };
}

function buildDailyReminder({ profile = {}, journey = {}, progress = {} }) {
  const modules = Array.isArray(journey.modules) ? journey.modules : [];
  const moduleStatus = Array.isArray(progress.module_status) ? progress.module_status : [];
  const currentStatus =
    moduleStatus.find((item) => item.id === progress.current_module_id) ||
    moduleStatus.find((item) => item.unlocked && !item.module_complete) ||
    moduleStatus.find((item) => !item.module_complete) ||
    null;
  const module =
    modules.find((item) => item.id === currentStatus?.id) ||
    modules.find((item, index) => index + 1 === Number(progress.current_module_week)) ||
    modules[0] ||
    {};
  const completedInModule = Math.max(0, Number(currentStatus?.completed || 0));
  const task = nextTaskForModule(module, completedInModule);
  const resource = firstResource(module);
  const name = firstName(profile.name) || 'learner';
  const language = String(profile.preferred_language || profile.language || '').toLowerCase();
  const resourceLine = resource.title
    ? `${resource.title}${resource.url ? ` - ${resource.url}` : ''}`
    : '';
  const howLine = resource.how_to_use || module.low_data_alternative || module.voice_whatsapp_version || '';
  const copy = reminderCopy(language);
  const message = [
    copy.intro(name, task),
    resourceLine ? `${copy.resource}: ${resourceLine}` : '',
    howLine ? `${copy.how}: ${howLine}` : '',
    copy.done,
  ].filter(Boolean).join('\n');

  return {
    message,
    task,
    module_title: module.title || `Week ${module.week || ''}`.trim(),
    resource_title: resource.title || '',
    resource_url: resource.url || '',
    proof_step: copy.proofStep,
  };
}

function nextTaskForModule(module = {}, completedInModule = 0) {
  const daily = normalizeList(module.daily_micro_tasks);
  const lessons = normalizeList(module.lessons);
  const practice = normalizeList(module.practice_tasks);
  const proof = normalizeList(module.proof_tasks);
  const candidates = [
    daily[completedInModule],
    daily[0],
    lessons[completedInModule],
    lessons[0],
    practice[0],
    module.today_task,
    module.goal,
    proof[0],
    module.proof,
  ].map(cleanTaskText).filter(Boolean);
  return candidates[0] || 'apna current lesson complete karein';
}

function firstResource(module = {}) {
  const resource = Array.isArray(module.resources) ? module.resources[0] || {} : {};
  const title = cleanTaskText(resource.title || resource.search_query || resource.type || '');
  const url = cleanTaskText(resource.source_url || resource.url || '');
  const how = cleanTaskText(resource.how_to_use || resource.proof_to_save || '');
  return { title, url, how_to_use: how };
}

async function sendWatiMessage({ phone, reminder, profile = {} }) {
  const base = watiApiBase();
  const token = process.env.WATI_API_TOKEN || '';
  const templateName = process.env.WATI_TEMPLATE_NAME || '';
  const broadcastName = process.env.WATI_BROADCAST_NAME || 'vidyasetu_daily_reminder';
  if (!base || !token) {
    return { ok: false, provider: 'wati', dry_run: true, error: 'WATI_API_BASE_URL/WATI_API_ENDPOINT or WATI_API_TOKEN missing' };
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), Number(process.env.WATI_TIMEOUT_MS || 12_000));
  try {
    let response;
    if (templateName) {
      const url = new URL(`${base}/api/v1/sendTemplateMessage`);
      url.searchParams.set('whatsappNumber', phone);
      response = await fetch(url, {
        method: 'POST',
        signal: timeout.signal,
        headers,
        body: JSON.stringify({
          template_name: templateName,
          broadcast_name: broadcastName,
          parameters: watiTemplateParameters({ profile, reminder }),
        }),
      });
    } else {
      const url = new URL(`${base}/api/v1/sendSessionMessage/${phone}`);
      url.searchParams.set('messageText', reminder.message);
      response = await fetch(url, { method: 'POST', signal: timeout.signal, headers });
    }
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return {
      ok: response.ok,
      provider: templateName ? 'wati_template' : 'wati_session',
      status: response.status,
      data,
      error: response.ok ? null : (data?.message || data?.error || response.statusText),
    };
  } catch (error) {
    return { ok: false, provider: 'wati', error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

function watiConfigured() {
  return Boolean(watiApiBase() && process.env.WATI_API_TOKEN);
}

function watiApiBase() {
  return String(process.env.WATI_API_BASE_URL || process.env.WATI_API_ENDPOINT || process.env.WATI_ENDPOINT || '').replace(/\/$/, '');
}

function dailyReminderLiveSendEnabled() {
  const raw = process.env.DAILY_REMINDERS_LIVE_SEND;
  if (raw === undefined || raw === '') return true;
  return String(raw).toLowerCase() === 'true';
}

function remindersEnabled(profile = {}, reminderState = {}) {
  return Boolean(
    reminderState.enabled === true ||
      reminderState.daily_enabled === true ||
      profile.whatsapp_reminders_enabled === true ||
      profile.consent?.whatsapp_reminders === true,
  );
}

function normalizeWhatsAppPhone(value = '') {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) return `${process.env.WATI_COUNTRY_CODE || '91'}${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return '';
}

function reminderPhoneAllowed(phone = '') {
  if (!reminderAllowlistEnforced()) return true;
  const raw = process.env.DAILY_REMINDER_ALLOWED_PHONES || process.env.REMINDER_ALLOWED_PHONES || '';
  const entries = raw.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean);
  if (!entries.length) return true;
  const allowed = entries.map(normalizeWhatsAppPhone).filter(Boolean);
  return allowed.includes(phone);
}

function reminderLearnerAllowed(learnerId = '') {
  if (!reminderAllowlistEnforced()) return true;
  const raw = process.env.DAILY_REMINDER_ALLOWED_LEARNER_IDS || process.env.REMINDER_ALLOWED_LEARNER_IDS || '';
  const entries = raw.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean);
  if (!entries.length) return true;
  return entries.includes(String(learnerId || '').trim());
}

function reminderAllowlistEnforced() {
  return String(process.env.DAILY_REMINDERS_ENFORCE_ALLOWLIST || '').toLowerCase() === 'true';
}

function maskPhone(phone = '') {
  const text = String(phone || '');
  return text ? `***${text.slice(-4)}` : '';
}

function skipped(reason, learnerId = '') {
  return { status: 'skipped', learner_id: learnerId || null, reason };
}

function normalizeList(value) {
  return Array.isArray(value) ? value.map(cleanTaskText).filter(Boolean) : [];
}

function cleanTaskText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function firstName(value = '') {
  return cleanTaskText(value).split(/\s+/).filter(Boolean)[0] || '';
}

function watiTemplateParameters({ profile = {}, reminder = {} }) {
  const parameters = [
    { name: 'name', value: firstName(profile.name) || 'learner' },
    { name: 'today_task', value: reminder.task },
    { name: 'resource', value: reminder.resource_title || 'VidyaSetu' },
  ];
  if (process.env.WATI_INCLUDE_PROOF_STEP === 'true') {
    parameters.push({
      name: 'proof_step',
      value: reminder.proof_step || 'VidyaSetu app me Done tap karke proof save karein',
    });
  }
  return parameters;
}

function stableReminderCopy(raw = '') {
  const variants = [
    {
      match: /english/.test(raw) && !/hinglish|hindi/.test(raw),
      copy: {
        intro: (name, task) => `Namaste ${name}, today's VidyaSetu task: ${task}`,
        resource: 'Resource',
        how: 'How to use',
        done: 'When done, open VidyaSetu, tap Done, and save one short proof note/photo.',
        proofStep: 'Open VidyaSetu, tap Done, and save one short proof note/photo.',
      },
    },
    {
      match: /odia|oriya/.test(raw),
      copy: {
        intro: (name, task) => `Namaskar ${name}, aaji ra VidyaSetu kaam: ${task}`,
        resource: 'Sadhan',
        how: 'Kemiti karibe',
        done: 'Sari gale VidyaSetu kholi Done dabantu ebam chhota proof note/photo save karantu.',
        proofStep: 'VidyaSetu re Done dabai chhota proof save karantu.',
      },
    },
    {
      match: /bengali|bangla/.test(raw),
      copy: {
        intro: (name, task) => `Nomoskar ${name}, aajker VidyaSetu kaaj: ${task}`,
        resource: 'Resource',
        how: 'Kibhabe korben',
        done: 'Hoye gele VidyaSetu khule Done chapun ebong chhoto proof note/photo save korun.',
        proofStep: 'VidyaSetu te Done chapun ebong chhoto proof save korun.',
      },
    },
    {
      match: /marathi/.test(raw),
      copy: {
        intro: (name, task) => `Namaste ${name}, aajche VidyaSetu kaam: ${task}`,
        resource: 'Sadhan',
        how: 'Kase karayche',
        done: 'Purna zalyavar VidyaSetu ughada, Done daba ani chhota purava note/photo save kara.',
        proofStep: 'VidyaSetu madhe Done dabun chhota purava save kara.',
      },
    },
    {
      match: /tamil/.test(raw),
      copy: {
        intro: (name, task) => `Vanakkam ${name}, indraiya VidyaSetu velai: ${task}`,
        resource: 'Resource',
        how: 'Eppadi seivathu',
        done: 'Mudinthathum VidyaSetu thirandhu Done azhuthi siru proof note/photo save seiyavum.',
        proofStep: 'VidyaSetu il Done azhuthi siru proof save seiyavum.',
      },
    },
    {
      match: /telugu/.test(raw),
      copy: {
        intro: (name, task) => `Namaste ${name}, ee roju VidyaSetu pani: ${task}`,
        resource: 'Resource',
        how: 'Ela cheyali',
        done: 'Poorthayyaka VidyaSetu terichi Done nokki chinna proof note/photo save cheyandi.',
        proofStep: 'VidyaSetu lo Done nokki chinna proof save cheyandi.',
      },
    },
    {
      match: /kannada/.test(raw),
      copy: {
        intro: (name, task) => `Namaste ${name}, indina VidyaSetu kelasa: ${task}`,
        resource: 'Resource',
        how: 'Hege madabeku',
        done: 'Mugida mele VidyaSetu tereyiri, Done otti, chikka proof note/photo save madi.',
        proofStep: 'VidyaSetu nalli Done otti chikka proof save madi.',
      },
    },
    {
      match: /malayalam/.test(raw),
      copy: {
        intro: (name, task) => `Namaskaram ${name}, innathe VidyaSetu joli: ${task}`,
        resource: 'Resource',
        how: 'Engane cheyyam',
        done: 'Mudinjaal VidyaSetu thurannu Done amarthi cheriya proof note/photo save cheyyuka.',
        proofStep: 'VidyaSetu il Done amarthi cheriya proof save cheyyuka.',
      },
    },
    {
      match: /gujarati/.test(raw),
      copy: {
        intro: (name, task) => `Namaste ${name}, aajnu VidyaSetu kaam: ${task}`,
        resource: 'Sadhan',
        how: 'Kevi rite karvu',
        done: 'Purna thay pachi VidyaSetu kholo, Done dabavo ane nano proof note/photo save karo.',
        proofStep: 'VidyaSetu ma Done dabavi nano proof save karo.',
      },
    },
    {
      match: /punjabi/.test(raw),
      copy: {
        intro: (name, task) => `Sat sri akal ${name}, aaj da VidyaSetu kaam: ${task}`,
        resource: 'Resource',
        how: 'Kiven karna hai',
        done: 'Poora ho jave ta VidyaSetu kholo, Done dabao ate chhota proof note/photo save karo.',
        proofStep: 'VidyaSetu vich Done daba ke chhota proof save karo.',
      },
    },
  ];
  return variants.find((variant) => variant.match)?.copy || {
    intro: (name, task) => `Namaste ${name}, aaj ka VidyaSetu kaam: ${task}`,
    resource: 'Resource',
    how: 'Kaise karna hai',
    done: 'Ho jaye to VidyaSetu kholkar Done tap karein aur ek chhota proof note/photo save karein.',
    proofStep: 'VidyaSetu app me Done tap karke proof save karein.',
  };
}

function reminderCopy(language = '') {
  const raw = String(language || '').toLowerCase();
  return stableReminderCopy(raw);
  if (/english/.test(raw) && !/hinglish|hindi/.test(raw)) {
    return {
      intro: (name, task) => `Namaste ${name}, today's VidyaSetu task: ${task}`,
      resource: 'Resource',
      how: 'How to use',
      done: 'When done, open VidyaSetu, tap Done, and save one short proof note/photo.',
      proofStep: 'Open VidyaSetu, tap Done, and save one short proof note/photo.',
    };
  }
  if (/hindi/.test(raw) && !/hinglish/.test(raw)) {
    return {
      intro: (name, task) => `नमस्ते ${name}, आज का VidyaSetu काम: ${task}`,
      resource: 'संसाधन',
      how: 'कैसे करना है',
      done: 'पूरा हो जाए तो VidyaSetu खोलकर Done दबाएं और छोटा सा सबूत नोट या फोटो सेव करें।',
      proofStep: 'VidyaSetu खोलकर Done दबाएं और छोटा सा सबूत सेव करें।',
    };
  }
  if (/odia|oriya/.test(raw)) {
    return {
      intro: (name, task) => `ନମସ୍କାର ${name}, ଆଜିର VidyaSetu କାମ: ${task}`,
      resource: 'ସାଧନ',
      how: 'କିପରି କରିବେ',
      done: 'ହେଇଗଲେ VidyaSetu ଖୋଲି Done ଦବାନ୍ତୁ ଏବଂ ଛୋଟ ପ୍ରମାଣ ନୋଟ/ଫଟୋ ସେଭ କରନ୍ତୁ।',
      proofStep: 'VidyaSetu ରେ Done ଦବାଇ ଛୋଟ ପ୍ରମାଣ ସେଭ କରନ୍ତୁ।',
    };
  }
  if (/bengali|bangla/.test(raw)) {
    return {
      intro: (name, task) => `নমস্কার ${name}, আজকের VidyaSetu কাজ: ${task}`,
      resource: 'রিসোর্স',
      how: 'কীভাবে করবেন',
      done: 'হয়ে গেলে VidyaSetu খুলে Done চাপুন এবং ছোট প্রমাণ নোট/ছবি সেভ করুন।',
      proofStep: 'VidyaSetu-তে Done চাপুন এবং ছোট প্রমাণ সেভ করুন।',
    };
  }
  if (/marathi/.test(raw)) {
    return {
      intro: (name, task) => `नमस्ते ${name}, आजचे VidyaSetu काम: ${task}`,
      resource: 'साधन',
      how: 'कसे करायचे',
      done: 'पूर्ण झाल्यावर VidyaSetu उघडा, Done दाबा आणि छोटा पुरावा नोट/फोटो सेव करा.',
      proofStep: 'VidyaSetu मध्ये Done दाबून छोटा पुरावा सेव करा.',
    };
  }
  if (/tamil/.test(raw)) {
    return {
      intro: (name, task) => `வணக்கம் ${name}, இன்றைய VidyaSetu வேலை: ${task}`,
      resource: 'வளம்',
      how: 'எப்படி செய்வது',
      done: 'முடிந்ததும் VidyaSetu திறந்து Done அழுத்தி சிறிய சான்று நோட்/போட்டோ சேமிக்கவும்.',
      proofStep: 'VidyaSetu-ல் Done அழுத்தி சிறிய சான்றை சேமிக்கவும்.',
    };
  }
  if (/telugu/.test(raw)) {
    return {
      intro: (name, task) => `నమస్తే ${name}, ఈరోజు VidyaSetu పని: ${task}`,
      resource: 'వనరు',
      how: 'ఎలా చేయాలి',
      done: 'పూర్తయ్యాక VidyaSetu తెరిచి Done నొక్కి చిన్న ఆధారం నోట్/ఫోటో సేవ్ చేయండి.',
      proofStep: 'VidyaSetu లో Done నొక్కి చిన్న ఆధారం సేవ్ చేయండి.',
    };
  }
  if (/kannada/.test(raw)) {
    return {
      intro: (name, task) => `ನಮಸ್ತೆ ${name}, ಇಂದಿನ VidyaSetu ಕೆಲಸ: ${task}`,
      resource: 'ಸಂಪನ್ಮೂಲ',
      how: 'ಹೇಗೆ ಮಾಡಬೇಕು',
      done: 'ಮುಗಿದ ಮೇಲೆ VidyaSetu ತೆರೆಯಿರಿ, Done ಒತ್ತಿ, ಚಿಕ್ಕ proof note/photo save ಮಾಡಿ.',
      proofStep: 'VidyaSetu ನಲ್ಲಿ Done ಒತ್ತಿ ಚಿಕ್ಕ proof save ಮಾಡಿ.',
    };
  }
  if (/malayalam/.test(raw)) {
    return {
      intro: (name, task) => `നമസ്കാരം ${name}, ഇന്നത്തെ VidyaSetu ജോലി: ${task}`,
      resource: 'റിസോഴ്സ്',
      how: 'എങ്ങനെ ചെയ്യാം',
      done: 'മുടിഞ്ഞാൽ VidyaSetu തുറന്ന് Done അമർത്തി ചെറിയ proof note/photo save ചെയ്യുക.',
      proofStep: 'VidyaSetu-ൽ Done അമർത്തി ചെറിയ proof save ചെയ്യുക.',
    };
  }
  if (/gujarati/.test(raw)) {
    return {
      intro: (name, task) => `નમસ્તે ${name}, આજનું VidyaSetu કામ: ${task}`,
      resource: 'સાધન',
      how: 'કેવી રીતે કરવું',
      done: 'પૂર્ણ થાય પછી VidyaSetu ખોલો, Done દબાવો અને નાનો પુરાવો note/photo save કરો.',
      proofStep: 'VidyaSetu માં Done દબાવી નાનો પુરાવો save કરો.',
    };
  }
  if (/punjabi/.test(raw)) {
    return {
      intro: (name, task) => `ਸਤ ਸ੍ਰੀ ਅਕਾਲ ${name}, ਅੱਜ ਦਾ VidyaSetu ਕੰਮ: ${task}`,
      resource: 'ਸਰੋਤ',
      how: 'ਕਿਵੇਂ ਕਰਨਾ ਹੈ',
      done: 'ਪੂਰਾ ਹੋ ਜਾਵੇ ਤਾਂ VidyaSetu ਖੋਲ੍ਹੋ, Done ਦਬਾਓ ਅਤੇ ਛੋਟਾ ਸਬੂਤ note/photo save ਕਰੋ।',
      proofStep: 'VidyaSetu ਵਿੱਚ Done ਦਬਾਕੇ ਛੋਟਾ ਸਬੂਤ save ਕਰੋ।',
    };
  }
  return {
    intro: (name, task) => `Namaste ${name}, aaj ka VidyaSetu kaam: ${task}`,
    resource: 'Resource',
    how: 'Kaise karna hai',
    done: 'Ho jaye to VidyaSetu kholkar Done tap karein aur ek chhota proof note/photo save karein.',
    proofStep: 'VidyaSetu app me Done tap karke proof save karein.',
  };
}

function localDateKey(date = new Date()) {
  const offsetMinutes = Number(process.env.REMINDER_TIMEZONE_OFFSET_MINUTES || 330);
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
  return shifted.toISOString().slice(0, 10);
}
