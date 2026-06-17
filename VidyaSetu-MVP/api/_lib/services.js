import {
  ACADEMIC_RESOURCE_DOCS,
  KB_DOCS,
  sourceLimitedPathways,
  validatePathwayRoutes,
  buildLocationGuardrail,
  decorateRouteExplanation,
  goalFamily,
  buildThisWeekActions,
} from './mvp.js';
import { detectLanguageStyle, languageInstruction, phrase } from './language.js';

function timeoutSignal(ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

function parseModelJson(text = '', fallback) {
  const raw = String(text || '').trim();
  if (!raw) return { data: fallback, parsed: false };
  try {
    return { data: JSON.parse(raw), parsed: true };
  } catch {
    const cleaned = raw.replace(/```json|```/gi, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return { data: JSON.parse(cleaned.slice(start, end + 1)), parsed: true };
      } catch {
        return { data: fallback, parsed: false };
      }
    }
  }
  return { data: fallback, parsed: false };
}

function providerError(provider, error) {
  return `${provider}: ${error || 'unavailable'}`;
}

function uniqueModelList(values = []) {
  return [...new Set(values.map((item) => String(item || '').trim()).filter(Boolean))];
}

function extractOpenAIText(payload = {}) {
  if (payload.output_text) return payload.output_text;
  return (payload.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || content.value || '')
    .filter(Boolean)
    .join('\n')
    .trim();
}

async function callOpenAIJson({ system, prompt, fallback, maxTokens = 900 }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { data: fallback, ok: false, provider: 'openai', error: 'OPENAI_API_KEY missing' };

  const models = uniqueModelList([
    process.env.OPENAI_MODEL,
    'gpt-4.1-mini',
    'gpt-4o-mini',
  ]);
  const errors = [];

  for (const model of models) {
    const timeout = timeoutSignal(Number(process.env.MODEL_JSON_TIMEOUT_MS || 12_000));
    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        signal: timeout.signal,
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_output_tokens: Math.max(maxTokens, 1200),
          input: [
            {
              role: 'system',
              content: `${system}\nReturn valid JSON only. Do not include markdown.`,
            },
            { role: 'user', content: prompt },
          ],
          text: { format: { type: 'json_object' } },
        }),
      });
      timeout.clear();
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        errors.push(`${model}: ${payload?.error?.message || response.statusText}`);
        continue;
      }
      const text = extractOpenAIText(payload);
      const parsed = parseModelJson(text, fallback);
      if (!parsed.parsed) {
        errors.push(`${model}: model did not return valid JSON`);
        continue;
      }
      return { data: parsed.data, ok: true, provider: 'openai', model, error: null };
    } catch (error) {
      timeout.clear();
      errors.push(`${model}: ${error.message}`);
    }
  }

  return { data: fallback, ok: false, provider: 'openai', error: errors.join(' | ') || 'OpenAI unavailable' };
}

async function callAnthropicJson({ system, prompt, fallback, maxTokens = 900 }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { data: fallback, ok: false, provider: 'anthropic', error: 'ANTHROPIC_API_KEY missing' };

  const models = uniqueModelList([
    process.env.ANTHROPIC_MODEL,
    'claude-sonnet-4-5',
    'claude-3-5-haiku-latest',
  ]);
  const errors = [];

  for (const model of models) {
    const timeout = timeoutSignal(Number(process.env.MODEL_JSON_TIMEOUT_MS || 12_000));
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: timeout.signal,
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: Math.max(maxTokens, 1200),
          temperature: 0.1,
          system: `${system}\nReturn valid JSON only. Do not include markdown.`,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      timeout.clear();
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        errors.push(`${model}: ${payload?.error?.message || response.statusText}`);
        continue;
      }
      const text = (payload.content || [])
        .map((item) => item.text || '')
        .filter(Boolean)
        .join('\n')
        .trim();
      const parsed = parseModelJson(text, fallback);
      if (!parsed.parsed) {
        errors.push(`${model}: model did not return valid JSON`);
        continue;
      }
      return { data: parsed.data, ok: true, provider: 'anthropic', model, error: null };
    } catch (error) {
      timeout.clear();
      errors.push(`${model}: ${error.message}`);
    }
  }

  return { data: fallback, ok: false, provider: 'anthropic', error: errors.join(' | ') || 'Anthropic unavailable' };
}

async function callFireworksOnlyJson({ system, prompt, fallback, maxTokens = 900 }) {
  const key = process.env.FIREWORKS_API_KEY;
  if (!key) {
    return { data: fallback, ok: false, provider: 'fireworks', error: 'FIREWORKS_API_KEY missing' };
  }

  const timeout = timeoutSignal(Number(process.env.FIREWORKS_JSON_TIMEOUT_MS || 10_000));
  try {
    const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      signal: timeout.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.FIREWORKS_MODEL || 'accounts/fireworks/models/gpt-oss-120b',
        max_tokens: Math.max(maxTokens, 1200),
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `${system}\nReturn valid JSON only. Do not include markdown.` },
          { role: 'user', content: prompt },
        ],
      }),
    });
    timeout.clear();

    const payload = await response.json();
    if (!response.ok) {
      return {
        data: fallback,
        ok: false,
        provider: 'fireworks',
        error: payload?.error?.message || response.statusText,
      };
    }

    const text = payload?.choices?.[0]?.message?.content || '';
    const parsed = parseModelJson(text, fallback);
    if (!parsed.parsed) {
      return { data: fallback, ok: false, provider: 'fireworks', error: text ? 'Model did not return valid JSON' : 'Empty model content' };
    }
    return { data: parsed.data, ok: true, provider: 'fireworks', model: process.env.FIREWORKS_MODEL || 'accounts/fireworks/models/gpt-oss-120b', error: null };
  } catch (error) {
    timeout.clear();
    return { data: fallback, ok: false, provider: 'fireworks', error: error.message };
  }
}

export async function callFireworksJson({ system, prompt, fallback, maxTokens = 900 }) {
  const attempts = [];
  const providers = [callAnthropicJson, callOpenAIJson, callFireworksOnlyJson];
  for (const provider of providers) {
    const result = await provider({ system, prompt, fallback, maxTokens });
    if (result.ok) {
      return {
        ...result,
        fallback_chain: attempts,
      };
    }
    attempts.push(providerError(result.provider, result.error));
  }
  return {
    data: fallback,
    ok: false,
    provider: 'fallback',
    error: attempts.join(' | '),
    fallback_chain: attempts,
  };
}

export async function transcribeSarvamAudio({ audioBase64, fileName = 'learner-demo.webm', languageCode = '' }) {
  const key = process.env.SARVAM_API_KEY;
  if (!audioBase64) {
    return {
      transcript: '',
      ok: false,
      provider: 'fallback',
      error: 'No audio provided',
      language_code: languageCode || '',
    };
  }

  let timeout = null;
  try {
    const normalized = audioBase64.includes(',') ? audioBase64.split(',').pop() : audioBase64;
    const binary = Buffer.from(normalized, 'base64');
    if (binary.length < 512) {
      return {
        transcript: '',
        ok: false,
        provider: 'audio_validation',
        error: 'Audio note is too short to transcribe. Record at least 5 seconds.',
        language_code: languageCode || '',
      };
    }
    if (!key) {
      return {
        transcript: '',
        ok: false,
        provider: 'fallback',
        error: 'SARVAM_API_KEY missing',
        language_code: languageCode || '',
      };
    }
    timeout = timeoutSignal(18_000);
    const form = new FormData();
    form.append('model', 'saaras:v3');
    form.append('mode', 'transcribe');
    if (languageCode) form.append('language_code', languageCode);
    form.append('file', new Blob([binary]), fileName);

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      signal: timeout.signal,
      headers: { 'api-subscription-key': key },
      body: form,
    });
    timeout.clear();

    const payload = await response.json();
    if (!response.ok) {
      return {
        transcript: '',
        ok: false,
        provider: 'sarvam',
        error: payload?.error?.message || payload?.message || response.statusText,
        language_code: languageCode || '',
      };
    }

    const transcript =
      payload.transcript ||
      payload.text ||
      payload.output ||
      payload.results?.[0]?.transcript ||
      '';

    return { transcript, ok: true, provider: 'sarvam', error: null, raw: payload, language_code: languageCode || '' };
  } catch (error) {
    timeout?.clear();
    return { transcript: '', ok: false, provider: 'sarvam', error: error.message, language_code: languageCode || '' };
  }
}

export async function discoverWithFirecrawl(query, fallback = [], options = {}) {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) {
    return { data: fallback, ok: false, provider: 'fallback', error: 'FIRECRAWL_API_KEY missing' };
  }

  const limit = Math.max(1, Math.min(Number(options.limit || process.env.FIRECRAWL_SEARCH_LIMIT || 2), 3));
  const scrape = Boolean(options.scrape);
  const timeout = timeoutSignal(Number(process.env.FIRECRAWL_TIMEOUT_MS || 8_000));
  try {
    const body = { query, limit };
    if (scrape) body.scrapeOptions = { formats: ['markdown'] };
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      signal: timeout.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    timeout.clear();
    const payload = await response.json();
    if (!response.ok) {
      return {
        data: fallback,
        ok: false,
        provider: 'firecrawl',
        error: payload?.error || payload?.message || response.statusText,
      };
    }

    const data = payload.data || payload.results || [];
    return { data, ok: true, provider: scrape ? 'firecrawl_scrape' : 'firecrawl_light', error: null, limit, scrape };
  } catch (error) {
    timeout.clear();
    return { data: fallback, ok: false, provider: 'firecrawl', error: error.message };
  }
}

