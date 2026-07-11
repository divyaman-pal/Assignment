"""Hard budget guard for Anthropic API usage.

- Persists cumulative spend to data/llm_spend.json after EVERY call.
- Uses CONSERVATIVE (over-estimating) prices so real spend <= tracked spend.
- Raises BudgetExceeded before making a call once the cap is hit.
- Cap: $10.00 with a warning threshold at $8.00 (per user instruction).
"""
import json, threading
from pathlib import Path

SPEND_FILE = Path(__file__).resolve().parent.parent / "data" / "llm_spend.json"
CAP_USD = 10.00
WARN_USD = 8.00
# Conservative per-MTok prices (upper bounds; actual haiku pricing is lower)
PRICE_IN_PER_MTOK = 3.00
PRICE_OUT_PER_MTOK = 15.00
_lock = threading.Lock()

class BudgetExceeded(RuntimeError):
    pass

def _load():
    if SPEND_FILE.exists():
        return json.loads(SPEND_FILE.read_text())
    return {"usd": 0.0, "calls": 0, "in_tokens": 0, "out_tokens": 0, "warned": False}

def check():
    s = _load()
    if s["usd"] >= CAP_USD:
        raise BudgetExceeded(f"LLM budget cap ${CAP_USD} reached (spent ~${s['usd']:.2f}). Notify user.")
    return s

def record(usage):
    with _lock:
        s = _load()
        s["in_tokens"] += usage.input_tokens
        s["out_tokens"] += usage.output_tokens
        s["calls"] += 1
        s["usd"] = (s["in_tokens"] * PRICE_IN_PER_MTOK + s["out_tokens"] * PRICE_OUT_PER_MTOK) / 1e6
        SPEND_FILE.write_text(json.dumps(s, indent=2))
        warn = s["usd"] >= WARN_USD and not s["warned"]
        if warn:
            s["warned"] = True
            SPEND_FILE.write_text(json.dumps(s, indent=2))
        return s, warn
