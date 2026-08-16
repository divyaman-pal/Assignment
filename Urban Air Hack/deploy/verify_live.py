"""CI verification: exercise the live Supabase-backed API end to end.

Runs in GitHub Actions (which can reach Supabase) and prints a verdict for
every endpoint, so the deployment can be validated without a browser.
"""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from service.live_api import app

c = TestClient(app)
fails = []

def check(name, fn):
    try:
        v = fn()
        print(f"  PASS  {name}: {v}")
    except Exception as e:
        print(f"  FAIL  {name}: {type(e).__name__}: {e}")
        fails.append(name)

print("Verifying live API against Supabase")
check("health", lambda: c.get("/health").json())
check("cities", lambda: c.get("/cities").json())
check("stations(delhi)", lambda: f"{len(c.get('/cities/delhi/stations').json())} stations, "
                                 f"sample={c.get('/cities/delhi/stations').json()[0]['station_name'][:28]}")
check("events(delhi)", lambda: f"{len(c.get('/cities/delhi/events').json())} events")
check("actions(delhi)", lambda: f"{len(c.get('/cities/delhi/actions').json())} actions")
check("metrics", lambda: c.get("/metrics").json().get("live_store"))
check("replay", lambda: {k: v for k, v in c.post("/replay/run?city=Delhi").json().items()
                         if k in ("elapsed_s", "events", "attributions", "newest_reading")})
check("evidence pack", lambda: f"{c.get('/actions/1/pack.pdf').status_code} "
                               f"{len(c.get('/actions/1/pack.pdf').content)} bytes")
check("advisory", lambda: c.get("/cities/delhi/advisory?ward=Rohini&aqi=340&group=elderly").json()["text"][:70])

print("\nRESULT:", "ALL PASSED" if not fails else f"FAILURES: {fails}")
sys.exit(1 if fails else 0)
