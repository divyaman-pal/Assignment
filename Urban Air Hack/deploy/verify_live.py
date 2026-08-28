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
    live = c.get("/cities/delhi/actions?era=live").json()
    ep = c.get("/cities/delhi/actions?era=episode").json()
    assert isinstance(live, list) and isinstance(ep, list), "actions endpoint did not return lists"
    # the live pool must be answerable independently of the episode pool
    assert all(a.get("era") == "live" for a in live), "era=live returned non-live rows"
    return f"{len(live)} live, {len(ep)} episode"


check("actions(delhi) live/episode split", actions_ok)


def live_ok():
    lv = c.get("/live").json()
    assert "age_hours" in lv, "/live does not report data age"
    assert lv.get("as_of"), "/live has no as_of"
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
    en = c.get("/cities/delhi/advisory?ward=Rohini&aqi=340&group=elderly").json()
    assert en["source"] == "template", f"english advisory source={en['source']}"
    hi = c.get("/cities/delhi/advisory?ward=Rohini&aqi=340&group=elderly&lang=hi").json()
    # a fallback here means the translation path is broken (it was: the spend
    # tracker wrote to a read-only bundle and threw the paid result away)
    assert hi["source"] == "llm_translated", f"hindi fell back: source={hi['source']}"
    assert hi["lang"] == "hi", "hindi advisory came back tagged as another language"
    return f"en=template hi={hi['source']}"


check("advisory (en + hi)", advisory_ok)

warn("feed freshness", lambda: (
    f"newest reading is {c.get('/health').json().get('age_hours')}h old"
    if (c.get("/health").json().get("age_hours") or 0) > 6 else None))

print("\nRESULT:", "ALL PASSED" if not fails else f"FAILURES: {fails}")
if warns:
    print("WARNINGS:", warns)
sys.exit(1 if fails else 0)
