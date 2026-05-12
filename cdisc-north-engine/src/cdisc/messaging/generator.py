"""
Message generator.

Two modes:
  1) Template-only (fast, deterministic, no API cost) — uses templates.py
  2) LLM-enhanced (personalised) — uses OpenAI to inject lead-specific context

Both modes are constrained by config.messaging rules (max words, must-include phrases).
"""
from __future__ import annotations
import re
from dataclasses import dataclass
from typing import Optional

from .. import config
from . import templates


@dataclass
class GeneratedMessage:
    subject: str
    body: str
    channel: str
    language: str
    method: str  # 'template' | 'llm'


def _enforce_constraints(text: str) -> str:
    """Guarantee max-word cap and required phrases."""
    max_words = int(config.get("messaging.max_words", 120))
    must_include = config.get("messaging.must_include", [])
    # Word cap
    words = text.split()
    if len(words) > max_words:
        text = " ".join(words[:max_words]) + "…"
    # Force missing must-includes by appending a short clause (only if missing)
    blob = text.lower()
    missing = [m for m in must_include if m.lower() not in blob]
    if missing:
        text = text.rstrip() + f"\n\n[{' · '.join(missing)} — single-storey/G+1 only]"
    return text


def _format_vars(lead: dict) -> dict:
    company = config.get("company", {})
    # Best-guess first name
    full = lead.get("name", "")
    name = full.split(",")[0].split("&")[0].strip()
    return {
        "name": name or "there",
        "city": lead.get("district") or lead.get("state") or "your region",
        "segment_label": lead.get("segment", "construction"),
        "video_url": company.get("video_url", ""),
        "sender_name": "Team C-DISC",
        "proof_point": company.get("proof_point", ""),
    }


def render_template(channel: str, language: str, segment: str, lead: dict) -> GeneratedMessage:
    subject, body = templates.get_template(channel, language, segment)
    fvars = _format_vars(lead)
    subject = subject.format(**fvars) if subject else ""
    body = body.format(**fvars)
    body = _enforce_constraints(body)
    return GeneratedMessage(
        subject=subject, body=body,
        channel=channel, language=language, method="template",
    )


# ──────────────────────────────────────────────────────────────────
# LLM personalisation (OpenAI). Falls back to template if no key.
# ──────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a North India construction-industry outreach copywriter for C-DISC Technologies.

C-DISC products you may pitch:
  • PEN Foundation — patented soil-nail tech, NIT Calicut validated, 15 MT load per nail
  • Pre-Engineered Construction — single-storey industrial sheds, warehouses
  • MNZE Homes — modular net-zero-energy G+1 homes

HARD CONSTRAINTS — never break these:
  • PEN Foundation and MNZE Homes are for SINGLE-STOREY and G+1 ONLY. Never pitch to
    apartments, towers, high-rise, housing societies, malls, or G+2 and above.
  • Always mention "NIT Calicut" validation as proof.
  • Keep messages under 120 words.
  • For email: produce a Subject line (under 70 chars) and a Body.
  • For Hindi: use natural Devanagari. For Hinglish WhatsApp: Roman script Hindi.
  • Never invent facts about the prospect. Use only the supplied lead context.
  • Always end with a clear, single ask (a question or a CTA).
"""


def llm_generate(channel: str, language: str, segment: str, lead: dict) -> Optional[GeneratedMessage]:
    """Returns an LLM-personalised message, or None if the LLM is unavailable."""
    api_key = config.env("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        from openai import OpenAI
    except ImportError:
        return None

    client = OpenAI(api_key=api_key)
    model = config.env("OPENAI_MODEL", "gpt-4o-mini")

    # Build a tight context block
    seed_subject, seed_body = templates.get_template(channel, language, segment)
    lead_block = "\n".join([
        f"Lead name: {lead.get('name','')}",
        f"Description: {lead.get('description','')}",
        f"Segment: {lead.get('segment','')}",
        f"District: {lead.get('district','')}",
        f"State: {lead.get('state','')}",
        f"Address: {lead.get('address','')}",
        f"Website: {lead.get('website','')}",
    ])

    user_prompt = (
        f"Channel: {channel}\nLanguage: {language}\nSegment: {segment}\n\n"
        f"LEAD CONTEXT:\n{lead_block}\n\n"
        f"SEED TEMPLATE (use as starting point, personalise based on lead context — "
        f"do NOT invent details that aren't in the lead context):\n"
        f"SUBJECT: {seed_subject}\nBODY:\n{seed_body}\n\n"
        f"Return JSON: {{\"subject\": \"...\", \"body\": \"...\"}}. "
        f"If channel is not email, subject can be empty."
    )

    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_tokens=500,
        )
        import json
        data = json.loads(resp.choices[0].message.content)
        subject = (data.get("subject") or "").strip()
        body = _enforce_constraints((data.get("body") or "").strip())
        if not body:
            return None
        return GeneratedMessage(subject=subject, body=body, channel=channel,
                                language=language, method="llm")
    except Exception as e:
        print(f"  ! LLM generation failed, falling back to template: {e}")
        return None


def generate(channel: str, language: str, segment: str, lead: dict, use_llm: bool = True) -> GeneratedMessage:
    """Top-level message generator. Tries LLM, falls back to template."""
    if use_llm:
        msg = llm_generate(channel, language, segment, lead)
        if msg:
            return msg
    return render_template(channel, language, segment, lead)


def generate_followups(channel: str, language: str, lead: dict) -> tuple[str, str]:
    """Returns (day_5_body, day_14_body) — rendered with lead vars."""
    d5, d14 = templates.get_followups(channel, language)
    fvars = _format_vars(lead)
    return d5.format(**fvars), d14.format(**fvars)
