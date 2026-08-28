"""VAYU-NET API served from Supabase (live store).

Same endpoints as the file-backed API, but every read hits the live Postgres
database that the hourly pipeline writes into — so the deployed platform shows
current government readings, not a bundled snapshot.
"""
import json, sys, time
from pathlib import Path

from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from etl.sb import connect                      # noqa: E402
from models.aqi import pm_aqi, band             # noqa: E402

CITIES = {"delhi": "Delhi", "mumbai": "Mumbai", "bengaluru": "Bengaluru"}

# readings_hourly.h is IST wall-clock stored without a zone, while the database
# clock is UTC. Comparing h against a bare now() therefore skewed every window
# by 5h30m and put the newest reading 3 hours in the "future".
IST_NOW_SQL = "(now() at time zone 'Asia/Kolkata')"
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
        df = q(f"""select count(*) n, max(h)::text newest,
                          round(extract(epoch from ({IST_NOW_SQL} - max(h))) / 3600.0, 2) age_hours
                   from readings_hourly""")
        import os
        age = float(df.age_hours[0])
        return {"ok": True, "store": "supabase", "readings": int(df.n[0]),
                "newest_reading": df.newest[0], "age_hours": age,
                "feed": "current" if age <= 6 else ("lagging" if age <= 24 else "stale"),
                # whether the scheduled ingest path is armed on THIS deployment.
                # Vercel applies env vars only to new deployments, so setting
                # INGEST_TOKEN without redeploying leaves the running function
                # rejecting every call — worth being able to see, not guess.
                "ingest_configured": bool(os.environ.get("INGEST_TOKEN", "").strip())}
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
    where = "a.city = %(c)s" + (f" and a.h > {IST_NOW_SQL} - (%(d)s || ' days')::interval" if since_days else "")
    return rows(q(f"""select a.station_id, s.ward_id, a.h::text h, a.event_type, a.pm25, a.zscore,
                             a.category, a.confidence, a.evidence_json
                      from attributions a left join stations s using (station_id)
                      where {where} order by a.h desc limit %(l)s""",
                  {"c": city, "l": limit, "d": since_days}))

@app.get("/cities/{slug}/actions")
def actions(slug: str, since_days: int | None = None, era: str | None = None):
    """Ranked enforcement actions.

    The agent ranks the live window and the historical episode into two separate
    pools (`era`), because one shared pool let December's crisis permanently
    outrank every current event — the live view could then never show an action.
    `since_days` is kept for older clients and now selects the live pool.
    """
    city = CITIES.get(slug, slug)
    want = era or ("live" if since_days else None)
    if want:
        return rows(q("""select * from actions where city = %(c)s and era = %(e)s
                         order by priority desc""", {"c": city, "e": want}))
    return rows(q("select * from actions where city = %(c)s order by priority desc", {"c": city}))


@app.get("/live")
def live():
    """Real freshness and current hotspots, straight from the store.

    The UI used to read a build-time snapshot for this, so its "LIVE" banner
    showed whenever the last successful build ran rather than how current the
    data actually is — it read 12 days stale while the store was 2 hours old.
    """
    df = q("""with latest as (
                 select distinct on (station_id) station_id, city, pm25, pm10, h
                 from readings_hourly
                 where h > (select max(h) from readings_hourly) - interval '24 hours'
                 order by station_id, h desc)
              select coalesce(s.station_name, s.station_id) as station,
                     s.station_id, l.city, s.lat, s.lon, l.pm25, l.pm10,
                     l.h::text as as_of
              from latest l join stations s using (station_id)
              where s.lat is not null""")
    df["aqi"] = [pm_aqi(a, b) for a, b in zip(df.pm25, df.pm10)]
    df["band"] = df.aqi.map(band)
    # age is computed against the database clock so the client never has to
    # guess the timezone of a naive timestamp
    newest = q(f"""select max(h)::text newest, count(*) n,
                          round(extract(epoch from ({IST_NOW_SQL} - max(h))) / 3600.0, 2) age_hours
                   from readings_hourly""")
    recs = [r for r in rows(df) if r["aqi"] is not None]
    return {"available": bool(recs), "as_of": newest.newest[0],
            "age_hours": float(newest.age_hours[0]),
            "stations": sorted(recs, key=lambda r: -r["aqi"]),
            "fresh_stations": len(recs), "total_readings": int(newest.n[0])}


@app.get("/compare")
def compare():
    """Cross-city summary computed in SQL.

    The UI used to derive this from three paged endpoints, so every city hit the
    300-row event cap and Delhi reported exactly 300 events — a cap artefact
    presented as a count.
    """
    st = q("""with latest as (
                 select distinct on (station_id) station_id, pm25, pm10
                 from readings_hourly
                 where h > (select max(h) from readings_hourly) - interval '24 hours'
                 order by station_id, h desc)
              select s.city, l.pm25, l.pm10 from latest l join stations s using (station_id)""")
    st["aqi"] = [pm_aqi(a, b) for a, b in zip(st.pm25, st.pm10)]
    ev = q("""select city, count(*) events, count(distinct station_id) stations
              from attributions group by 1""")
    top = q("""select distinct on (city) city, category, count(*) n
               from attributions group by city, category order by city, n desc""")
    pri = q("""select distinct on (city) city, priority, era
               from actions order by city, priority desc""")
    out = []
    for city in ("Delhi", "Mumbai", "Bengaluru"):
        a = [v for v in st[st.city == city].aqi if v is not None and v == v]
        e = ev[ev.city == city]
        t = top[top.city == city]
        p = pri[pri.city == city]
        out.append({
            "city": city,
            "stations": int(len(st[st.city == city])),
            "meanAqi": round(sum(a) / len(a)) if a else None,
            "maxAqi": round(max(a)) if a else None,
            "events": int(e.events.iloc[0]) if len(e) else 0,
            "topSource": f"{t.category.iloc[0]} ({int(t.n.iloc[0])})" if len(t) else None,
            "topPriority": round(float(p.priority.iloc[0]), 2) if len(p) else None})
    return out

