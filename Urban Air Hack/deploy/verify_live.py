"""CI verification: exercise the live Supabase-backed API end to end.

Runs in GitHub Actions (which can reach Supabase) and prints a verdict for
every endpoint, so the deployment can be validated without a browser.

Checks are assertions, not just smoke tests. Each of the guarded conditions
below corresponds to a failure that shipped silently to production once:
a live view with no possible enforcement action, a freshness banner fed by a
build artefact, duplicate station rows, and no-data sensors rendered "Severe".
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from service.live_api import app

c = TestClient(app)
fails = []
warns = []


def check(name, fn):
    try:
        v = fn()
        print(f"  PASS  {name}: {v}")
    except AssertionError as e:
        print(f"  FAIL  {name}: {e}")
        fails.append(name)
    except Exception as e:
        print(f"  FAIL  {name}: {type(e).__name__}: {e}")
        fails.append(name)


def warn(name, fn):
    """Conditions worth surfacing that should not fail the build."""
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


print("Verifying live API against Supabase")
check("health", lambda: c.get("/health").json())
check("cities", lambda: c.get("/cities").json())


def stations_ok():
    st = c.get("/cities/delhi/stations").json()
    assert st, "no stations returned"
    # a null AQI must never be given a band — that painted no-data sensors red
    bad = [s for s in st if s["aqi"] is None and s["band"] is not None]
    assert not bad, f"{len(bad)} stations have a band with no AQI (e.g. {bad[0]['station_id']})"
    # the same physical sensor must not appear twice under two id schemes
    names = {}
    for s in st:
        names.setdefault(str(s["station_name"]).strip().lower(), []).append(s["station_id"])
    dupes = {n: ids for n, ids in names.items() if len(ids) > 1}
    assert not dupes, f"{len(dupes)} sensors duplicated across id schemes, e.g. {list(dupes.items())[0]}"
    unmapped = [s for s in st if not s["ward_id"]]
    return f"{len(st)} sensors, {len(st) - len(unmapped)} ward-mapped, 0 duplicates"


check("stations(delhi)", stations_ok)
check("events(delhi)", lambda: f"{len(c.get('/cities/delhi/events').json())} events")


def actions_ok():
    counts = {}
    for slug in ("delhi", "mumbai", "bengaluru"):
        live = c.get(f"/cities/{slug}/actions?era=live").json()
        ep = c.get(f"/cities/{slug}/actions?era=episode").json()
        assert isinstance(live, list) and isinstance(ep, list), "actions endpoint did not return lists"
        # the live pool must be answerable independently of the episode pool
        assert all(a.get("era") == "live" for a in live), f"{slug}: era=live returned non-live rows"
        # A zero priority means severity clipped to zero — the ward's air did not
        # warrant enforcement at all. Publishing it as a ranked action with a
        # statutory citation is a claim we cannot stand behind, and a whole city
        # of them tied at 0.00 sorts arbitrarily.
        zeros = [a for a in live + ep if not a.get("priority")]
        assert not zeros, (f"{slug}: {len(zeros)} action(s) at priority 0, "
                           f"e.g. {zeros[0]['ward_name']} at {zeros[0]['mean_pm25']} ug/m3")
        counts[slug] = f"{len(live)}L/{len(ep)}E"
    return counts


check("actions: live/episode split, no zero-priority", actions_ok)


def live_ok():
    lv = c.get("/live").json()
    assert "age_hours" in lv, "/live does not report data age"
    assert lv.get("as_of"), "/live has no as_of"
    # hotspots are shown to a commissioner by name; an internal id is not a place
    ids = [x for x in lv.get("stations", []) if str(x["station"]).startswith("site_")]
    assert not ids, f"{len(ids)} hotspots labelled by internal id, e.g. {ids[0]['station']}"
    return (f"as_of={lv['as_of']} age={lv['age_hours']}h "
            f"fresh_stations={lv.get('fresh_stations')}")


check("live freshness", live_ok)
check("compare", lambda: {r["city"]: r["events"] for r in c.get("/compare").json()})


def metrics_ok():
    m = c.get("/metrics").json()
    assert "inventory_validation" in m, "inventory_validation missing (bundle excludes it?)"
    assert m["inventory_validation"].get("rows"), "inventory_validation has no rows"
    return {"live_store": m.get("live_store"), "fires": m.get("fires", {}).get("status")}


check("metrics", metrics_ok)
check("replay", lambda: {k: v for k, v in c.post("/replay/run?city=Delhi").json().items()
                         if k in ("elapsed_s", "events", "attributions", "actions", "newest_reading")})


def pack_ok():
    ids = [a["action_id"] for a in c.get("/cities/delhi/actions").json()]
    assert ids, "no actions to render a pack for"
    r = c.get(f"/actions/{ids[0]}/pack.pdf")
    assert r.status_code == 200, f"status {r.status_code}"
    return f"action {ids[0]} -> {len(r.content)} bytes"


check("evidence pack", pack_ok)


def advisory_ok():
    """Exercises the translation path without paying for a model call.

    Both failures this guards against were in our own code, not the model:
    the spend tracker wrote to a read-only bundle and raised *after* the call
    was billed, and the validator rejected Devanagari numerals. Both are
    checkable offline, so the hourly run costs nothing. A real round trip runs
    only on demand (VAYU_VERIFY_LLM=1) — asserting it every hour would burn the
    $10 cap on CI and then break advisories for actual users.
    """
    import os
    from agents import advisory, budget

    en = c.get("/cities/delhi/advisory?ward=Rohini&aqi=340&group=elderly").json()
    assert en["source"] == "template", f"english advisory source={en['source']}"

    # spend bookkeeping must persist and must never raise
    class _U:
        input_tokens = out = 0
        output_tokens = 0
    before = budget._load()["calls"]
    state, _warn = budget.record(_U())
    assert state["calls"] == before + 1, "spend tracker did not persist a call"

    # a correct Hindi/Marathi translation must survive validation
    sample = "रोहिणी के लिए वायु गुणवत्ता सतर्कता: AQI ३४० (बहुत खराब)।"
    assert advisory.validate(sample, "Rohini", 340, "hi"), \
        "validator rejects a correct Devanagari translation"
    assert not advisory.validate("रोहिणी: AQI ९९९।", "Rohini", 340, "hi"), \
        "validator accepts a translation with the wrong AQI"

    if os.environ.get("VAYU_VERIFY_LLM") == "1":
        hi = c.get("/cities/delhi/advisory?ward=Rohini&aqi=340&group=elderly&lang=hi").json()
        assert hi["source"] == "llm_translated", f"hindi fell back: source={hi['source']}"
        assert hi["lang"] == "hi", "hindi advisory came back tagged as another language"
        return f"en=template hi={hi['source']} (live round trip)"
    return f"en=template, spend tracker + validator OK (spent ${state['usd']:.4f} to date)"


check("advisory", advisory_ok)


def advisory_basis_ok():
    """An interpolated number must never be described as a measurement.

    Most wards hold no sensor (Delhi: 289 wards, 38 with one), so their AQI is
    estimated from neighbours. The citizen view used to substitute the city
    mean and render it exactly like a reading, which put "AQI 130 Moderate"
    under wards next to a sensor measuring 448 Severe. The number is now
    interpolated and carries its provenance; these assertions keep the wording
    honest at the API boundary, where the IVR and public-display channels read
    it and no human is looking at the screen.
    """
    from agents import advisory

    est = c.get("/cities/delhi/advisory?ward=Rohini&aqi=130&basis=estimated").json()
    assert est["basis"] == "estimated", f"basis not echoed: {est.get('basis')}"
    assert "measured" not in est["text"].lower(), \
        f"an estimate is described as measured: {est['text']}"
    assert "estimated" in est["text"].lower(), \
        f"an estimate does not say so: {est['text']}"

    cur = c.get("/cities/delhi/advisory?ward=Rohini&aqi=130&basis=current").json()
    assert "measured now" in cur["text"], f"measured reading lost its wording: {cur['text']}"

    # An unrecognised basis must degrade to the weaker claim, never to
    # "measured now" — overstating certainty is the direction that harms.
    junk = c.get("/cities/delhi/advisory?ward=Rohini&aqi=130&basis=nonsense").json()
    assert junk["basis"] == "estimated", f"unknown basis became {junk['basis']}"
    assert "measured" not in junk["text"].lower(), \
        f"unknown basis produced a measurement claim: {junk['text']}"

    # The AQI number must survive every basis: the validator drops a
    # translation that loses it, and losing it silently serves English.
    for b in advisory.BASES:
        t = advisory.english_template("Rohini", "Moderate", 130, "general", 24, b)
        assert "130" in t, f"basis={b} dropped the AQI number"
    return f"bases {list(advisory.BASES)} distinct, unknown -> estimated"


check("advisory basis", advisory_basis_ok)


def ward_estimator_ok():
    """Run the JS estimator's own assertions (deploy/verify_ward_estimate.mjs).

    Invoked from here rather than as a separate CI step on purpose: GITHUB_PAT
    is fine-grained without `workflow` scope, so .github/workflows/* cannot be
    edited from a session, and a check that needs a workflow edit to run is a
    check that never runs. Node is preinstalled on the GitHub runners.
    """
    import shutil, subprocess
    node = shutil.which("node")
    if not node:
        return "SKIPPED (no node on PATH)"
    root = Path(__file__).resolve().parent.parent
    p = subprocess.run([node, str(root / "deploy" / "verify_ward_estimate.mjs")],
                       capture_output=True, text=True, timeout=180, cwd=str(root))
    tail = (p.stdout or p.stderr).strip().splitlines()
    assert p.returncode == 0, "ward estimator assertions failed:\n" + "\n".join(tail[-8:])
    passed = sum(1 for ln in tail if ln.strip().startswith("PASS"))
    return f"{passed} estimator assertions passed"


check("ward estimator", ward_estimator_ok)

def ingest_armed():
    """The scheduled ingest path must be armed, and armed by the source
    production actually uses.

    This is the check that would have caught the outage it was written for:
    the token was set in a Vercel dashboard and /ingest still 503'd for days,
    because a variable saved against the wrong project reads identically to no
    variable at all. Asserting only that *some* token resolves would have
    passed locally the whole time, so the ops_config path is exercised with the
    env var explicitly removed -- that is the code path the deployment runs.
    """
    import os as _os
    from service import live_api
    from etl import ops

    h = c.get("/health").json()
    assert h.get("ingest_configured"), f"ingest not armed: source={h.get('ingest_token_source')}"

    saved = _os.environ.pop("INGEST_TOKEN", None)
    ops._CACHE.pop('ingest_token', None)
    try:
        tok, src = live_api.expected_ingest_token()
        assert src == "ops_config", f"no ops_config fallback: source={src}"
        assert tok, "ops_config.ingest_token resolved empty"
        # the cron sends the ops_config value, so the two must be the same row
        with live_api._conn().cursor() as cur:
            cur.execute("select value from ops_config where key = 'ingest_token'")
            assert cur.fetchone()[0].strip() == tok, "resolved token is not the ops_config row"
    finally:
        if saved is not None:
            _os.environ["INGEST_TOKEN"] = saved
        ops._CACHE.pop('ingest_token', None)

    # a wrong token must be rejected, and never with the 503 that means "off"
    r = c.post("/ingest", headers={"Authorization": "Bearer not-the-token"})
    assert r.status_code == 401, f"bad token got {r.status_code}, expected 401"
    return f"armed via {h.get('ingest_token_source')}, ops_config fallback OK, bad token -> 401"


check("ingest armed", ingest_armed)


def ops_config_locked():
    """ops_config holds secrets, so the public roles must not reach it.

    Supabase serves every public-schema table over PostgREST, and the anon key
    is a published credential by design -- it ships in frontends. A table with
    RLS off and a grant to anon is therefore world-readable, which for this
    table means the ingest token and the CPCB feed key. RLS was in fact off
    here, so this is a regression guard, not a hypothetical.
    """
    from service import live_api

    with live_api._conn().cursor() as c:
        c.execute("""select relrowsecurity from pg_class
                     where oid = 'public.ops_config'::regclass""")
        row = c.fetchone()
        assert row, "ops_config table is missing"
        assert row[0], "RLS is disabled on ops_config (it holds secrets)"

        c.execute("""select grantee, privilege_type
                     from information_schema.role_table_grants
                     where table_schema = 'public' and table_name = 'ops_config'
                       and grantee in ('anon', 'authenticated')""")
        leaked = c.fetchall()
        assert not leaked, f"public roles hold grants on ops_config: {leaked}"
    return "RLS on, no anon/authenticated grants"


check("ops_config locked", ops_config_locked)

def fire_layer_stale():
    """The fire sync fails silently by design, so staleness is the only signal.

    push_to_store() in etl/fetch_fires_live.py catches every exception so a
    satellite outage cannot fail the pipeline. The cost is that a missing DSN
    on the CI step looks exactly like success -- the CSV is still written and
    the step still exits 0. Age of the newest detection is the only thing that
    distinguishes "FIRMS is quiet" from "nothing has reached the store in days".

    A warning, not a failure: FIRMS genuinely lags, and failing the run on an
    upstream provider's latency would train people to ignore this.
    """
    f = c.get("/metrics").json().get("fires", {})
    if f.get("status") != "live":
        return (f"fire layer is {f.get('status')} — newest detection "
                f"{f.get('newest')} ({f.get('age_hours')}h old); check that the "
                f"FIRMS step has SUPABASE_DB_URL")
    return None


warn("fire layer", fire_layer_stale)

warn("feed freshness", lambda: (
    f"newest reading is {c.get('/health').json().get('age_hours')}h old"
    if (c.get("/health").json().get("age_hours") or 0) > 6 else None))

print("\nRESULT:", "ALL PASSED" if not fails else f"FAILURES: {fails}")
if warns:
    print("WARNINGS:", warns)
sys.exit(1 if fails else 0)
