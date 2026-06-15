import { addDays, methodNotAllowed, readJson, sendJson, stableId } from './_lib/http.js';
import { insertRows, patchRows } from './_lib/supabase.js';
import { classifyReply, consentLimitedOutreach } from './_lib/mvp.js';

async function sendViaAgentMail({ to, subject, body }) {
  const key = process.env.AGENTMAIL_API_KEY;
  if (!key || key === 'placeholder') {
    return {
      ok: false,
      provider: 'agentmail_placeholder',
      messageId: stableId('draft'),
      error: 'AGENTMAIL_API_KEY not configured yet; outreach is drafted and queued.',
    };
  }

  try {
    const response = await fetch('https://api.agentmail.to/v0/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, text: body }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        provider: 'agentmail',
        messageId: stableId('draft'),
        error: payload?.error || payload?.message || response.statusText,
      };
    }

    return {
      ok: true,
      provider: 'agentmail',
      messageId: payload.id || payload.message_id || stableId('agentmail'),
      error: null,
    };
  } catch (error) {
    return { ok: false, provider: 'agentmail', messageId: stableId('draft'), error: error.message };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const body = await readJson(req);
    const match = body.match;
    const passport = body.passport;
    const manualEmail = String(body.manualEmail || '').trim();

    if (!match || !passport) {
      return sendJson(res, 400, { error: 'match and passport are required' });
    }

    const to = manualEmail || match.contact_email || '';
    const draft = consentLimitedOutreach({ passport, match, journey: body.journey, resumeText: body.resumeText, profile: body.profile });
    const [subjectLine, ...bodyLines] = draft.split('\n');
    const subject = subjectLine.replace(/^Subject:\s*/i, '').trim();
    const messageBody = bodyLines.join('\n').trim();
    const sent = to
      ? await sendViaAgentMail({ to, subject, body: messageBody })
      : {
          ok: false,
          provider: 'contact_required',
          messageId: stableId('contact'),
          error: 'No verified public email found. Open the source/contact page or add a verified email before sending.',
        };
    const learnerName = passport.name && passport.name !== 'Learner' ? passport.name : 'the learner';
    const replyText =
      body.replyText || (sent.ok ? `Interested. Please connect ${learnerName} with the community worker on Tuesday afternoon for a short screening call.` : '');
    const reply_class = sent.ok ? classifyReply(replyText) : classifyReply('');
    const followup_at = reply_class.suggested_followup_date || addDays(5);
    const mailto_url = to ? `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageBody)}` : '';
    const matchId = validUuid(body.match_id || match.match_id || match.id) ? (body.match_id || match.match_id || match.id) : null;
    const pipeline = buildOutreachPipeline({ match, sent, to, manualEmail, draft, reply_class });
    const consentChecklist = consentChecklistFor({ passport, match, profile: body.profile, resumeText: body.resumeText });
    const outreach = {
      match_id: matchId,
      channel: sent.provider,
      sent_at: sent.ok ? new Date().toISOString() : null,
      reply_text: replyText,
      reply_class,
      followup_at,
      payload_json: {
        to,
        subject,
        draft,
        consent_used: passport.consent,
        journey_readiness: body.journey?.readiness_score || null,
        message_id: sent.messageId,
        contact_page: match.contact_page || match.source_url || null,
        contact_status: match.contact_status || (to ? 'verified_public_email' : 'source_contact_needed'),
        manual_email_used: Boolean(manualEmail),
        pipeline,
        consent_checklist: consentChecklist,
      },
    };
    const persistence = await insertRows('outreach', outreach);
    const pipelineStatus = sent.ok
      ? 'sent'
      : to
        ? 'drafted_manual_send'
        : 'source_review';
    const matchPersistence = matchId
      ? await patchRows('matches', { id: matchId }, { status: pipelineStatus, updated_at: new Date().toISOString() })
      : { ok: false, error: 'No persisted match id available' };

    return sendJson(res, 200, {
      draft,
      sent,
      mailto_url,
      pipeline,
      consent_checklist: consentChecklist,
      next_actions: nextActionsForOutreach({ sent, to, match, manualEmail }),
      contact: {
        to,
        name: match.contact_name || null,
        title: match.contact_title || null,
        page: match.contact_page || match.source_url || null,
        status: match.contact_status || (to ? 'verified_public_email' : 'source_contact_needed'),
      },
      reply_text: replyText,
      reply_class,
      followup_at,
      placement_fee_state: reply_class.status === 'interview' ? 'retention_check_scheduled' : 'not_ready',
      proof: {
        persistence: {
          ok: persistence.ok,
          table: 'outreach',
          error: persistence.error,
        },
        match_state: {
          ok: matchPersistence.ok,
          table: 'matches',
          error: matchPersistence.error,
          status: pipelineStatus,
        },
      },
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}

function validUuid(value = '') {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
}

function buildOutreachPipeline({ match = {}, sent = {}, to = '', manualEmail = '', draft = '', reply_class = {} }) {
  const hasSource = Boolean(match.contact_page || match.source_url);
  const hasEmail = Boolean(to);
  const stages = [
    { key: 'matched', label: 'Lead selected', state: 'done' },
    { key: 'source', label: 'Source available', state: hasSource ? 'done' : 'blocked' },
    { key: 'contact', label: hasEmail ? 'Contact verified' : hasSource ? 'Contact review' : 'Contact missing', state: hasEmail ? 'done' : hasSource ? 'review' : 'blocked' },
    { key: 'draft', label: 'Consent draft', state: draft ? 'done' : 'blocked' },
    {
      key: 'send',
      label: sent.ok ? 'Sent by agent' : hasEmail ? 'Manual send ready' : 'Send blocked',
      state: sent.ok ? 'done' : hasEmail ? 'ready' : 'blocked',
    },
    { key: 'followup', label: 'Follow-up', state: sent.ok ? 'ready' : 'waiting' },
  ];
  return {
    stages,
    status: sent.ok ? 'sent' : hasEmail ? 'manual_send_ready' : 'contact_verification_required',
    send_mode: sent.ok ? sent.provider : hasEmail ? 'mailto_or_agentmail_after_key' : 'source_review_first',
    manual_email_used: Boolean(manualEmail),
    reply_status: reply_class.status || 'none',
  };
}

function consentChecklistFor({ passport = {}, match = {}, profile = {}, resumeText = '' }) {
  const consent = passport.consent || {};
  return [
    {
      label: 'Learner consent before sharing identity',
      done: Boolean(passport.qr_token || profile.learner_id),
    },
    {
      label: 'Only consented proof fields included',
      done: Boolean(consent.share_certs || consent.share_informal || consent.share_scores),
    },
    {
      label: 'Resume checked or marked as pending',
      done: String(resumeText || '').trim().length > 240 || /resume/i.test(`${(profile.proof_available || []).join(' ')}`),
    },
    {
      label: 'Public contact source exists',
      done: Boolean(match.contact_email || match.contact_page || match.source_url),
    },
    {
      label: 'No phone/location shared unless needed',
      done: true,
    },
  ];
}

function nextActionsForOutreach({ sent = {}, to = '', match = {}, manualEmail = '' }) {
  if (sent.ok) {
    return [
      'Wait for reply and classify response.',
      'Community worker confirms safe commute before interview.',
      'If no reply arrives, send one follow-up after the scheduled date.',
    ];
  }
  if (to) {
    return [
      manualEmail ? 'Manual email was used; verify it came from a public source before sending.' : 'Use the prepared mailto draft or add AgentMail key for automatic send.',
      'Do not attach resume until the learner confirms consent.',
      'Mark reply outcome in Follow-ups after employer response.',
    ];
  }
  return [
    'Open the source/contact page and verify a public email.',
    'Add a verified manual email, then prepare the draft again.',
    'If no contact exists, move to the next shortlisted lead.',
  ];
}
