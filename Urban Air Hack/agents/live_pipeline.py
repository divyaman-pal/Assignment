"""Run the full agent chain against LIVE Supabase data and write results back.

Executed hourly by CI after ingestion, and on demand by the API. Unlike the
episode pipeline (which reads a bundled file), this reads and writes the live
Postgres store, so the deployed platform always reflects current conditions.

Chain: sentinel -> attribution -> enforcement -> audit log
Forecasting runs separately (models are retrained on a slower cadence).
"""
import json, sys, time, uuid
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from etl.sb import connect, insert_rows           # noqa: E402
from models.attribution import attribute_event, detect_events, EVIDENCE_PARAMS  # noqa: E402
from agents.enforcement import STATUTES, ACTIONS  # noqa: E402

LOOKBACK_DAYS = 10          # window of history used for baselines
LIVE_CUTOFF_DAYS = 3        # "live" = events within this many days of the newest reading

def load_hourly(conn):
    df = pd.read_sql(
        "select station_id, city, h, pm25, pm10, no2, co, so2, nh3, o3, ws, wd, at_c, rh "
        "from readings_hourly where h > (select max(h) from readings_hourly) - interval '%s days' "
        "order by station_id, h" % LOOKBACK_DAYS, conn)
    df["h"] = pd.to_datetime(df["h"])
    return df

def run(conn, verbose=True):
    t0 = time.time()
    run_id = uuid.uuid4().hex[:12]
    log = []

    def step(agent, inp, out):
        log.append((run_id, len(log) + 1, agent, datetime.utcnow(), round(time.time() - t0, 2),
                    json.dumps(inp)[:500], json.dumps(out, default=str)[:500]))

    df = load_hourly(conn)
    if df.empty:
        return {"error": "no readings"}
    newest = df.h.max()

    # 1) SENTINEL
    events = detect_events(df)
    if len(events):
        events = events[events.h >= newest - timedelta(days=LIVE_CUTOFF_DAYS)]
    step("sentinel", {"window_days": LOOKBACK_DAYS, "newest_reading": str(newest)},
         {"events_detected": len(events)})

    # 2) ATTRIBUTION
    coords = {r[0]: (r[1], r[2]) for r in
              pd.read_sql("select station_id, lat, lon from stations where lat is not null",
                          conn).itertuples(index=False, name=None)}
    fires_path = ROOT / "data" / "raw" / "firms.csv"
    fires = pd.read_csv(fires_path, parse_dates=["h"]) if fires_path.exists() else None
    attrs = []
    for _, e in events.iterrows():
        a = attribute_event(e, df, fires, coords)
        attrs.append((e.station_id, e.city, e.h.to_pydatetime(), e.get("event_type"),
                      float(e.pm25) if pd.notna(e.pm25) else None,
                      float(e.zscore) if pd.notna(e.get("zscore")) else None,
                      a["category"], a["confidence"], a["n_signals"], json.dumps(a)))
    cats = pd.Series([r[6] for r in attrs])
    step("attribution", {"events": len(attrs)},
         {"by_category": cats.value_counts().to_dict() if len(cats) else {},
          "fires_layer": fires is not None})

    cur = conn.cursor()
    if attrs:
        # replace the live window so re-runs don't duplicate
        cur.execute("delete from attributions where h >= %s", (newest - timedelta(days=LIVE_CUTOFF_DAYS),))
        insert_rows(cur, "attributions",
                    ["station_id", "city", "h", "event_type", "pm25", "zscore", "category",
                     "confidence", "n_signals", "evidence_json"], attrs)

    # 3) ENFORCEMENT — rank wards on everything currently in the store
    conn.commit()
    agg = pd.read_sql("""
        select a.city, s.ward_id, w.name ward_name, a.category,
               count(*) n_events, avg(a.pm25) mean_pm25, max(a.pm25) max_pm25,
               avg(a.confidence) confidence, min(a.h) first_seen, max(a.h) last_seen,
               max(coalesce(w.n_schools,0)) n_schools, max(coalesce(w.n_hospitals,0)) n_hospitals,
               max(coalesce(w.n_industrial,0)) n_industrial, max(coalesce(w.n_construction,0)) n_construction
        from attributions a
        join stations s on s.station_id = a.station_id
        left join wards w on w.ward_id = s.ward_id
        where s.ward_id is not null
        group by 1,2,3,4""", conn)
    if len(agg):
        sev = np.clip((agg.mean_pm25 - 60) / 250, 0, 2)
        persist = 1 + np.log1p((pd.to_datetime(agg.last_seen) - pd.to_datetime(agg.first_seen))
                               .dt.total_seconds() / 3600)
        fac = agg.n_schools + agg.n_hospitals
        vuln = 1 + 0.5 * (fac / fac.groupby(agg.city).transform(lambda x: max(x.max(), 1)))
        agg["vulnerability"] = vuln.round(3)
        agg["priority"] = (sev * (agg.confidence / 100) * persist * vuln).round(3)
        agg["action"] = agg.category.map(ACTIONS)
        agg["statute"] = agg.category.map(STATUTES)
        top = agg.sort_values("priority", ascending=False).groupby("city").head(10).reset_index(drop=True)
        top.insert(0, "action_id", range(1, len(top) + 1))
        cur.execute("delete from actions")
        insert_rows(cur, "actions",
                    ["action_id", "city", "ward_id", "ward_name", "category", "n_events",
                     "mean_pm25", "max_pm25", "confidence", "first_seen", "last_seen",
                     "n_schools", "n_hospitals", "n_industrial", "n_construction",
                     "vulnerability", "priority", "action", "statute"],
                    [tuple(None if pd.isna(v) else v for v in r) for r in top.itertuples(index=False, name=None)])
        step("enforcement", {"candidates": len(agg)},
             {"top": top.head(3)[["ward_name", "category", "priority"]].to_dict("records")})
    else:
        step("enforcement", {"candidates": 0}, {"top": []})

    elapsed = round(time.time() - t0, 2)
    step("done", {}, {"signal_to_action_seconds": elapsed})
    insert_rows(cur, "agent_log",
                ["run_id", "step", "agent", "ts", "elapsed_s", "input_summary", "output_summary"], log)
    conn.commit()
    out = {"run_id": run_id, "elapsed_s": elapsed, "events": len(events),
           "attributions": len(attrs), "newest_reading": str(newest),
           "log": [{"step": l[1], "agent": l[2], "elapsed_s": l[4],
                    "input_summary": l[5], "output_summary": l[6]} for l in log]}
    if verbose:
        print(json.dumps({k: v for k, v in out.items() if k != "log"}, indent=2))
    return out

if __name__ == "__main__":
    c = connect()
    try:
        run(c)
    finally:
        c.close()