export async function discoverWithOpenAIWeb(query, fallback = []) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return { data: fallback, ok: false, provider: 'openai_web_search', error: 'OPENAI_API_KEY missing' };
  }

  const models = uniqueModelList([
    process.env.OPENAI_SEARCH_MODEL,
    'gpt-4.1-mini',
    'gpt-4o-mini',
  ]);
  const errors = [];

  for (const model of models) {
    const timeout = timeoutSignal(Number(process.env.OPENAI_SEARCH_TIMEOUT_MS || 10_000));
    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        signal: timeout.signal,
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_output_tokens: 1200,
          tools: [{ type: 'web_search', search_context_size: 'low' }],
          tool_choice: 'required',
          input: `Search the live web for VidyaSetu evidence, opportunities, official resources, employer pages, or contact/source pages.\nQuery: ${query}\nReturn strict JSON only: {"results":[{"title":string,"url":string,"description":string,"source_type":string}]}. Include official/government/source pages when available. Do not invent URLs or email addresses.`,
        }),
      });
      timeout.clear();
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        errors.push(`${model}: ${payload?.error?.message || response.statusText}`);
        continue;
      }
      const text = extractOpenAIText(payload);
      const parsed = parseModelJson(text, { results: [] });
      const results = (parsed.data?.results || [])
        .map((item) => ({
          title: item.title || item.url || 'Web evidence',
          url: item.url || '',
          description: item.description || '',
          source_type: item.source_type || 'openai_web_search',
        }))
        .filter((item) => item.url || item.title);
      if (!parsed.parsed || !results.length) {
        errors.push(`${model}: no structured search results`);
        continue;
      }
      return { data: results, ok: true, provider: 'openai_web_search', model, error: null };
    } catch (error) {
      timeout.clear();
      errors.push(`${model}: ${error.message}`);
    }
  }

  return { data: fallback, ok: false, provider: 'openai_web_search', error: errors.join(' | ') || 'OpenAI web search unavailable' };
}

export async function discoverPathwayEvidence(query, fallback = []) {
  const openaiSearch = await discoverWithOpenAIWeb(query, []);
  if (openaiSearch.ok && openaiSearch.data?.length) {
    return openaiSearch;
  }
  if (process.env.ENABLE_FIRECRAWL_PATHWAY_FALLBACK !== 'true') {
    return {
      data: fallback,
      ok: false,
      provider: 'fallback_kb_after_openai_web',
      error: openaiSearch.error || 'OpenAI web search unavailable; Firecrawl pathway fallback disabled to save credits',
    };
  }
  const firecrawl = await discoverWithFirecrawl(query, fallback);
  if (firecrawl.ok) {
    return {
      ...firecrawl,
      provider: openaiSearch.error ? `firecrawl_after_openai` : firecrawl.provider,
      upstream_error: openaiSearch.error || null,
    };
  }
  return openaiSearch.ok ? openaiSearch : firecrawl;
}

export function fallbackProfileFromTranscript(transcript = '') {
  const lower = transcript.toLowerCase();
  const intent = latestInterestSegment(lower);
  const entrancePrep = isEntranceExamPrepText(lower);
  const academicPrep = isAcademicPrepText(lower);
  const schoolStudy = isSchoolStudyText(lower);
  const nameMatch =
    transcript.match(/(?:मेरा नाम|मेरे नाम|नाम|माझे नाव|माझं नाव|मो नाम|ମୋ ନାମ|ମୋର ନାମ|আমার নাম|আমি|என் பெயர்|எனது பெயர்)\s+([\p{L} .]{2,40}?)(?:\s+(?:है|आहे|ଅଟେ|আছে|হয়|ஆகும்)|।|\.|,|$)/iu) ||
    transcript.match(/(?:mera naam|mora naam|my name is|name\s*[-:]?|naam\s*[-:]?)\s+([\p{L} .]{2,40}?)(?:\s+hai|\.|,|$)/iu) ||
    transcript.match(/(?:main|mai|i am)\s+([\p{L}]{2,30})\s+[A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)?\s+(?:se|से)\b/iu) ||
    transcript.match(/(?:main|mai|i am)\s+([\p{L} ]{2,30}?)(?:\s+hoon|\s+hu|\s+hun|,|\.|$)/iu);
  const detectedName = cleanName(nameMatch?.[1] || '');
  const classMatch = transcript.match(/(?:class|क्लास|कक्षा|କ୍ଲାସ|ক্লাস|வகுப்பு)\s*(\d{1,2})|(\d{1,2})(?:st|nd|rd|th|vi|pass)/i);
  const collegeStageMatch = transcript.match(/\b((?:btech|b\.tech|mtech|m\.tech|bca|mca|bcom|b\.com|b\.?a\b|bsc|b\.sc|diploma|iti|polytechnic|engineering)[A-Za-z .]*(?:first|second|third|fourth|1st|2nd|3rd|4th|final)?\s*(?:year)?)\b/i);
  const genericCollegeMatch = /college|university|engineering college|polytechnic|diploma|iti|कॉलेज|इंजीनियरिंग/i.test(transcript);
  const classNumber = classMatch?.slice(1).find(Boolean);
  const classLevel = classMatch
    ? `Class ${classNumber}`
    : titleCase(collegeStageMatch?.[1] || (genericCollegeMatch ? 'College learner' : ''));
  const detectedLocation = detectLocation(transcript);
  const locationMatch =
    transcript.match(/\b([A-Za-z\u0900-\u097F]{3,30})\s+(?:district|zila|zilla)\b/i) ||
    transcript.match(/\b([A-Za-z\u0900-\u097F]{3,30})\s+(?:se|re)(?:\.|,|\s|$)/i) ||
    transcript.match(/(?:from|in|near|paas)\s+([A-Za-z\u0900-\u097F ]{3,40})(?:\.|,|$)/i);
  const explicitInterest =
    transcript.match(/(?:actually|instead|change(?:d)?(?: my)? interest(?: to)?|ab|now|but)\s+(?:mujhe|i am interested in|i want|mera interest|my interest is)?\s*([A-Za-z\u0900-\u097F ]{3,70}?)(?:\s+mein|\s+me|\s+karna|\s+chahiye|\.|,|$)/i)?.[1]?.trim() ||
    transcript.match(/(?:mujhe|i am interested in|i want|i like|interest(?:ed)? in|pasand hai)\s+([A-Za-z\u0900-\u097F ]{3,70}?)(?:\s+mein|\s+me|\.|,|$)/i)?.[1]?.trim() ||
    transcript.match(/([A-Za-z\u0900-\u097F ]{3,70}?)\s+(?:pasand hai|mein interest hai|me interest hai)/i)?.[1]?.trim();
  const detected = detectAspirations(intent);
  const broadDetected = detected.length ? detected : detectAspirations(lower);
  const subjects = entrancePrep ? detectEntranceSubjects(transcript) : detectSubjects(transcript);
  const entranceExam = detectEntranceExam(transcript);
  const aspirations = entrancePrep
    ? [`${entranceExam} preparation`]
    : academicPrep
      ? ['class 12 board exam preparation']
      : schoolStudy
        ? [`${classLevel || 'school'} study support`]
      : broadDetected.length
        ? broadDetected
        : explicitInterest
          ? [cleanInterest(explicitInterest)]
          : [];
  const timeAvailable = detectTimeAvailable(transcript);
  const commuteMatch = lower.match(/(\d+)\s*(km|kilometre|kilometer)/);
  const relocationPreference = detectRelocationPreference(transcript);
  const phoneAccess = /shared|share|ghar ka phone|family phone/i.test(transcript)
    ? 'shared mobile phone'
    : /laptop|computer/i.test(transcript)
      ? 'laptop/computer access'
    : /android|whatsapp|phone|mobile/i.test(transcript)
      ? 'mobile phone with WhatsApp'
      : '';
  const earningUrgency = /turant|jaldi|quick|immediate|abhi|income|kamai|earn|job|naukri|placement|नौकरी|रोजगार/i.test(transcript)
    ? 'immediate'
    : /training|course|seekh/i.test(transcript)
      ? 'after training'
      : '';
  const preferredLanguage = detectPreferredLanguage(transcript);

  return {
    name: detectedName,
    class_level: classLevel,
    education_status: entrancePrep
      ? `${classLevel || 'Learner'} entrance exam preparation`
      : academicPrep
        ? 'Class 12 exam preparation'
        : schoolStudy
          ? `${classLevel || 'School'} study support`
          : classMatch
            ? `${classLevel} / studying`
            : genericCollegeMatch
              ? `${classLevel || 'College learner'} / studying`
          : /dropout|school chhod/i.test(transcript)
            ? 'School dropout'
            : '',
    location: stripLeadingName(cleanLocation(detectedLocation || ''), detectedName),
    commute_km: commuteMatch ? Number(commuteMatch[1]) : null,
    commute_constraint: /safe|women|ladki|girl|day shift/i.test(transcript) ? 'safe commute preferred' : '',
    aspirations,
    income_pressure: /earn|income|paisa|kamai|rojgar|earning|job|naukri|नौकरी|रोजगार|कमाई/i.test(transcript),
    language: detectSpokenLanguages(transcript, preferredLanguage),
    preferred_language: preferredLanguage,
    device: /android/i.test(transcript) ? 'Android phone' : phoneAccess || 'mobile phone',
    phone_access: phoneAccess,
    time_available: timeAvailable,
    earning_urgency: earningUrgency,
    relocation_preference: relocationPreference,
    content_preferences: /voice|bol|audio/i.test(transcript)
      ? ['voice notes']
      : /video|youtube/i.test(transcript)
        ? ['short videos']
        : [],
    support_needs: /family|parent|maa|papa|guardian/i.test(transcript) ? ['family explanation'] : [],
    academic_goal: entrancePrep || academicPrep || schoolStudy
      ? {
          type: entrancePrep ? 'entrance_exam_prep' : academicPrep ? 'class_12_exam_prep' : 'school_study_support',
          exam: entrancePrep ? entranceExam : undefined,
          board: detectBoard(transcript),
          subjects,
          target: entrancePrep
            ? `prepare for ${entranceExam} with syllabus coverage, practice, mocks, and error-log tracking`
            : academicPrep
              ? /good|achha|achhe|score|marks|number|नंबर|अच्छ/i.test(transcript)
                ? 'score better marks in Class 12'
                : 'prepare for Class 12 board exams'
              : `get better at ${subjects.join(', ')} for ${classLevel || 'school'}`,
        }
      : null,
    learner_goal: inferLearnerGoal(transcript, {
      entrancePrep,
      academicPrep,
      schoolStudy,
      classLevel,
      aspirations,
      subjects,
    }),
  };
}

