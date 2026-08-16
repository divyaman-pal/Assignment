"""VAYU-NET API served from Supabase (live store).

Same endpoints as the file-backed API, but every read hits the live Postgres
database that the hourly pipeline writes into — so the deployed platform shows
current government readings, not a bundled snapshot.
"""
import json, sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from etl.sb import connect                      # noqa: E402
from models.aqi import pm_aqi, band             # noqa: E402

CITIES = {"delhi": "Delhi", "mumbai": "Mumbai", "bengaluru": "Bengaluru"}
app = FastAPI(title="VAYU-NET API (live)", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_CONN = None

def _conn():
    """One connection per warm serverless instance (reconnect if it dropped)."""
    global _CONN
    if _CONN is not None:
        try:
            if _CONN.closed == 0:
                with _CONN.cursor() as c:
                    c.execute("select 1")
                return _CONN
        except Exception:
            pass
        try: _CONN.close()
        except Exception: pass
        _CONN = None
    _CONN = connect()
    return _CONN

def q(sql, params=None):
    import pandas as pd
    conn = _conn()
    try:
        return pd.read_sql(sql, conn, params=params)
    except Exception:
        conn.rollback()
        raise

def rows(df):
    return json.loads(df.to_json(orient="records"))

@app.get("/")
def root():
    return {"service": "VAYU-NET API", "store": "supabase", "status": "running"}

@app.get("/health")
def health():
    try:
        df = q("select count(*) n, max(h)::text newest from readings_hourly")
        return {"ok": True, "store": "supabase", "readings": int(df.n[0]), "newest_reading": df.newest[0]}
    except Exception as e:
        return JSONResponse({"ok": False, "error": f"{type(e).__name__}: {e}"}, status_code=503)

@app.get("/cities")
def cities():
    return rows(q("""select city, count(*) stations, count(ward_id) mapped
                     from stations where city in ('Delhi','Mumbai','Bengaluru') and lat is not null
                     group by 1 order by 1"""))

@app.get("/cities/{slug}/stations")
def stations(slug: str):
    city = CITIES.get(slug, slug)
    df = q("""with latest as (
                 select distinct on (station_id) station_id, pm25, pm10, h
                 from readings_hourly where city = %(c)s
                 order by station_id, h desc)
              select s.station_id, s.station_name, s.lat, s.lon, s.ward_id,
                     l.pm25, l.pm10, l.h::text as as_of
              from stations s join latest l using (station_id)
              where s.city = %(c)s and s.lat is not null""", {"c": city})
    df["aqi"] = [pm_aqi(a, b) for a, b in zip(df.pm25, df.pm10)]
    df["band"] = df.aqi.map(band)
    return rows(df)

@app.get("/cities/{slug}/events")
def events(slug: str, limit: int = 300, since_days: int | None = None):
    city = CITIES.get(slug, slug)
    where = "a.city = %(c)s" + (" and a.h > now() - (%(d)s || ' days')::interval" if since_days else "")
    return rows(q(f"""select a.station_id, s.ward_id, a.h::text h, a.event_type, a.pm25, a.zscore,
                             a.category, a.confidence, a.evidence_json
                      from attributions a left join stations s using (station_id)
                      where {where} order by a.h desc limit %(l)s""",
                  {"c": city, "l": limit, "d": since_days}))

@app.get("/cities/{slug}/actions")
def actions(slug: str, since_days: int | None = None):
    """Ranked enforcement actions. `since_days` restricts to actions whose most
    recent supporting event falls inside that window — used by LIVE mode so it
    never presents historical rankings as current."""
    city = CITIES.get(slug, slug)
    if since_days:
        return rows(q("""select * from actions where city = %(c)s
                         and last_seen > now() - (%(d)s || ' days')::interval
                         order by priority desc""", {"c": city, "d": since_days}))
    return rows(q("select * from actions where city = %(c)s order by priority desc", {"c": city}))

@app.get("/metrics")
def metrics():
    m = {}
    for name, path in [("forecast", "data/forecast_metrics.json"),
                       ("attribution", "data/attribution_summary.json"),
                       ("build", "data/build_report.json")]:
        p = ROOT / path
        if p.exists():
            m[name] = json.loads(p.read_text())
    live = q("""select count(*) readings, max(h)::text newest, min(h)::text oldest,
                       count(distinct station_id) stations,
                       count(*) filter (where h > now() - interval '2 days') last_48h,
                       count(distinct date_trunc('day', h))
                         filter (where h > now() - interval '30 days') live_days,
                       count(*) filter (where h > now() - interval '30 days') live_rows
                from readings_hourly""")
    m["live_store"] = rows(live)[0]
    demo = ROOT / "web" / "public" / "demo" / "metrics.json"
    if demo.exists():
        for k, v in json.loads(demo.read_text()).items():
            m.setdefault(k, v)
    return m

@app.get("/agent_log")
def agent_log(limit: int = 50):
    return rows(q("""select run_id, step, agent, ts::text ts, elapsed_s, input_summary, output_summary
                     from agent_log order by ts desc, step desc limit %(l)s""", {"l": limit}))

@app.post("/replay/run")
def replay_run(city: str = "Delhi"):
    """Run the agent chain live against Supabase and return the timed log."""
    from agents.live_pipeline import run
    return run(_conn(), verbose=False)

@app.get("/actions/{action_id}/pack.pdf")
def pack(action_id: int):
    from agents.enforcement import evidence_pack
    path = evidence_pack(action_id, con=_conn())
    return FileResponse(path, media_type="application/pdf", filename=f"evidence_pack_{action_id}.pdf")

@app.get("/cities/{slug}/advisory")
def advisory_ep(slug: str, ward: str, aqi: int = 300, group: str = "general", lang: str = "en"):
    from agents import advisory
    b = band(aqi) or "Poor"
    try:
        return advisory.generate(ward, b, aqi, group=group, lang=lang)
    except Exception as e:
        return {"text": advisory.english_template(ward, b, aqi, group, 24),
                "lang": "en", "source": f"fallback ({type(e).__name__})"}
