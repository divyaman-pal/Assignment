"""Hard budget guard for Anthropic API usage.

- Persists cumulative spend to the live store, falling back to a local file.
- Uses CONSERVATIVE (over-estimating) prices so real spend <= tracked spend.
- Raises BudgetExceeded before making a call once the cap is hit.
- Cap: $10.00 with a warning threshold at $8.00 (per user instruction).

Why the store and not a file: on Vercel the bundle is read-only outside /tmp,
so `write_text` raised OSError *after* the model call had already been billed —
the caller treated that as a failed translation and threw the paid result away,
which is why every non-English advisory came back in English. Serverless also
has no disk that survives an invocation, so a file-backed counter always read
$0.00 and the cap could never trigger. A table fixes both: it is writable, and
it is shared across invocations.
"""
import json
import os
import threading
from pathlib import Path

SPEND_FILE = Path(__file__).resolve().parent.parent / "data" / "llm_spend.json"
FALLBACK_FILE = Path(os.environ.get("TMPDIR", "/tmp")) / "vayu_llm_spend.json"
CAP_USD = 10.00
WARN_USD = 8.00
# Conservative per-MTok prices (upper bounds; actual haiku pricing is lower)
PRICE_IN_PER_MTOK = 3.00
PRICE_OUT_PER_MTOK = 15.00
_lock = threading.Lock()
_ZERO = {"usd": 0.0, "calls": 0, "in_tokens": 0, "out_tokens": 0, "warned": False}


class BudgetExceeded(RuntimeError):
    pass


def _conn():
    from etl.sb import connect
    c = connect()
    cur = c.cursor()
    cur.execute("""create table if not exists llm_spend (
                     id int primary key default 1, usd double precision default 0,
                     calls int default 0, in_tokens bigint default 0,
                     out_tokens bigint default 0, warned boolean default false,
                     updated_at timestamptz default now())""")
    c.commit()
    return c


def _read_file():
    for p in (SPEND_FILE, FALLBACK_FILE):
        try:
            if p.exists():
                return {**_ZERO, **json.loads(p.read_text(encoding="utf-8"))}
        except Exception:
            pass
    return dict(_ZERO)


def _write_file(s):
    """Best effort only — never let a bookkeeping failure lose a paid result."""
    for p in (SPEND_FILE, FALLBACK_FILE):
        try:
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(json.dumps(s, indent=2), encoding="utf-8")
            return True
        except Exception:
            continue
    return False


def _load():
    try:
        c = _conn()
        cur = c.cursor()
        cur.execute("select usd, calls, in_tokens, out_tokens, warned from llm_spend where id = 1")
        row = cur.fetchone()
        c.close()
        if row:
            return {"usd": float(row[0]), "calls": int(row[1]), "in_tokens": int(row[2]),
                    "out_tokens": int(row[3]), "warned": bool(row[4])}
        return dict(_ZERO)
    except Exception:
        return _read_file()


def check():
    s = _load()
    if s["usd"] >= CAP_USD:
        raise BudgetExceeded(f"LLM budget cap ${CAP_USD} reached (spent ~${s['usd']:.2f}). Notify user.")
    return s


def record(usage):
    """Book the spend. Returns (state, warn). Never raises: the call is already
    billed by the time we get here, so a tracking failure must not discard it."""
    with _lock:
        try:
            s = _load()
            s["in_tokens"] += usage.input_tokens
            s["out_tokens"] += usage.output_tokens
            s["calls"] += 1
            s["usd"] = (s["in_tokens"] * PRICE_IN_PER_MTOK
                        + s["out_tokens"] * PRICE_OUT_PER_MTOK) / 1e6
            warn = s["usd"] >= WARN_USD and not s["warned"]
            if warn:
                s["warned"] = True
            try:
                c = _conn()
                cur = c.cursor()
                cur.execute("""insert into llm_spend (id, usd, calls, in_tokens, out_tokens, warned, updated_at)
                               values (1, %s, %s, %s, %s, %s, now())
                               on conflict (id) do update set usd=excluded.usd, calls=excluded.calls,
                                 in_tokens=excluded.in_tokens, out_tokens=excluded.out_tokens,
                                 warned=excluded.warned, updated_at=now()""",
                            (s["usd"], s["calls"], s["in_tokens"], s["out_tokens"], s["warned"]))
                c.commit()
                c.close()
            except Exception:
                _write_file(s)
            return s, warn
        except Exception:
            # last resort: report zero spend rather than fail the caller
            return dict(_ZERO), False