export function inferLearnerGoal(text = '', hints = {}) {
  const lower = String(text).toLowerCase();
  const aspirations = (hints.aspirations || []).join(' ').toLowerCase();
  const combined = `${lower} ${aspirations}`;

  if (
    /switch.*career|career.*switch|job counseling|career counseling|career\/job|career.*job|job.*career|employability|opportunity search|outreach pipeline|hirer outreach/i.test(
      text,
    )
  ) {
    return {
      type: 'job_search_only',
      label: 'Career/job counseling',
      intent: 'job',
      needs_location_for_offline: true,
      recommended_next_step: 'Clarify target role, skill proof/resume, safe location or relocation, then prepare opportunity search and consent-limited outreach.',
    };
  }

  if (
    /confused|do not know|don't know|not sure|unsure|counseling|counselling|guide me|what should i do/i.test(text) &&
    !/career|job|internship|placement|employability|naukri|opportunity|outreach|hiring|vacancy/i.test(text)
  ) {
    return {
      type: 'open_counseling',
      label: 'Open counseling',
      intent: 'unknown',
      needs_location_for_offline: false,
      recommended_next_step: 'Ask one more question to identify study, training, job, or support need.',
    };
  }

  if (hints.entrancePrep || isEntranceExamPrepText(combined)) {
    const exam = detectEntranceExam(text || aspirations);
    return {
      type: 'entrance_exam_prep',
      label: `${exam} preparation`,
      intent: 'study',
      needs_location_for_offline: false,
      recommended_next_step: 'Create exam syllabus map, daily practice plan, mock-test routine, and error-log tracker.',
    };
  }
  if (hints.academicPrep) {
    return {
      type: 'school_exam_prep',
      label: 'School exam preparation',
      intent: 'study',
      needs_location_for_offline: false,
      recommended_next_step: 'Create subject-wise study plan and progress tracker.',
    };
  }
  if (hints.schoolStudy) {
    return {
      type: 'school_study_support',
      label: 'School study support',
      intent: 'study',
      needs_location_for_offline: false,
      recommended_next_step: 'Create chapter plan, practice set, and mistake-log tracker.',
    };
  }
  if (/college|btech|b\.tech|engineering|semester|campus|undergraduate|university|कॉलेज|इंजीनियरिंग/i.test(text) && /job|naukri|placement|hire|hirer|hiring|vacancy|नौकरी|रोजगार/i.test(text)) {
    return {
      type: 'college_job_search',
      label: /data science|डेटा\s*साइंस|machine learning|मशीन\s*लर्निंग|analytics|एनालिटिक्स|python|पायथन|sql|\bai\b|artificial intelligence/i.test(combined)
        ? 'College to data science job pathway'
        : 'College to job pathway',
      intent: 'job',
      needs_location_for_offline: true,
      recommended_next_step: 'Build skill-gap plan, portfolio proof, job search, and consent-limited hirer outreach.',
    };
  }
  if (
    /college|btech|b\.tech|engineering|semester|campus|undergraduate|university/i.test(text) &&
    /internship|project|placement|portfolio|resume|college|campus/i.test(text)
  ) {
    return {
      type: /internship|project/i.test(text) ? 'college_internship_project' : 'college_career',
      label: /internship|project/i.test(text) ? 'College internship/project pathway' : 'College career pathway',
      intent: 'college',
      needs_location_for_offline: /offline|near|nearby|local|campus|job|internship|placement/i.test(text),
      recommended_next_step: 'Build college profile, portfolio/resume, internship/job route, and outreach plan.',
    };
  }
  const explicitEnterprise =
    /self.?employment|business|enterprise|startup setup|start.*own|apna kaam|ghar se kaam|home unit|open.*shop|apni.*shop|shop.*start|poultry|mushroom|goat|dairy|food processing|pickle|papad|bakery|farming enterprise|loan|mudra|pmegp|pmfme|kvk|district industries|dic/i.test(text);
  const explicitProofOrEmployment =
    /local job|job chahiye|naukri|rpl|certificate|proof|sample|workshop mein|workshop experience|seekha hai|apprentice|apprenticeship/i.test(text);
  if (explicitEnterprise && (!explicitProofOrEmployment || /loan|mudra|pmegp|business|enterprise|start.*own|apna kaam|ghar se kaam|home unit|poultry|mushroom|goat|dairy|food processing|pickle|papad|bakery/i.test(text))) {
    return {
      type: 'self_employment_enterprise',
      label: /poultry|chicken|broiler|layer/i.test(text)
        ? 'Poultry enterprise setup'
        : /mushroom/i.test(text)
          ? 'Mushroom enterprise setup'
          : /food processing|pickle|papad|bakery|masala/i.test(text)
            ? 'Food processing micro-enterprise'
            : 'Self-employment enterprise setup',
      intent: 'self_employment',
      needs_location_for_offline: true,
      recommended_next_step: 'Build setup roadmap, verify training/scheme/local support, check cost heads, buyers, suppliers, and risks before any loan or investment.',
    };
  }
  if (
    /job|naukri|placement|work|role|hiring|vacancy|employment/i.test(text) &&
    /computer basics|typing|data entry|computer operator|front desk|reception|billing|office assistant|office job|local office|bpo|call center|customer service|retail billing/i.test(
      combined,
    )
  ) {
    return {
      type: 'local_office_job',
      label: 'Local office job search',
      intent: 'job',
      needs_location_for_offline: true,
      recommended_next_step: 'Build resume/typing proof, shortlist nearby day-shift office roles, then apply only with learner consent.',
    };
  }
  if (/informal|without certificate|no certificate|certificate nahi|ghar par|home based|seekha hai|workshop mein|self taught/i.test(text)) {
    return {
      type: 'informal_skill_validation',
      label: 'Informal skill validation',
      intent: 'proof_to_work',
      needs_location_for_offline: true,
      recommended_next_step: 'Validate skill proof, create Skill Passport, then match local training/jobs.',
    };
  }
  if (/job only|only job|sirf job|bas job|job search|find job|job opportunity|job opportunities|hiring|vacancy|naukri|नौकरी|रोजगार|job chahiye|work from home|remote work|remote job|wfh|freelance/i.test(text)) {
    const hasFormalSignal = /certified|certificate|diploma|degree|iti|experience|graduate|bcom|b\.com|tally|gst|license|driving/i.test(text);
    return {
      type: hasFormalSignal ? 'formal_skill_job_search' : 'job_search_only',
      label: hasFormalSignal ? 'Formal skill job search' : 'Job search only',
      intent: 'job',
      needs_location_for_offline: true,
      recommended_next_step: 'Search location-specific jobs and prepare consent-limited outreach.',
    };
  }
  if (
    /job|naukri|placement|work|role|hiring|vacancy|internship/i.test(text) &&
    /graduate|bcom|b\.com|degree|diploma|iti|certified|certificate|license|driving|experience|tally|gst|accountant|finance|resume|cv/i.test(text)
  ) {
    return {
      type: 'formal_skill_job_search',
      label: 'Formal skill job search',
      intent: 'job',
      needs_location_for_offline: true,
      recommended_next_step: 'Search role-specific jobs and prepare consent-limited outreach.',
    };
  }
  if (/training|course|vocational|skill course|learn skill|seekhna|sikhna|apprentice|apprenticeship|pmkvy|skill india|nsdc/i.test(text) && !/job only|only job|sirf job|bas job/i.test(text)) {
    return {
      type: 'vocational_training',
      label: 'Vocational training',
      intent: 'training',
      needs_location_for_offline: true,
      recommended_next_step: 'Find local/online training routes and build practice-to-proof journey.',
    };
  }
  if (/already skilled|certified|certificate|diploma|degree|iti|experience|resume|cv|placement/i.test(text)) {
    return {
      type: /certificate|certified|diploma|degree|iti|experience|resume|cv/i.test(text) ? 'formal_skill_job_search' : 'job_search_only',
      label: /certificate|certified|diploma|degree|iti|experience|resume|cv/i.test(text) ? 'Formal skill job search' : 'Job search only',
      intent: 'job',
      needs_location_for_offline: true,
      recommended_next_step: 'Search location-specific jobs and prepare consent-limited outreach.',
    };
  }
  if (/college|btech|b\.tech|engineering|degree|semester|campus|polytechnic|diploma|iti|undergraduate|graduate|university|internship|project|placement|कॉलेज|इंजीनियरिंग/i.test(text)) {
    return {
      type: /internship|project/i.test(text) ? 'college_internship_project' : 'college_career',
      label: /internship|project/i.test(text) ? 'College internship/project pathway' : 'College career pathway',
      intent: 'college',
      needs_location_for_offline: /offline|near|nearby|local|campus|job|internship|placement/i.test(text),
      recommended_next_step: 'Build college profile, portfolio/resume, internship/job route, and outreach plan.',
    };
  }
  if (/repair|mobile|tailor|silai|cooking|hotel|beauty|salon|computer|typing|data entry|data science|डेटा\s*साइंस|machine learning|मशीन\s*लर्निंग|analytics|एनालिटिक्स|python|पायथन|sql|agri|drone|retail|sales|customer|video|design/.test(combined)) {
    return {
      type: 'skill_pathway_exploration',
      label: /data science|डेटा\s*साइंस|machine learning|मशीन\s*लर्निंग|analytics|एनालिटिक्स|python|पायथन|sql/i.test(combined) ? 'Data science pathway exploration' : 'Skill pathway exploration',
      intent: 'career',
      needs_location_for_offline: true,
      recommended_next_step: 'Compare training, apprenticeship, and entry-work routes based on location.',
    };
  }
  return {
    type: 'open_counseling',
    label: 'Open counseling',
    intent: 'unknown',
    needs_location_for_offline: false,
    recommended_next_step: 'Ask one more question to identify study, training, job, or support need.',
  };
}