@app.get("/metrics")
def metrics():
    m = {}
    # All four live under data/, which ships with the function. The inventory
    # table used to be read from web/public/demo/metrics.json — excluded from
    # the serverless bundle by .vercelignore, so it silently never arrived and
    # the UI rendered an empty table.
    for name, path in [("forecast", "data/forecast_metrics.json"),
                       ("attribution", "data/attribution_summary.json"),
                       ("build", "data/build_report.json"),
                       ("inventory_validation", "data/inventory_validation.json")]:
        p = ROOT / path
        if p.exists():
            m[name] = json.loads(p.read_text(encoding="utf-8"))
    live = q(f"""select count(*) readings, max(h)::text newest, min(h)::text oldest,
                       count(distinct station_id) stations,
                       count(*) filter (where h > {IST_NOW_SQL} - interval '2 days') last_48h,
                       count(distinct date_trunc('day', h))
                         filter (where h > {IST_NOW_SQL} - interval '30 days') live_days,
                       count(*) filter (where h > {IST_NOW_SQL} - interval '30 days') live_rows
                from readings_hourly""")
    m["live_store"] = rows(live)[0]
    # report what the satellite layer is actually doing rather than asserting it
    # is active: a CI-written CSV never reached the deployed function, so this
    # read "active" for months while attribution was using December detections
    try:
        f = q(f"""select count(*) n, max(h)::text newest,
                         round(extract(epoch from ({IST_NOW_SQL} - max(h))) / 3600.0, 2) age_hours
                  from fires""")
        age = f.age_hours[0]
        m["fires"] = {"detections": int(f.n[0]), "newest": f.newest[0],
                      "age_hours": float(age) if age is not None else None,
                      "status": "live" if age is not None and float(age) <= 48 else "archive-only"}
    except Exception:
        m["fires"] = {"detections": 0, "newest": None, "age_hours": None, "status": "absent"}
    # kept only for local runs, where web/ is present; on Vercel it is excluded
    # from the bundle and every key above already comes from data/
    demo = ROOT / "web" / "public" / "demo" / "metrics.json"
    if demo.exists():
        for k, v in json.loads(demo.read_text(encoding="utf-8")).items():
            m.setdefault(k, v)
    return m

@app.get("/agent_log")
def agent_log(limit: int = 50):
    return rows(q("""select run_id, step, agent, ts::text ts, elapsed_s, input_summary, output_summary
                     from agent_log order by ts desc, step desc limit %(l)s""", {"l": limit}))

@app.post("/ingest")
def ingest(authorization: str = Header(None), x_ingest_token: str = Header(None),
           run_agents: bool = True):
    """Pull the current hour and rerun the agent chain. Token-protected.

    Exists because GitHub's scheduled runner is best-effort: on bad days it
    captured 1-3 of 24 hours, and a missed hour is gone for good — data.gov.in
    serves only the present hour and the CPCB archive mirror lags by months.
    An external cron calling this hourly is what keeps the feed dense enough
    for the sentinel to have a baseline to detect against.

    Auth: send `Authorization: Bearer <INGEST_TOKEN>` (or `X-Ingest-Token`).
    Never pass the token in the query string — it would be logged by every
    proxy in between. Disabled entirely when INGEST_TOKEN is unset.
    """
    import os
    from hmac import compare_digest

    expected = os.environ.get("INGEST_TOKEN", "").strip()
    if not expected:
        return JSONResponse({"ok": False, "error": "ingest disabled: INGEST_TOKEN not configured"},
                            status_code=503)
    supplied = x_ingest_token or ""
    if authorization and authorization.lower().startswith("bearer "):
        supplied = authorization[7:]
    if not supplied or not compare_digest(supplied.strip(), expected):
        return JSONResponse({"ok": False, "error": "unauthorized"}, status_code=401)

    from etl import ingest_live
    started = time.time()
    conn = _conn()
    try:
        out = ingest_live.run(conn)
    except Exception as e:
        conn.rollback()
        return JSONResponse({"ok": False, "stage": "ingest", "error": f"{type(e).__name__}: {e}"},
                            status_code=500)
    if run_agents and out.get("ok"):
        try:
            from agents.live_pipeline import run as agents_run
            chain = agents_run(conn, verbose=False)
            out["agents"] = {k: chain.get(k) for k in
                             ("run_id", "events", "attributions", "actions", "elapsed_s")}
        except Exception as e:
            conn.rollback()
            out["agents"] = {"error": f"{type(e).__name__}: {e}"}
    out["elapsed_s"] = round(time.time() - started, 2)
    return out


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
def advisory_ep(slug: str, ward: str, aqi: int = 300, group: str = "general", lang: str = "en",
                basis: str = "current"):
    from agents import advisory
    b = band(aqi) or "Poor"
    try:
        return advisory.generate(ward, b, aqi, group=group, lang=lang, basis=basis)
    except Exception as e:
        return {"text": advisory.english_template(ward, b, aqi, group, 24, basis),
                "lang": "en", "source": f"fallback ({type(e).__name__})"}
