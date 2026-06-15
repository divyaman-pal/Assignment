import { methodNotAllowed, readJson, sendJson } from './_lib/http.js';
import { patchRows } from './_lib/supabase.js';
import { callFireworksJson } from './_lib/services.js';
import { languageInstruction } from './_lib/language.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  try {
    const body = await readJson(req);
    const profile = body.profile || {};
    const journey = body.journey || {};
    const existingText = String(body.resumeText || '').trim();
    const fallback = buildResume(profile, journey, existingText);
    const generated = await callFireworksJson({
      fallback,
      maxTokens: 900,
      system: `You are VidyaSetu resume builder for Indian rural, college, formal, and informal job seekers. ${languageInstruction(profile, existingText)} Build truthful resumes only from given profile/resume facts. Do not invent degrees, companies, certificates, salaries, or experience. If proof is missing, say proof pending. Keep official degree/course/company names unchanged. Return strict JSON.`,
      prompt: `Profile:\n${JSON.stringify(profile)}\n\nJourney:\n${JSON.stringify(journey)}\n\nExisting resume text:\n${existingText.slice(0, 5000)}\n\nReturn JSON: { "headline": string, "text": string, "sections": { "summary": string, "skills": string[], "projects_or_proof": string[], "education": string, "target_roles": string[], "missing_proof": string[] }, "quality_score": number, "next_steps": string[] }`,
    });

    let persistence = { ok: false, error: null };
    if (profile.learner_id) {
      persistence = await patchRows('learners', { id: profile.learner_id }, {
        profile_json: {
          ...profile,
          resume_text: generated.data?.text || existingText,
          resume_file_name: generated.data?.headline || 'VidyaSetu AI resume draft',
          last_active_tab: 'jobs',
          last_action: 'resume_built',
          updated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      });
    }

    return sendJson(res, 200, {
      resume: generated.data,
      proof: {
        resume_builder: {
          ok: generated.ok,
          provider: generated.provider,
          model: generated.model || null,
          fallback_chain: generated.fallback_chain || [],
          error: generated.error,
        },
        persistence: {
          ok: persistence.ok,
          table: 'learners.profile_json',
          error: persistence.error,
        },
      },
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}

function buildResume(profile = {}, journey = {}, existingText = '') {
  if (existingText.length > 240) {
    return {
      headline: 'Uploaded resume ready for outreach',
      text: existingText,
      sections: {
        summary: existingText.split(/\n+/).find((line) => line.trim().length > 50) || 'Resume text uploaded by learner.',
        skills: profile.skills || profile.aspirations || [],
        projects_or_proof: profile.proof_available || [],
        education: profile.education_status || profile.class_level || 'Education pending',
        target_roles: profile.aspirations || ['entry-level role'],
        missing_proof: [],
      },
      quality_score: 78,
      next_steps: ['Review contact details before outreach', 'Attach one proof/project if available'],
    };
  }

  const name = profile.name || 'Learner';
  const location = profile.relocation_preference || profile.location || 'Location flexible';
  const roles = targetRoles(profile);
  const skills = [...new Set([...(profile.skills || []), ...(profile.aspirations || [])].filter(Boolean))];
  const proof = [
    ...(profile.proof_available || []),
    journey?.route_name ? `${journey.route_name} learning journey` : '',
    journey?.readiness_score ? `${journey.readiness_score}% readiness score` : '',
  ].filter(Boolean);
  const education = profile.education_status || profile.class_level || 'Education details pending';
  const summary = `${name} is seeking ${roles[0]} opportunities. Location preference: ${location}. Available time: ${profile.time_available || 'to be confirmed'}. Languages: ${profile.language || profile.preferred_language || 'to be confirmed'}.`;
  const missingProof = [];
  if (!skills.length) missingProof.push('skills need confirmation');
  if (!proof.length) missingProof.push('project/work proof missing');
  if (!profile.phone_access && !profile.device) missingProof.push('device/contact access missing');

  const text = [
    name,
    `${location} | ${profile.language || profile.preferred_language || 'Language pending'} | ${profile.phone_access || profile.device || 'Phone access pending'}`,
    '',
    'SUMMARY',
    summary,
    '',
    'TARGET ROLES',
    roles.map((role) => `- ${role}`).join('\n'),
    '',
    'SKILLS',
    (skills.length ? skills : ['Skill details pending']).map((skill) => `- ${skill}`).join('\n'),
    '',
    'EDUCATION',
    education,
    '',
    'PROJECTS / PROOF',
    (proof.length ? proof : ['- Proof pending. VidyaSetu will create first proof task before outreach.']).map((item) => item.startsWith('-') ? item : `- ${item}`).join('\n'),
    '',
    'CONSTRAINTS',
    `- Commute: ${profile.commute_km ? `${profile.commute_km} km` : profile.relocation_preference || 'to be confirmed'}`,
    `- Safety/shift: ${profile.commute_constraint || 'to be confirmed'}`,
  ].join('\n');

  return {
    headline: `${roles[0]} resume draft`,
    text,
    sections: {
      summary,
      skills,
      projects_or_proof: proof,
      education,
      target_roles: roles,
      missing_proof: missingProof,
    },
    quality_score: Math.max(45, 80 - missingProof.length * 12),
    next_steps: [
      missingProof.length ? 'Complete missing proof before high-stakes outreach' : 'Ready for targeted outreach draft',
      'Add phone/email only after consent',
      'Review role title and location before sending',
    ],
  };
}

function targetRoles(profile = {}) {
  const text = `${(profile.aspirations || []).join(' ')} ${(profile.skills || []).join(' ')} ${profile.education_status || ''}`.toLowerCase();
  if (/data science|data analyst|analytics|python|sql|machine learning/.test(text)) return ['Data Analyst Intern', 'Data Science Intern', 'Junior Data Analyst'];
  if (/software|web|react|javascript|btech|engineering/.test(text)) return ['Software Engineering Intern', 'Frontend Intern', 'Junior Developer'];
  if (/tally|gst|accounting|finance|bcom/.test(text)) return ['Accounts Assistant', 'GST Billing Assistant'];
  if (/driver|driving|license/.test(text)) return ['Driver', 'Fleet Driver'];
  if (/mobile|repair/.test(text)) return ['Mobile Repair Trainee', 'Repair Counter Assistant'];
  if (/tailor|silai|stitch/.test(text)) return ['Tailoring Trainee', 'Stitching Assistant'];
  if (/nursing|health/.test(text)) return ['Healthcare Assistant Trainee', 'Nursing Training Candidate'];
  return profile.aspirations?.length ? profile.aspirations : ['Entry-level Assistant'];
}