export function isSchoolStudyText(text = '') {
  const lower = String(text).toLowerCase();
  const hasClass = /class\s*\d{1,2}|\d{1,2}(?:st|nd|rd|th)|कक्षा\s*\d{1,2}|क्लास\s*\d{1,2}|କ୍ଲାସ\s*\d{1,2}|ক্লাস\s*\d{1,2}|வகுப்பு\s*\d{1,2}/.test(lower);
  const vocationalOrCareerIntent =
    /training|course|vocational|job|naukri|career|income|earning|internship|placement|nursing|anm|gnm|agriculture|drone|mobile repair|tailor|silai|beauty|driver|driving|accountant|tally|gst/i.test(
      lower,
    );
  const explicitAcademicNeed =
    /homework|marks|exam|board|math|maths|science|english|sst|social science|chapter|ncert|cbse|sample paper|padhai|study help|coding.*help|help.*coding/i.test(
      lower,
    );
  if (vocationalOrCareerIntent && !explicitAcademicNeed) return false;
  const hasStudyIntent =
    /study|student|school|homework|learn|help|math|maths|science|english|hindi|sst|social science|marks|exam|chapter|padh|padhna|resources|practice/.test(
      lower,
    ) ||
    /पढ़|पढ़|पढ|स्कूल|विद्यार्थी|छात्र|मदद|गणित|विज्ञान|होमवर्क|अध्याय|नंबर|परीक्षा|तैयारी|ପଢ|ସହାୟତା|ଗଣିତ|ବିଜ୍ଞାନ|পড়|সাহায্য|গণিত|বিজ্ঞান|கற்க|படிக்க|உதவி|கணித|அறிவியல்/.test(lower);
  return hasClass && hasStudyIntent;
}

export function isEntranceExamPrepText(text = '') {
  const lower = String(text).toLowerCase();
  const multiGoalConfusion =
    /confused|do not know|don't know|not sure|whether|should i|ya |or /i.test(lower) &&
    /job|private job|design|training|course|career|skill|college|placement/i.test(lower);
  if (multiGoalConfusion) return false;
  const hasEntranceExam =
    /\bjee\b|jee\s*(main|mains|advanced|advance)|\biit\b|\bneet\b|\bcuet\b|\bbitsat\b|\bviteee\b|\bwbjee\b|\bcomedk\b|mht\s*cet|\bkcet\b|\bgate\b|\bcat\b|\bclat\b|\bnda\b|\bupsc\b|\bssc\b|railway|bank\s*(po|exam)|government exam|sarkari exam|entrance exam|competitive exam/.test(lower) ||
    /जेईई|आईआईटी|नीट|सीयूईटी|गेट|कैट|क्लैट|एनडीए|यूपीएससी|एसएससी|रेलवे|बैंक|सरकारी\s*परीक्षा|प्रवेश\s*परीक्षा|प्रतियोगी\s*परीक्षा/.test(lower);
  const hasPrepIntent =
    /prep|prepare|preparation|crack|rank|mock|test series|practice test|syllabus|exam|paper|revision|study|target|score|marks/.test(lower) ||
    /प्रेप|तैयारी|क्रैक|रैंक|मॉक|टेस्ट|सिलेबस|परीक्षा|पेपर|रिवीजन|पढ़|पढ़|पढ|अंक|नंबर|स्कोर/.test(lower);
  return hasEntranceExam && hasPrepIntent;
}

export function isAcademicPrepText(text = '') {
  const lower = String(text).toLowerCase();
  const hasClass12 =
    /class\s*12|12th|twelfth|xii|class\s*twelve/.test(lower) ||
    /बारहवीं|बारहवी|बारह|ट्वेल्थ|टवेल्थ|क्लास\s*(12|ट्वेल्थ|टवेल्थ)|कक्षा\s*(12|बारह|बारहवीं)/.test(lower);
  const hasStudyIntent =
    /exam|board|paper|sample|marks|score|number|study|resources|revision|syllabus|ncert|cbse|diksha|prepare|preparation/.test(lower) ||
    /नंबर|नम्बर|एग्जाम|इग्जाम|परीक्षा|पेपर|अंक|स्कोर|पढ़|पढ़|पढ|तैयारी|रिवीजन|सिलेबस|अच्छे\s*नंबर/.test(
      lower,
    );
  return hasClass12 && hasStudyIntent;
}

function detectBoard(text = '') {
  if (/cbse/i.test(text)) return 'CBSE';
  if (/state board|up board|bihar board|mp board|maharashtra board|राज्य बोर्ड|यूपी बोर्ड/i.test(text)) return 'State board';
  return 'CBSE or state board';
}

function detectPreferredLanguage(text = '') {
  const detected = detectLanguageStyle(text);
  if (detected.name === 'Hinglish') return 'Hindi + English';
  return detected.name || 'Hindi or local language';
}

function detectSpokenLanguages(text = '', preferredLanguage = '') {
  const detected = detectLanguageStyle(text, { preferred_language: preferredLanguage });
  const languages = [detected.name === 'Hinglish' ? 'Hindi + English' : detected.name].filter(Boolean);
  if (/english/i.test(text) && !languages.includes('English')) languages.push('English');
  if (/hindi|हिंदी|हिन्दी|namaste|mera|mujhe|main|mai|hoon|hai/i.test(text) && !languages.some((item) => /Hindi/.test(item))) {
    languages.push('Hindi');
  }
  if (!languages.length && preferredLanguage) languages.push(preferredLanguage);
  return [...new Set(languages)].join(' + ') || 'Hindi or local language';
}

function detectSubjects(text = '') {
  const subjects = [
    [/physics|फिजिक्स|भौतिक/i, 'Physics'],
    [/chemistry|केमिस्ट्री|रसायन/i, 'Chemistry'],
    [/\bscience\b|विज्ञान/i, 'Science'],
    [/math|maths|mathematics|गणित/i, 'Mathematics'],
    [/biology|bio|बायोलॉजी|जीव/i, 'Biology'],
    [/english|अंग्रेज/i, 'English'],
    [/hindi|हिंदी/i, 'Hindi'],
    [/accountancy|accounts|लेखा/i, 'Accountancy'],
    [/business studies|bst|commerce|व्यवसाय/i, 'Business Studies'],
    [/economics|अर्थशास्त्र/i, 'Economics'],
    [/history|इतिहास/i, 'History'],
    [/geography|भूगोल/i, 'Geography'],
    [/sst|social science|सामाजिक/i, 'Social Science'],
    [/political science|pol science|राजनीति/i, 'Political Science'],
    [/computer science|informatics|ip|कंप्यूटर/i, 'Computer Science'],
  ]
    .filter(([pattern]) => pattern.test(text))
    .map(([, subject]) => subject);
  return subjects.length ? [...new Set(subjects)] : ['Learner selected subjects'];
}

function detectEntranceExam(text = '') {
  if (/jee\s*advanced|jee\s*advance|जेईई\s*एडवांस|आईआईटी/i.test(text)) return 'JEE Advanced';
  if (/\bjee\b|jee\s*main|jee\s*mains|जेईई/i.test(text)) return 'JEE Main';
  if (/neet|नीट/i.test(text)) return 'NEET';
  if (/cuet|सीयूईटी/i.test(text)) return 'CUET';
  if (/gate|गेट/i.test(text)) return 'GATE';
  if (/cat|कैट/i.test(text)) return 'CAT';
  if (/clat|क्लैट/i.test(text)) return 'CLAT';
  if (/nda|एनडीए/i.test(text)) return 'NDA';
  if (/upsc|यूपीएससी/i.test(text)) return 'UPSC';
  if (/ssc|एसएससी/i.test(text)) return 'SSC';
  if (/railway|रेलवे/i.test(text)) return 'Railway exam';
  if (/bank|बैंक/i.test(text)) return 'Bank exam';
  return 'entrance exam';
}

function detectEntranceSubjects(text = '') {
  const lower = String(text).toLowerCase();
  if (/jee|iit|जेईई|आईआईटी/.test(lower)) return ['Physics', 'Chemistry', 'Mathematics'];
  if (/neet|नीट/.test(lower)) return ['Physics', 'Chemistry', 'Biology'];
  const subjects = detectSubjects(text);
  return subjects[0] === 'Learner selected subjects' ? ['Syllabus topics'] : subjects;
}

function latestInterestSegment(lower = '') {
  const markers = [
    /\bactually\b/,
    /\binstead\b/,
    /\bbut now\b/,
    /\bbut\b/,
    /\bfirst\b/,
    /\bpehle\b/,
    /\bchange(?:d)?\b/,
    /\bab\b/,
    /\bnow\b/,
    /पहले/,
    /बट/,
  ];
  const indices = markers.map((marker) => lower.search(marker)).filter((index) => index >= 0);
  if (!indices.length) return lower;
  return lower.slice(Math.min(...indices));
}

function detectAspirations(text = '') {
  return [
    isEntranceExamPrepText(text) ? `${detectEntranceExam(text)} preparation` : null,
    isAcademicPrepText(text) ? 'class 12 board exam preparation' : null,
    /data science|डेटा\s*साइंस|machine learning|मशीन\s*लर्निंग|analytics|एनालिटिक्स|data analyst|python|पायथन|sql|\bai\b|artificial intelligence/.test(text) ? 'data science' : null,
    /nursing|health/.test(text) ? 'nursing' : null,
    /beauty|mehandi|wellness|salon/.test(text) ? 'beauty and wellness' : null,
    /computer|typing|data entry|spreadsheet|office/.test(text) ? 'computer basics' : null,
    /repair|mobile|technician/.test(text) ? 'mobile repair' : null,
    /mechanic|bike|motorcycle|two wheeler|2 wheeler/.test(text) ? 'mechanic repair' : null,
    /tailor|silai|stitch|sewing|garment/.test(text) ? 'tailoring' : null,
    /cooking|hotel|cook|chef|kitchen|hospitality/.test(text) ? 'hospitality cooking' : null,
    /agriculture|farming|kheti|farm/.test(text) ? 'agriculture skills' : null,
    /poultry|chicken|broiler|layer/.test(text) ? 'poultry farming enterprise' : null,
    /mushroom/.test(text) ? 'mushroom farming enterprise' : null,
    /food processing|pickle|papad|bakery|masala/.test(text) ? 'food processing micro-enterprise' : null,
    /goat/.test(text) ? 'goat farming enterprise' : null,
    /drone/.test(text) ? 'drone operations' : null,
    /customer|call center|customer service/.test(text) ? 'customer service' : null,
    /video|videos|creator|content creation|digital content/.test(text) ? 'video creation' : null,
    /graphic|design|canva/.test(text) ? 'graphic design' : null,
    /accountant|accounting|tally|gst|finance/.test(text) ? 'accounting and finance' : null,
    /driver|driving|license/.test(text) ? 'driving' : null,
    /sales|retail|shop/.test(text) ? 'retail sales' : null,
    /electrician|electrical|wireman/.test(text) ? 'electrician' : null,
  ].filter(Boolean);
}

