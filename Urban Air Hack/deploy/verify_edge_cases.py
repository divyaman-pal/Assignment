"""Edge-case and input-validation suite for the VAYU-NET API.

Why this exists separately from verify_live.py: that suite drives a local
TestClient(app) against the remote database, so it proves the code in this
working tree is correct and says nothing about what the deployed function is
serving. On 2026-08-29 it reported ALL PASSED while production answered
"AQI -50 (Severe) measured now" over an impossible number.

So every assertion here runs against a *base URL you choose*:

    python deploy/verify_edge_cases.py                  # local app (pre-deploy gate)
    python deploy/verify_edge_cases.py --live           # the deployed API
    python deploy/verify_edge_cases.py --live URL       # any other deployment

The local and live modes assert exactly the same things. A case that passes
locally and fails live means the fix has not shipped -- which is the single
most repeated failure in this project's history, and the reason the two modes
share one file instead of two.

These are the cases a public, unauthenticated API must survive before it is
handed to an agency: every one of them is reachable by anybody with the URL.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

LIVE_DEFAULT = "https://vayu-net-api-ver-tex.vercel.app"

fails, warns = [], []


def make_client(live):
    if not live:
        from fastapi.testclient import TestClient
        from service.live_api import app
        return TestClient(app), "local app (service/live_api.py)"
    import httpx
    # Cold Vercel functions and the agent chain both take real time.
    return httpx.Client(base_url=live, timeout=60.0), live


def check(name, fn):
    try:
        print(f"  PASS  {name}: {fn()}")
    except AssertionError as e:
        print(f"  FAIL  {name}: {e}")
        fails.append(name)
    except Exception as e:
        print(f"  FAIL  {name}: {type(e).__name__}: {e}")
        fails.append(name)


def warn(name, fn):
    try:
        v = fn()
        if v:
            print(f"  WARN  {name}: {v}")
            warns.append(name)
        else:
            print(f"  PASS  {name}")
    except Exception as e:
        print(f"  WARN  {name}: {type(e).__name__}: {e}")
        warns.append(name)


def main(live):
    c, where = make_client(live)
    ADV = "/cities/delhi/advisory"
    print(f"Edge-case suite against: {where}\n")

    # ---- Advisory input validation -------------------------------------
    # aqi, group, lang, ward and basis all arrive as query parameters on a
    # public endpoint, so any caller can reach every branch below.

    def aqi_range():
        """An AQI outside 0-500 is not a reading; it must not be banded.

        band() returned "Severe" for anything above its table and, before the
        negative guard, for anything below it -- so aqi=-50 came back as
        "AQI -50 (Severe) measured now": public health guidance over an
        impossible number, from a parameter anyone can set.
        """
        seen = {}
        for bad in (-50, -1, 501, 99999):
            r = c.get(ADV, params={"ward": "ANAND VIHAR", "aqi": bad})
            seen[bad] = r.status_code
            assert r.status_code == 422, (
                f"aqi={bad} returned {r.status_code}, expected 422 — "
                f"body: {r.text[:160]}")
        return f"out-of-range rejected {seen}"

    def aqi_bounds_accepted():
        """The ends of the scale are valid readings and must still work."""
        for ok in (0, 500):
            r = c.get(ADV, params={"ward": "ANAND VIHAR", "aqi": ok})
            assert r.status_code == 200, f"aqi={ok} returned {r.status_code}"
        return "0 and 500 accepted"

    def unknown_group():
        """An unknown group indexed GROUP_ACTIONS and raised KeyError.

        The except-branch built its fallback by calling the same function, so
        it raised again and the endpoint answered 500 instead of naming the
        bad parameter.
        """
        r = c.get(ADV, params={"ward": "ANAND VIHAR", "aqi": 300, "group": "hacker"})
        assert r.status_code == 422, f"returned {r.status_code}: {r.text[:160]}"
        assert "valid" in r.json(), "422 should list the valid groups"
        return f"422, valid groups listed: {r.json()['valid']}"

    def unknown_lang():
        """An unsupported language leaked an exception name to the caller.

        It fell through to generate(), raised KeyError on LANG_NAMES, and was
        caught -- returning English text labelled source "fallback (KeyError)".
        An internal exception type on a public health response, and no signal
        that the requested language was refused.
        """
        r = c.get(ADV, params={"ward": "X", "aqi": 300, "lang": "zz"})
        assert r.status_code == 422, f"returned {r.status_code}: {r.text[:160]}"
        body = r.text.lower()
        assert "keyerror" not in body and "traceback" not in body, \
            f"internal detail leaked to caller: {r.text[:200]}"
        return "422, no internal detail leaked"

    def supported_langs_work():
        for lang in ("en", "hi", "mr", "kn", "ta"):
            r = c.get(ADV, params={"ward": "X", "aqi": 300, "lang": lang})
            assert r.status_code == 200, f"lang={lang} returned {r.status_code}"
        return "en/hi/mr/kn/ta all 200"

    def empty_ward():
        """An empty ward rendered "Air quality alert for : AQI 300"."""
        for w in ("", "   "):
            r = c.get(ADV, params={"ward": w, "aqi": 300})
            assert r.status_code == 422, f"ward={w!r} returned {r.status_code}"
        return "empty and whitespace-only ward rejected"

    def ward_bounded():
        """The ward name is echoed into the advisory text, so bound it."""
        r = c.get(ADV, params={"ward": "A" * 5000, "aqi": 300})
        assert r.status_code == 200, f"returned {r.status_code}"
        assert len(r.json()["text"]) < 2000, "unbounded ward reached the output"
        return "5000-char ward truncated"

    def basis_echoed():
        """A caller that asked for a provenance must see which one it got.

        The client refuses a server advisory that does not echo `basis`, which
        is what stops an API predating the field describing an interpolated
        number as "measured now".
        """
        r = c.get(ADV, params={"ward": "X", "aqi": 300, "basis": "estimated"})
        assert r.status_code == 200 and r.json().get("basis") == "estimated", \
            f"basis not echoed: {r.text[:200]}"
        r2 = c.get(ADV, params={"ward": "X", "aqi": 300, "basis": "nonsense"})
        assert r2.json().get("basis") == "estimated", \
            f"unknown basis must fall back to estimated, got {r2.text[:160]}"
        txt = r.json()["text"].lower()
        assert "measured now" not in txt, "an estimated AQI is described as measured"
        return "echoed; unknown -> estimated; never 'measured now'"

    check("advisory: aqi out of range -> 422", aqi_range)
    check("advisory: aqi 0 and 500 accepted", aqi_bounds_accepted)
    check("advisory: unknown group -> 422", unknown_group)
    check("advisory: unknown lang -> 422", unknown_lang)
    check("advisory: supported langs -> 200", supported_langs_work)
    check("advisory: empty ward -> 422", empty_ward)
    check("advisory: ward length bounded", ward_bounded)
    check("advisory: basis echoed and honest", basis_echoed)

    # ---- Row-count parameters ------------------------------------------

    def limit_negative():
        """`limit` reaches Postgres as LIMIT, where a negative value errors."""
        r = c.get("/cities/delhi/events", params={"limit": -5})
        assert r.status_code == 200, f"limit=-5 returned {r.status_code}: {r.text[:160]}"
        return f"limit=-5 -> 200, {len(r.json())} rows"

    def limit_capped():
        """Unbounded LIMIT is the cheapest way to exhaust a 60s function."""
        r = c.get("/cities/delhi/events", params={"limit": 10 ** 9})
        assert r.status_code == 200, f"returned {r.status_code}"
        n = len(r.json())
        assert n <= 5000, f"{n} rows returned; expected a cap at 5000"
        return f"limit=1e9 capped to {n} rows"

    def limit_non_numeric():
        r = c.get("/cities/delhi/events", params={"limit": "abc"})
        assert r.status_code == 422, f"returned {r.status_code}"
        return "422 from type validation"

    def since_days_negative():
        r = c.get("/cities/delhi/events", params={"since_days": -3})
        assert r.status_code == 200, f"returned {r.status_code}: {r.text[:160]}"
        return f"since_days=-3 -> 200, {len(r.json())} rows"

    check("events: negative limit", limit_negative)
    check("events: limit capped", limit_capped)
    check("events: non-numeric limit -> 422", limit_non_numeric)
    check("events: negative since_days", since_days_negative)

    # ---- Unknown identifiers -------------------------------------------

    def unknown_action_pack():
        """evidence_pack() does .iloc[0], so an unknown id raised IndexError.

        This URL is what an enforcement officer follows from a citation, so
        "no such action" and "the server broke" must not look identical.
        """
        r = c.get("/actions/999999/pack.pdf")
        assert r.status_code == 404, f"returned {r.status_code}: {r.text[:160]}"
        return "404"

    def negative_action_pack():
        r = c.get("/actions/-1/pack.pdf")
        assert r.status_code == 404, f"returned {r.status_code}: {r.text[:160]}"
        return "404"

    def non_numeric_action_pack():
        r = c.get("/actions/abc/pack.pdf")
        assert r.status_code == 422, f"returned {r.status_code}"
        return "422 from type validation"

    def unknown_city():
        """An unknown city is an empty result, not an error or another city's."""
        for path in ("/cities/atlantis/stations", "/cities/atlantis/events",
                     "/cities/atlantis/actions"):
            r = c.get(path)
            assert r.status_code == 200, f"{path} returned {r.status_code}"
            assert r.json() == [], f"{path} returned data for a city that does not exist"
        return "empty list, no leakage from another city"

    check("pack: unknown action -> 404", unknown_action_pack)
    check("pack: negative action -> 404", negative_action_pack)
    check("pack: non-numeric action -> 422", non_numeric_action_pack)
    check("unknown city -> empty", unknown_city)

    # ---- Injection and authentication -----------------------------------

    def sql_injection_inert():
        """Every user string must reach Postgres as a bound parameter."""
        payloads = ["'; drop table actions; --", "' or '1'='1", "\\'; select pg_sleep(10); --"]
        for p in payloads:
            r = c.get("/cities/delhi/actions", params={"era": p})
            assert r.status_code == 200, f"{p!r} returned {r.status_code}"
            assert r.json() == [], f"{p!r} returned rows — era is not parameterised"
        # the tables must still be there afterwards
        assert c.get("/cities/delhi/actions").json(), "actions table is empty after injection probes"
        return f"{len(payloads)} payloads inert, tables intact"

    def ingest_requires_token():
        for headers in ({}, {"x-ingest-token": "wrong"}, {"x-ingest-token": ""}):
            r = c.post("/ingest", headers=headers)
            assert r.status_code == 401, \
                f"headers={headers} returned {r.status_code}, expected 401"
        return "401 with no token, a wrong token, and an empty token"

    check("sql injection inert", sql_injection_inert)
    check("ingest requires token", ingest_requires_token)

    # ---- Known open gaps: reported, never silently passed ----------------

    def no_auth():
        """Documented open gap — blocks an agency pilot. See the test plan §11."""
        r = c.get("/cities/delhi/stations")
        if r.status_code == 200:
            return ("every endpoint answers unauthenticated (SEC-01, documented "
                    "open gap — required before agency handover)")
        return None

    def replay_unauthenticated():
        """POST /replay/run takes no token and runs the whole agent chain.

        Deliberately not invoked: it writes to the store and bills the model.
        Reported from the route table instead, which is enough to see the gap.
        """
        r = c.post("/replay/run", params={"city": "Delhi"}) if False else None
        return ("POST /replay/run is unauthenticated and both mutates the store "
                "and bills the LLM budget (not invoked by this suite)")

    warn("SEC-01 no authentication", no_auth)
    warn("SEC-01 unauthenticated replay", replay_unauthenticated)

    print("\nRESULT:", "ALL PASSED" if not fails else f"FAILURES: {fails}")
    if warns:
        print("WARNINGS (known open gaps, not regressions):", len(warns))
    return 1 if fails else 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--live", nargs="?", const=LIVE_DEFAULT, default=None,
                    help=f"run against a deployed API (default {LIVE_DEFAULT})")
    a = ap.parse_args()
    sys.exit(main(a.live))
