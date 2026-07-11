"""VAYU-NET API (FastAPI). Serves the war-room frontend.

Every endpoint reads from data/vayu.duckdb — the same tables the agents
write. Nothing served here is computed ad hoc; it all joins back to the
auditable pipeline (agent_log).
"""
import json, sys, threading
from pathlib import Path

import duckdb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
DB = ROOT / "data" / "vayu.duckdb"
if not DB.exists():
    DB = ROOT / "data" / "vayu_serve.duckdb"
DEMO = ROOT / "web" / "public" / "demo"
CITIES = {"delhi": "Delhi", "mumbai": "Mumbai", "bengaluru": "Bengaluru"}

app = FastAPI(title="VAYU-NET API", version="0.5")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_CON, _LOCK = None, threading.Lock()

def get_con():
    global _CON
    if _CON is None:
        _CON = duckdb.connect(str(DB))
    return _CON

def q(sql, params=None):
    with _LOCK:
        con = get_con()
        return con.sql(sql).df() if params is None else con.execute(sql, params).df()

@app.get("/health")
def health():
    return {"ok": True, "db": DB.exists()}

@app.get("/cities")
def cities():
    df = q("""SELECT city, count(*) stations, count(ward_id) mapped FROM stations
              WHERE city IN ('Delhi','Mumbai','Bengaluru') AND lat IS NOT NULL GROUP BY 1""")
    return df.to_dict("records")

@app.get("/cities/{slug}/wards.geojson")
def wards_geojson(slug: str):
    f = DEMO / f"{slug}_wards.json"
    if not f.exists(): raise HTTPException(404)
    return FileResponse(f, media_type="application/geo+json")

@app.get("/cities/{slug}/stations")
def stations(slug: str):
    city = CITIES.get(slug) or slug
    from models.aqi import pm_aqi, band
    df = q("""
      WITH latest AS (SELECT station_id, avg(pm25) pm25, avg(pm10) pm10 FROM readings
        WHERE ts > (SELECT max(ts) - INTERVAL 3 HOUR FROM readings) GROUP BY 1)
      SELECT s.station_id, s.station_name, s.lat, s.lon, s.ward_id,
             round(l.pm25,1) pm25, round(l.pm10,1) pm10
      FROM stations s LEFT JOIN latest l USING (station_id)
      WHERE s.city = ? AND s.lat IS NOT NULL""", [city])
    df["aqi"] = [pm_aqi(a, b) for a, b in zip(df.pm25, df.pm10)]
    df["band"] = df.aqi.map(band)
    return json.loads(df.to_json(orient="records"))

@app.get("/cities/{slug}/events")
def events(slug: str, start: str | None = None, end: str | None = None):
    city = CITIES.get(slug) or slug
    sql = """SELECT a.station_id, s.ward_id, a.h::VARCHAR h, a.event_type, round(a.pm25,1) pm25,
             a.zscore, a.category, a.confidence, a.evidence_json
             FROM attributions a JOIN stations s USING (station_id) WHERE a.city = ?"""
    params = [city]
    if start: sql += " AND a.h >= ?"; params.append(start)
    if end: sql += " AND a.h <= ?"; params.append(end)
    return json.loads(q(sql + " ORDER BY a.h", params).to_json(orient="records"))

@app.get("/cities/{slug}/actions")
def actions(slug: str):
    city = CITIES.get(slug) or slug
    return json.loads(q("SELECT * FROM actions WHERE city = ? ORDER BY priority DESC", [city]).to_json(orient="records"))

@app.get("/actions/{action_id}/pack.pdf")
def pack(action_id: int):
    from agents.enforcement import evidence_pack
    with _LOCK:
        path = evidence_pack(action_id, con=get_con())
    return FileResponse(path, media_type="application/pdf",
                        filename=f"evidence_pack_{action_id}.pdf")

@app.get("/cities/{slug}/advisory")
def advisory_ep(slug: str, ward: str, aqi: int = 300, group: str = "general", lang: str = "en"):
    from agents import advisory
    from models.aqi import band
    b = band(aqi) or "Poor"
    try:
        return advisory.generate(ward, b, aqi, group=group, lang=lang)
    except Exception as e:
        return JSONResponse({"text": advisory.english_template(ward, b, aqi, group, 24),
                             "lang": "en", "source": f"fallback ({type(e).__name__})"})

@app.get("/metrics")
def metrics():
    return json.loads((DEMO / "metrics.json").read_text())

@app.get("/agent_log")
def agent_log(limit: int = 50):
    return json.loads(q("SELECT * FROM agent_log ORDER BY ts DESC LIMIT ?", [limit]).to_json(orient="records"))

@app.post("/replay/run")
def replay_run(start: str = "2025-12-31 18:00", end: str = "2026-01-01 02:00", city: str = "Delhi"):
    from agents.orchestrator import Orchestrator
    with _LOCK:
        o = Orchestrator(con=get_con())
    state, elapsed = o.run_window(start, end, city=city)
    log = o.con.execute("SELECT step, agent, elapsed_s, input_summary, output_summary FROM agent_log WHERE run_id = ? ORDER BY step", [state.run_id]).df()
    return {"run_id": state.run_id, "elapsed_s": elapsed,
            "events": len(state.events), "actions": 0 if state.actions is None else len(state.actions),
            "advisories": state.advisories, "log": json.loads(log.to_json(orient="records"))}