function detectTimeAvailable(text = '') {
  const lower = String(text).toLowerCase();
  const range =
    lower.match(/(\d+)\s*(?:to|-|se|से)\s*(\d+)\s*(min|minute|minutes|ghanta|ghante|hour|hours|घंटे|घंटा|मिनट)/i) ||
    null;
  if (range) return `${range[1]}-${range[2]} ${normalizeTimeUnit(range[3])}/day`;
  const single = lower.match(/(\d+)\s*(min|minute|minutes|ghanta|ghante|hour|hours|घंटे|घंटा|मिनट)/i);
  return single ? `${single[1]} ${normalizeTimeUnit(single[2])}/day` : '';
}

function normalizeTimeUnit(unit = '') {
  if (/min|मिनट/i.test(unit)) return 'minutes';
  return 'hours';
}

function detectRelocationPreference(text = '') {
  if (/anywhere in india|india anywhere|kahin bhi|कहीं भी|relocate|pan india|all india|किसी भी शहर/i.test(text)) {
    return 'open to opportunities anywhere in India';
  }
  if (/remote|work from home|wfh/i.test(text)) return 'remote preferred';
  return '';
}

function cleanName(value = '') {
  return value
    .replace(/\b(hai|hu|hun|hoon)$/i, '')
    .replace(/\s+(है|हूँ|हूं|आहे|ଅଟେ|ହେଉଛି|আছে|হয়|ஆகும்)$/iu, '')
    .trim();
}

function detectLocation(text = '') {
  const patterns = [
    /\baur\s+([A-Za-z\u0900-\u097F]{3,30})(?:\s+(?:city|town|district))?\s+(?:ke\s+paas|near)\b/i,
    /\b([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+){0,2})\s+(?:city|town|district)?\s*(?:ke\s+paas|near)\s+(?:rehta|rehti|rahta|rahti|hoon|hu|hun|live|lives)\b/,
    /\b([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+){0,2})\s+(?:city|town|district)?\s*(?:ke\s+paas|near)\b/,
    /\b(New Delhi|Navi Mumbai|Greater Noida|Noida Extension|Greater Mumbai)\s+(?:se|से)\b/i,
    /(?:main|mai|i am)\s+[A-Za-z\u0900-\u097F]{2,30}\s+([A-Z][a-zA-Z]+)\s+(?:se|से)\b/i,
    /\b([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+){0,2})\s+(?:se|से)\s+(?:hoon|hu|hun|belong|हूँ|हूं)\b/,
    /\b([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+){0,2})\s+(?:se|से)\b/,
    /\b([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+){0,2})\s+(?:ke|के)\s+(?:ek|एक)?\s*(?:engineering\s+)?(?:college|university|कॉलेज|इंजीनियरिंग)/,
    /(?:main|mai|i|मैं)\s+([A-Za-z\u0900-\u097F ]{2,40})\s+(?:ke|के)\s+(?:ek|एक)?\s*(?:engineering\s+)?(?:college|university|कॉलेज|इंजीनियरिंग)/i,
    /\b([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+){0,2})\s+(?:mein|me)\s+(?:rehta|rehti|rahta|rahti|hoon|hu|hun|live|lives)/,
    /\b([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+){0,2})\s+(?:mein|me)\s+(?:job|training|internship|course|work|apprenticeship|chahiye)/,
    /\b([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+){0,2})\s+(?:mein|me)(?:\.|,|\s|$)/,
    /(?:main|mai|i)\s+([A-Za-z\u0900-\u097F ]{2,40})\s+(?:mein|me)\s+(?:rehta|rehti|rahta|rahti|hoon|hu|hun|live|lives)/i,
    /([A-Za-z\u0900-\u097F ]{2,40})\s+(?:mein|me)\s+(?:rehta|rehti|rahta|rahti|hoon|hu|hun|live|lives)/i,
    /(?:main|mai|i|मैं)\s+([A-Za-z\u0900-\u097F ]{2,40})\s+(?:se|से)\s+(?:hoon|hu|hun|belong|हूँ|हूं)/i,
    /(?:from|near|in)\s+([A-Za-z\u0900-\u097F ]{2,40})(?:\.|,|$)/i,
    /(?:job|training|internship|course|work|apprenticeship)\s+(?:in|near|around|at|mein|me)\s+([A-Za-z\u0900-\u097F ]{2,40})(?:\.|,|$)/i,
    /\b([A-Za-z\u0900-\u097F]{3,30})\s+(?:district|zila|zilla)\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = cleanLocation(match?.[1] || '');
    if (value && !isNotLocation(value)) return value;
  }
  return '';
}

function isNotLocation(value = '') {
  return /certified|electrician|data entry|job only|resume|android|phone|math|science|training|course|help|student|class|skill|certificate|engineering|college|hindi|english|odia|language|content|batana|nahi|chahti|chahiye|marks/i.test(
    value,
  );
}

function cleanLocation(value = '') {
  return value
    .replace(/^(main|mai|i)\s+/i, '')
    .replace(/\s+(ke|के)\s+(ek|एक)?\s*(engineering\s+)?(college|university|कॉलेज|इंजीनियरिंग).*$/i, '')
    .replace(/\s+(city|town|district)$/i, '')
    .replace(/\b(se|re|from|near|paas|mein|me|ke|rehta|rehti|rahta|rahti|hoon|hu|hun|live|lives|हूँ|हूं)$/i, '')
    .trim();
}

function stripLeadingName(location = '', name = '') {
  if (!location || !name) return location;
  const normalizedLocation = location.toLowerCase();
  const normalizedName = name.toLowerCase();
  if (normalizedLocation.startsWith(`${normalizedName} `)) {
    return location.slice(name.length).trim();
  }
  return location;
}

function cleanInterest(value = '') {
  return value
    .replace(/^(ki|ka|ke|mein|me|to|for)\s+/i, '')
    .replace(/\s+(mein|me|ka|ke|ki|chahiye|karna hai)$/i, '')
    .trim()
    .toLowerCase();
}

