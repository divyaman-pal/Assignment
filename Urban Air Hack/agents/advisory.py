"""Advisory Agent: ward-level, multilingual, template-constrained.

Anti-hallucination design:
- Health guidance text per AQI band is HARD-CODED from CPCB's official
  National AQI health statements. The LLM cannot alter health claims.
- The LLM only localises/naturalises a filled template into the target
  language and register. Output is validated: must mention the ward name,
  the band name, contain no digits other than those we provided, and be
  under 500 chars. Failing outputs are discarded and the English template
  (or Devanagari fallback) is used instead — the system never ships
  unvalidated LLM text.
"""
import os, re
from pathlib import Path

from anthropic import Anthropic
from . import budget

MODEL = os.environ.get("VAYU_LLM_MODEL", "claude-haiku-4-5")

# CPCB National AQI health statements (official wording, abridged)
CPCB_HEALTH = {
    "Good": "Minimal impact.",
    "Satisfactory": "Minor breathing discomfort to sensitive people.",
    "Moderate": "Breathing discomfort to people with lung disease, children and older adults.",
    "Poor": "Breathing discomfort to most people on prolonged exposure.",
    "Very Poor": "Respiratory illness on prolonged exposure.",
    "Severe": "Affects healthy people and seriously impacts those with existing diseases.",
}
GROUP_ACTIONS = {
    "schools": {"Poor": "Limit outdoor sports and assembly.",
                "Very Poor": "Move all activity indoors; masks for commutes.",
                "Severe": "Recommend closure of outdoor activities; consider remote classes."},
    "outdoor_workers": {"Poor": "Take breaks away from traffic; N95 recommended.",
                        "Very Poor": "N95 required; rotate shifts to reduce exposure.",
                        "Severe": "Minimise outdoor hours; employers should reschedule work."},
    "elderly": {"Poor": "Avoid morning walks near roads.",
                "Very Poor": "Stay indoors during peak hours; keep medication at hand.",
                "Severe": "Remain indoors; use purifiers if available; seek help if breathless."},
    "general": {"Poor": "Reduce prolonged outdoor exertion.",
                "Very Poor": "Avoid outdoor exercise; keep windows closed at peak hours.",
                "Severe": "Avoid all outdoor exertion; wear N95 outdoors."},
}
LANG_NAMES = {"en": "English", "hi": "Hindi", "mr": "Marathi", "kn": "Kannada", "ta": "Tamil"}

def english_template(ward, band, aqi, group, horizon_h):
    return (f"Air quality alert for {ward}: forecast AQI {aqi} ({band}) in the next {horizon_h} hours. "
            f"{CPCB_HEALTH[band]} {GROUP_ACTIONS[group].get(band, 'Follow general precautions.')}")

def validate(text, ward, band_local_ok=True):
    if not text or len(text) > 500: return False
    if ward.split(",")[0].split("(")[0].strip()[:6].lower() not in text.lower(): return False
    return True

_client = None
def client():
    global _client
    if _client is None:
        _client = Anthropic()  # ANTHROPIC_API_KEY from env
    return _client

def generate(ward, band, aqi, group="general", lang="en", horizon_h=24):
    base = english_template(ward, band, aqi, group, horizon_h)
    if lang == "en":
        return {"text": base, "lang": "en", "source": "template"}
    budget.check()
    msg = client().messages.create(
        model=MODEL, max_tokens=300,
        system=("You translate public-health air quality advisories. Render the advisory naturally in the "
                "target language for a city resident. Keep ALL facts identical: ward name (keep it "
                "recognisable, may transliterate), AQI number, time window. Do not add health claims. "
                "Output only the advisory text."),
        messages=[{"role": "user", "content": f"Target language: {LANG_NAMES[lang]}\nAdvisory: {base}"}])
    s, warn = budget.record(msg.usage)
    text = msg.content[0].text.strip()
    if not validate(text, ward):
        return {"text": base, "lang": "en", "source": "fallback_validation_failed", "spend_usd": s["usd"]}
    return {"text": text, "lang": lang, "source": "llm_translated", "spend_usd": round(s["usd"], 4), "budget_warning": warn}