function titleCase(value = '') {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateProfile(transcript) {
  const fallback = fallbackProfileFromTranscript(transcript);
  return callFireworksJson({
    fallback,
    system:
      'You extract a rural learner intake profile. Never infer caste, religion, or community. Return strict JSON only.',
    prompt: `Extract this schema: { "name": string, "age": number, "class_level": string, "education_status": string, "location": string, "commute_km": number, "commute_constraint": string, "aspirations": string[], "skills": string[], "proof_available": string[], "phone_access": string, "device": string, "time_available": string, "earning_urgency": string, "income_pressure": boolean, "language": string, "preferred_language": string, "dialect_guess": string, "content_preferences": string[], "support_needs": string[] }. Transcript:\n${transcript}`,
  });
}

export async function generatePathways(profile, question = '') {
  const outputLanguage = `${languageInstruction(profile, question)} Keep official scheme, exam, employer, and source names unchanged. Translate or localize route names, tradeoffs, time, distance, income, callback messages, lesson titles, and learner-facing suggestions into that language/style.`;
  const enterpriseContext =
    profile.learner_goal?.type === 'self_employment_enterprise' ||
    /business|enterprise|scheme|mudra|pmegp|pmfme|udyam|setup|\bshop\b|farm|poultry|mushroom|dairy|self.?employ|apna kaam/i.test(
      question,
    );
  const offScope =
    /canada|marriage|medical diagnosis|legal advice/i.test(question) ||
    (/\bloan\b/i.test(question) && !enterpriseContext);
  if (offScope) {
    const guardData = enrichPathwayData(
      {
        routes: [],
        confidence: 0.52,
        callback_flag: true,
        callback_message: phrase(profile, question, 'next_pathway', {}),
      },
      profile,
      { evidenceProvider: 'guardrail', evidenceCount: 0 },
    );
    return {
      data: guardData,
      ok: true,
      provider: 'guardrail',
      error: null,
    };
  }

  const activeGoal = profile.learner_goal || {};
  const academicGoalType = profile.academic_goal?.type || '';
  const academicGoalOverridesStaleCareer =
    academicGoalType === 'entrance_exam_prep' ||
    academicGoalType === 'class_12_exam_prep' ||
    academicGoalType === 'school_study_support';
  const latestEntrancePrep = isEntranceExamPrepText(question);
  const latestAcademicPrep = !latestEntrancePrep && isAcademicPrepText(question);
  const latestSchoolStudy = !latestEntrancePrep && !latestAcademicPrep && isSchoolStudyText(question);
  const latestStudyRequest = latestEntrancePrep || latestAcademicPrep || latestSchoolStudy;
  const inferredGoal = inferLearnerGoal(question, {
    entrancePrep: latestEntrancePrep,
    academicPrep: latestAcademicPrep,
    schoolStudy: latestSchoolStudy,
    aspirations: profile.aspirations || [],
  });
  const genericPathwayRequest = /^\s*(generate|create|refresh|show|make|build)\s+(a\s+|my\s+|the\s+)?(personalized\s+)?(pathway|pathway map|recommendation|recommendations|route|plan)\s*\.?\s*$/i.test(
    String(question || ''),
  );
  const latestNonStudyRequest =
    Boolean(String(question || '').trim()) &&
    !genericPathwayRequest &&
    Boolean(inferredGoal.intent && !['study', 'unknown'].includes(inferredGoal.intent));
  const explicitProfileNonStudyGoal =
    Boolean(activeGoal.intent && activeGoal.intent !== 'study') ||
    /job|training|career|enterprise|self_employment|informal_skill|local_office|college/i.test(activeGoal.type || '');
  const inferredNonStudyGoal = /job|training|career|enterprise|self_employment|informal_skill|local_office|college/i.test(
    inferredGoal.type || '',
  );
  const explicitNonStudyGoal =
    latestNonStudyRequest ||
    (!academicGoalOverridesStaleCareer && (explicitProfileNonStudyGoal || inferredNonStudyGoal));
  const studyLaneActive =
    latestStudyRequest ||
    (!explicitNonStudyGoal && (!activeGoal.intent || activeGoal.intent === 'study' || academicGoalOverridesStaleCareer));
  const entrancePrep = latestEntrancePrep || (studyLaneActive && isEntranceExamPrepProfile(profile, ''));
  const academicPrep = !entrancePrep && (latestAcademicPrep || (studyLaneActive && isAcademicPrepProfile(profile, '')));
  const schoolStudy = !entrancePrep && !academicPrep && (latestSchoolStudy || (studyLaneActive && isSchoolStudyProfile(profile, '')));
  const academicMode = entrancePrep || academicPrep || schoolStudy;
  const goal = academicMode ? inferredGoal : latestNonStudyRequest ? inferredGoal : profile.learner_goal || inferredGoal;
  const pathwayProfile = academicMode
    ? academicPathwayProfile(profile, question, { entrancePrep, academicPrep, schoolStudy, goal })
    : { ...profile, learner_goal: goal };
  const relocationText = String(profile.relocation_preference || '').toLowerCase();
  const negativeMobility = /\bno\b|nahi|not |local|same city|same town|won'?t|cannot|can'?t/.test(relocationText);
  const positiveMobility =
    !negativeMobility && /remote|anywhere|india.?wide|relocat|pan.?india|wfh|work from home|open to/.test(relocationText);
  const hasJobMobility = goal.intent === 'job' && positiveMobility;
  if (goal.needs_location_for_offline && !profile.location && !hasJobMobility) {
    const guardData = enrichPathwayData(
      buildLocationGuardrail(profile, { message: phrase(profile, question, 'need_location', {}) }),
      profile,
      { goal, academicMode: false, evidenceProvider: 'location_guardrail', evidenceCount: 0 },
    );
    return {
      data: guardData,
      ok: true,
      provider: 'location_guardrail',
      error: null,
    };
  }
  const fallback = {
    routes: sourceLimitedPathways(pathwayProfile),
    confidence: 0.82,
    callback_flag: false,
    evidence: academicMode ? ACADEMIC_RESOURCE_DOCS : KB_DOCS,
  };

  const aspiration = (pathwayProfile.aspirations || []).join(' ') || 'career skills';
  const location = pathwayProfile.relocation_preference || pathwayProfile.location || 'India';
  const liveEvidenceEnabled = process.env.DISABLE_PATHWAY_WEB_SEARCH !== 'true';
  const webEvidence = liveEvidenceEnabled
    ? await discoverPathwayEvidence(
    entrancePrep
      ? `${profile.academic_goal?.exam || 'JEE entrance exam'} official syllabus mock test practice ${profile.academic_goal?.subjects?.join(' ') || ''}`
      : academicMode
        ? `${profile.class_level || 'school'} ${profile.academic_goal?.subjects?.join(' ') || ''} NCERT DIKSHA official resources practice plan`
      : goal.intent === 'job'
        ? `${location} ${aspiration} job vacancy apprenticeship NCS employer hiring`
        : goal.intent === 'training'
          ? `${location} ${aspiration} training center course PMKVY NSDC Skill India`
          : goal.intent === 'college'
            ? `${location} ${aspiration} internship project placement college opportunity`
            : `${location} ${aspiration} government scheme training scholarship job official PMKVY NCS`,
        academicMode ? ACADEMIC_RESOURCE_DOCS : KB_DOCS,
      )
    : { data: [], ok: false, provider: 'web_search_disabled', error: null };
  const evidence = [
    ...(academicMode ? ACADEMIC_RESOURCE_DOCS : KB_DOCS),
    ...(webEvidence.data || []).slice(0, 5).map((item) => ({
      title: item.title || item.url || 'Web evidence',
      source_url: item.url,
      scheme_type: 'live_web',
      content: (item.description || item.markdown || '').slice(0, 1200),
    })),
  ];
  fallback.evidence_provider = webEvidence.provider;
  fallback.evidence_error = webEvidence.error || webEvidence.upstream_error || null;

  const pathwaySystem =
    entrancePrep
        ? 'Generate exactly three entrance-exam preparation routes using only supplied evidence. Do not generate jobs, placement, employer outreach, or generic computer-skills routes. Every route must include id, name, source_url, source_title, tradeoff, time, distance, income, confidence, focus_subjects, and must cover syllabus mapping, concept repair, practice sets, mocks, and error-log review. Return strict JSON: {routes:[], confidence:number, callback_flag:boolean}.'
        : academicPrep
          ? 'Generate exactly three Class 12 exam-preparation pathway routes using only supplied evidence. Every route must include id, name, source_url, source_title, tradeoff, time, distance, income, confidence, and focus_subjects. Return strict JSON: {routes:[], confidence:number, callback_flag:boolean}. If evidence is insufficient, use the official NCERT, CBSE, and DIKSHA evidence provided.'
          : schoolStudy
            ? 'Generate exactly three school study-support routes using only supplied evidence. Every route must include id, name, source_url, source_title, tradeoff, time, distance, income, confidence, and focus_subjects. Return strict JSON: {routes:[], confidence:number, callback_flag:boolean}. Do not generate jobs or placement routes for school homework/study help.'
          : goal.intent === 'job'
            ? 'Generate exactly three location-specific job-search Pathway Cards using only supplied evidence. The learner wants jobs, not generic skilling unless a small proof/resume gap blocks the match. Every offline route must mention the learner location/commute. Each route must include id, name, card_kind (earn_fast/build_bigger/explore), archetype, source_url or sources, source_title, tradeoff, time, distance, income, confidence, first_income_in, income_path, what_it_asks, why_this_fits_you, first_step, entry_ids, and requires_worker_confirmation. Return strict JSON: {routes:[], confidence:number, callback_flag:boolean, callback_reason:string|null}.'
            : goal.intent === 'training'
              ? 'Generate exactly three vocational-training Pathway Cards using only supplied evidence. Prioritize local centers/courses when location is available, plus phone-first foundation practice. Every offline route must mention location/commute. Each route must include id, name, card_kind (earn_fast/build_bigger/explore), archetype, source_url or sources, source_title, tradeoff, time, distance, income, confidence, first_income_in, income_path, what_it_asks, why_this_fits_you, first_step, entry_ids, and requires_worker_confirmation. Return strict JSON: {routes:[], confidence:number, callback_flag:boolean, callback_reason:string|null}.'
              : goal.intent === 'college'
                ? 'Generate exactly three college Pathway Cards: profile/portfolio, internship/project search, and outreach/follow-up. Use supplied evidence only. Every offline internship/project route must mention location/campus constraints. Each route must include id, name, card_kind (earn_fast/build_bigger/explore), archetype, source_url or sources, source_title, tradeoff, time, distance, income, confidence, first_income_in, income_path, what_it_asks, why_this_fits_you, first_step, entry_ids, and requires_worker_confirmation. Return strict JSON: {routes:[], confidence:number, callback_flag:boolean, callback_reason:string|null}.'
        : 'Generate exactly three rural India career Pathway Cards using only supplied evidence. Do not invent schemes, jobs, employers, wages, or contacts. Each route must include id, name, card_kind (earn_fast/build_bigger/explore), archetype, source_url or sources, source_title, tradeoff, time, distance, income, confidence, first_income_in, income_path, what_it_asks, why_this_fits_you, first_step, entry_ids, and requires_worker_confirmation. Return strict JSON: {routes:[], confidence:number, callback_flag:boolean, callback_reason:string|null}. If evidence is insufficient, set callback_flag true and confidence below 0.70.';

  const generated = await callFireworksJson({
    fallback,
    system: `${outputLanguage} ${pathwaySystem}`,
    prompt: `Learner profile:\n${JSON.stringify(profile)}\n\nEvidence:\n${JSON.stringify(evidence)}\n\nQuestion: ${question || 'Generate a personalized pathway map.'}`,
  });
  const family = goalFamily(pathwayProfile, { entrancePrep, academicPrep, schoolStudy });
  const deterministicRoutes = sourceLimitedPathways(pathwayProfile);
  const validation = validatePathwayRoutes(pathwayProfile, generated.data?.routes, {
    family,
    deterministic: deterministicRoutes,
  });
  const routesWereCorrected = validation.replaced || validation.used_deterministic;
  const data = {
    ...generated.data,
    routes: validation.routes,
    confidence: routesWereCorrected
      ? Math.max(Number(generated.data?.confidence || 0), 0.82)
      : Number(generated.data?.confidence || 0.82),
    callback_flag: validation.routes.length ? false : Boolean(generated.data?.callback_flag),
    route_validation: {
      family: validation.family,
      incoming: validation.incoming_count,
      kept: validation.kept_count,
      rejected: validation.rejected,
      replaced: validation.replaced,
      used_deterministic: validation.used_deterministic,
    },
    leak_guard_applied: routesWereCorrected,
  };

  return {
    ...generated,
    data: enrichPathwayData(data, pathwayProfile, {
      goal,
      academicMode,
      entrancePrep,
      academicPrep,
      schoolStudy,
      family,
      evidenceProvider: webEvidence.provider,
      evidenceCount: evidence.length,
    }),
  };
}

function academicPathwayProfile(profile = {}, question = '', context = {}) {
  const exam = profile.academic_goal?.exam || detectEntranceExam(question) || 'entrance exam';
  const subjects = profile.academic_goal?.subjects?.length
    ? profile.academic_goal.subjects
    : context.entrancePrep
      ? ['Physics', 'Chemistry', 'Mathematics']
      : detectSubjects(question);
  const academicGoal = context.entrancePrep
    ? {
        type: 'entrance_exam_prep',
        exam,
        board: 'Official exam syllabus',
        subjects,
        target: `prepare for ${exam} with syllabus coverage, practice, mocks, and error-log tracking`,
      }
    : context.academicPrep
      ? {
          type: 'class_12_exam_prep',
          board: detectBoard(question),
          subjects: subjects.length ? subjects : ['Learner selected subjects'],
          target: 'score better marks in Class 12',
        }
      : {
          type: 'school_study_support',
          board: detectBoard(question),
          subjects: subjects.length ? subjects : ['Learner selected subjects'],
          target: 'improve school learning',
        };
  return {
    ...profile,
    learner_goal: context.goal || inferLearnerGoal(question, { entrancePrep: context.entrancePrep }),
    academic_goal: {
      ...academicGoal,
      ...(profile.academic_goal || {}),
      type: academicGoal.type,
    },
    aspirations: context.entrancePrep
      ? [`${exam} preparation`]
      : profile.aspirations?.length
        ? profile.aspirations
        : [academicGoal.target],
    income_pressure: false,
    earning_urgency: profile.earning_urgency === 'immediate' ? '' : profile.earning_urgency || '',
  };
}

function enrichPathwayData(data = {}, profile = {}, context = {}) {
  const routes = Array.isArray(data.routes) ? data.routes : [];
  const cleanedRoutes = context.academicMode ? routes.map((route) => sanitizeAcademicRoute(route)) : routes;
  const missingFacts = missingProfileFacts(profile, context);
  const persona = personaForProfile(profile, context);
  const family = context.family || goalFamily(profile, context);
  const enrichedRoutes = cleanedRoutes.map((route, index) => enrichRouteTrace(route, index, profile, context, persona, missingFacts));
  const topConfidence = enrichedRoutes.length ? Number(enrichedRoutes[0].confidence || 0) : 0;
  const lowConfidence = enrichedRoutes.length > 0 && topConfidence < 0.7;
  const noRoutes = enrichedRoutes.length === 0;
  const needsHumanCallback = Boolean(data.callback_flag) || noRoutes || lowConfidence;
  const callbackReason = needsHumanCallback
    ? safeRouteText(
        data.callback_reason || data.callback_message,
        noRoutes
          ? 'No source-backed pathway matched the current profile.'
          : lowConfidence
            ? 'Top pathway confidence is below 0.70, so a worker should review it first.'
            : 'A worker should review this pathway before sharing it.',
      )
    : null;
  const visibleRoutes = noRoutes || lowConfidence ? [] : enrichedRoutes;
  return {
    ...data,
    result_type: needsHumanCallback ? 'human_callback' : 'pathways',
    callback_flag: needsHumanCallback,
    callback_reason: callbackReason,
    callback_message: callbackReason || data.callback_message || '',
    persona,
    this_week_actions: buildThisWeekActions(profile, family, { language: profile.preferred_language || profile.language }),
    missing_profile_facts: missingFacts,
    cards: visibleRoutes,
    recommendation_trace: {
      persona,
      evidence_provider: context.evidenceProvider || data.evidence_provider || 'fallback_kb',
      evidence_count: context.evidenceCount || 0,
      profile_facts_used: profileFacts(profile, context),
      missing_profile_facts: missingFacts,
      card_selection: {
        axes: ['earn_fast', 'build_bigger', 'explore'],
        top_confidence: topConfidence,
        gate_threshold: 0.7,
        source_policy: 'Each card must carry at least one source URL from deterministic evidence or retrieved entries.',
      },
    },
    pathway_card_contract: {
      schema_version: 'vidyasetu_pathway_cards_v1',
      result_type: needsHumanCallback ? 'human_callback' : 'pathways',
      callback_reason: callbackReason,
      required_card_fields: [
        'card_kind',
        'archetype',
        'title',
        'first_income_in',
        'income_path',
        'what_it_asks',
        'why_this_fits_you',
        'first_step',
        'entry_ids',
        'sources',
        'requires_worker_confirmation',
      ],
    },
    routes: visibleRoutes,
  };
}

function sanitizeAcademicRoute(route = {}) {
  const replacements = [
    [/employer outreach/gi, 'future career step'],
    [/hirer outreach/gi, 'future career step'],
    [/job outreach/gi, 'future career step'],
    [/placement readiness/gi, 'exam readiness'],
    [/job matching/gi, 'study-resource matching'],
  ];
  return Object.fromEntries(
    Object.entries(route || {}).map(([key, value]) => {
      if (typeof value !== 'string') return [key, value];
      return [
        key,
        replacements.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), value),
      ];
    }),
  );
}

function enrichRouteTrace(route = {}, index = 0, profile = {}, context = {}, persona = 'unsure_exploration', missingFacts = []) {
  const normalizedRoute = normalizeRoute(route, index, context);
  const matchedFacts = profileFacts(profile, context).slice(0, 7);
  const blockers = routeBlockers(normalizedRoute, profile, context, missingFacts);
  const filters = routeFilters(normalizedRoute, profile, context);
  const family = context.family || goalFamily(profile, context);
  const nextAction = nextActionForRoute(normalizedRoute, profile, context, blockers);
  const decorated = decorateRouteExplanation(normalizedRoute, {
    profile,
    family,
    language: profile.preferred_language || profile.language,
    matchedFacts,
    blockers,
    nextAction,
  });
  const card = applyPathwayCardContract(decorated, index, profile, context, matchedFacts, blockers);
  return {
    ...card,
    id: normalizedRoute.id || `route-${index + 1}`,
    confidence: Number(normalizedRoute.confidence || 0.72),
    trace: {
      persona,
      family,
      matched_facts: matchedFacts,
      missing_facts: missingFacts,
      filters,
      blockers,
      explanation: traceExplanation(normalizedRoute, matchedFacts, blockers),
    },
    next_action: decorated.next_action || nextAction,
  };
}

function normalizeRoute(route = {}, index = 0, context = {}) {
  const normalized = route && typeof route === 'object' && !Array.isArray(route) ? route : {};
  const sourceUrls = normalizeSourceList(normalized.sources || normalized.source_urls || normalized.sourceUrls);
  const primarySourceUrl = safeRouteUrl(normalized.source_url || normalized.url || normalized.link || normalized.route_link) || sourceUrls[0] || '';
  const routeName =
    safeRouteText(normalized.name) ||
    safeRouteText(normalized.title) ||
    safeRouteText(normalized.route_name) ||
    safeRouteText(normalized.route_title) ||
    safeRouteText(normalized.source_title) ||
    safeRouteText(normalized.tradeoff) ||
    safeRouteText(normalized.route_description) ||
    (context.academicMode ? `Study route ${index + 1}` : `Pathway route ${index + 1}`);
  return {
    ...normalized,
    id: safeRouteText(normalized.id) || `route-${index + 1}`,
    name: routeName,
    source_url: primarySourceUrl,
    sources: sourceUrls.length ? sourceUrls : primarySourceUrl ? [primarySourceUrl] : [],
    source_title: safeRouteText(normalized.source_title || normalized.source || normalized.provider, 'verified evidence'),
    tradeoff: safeRouteText(
      normalized.tradeoff || normalized.why || normalized.why_this_route || normalized.description || normalized.route_description,
      'Good fit based on the learner profile.',
    ),
    time: safeRouteText(normalized.time || normalized.timeline || normalized.duration, 'To be confirmed'),
    distance: safeRouteText(normalized.distance || normalized.mode || normalized.delivery, 'Phone-first'),
    income: safeRouteText(normalized.income || normalized.outcome || normalized.result || normalized.expected_outcome, 'Progress toward goal'),
    confidence: normalizeConfidence(normalized.confidence),
    focus_subjects: normalizeStringList(normalized.focus_subjects || normalized.subjects || normalized.skills),
  };
}

function safeRouteText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const text = value.map((item) => safeRouteText(item)).filter(Boolean).join(', ');
    return text || fallback;
  }
  if (typeof value === 'object') {
    const preferred =
      value.label ||
      value.title ||
      value.name ||
      value.text ||
      value.value ||
      value.summary ||
      value.description ||
      value.url;
    if (preferred !== undefined) return safeRouteText(preferred, fallback);
    try {
      return JSON.stringify(value).slice(0, 180);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function normalizeStringList(value) {
  if (Array.isArray(value)) return value.map((item) => safeRouteText(item)).filter(Boolean).slice(0, 8);
  const text = safeRouteText(value);
  return text ? [text] : [];
}

function normalizeConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.72;
  const normalized = number > 1 ? number / 100 : number;
  return Math.max(0.35, Math.min(0.99, normalized));
}

function safeRouteUrl(value) {
  const text = safeRouteText(value);
  return /^https?:\/\//i.test(text) ? text : '';
}

function normalizeSourceList(value) {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return [
    ...new Set(
      raw
        .map((item) =>
          safeRouteUrl(
            typeof item === 'string'
              ? item
              : item?.source_url || item?.url || item?.link || item?.href,
          ),
        )
        .filter(Boolean),
    ),
  ].slice(0, 4);
}

function orderedCardKinds(profile = {}) {
  const motivation = `${profile.motivation || ''} ${profile.earning_urgency || ''} ${profile.income_pressure ? 'earn_now' : ''}`.toLowerCase();
  if (/build|long|higher|study/.test(motivation)) return ['build_bigger', 'earn_fast', 'explore'];
  return ['earn_fast', 'build_bigger', 'explore'];
}

function validCardKind(value = '') {
  return ['earn_fast', 'build_bigger', 'explore'].includes(String(value || '').trim());
}

function cardKindForRoute(route = {}, index = 0, profile = {}) {
  const explicit = safeRouteText(route.card_kind || route.kind || route.axis);
  if (validCardKind(explicit)) return explicit;
  return orderedCardKinds(profile)[index] || 'explore';
}

function archetypeForRoute(family = 'generic', cardKind = 'earn_fast') {
  if (family === 'informal_skill' && cardKind === 'build_bigger') return '11_nano_entrepreneur';
  if (family === 'enterprise') return '11_nano_entrepreneur';
  if (family === 'job') return '06_first_job_local';
  if (family === 'vocational') return '05_training_to_work';
  if (family === 'data_science_job' || family === 'college') return '09_college_to_work';
  if (family === 'entrance_exam') return '08_exam_bridge';
  if (family === 'board_exam') return '02_board_repair';
  if (family === 'school_study') return '03_school_foundation';
  if (family === 'informal_skill') return '04_rural_vernacular';
  return '12_guided_exploration';
}

function entryIdsForRoute(route = {}, index = 0) {
  const raw = Array.isArray(route.entry_ids) ? route.entry_ids : route.entry_id ? [route.entry_id] : [];
  const ids = raw.map((item) => safeRouteText(item)).filter(Boolean);
  return ids.length ? ids.slice(0, 4) : [safeRouteText(route.id, `route-${index + 1}`)];
}

function routeNeedsWorkerConfirmation(route = {}) {
  const routeText = [
    route.name,
    route.tradeoff,
    route.distance,
    route.income,
    route.time,
    route.risk,
    route.next_action,
    route.locked_until,
  ]
    .map((value) => safeRouteText(value))
    .join(' ')
    .toLowerCase();
  return Boolean(route.requires_worker_confirmation) || /relocat|hostel|residential|leave school|paid course|fee|fees|loan|borrow|night shift|far away/.test(routeText);
}

function profileFitLine(profile = {}, route = {}, matchedFacts = []) {
  const explicit = safeRouteText(route.why_this_fits_you);
  if (explicit) return explicit;
  const usefulFacts = matchedFacts
    .filter((fact) => /goal|skill|location|mobility|time|education/i.test(fact.label || ''))
    .slice(0, 2)
    .map((fact) => `${fact.label}: ${fact.value}`);
  if (usefulFacts.length) return `Built from ${usefulFacts.join(' and ')}.`;
  return safeRouteText(route.tradeoff || route.why_this_route, 'Matches the current learner profile.');
}

function firstStepForRoute(route = {}, context = {}) {
  return safeRouteText(
    route.first_step || route.next_action || route.action || route.next_action_summary || context.nextAction,
    'Choose this card, then build the four-week journey.',
  );
}

function whatItAsksForRoute(route = {}, blockers = []) {
  const parts = [
    safeRouteText(route.distance),
    safeRouteText(route.time),
    blockers.length ? `Check first: ${safeRouteText(blockers[0])}` : '',
  ].filter(Boolean);
  return parts.length ? parts.slice(0, 3).join(' ') : 'Time, travel, fees, and documents must be checked before acting.';
}

function applyPathwayCardContract(route = {}, index = 0, profile = {}, context = {}, matchedFacts = [], blockers = []) {
  const family = context.family || goalFamily(profile, context);
  const cardKind = cardKindForRoute(route, index, profile);
  const sources = normalizeSourceList(route.sources || route.source_urls || route.source_url);
  const firstStep = firstStepForRoute(route, context);
  return {
    ...route,
    card_kind: cardKind,
    archetype: safeRouteText(route.archetype, archetypeForRoute(family, cardKind)),
    title: safeRouteText(route.title || route.name, `Pathway option ${index + 1}`),
    first_income_in: safeRouteText(route.first_income_in || route.time, context.academicMode ? 'progress starts this week' : 'varies'),
    income_path: safeRouteText(route.income_path || route.income || route.expected_outcome, context.academicMode ? 'study progress now -> stronger next option' : 'income depends on verified opportunity'),
    what_it_asks: safeRouteText(route.what_it_asks, whatItAsksForRoute(route, blockers)),
    why_this_fits_you: profileFitLine(profile, route, matchedFacts),
    first_step: firstStep,
    next_action: safeRouteText(route.next_action, firstStep),
    entry_ids: entryIdsForRoute(route, index),
    sources,
    source_url: safeRouteUrl(route.source_url) || sources[0] || '',
    requires_worker_confirmation: routeNeedsWorkerConfirmation(route),
    grounding_status: sources.length ? 'source_backed' : 'needs_source_review',
  };
}

function profileFacts(profile = {}, context = {}) {
  const facts = [];
  const goal = profile.learner_goal?.label || profile.academic_goal?.target || (profile.aspirations || [])[0] || '';
  addFact(facts, 'Goal', goal);
  addFact(facts, 'Persona', personaForProfile(profile, context).replace(/_/g, ' '));
  addFact(facts, 'Education', profile.class_level || profile.education_status);
  addFact(facts, 'Location', profile.location || profile.relocation_preference);
  addFact(facts, 'Mobility', profile.relocation_preference || (profile.commute_km ? `${profile.commute_km} km safe commute` : ''));
  addFact(facts, 'Time', profile.time_available);
  addFact(facts, 'Language', profile.preferred_language || profile.language);
  addFact(facts, 'Device', profile.phone_access || profile.device);
  addFact(facts, 'Urgency', profile.earning_urgency || (profile.income_pressure ? 'income urgent' : ''));
  addFact(facts, 'Skills', (profile.skills || []).join(', '));
  addFact(facts, 'Proof', (profile.proof_available || []).join(', '));
  return facts;
}

function addFact(facts, label, value) {
  const clean = Array.isArray(value) ? value.filter(Boolean).join(', ') : String(value || '').trim();
  if (!clean) return;
  facts.push({ label, value: clean });
}

function missingProfileFacts(profile = {}, context = {}) {
  const persona = personaForProfile(profile, context);
  const missing = [];
  const hasGoal = Boolean(profile.learner_goal?.label || profile.academic_goal?.target || profile.aspirations?.length);
  if (!hasGoal) missing.push('goal');
  if (!profile.class_level && !profile.education_status) missing.push('education');
  if (['job_search_only', 'formal_skill_job_search', 'vocational_training', 'informal_skill_rpl', 'dropout_income'].includes(persona)) {
    if (!profile.location && !profile.relocation_preference) missing.push('location');
    if (!profile.commute_km && !profile.relocation_preference) missing.push('safe commute or relocation');
    if (!profile.skills?.length && !profile.aspirations?.length && !profile.proof_available?.length) missing.push('skill/proof');
  }
  if (['school_study_support', 'board_exam_prep', 'entrance_exam_prep'].includes(persona)) {
    if (!profile.academic_goal?.subjects?.length) missing.push('subjects');
    if (!profile.time_available) missing.push('daily study time');
  }
  if (['college_career', 'college_internship'].includes(persona)) {
    if (!profile.skills?.length && !profile.proof_available?.length) missing.push('skills/projects/resume');
  }
  if (!profile.phone_access && !profile.device) missing.push('phone/internet access');
  return [...new Set(missing)];
}

function personaForProfile(profile = {}, context = {}) {
  const goalType = profile.learner_goal?.type || profile.academic_goal?.type || '';
  const goalIntent = profile.learner_goal?.intent || '';
  const text = `${goalType} ${goalIntent} ${profile.class_level || ''} ${profile.education_status || ''} ${(profile.aspirations || []).join(' ')} ${(profile.skills || []).join(' ')}`.toLowerCase();
  if (/formal_skill_job_search|certified|certificate|iti|diploma|license/.test(text)) return 'formal_skill_job_search';
  if (/job_search_only|job|naukri|placement/.test(text) || goalIntent === 'job') return 'job_search_only';
  if (/training|course|vocational/.test(text) || goalIntent === 'training') return 'vocational_training';
  if (goalType === 'informal_skill_validation' || goalIntent === 'proof_to_work') return 'informal_skill_rpl';
  if (context.entrancePrep || /jee|neet|entrance|polytechnic/.test(text)) return 'entrance_exam_prep';
  if (context.academicPrep || /class 12|board|marks|score/.test(text)) return 'board_exam_prep';
  if (context.schoolStudy || goalType === 'school_study_support' || goalIntent === 'study') return 'school_study_support';
  if (/internship|project/.test(text)) return 'college_internship';
  if (/college|btech|b\.tech|engineering|bca|mca|degree/.test(text)) return 'college_career';
  if (/informal|rpl|tailor|stitch|repair|farming|cooking/.test(text)) return 'informal_skill_rpl';
  if (/dropout|school chhod|income urgent/.test(text)) return 'dropout_income';
  return 'unsure_exploration';
}

function routeFilters(route = {}, profile = {}, context = {}) {
  const filters = [];
  const routeText = `${route.name || ''} ${route.tradeoff || ''} ${route.distance || ''}`.toLowerCase();
  if (profile.location || profile.relocation_preference) filters.push(profile.location ? `location: ${profile.location}` : `mobility: ${profile.relocation_preference}`);
  if (profile.time_available) filters.push(`time: ${profile.time_available}`);
  if (profile.preferred_language || profile.language) filters.push(`language: ${profile.preferred_language || profile.language}`);
  if (profile.earning_urgency || profile.income_pressure) filters.push(`urgency: ${profile.earning_urgency || 'income urgent'}`);
  if (context.academicMode) filters.push('mode: study first');
  if (/offline|local|near|commute/.test(routeText) && profile.commute_km) filters.push(`safe commute: ${profile.commute_km} km`);
  return filters.slice(0, 5);
}

function routeBlockers(route = {}, profile = {}, context = {}, missingFacts = []) {
  const blockers = [];
  const routeText = `${route.name || ''} ${route.tradeoff || ''} ${route.distance || ''}`.toLowerCase();
  if (/offline|local|near|commute|center|centre|employer/.test(routeText) && !profile.location && !profile.relocation_preference) {
    blockers.push('Need location before offline route can be trusted.');
  }
  if (missingFacts.includes('skill/proof')) blockers.push('Need at least one skill, proof, resume, project, or work sample.');
  if (missingFacts.includes('daily study time')) blockers.push('Need daily study time to make the plan realistic.');
  if (missingFacts.includes('phone/internet access')) blockers.push('Need phone/internet access to choose the right delivery channel.');
  if (!context.academicMode && !profile.time_available) blockers.push('Daily/weekly time is not known yet.');
  return [...new Set(blockers)].slice(0, 4);
}

function traceExplanation(route = {}, facts = [], blockers = []) {
  const factText = facts.slice(0, 3).map((fact) => `${fact.label}: ${fact.value}`).join('; ');
  const blockerText = blockers.length ? ` Check first: ${blockers[0]}` : '';
  return `${route.name || 'This route'} was ranked using ${factText || 'the current learner profile'}.${blockerText}`;
}

function nextActionForRoute(route = {}, profile = {}, context = {}, blockers = []) {
  if (blockers.length) return blockers[0];
  if (context.academicMode) return 'Build the weekly study journey and start Week 1.';
  if (profile.learner_goal?.intent === 'job') return 'Build proof/resume, then search opportunities and prepare consent-based outreach.';
  if (profile.learner_goal?.intent === 'training') return 'Build the learning journey and confirm commute, fees, and proof tasks.';
  return 'Build the course journey and complete the first proof task.';
}

function isAcademicPrepProfile(profile = {}, question = '') {
  const aspirationText = (profile.aspirations || []).join(' ');
  return Boolean(profile.academic_goal?.type === 'class_12_exam_prep') || isAcademicPrepText(`${aspirationText} ${question}`);
}

function isEntranceExamPrepProfile(profile = {}, question = '') {
  const aspirationText = (profile.aspirations || []).join(' ');
  return Boolean(profile.academic_goal?.type === 'entrance_exam_prep') || isEntranceExamPrepText(`${aspirationText} ${question}`);
}

function isSchoolStudyProfile(profile = {}, question = '') {
  const aspirationText = (profile.aspirations || []).join(' ');
  return Boolean(profile.academic_goal?.type === 'school_study_support') || isSchoolStudyText(`${profile.class_level || ''} ${aspirationText} ${question}`);
}
