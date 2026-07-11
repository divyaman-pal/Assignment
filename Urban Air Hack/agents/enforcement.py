"""Enforcement Agent: prioritised, evidence-backed action recommendations.

priority = severity_exposure * attribution_confidence * persistence_factor
  severity_exposure: (mean event PM2.5 - 60)+ normalised  [60 = CPCB
    'Moderate' band start for PM2.5; below that no enforcement urgency]
  attribution_confidence: 0-1 from the Attribution Agent
  persistence_factor: 1 + log1p(hours the ward stayed in event state)
Vulnerability weighting (schools/hospitals density from OSM) is applied
when data/raw/osm_pois.csv exists (see etl/fetch_osm.py — requires open
network, run locally); otherwise weight=1 and the evidence pack states so.

Statute mapping is a fixed lookup (no LLM): source category -> legal basis.
Evidence pack: one-page PDF per action via matplotlib (timeseries, pollution
rose, evidence bullets, statute) — every number traceable to vayu.duckdb.
"""
import json
from pathlib import Path

import duckdb
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "data" / "vayu.duckdb"
if not DB.exists():
    DB = ROOT / "data" / "vayu_serve.duckdb"
PACK_DIR = ROOT / "data" / "packs"

STATUTES = {
    "traffic": "Motor Vehicles Act 1988 s.190(2); GRAP traffic measures (Stage III/IV)",
    "construction_dust": "C&D Waste Mgmt Rules 2016; dust mitigation norms (CPCB 2017); GRAP construction ban (Stage III+)",
    "industrial": "Air (Prevention & Control of Pollution) Act 1981 s.31A directions",
    "burning_fireworks": "Air Act 1981 s.19(5) & applicable court orders on fireworks; open burning ban (NGT)",
    "secondary_regional": "Inter-agency escalation: CAQM (NCR) / SPCB regional coordination",
}
ACTIONS = {
    "traffic": "Deploy traffic marshals; enforce idling/PUC checks at hotspot corridor",
    "construction_dust": "Inspect construction sites within ward; verify dust barriers, water sprinkling, cover requirements",
    "industrial": "Stack-emission inspection of registered units upwind of station; verify consent-to-operate compliance",
    "burning_fireworks": "Anti-burning patrol during evening/night hours; locate and extinguish open burning points",
    "secondary_regional": "Escalate to regional coordination; issue city-wide advisory; no local enforcement lever",
}

def rank_actions(top_n=10, con=None):
    con = con or duckdb.connect(str(DB))
    df = con.sql("""
      SELECT a.city, s.ward_id, w.name ward_name, a.category,
             count(*) n_events, avg(a.pm25) mean_pm25, max(a.pm25) max_pm25,
             avg(a.confidence) confidence, min(a.h) first_seen, max(a.h) last_seen,
             any_value(coalesce(w.n_schools,0)) n_schools, any_value(coalesce(w.n_hospitals,0)) n_hospitals,
             any_value(coalesce(w.n_industrial,0)) n_industrial, any_value(coalesce(w.n_construction,0)) n_construction
      FROM attributions a
      JOIN stations s USING (station_id)
      LEFT JOIN wards w ON s.ward_id = w.ward_id
      WHERE s.ward_id IS NOT NULL
      GROUP BY 1,2,3,4""").df()
    sev = np.clip((df.mean_pm25 - 60) / 250, 0, 2)
    persist = 1 + np.log1p((df.last_seen - df.first_seen).dt.total_seconds() / 3600)
    # Vulnerability: schools+hospitals in ward (OSM), normalised per city.
    fac = df.n_schools + df.n_hospitals
    fac_max = df.groupby("city")[["n_schools"]].transform(lambda s: 1)  # placeholder col
    vuln = 1 + 0.5 * (fac / fac.groupby(df.city).transform(lambda x: max(x.max(), 1)))
    df["vulnerability"] = vuln.round(3)
    df["priority"] = (sev * (df.confidence / 100) * persist * vuln).round(3)
    df["action"] = df.category.map(ACTIONS)
    df["statute"] = df.category.map(STATUTES)
    df = df.sort_values("priority", ascending=False)
    out = df.groupby("city").head(top_n).reset_index(drop=True)
    con.register("actions_df", out.assign(first_seen=out.first_seen.astype(str), last_seen=out.last_seen.astype(str)))
    con.sql("CREATE OR REPLACE TABLE actions AS SELECT row_number() OVER () action_id, * FROM actions_df")
    return out

def evidence_pack(action_id, con=None):
    """One-page PDF: header, priority breakdown, PM2.5 timeseries of the ward's
    stations, pollution rose, evidence bullets from top event, statute."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    con = con or duckdb.connect(str(DB), read_only=True)
    a = con.sql(f"SELECT * FROM actions WHERE action_id={int(action_id)}").df().iloc[0]
    ts = con.sql(f"""SELECT date_trunc('hour', r.ts) h, avg(r.pm25) pm25, avg(r.wd) wd, avg(r.ws) ws
        FROM readings r JOIN stations s USING (station_id)
        WHERE s.ward_id='{a.ward_id}' GROUP BY 1 ORDER BY 1""").df()
    ev = con.sql(f"""SELECT evidence_json FROM attributions a JOIN stations s USING (station_id)
        WHERE s.ward_id='{a.ward_id}' AND a.category='{a.category}'
        ORDER BY a.confidence DESC LIMIT 1""").fetchone()
    evidence = json.loads(ev[0])["evidence"] if ev else []
    PACK_DIR.mkdir(exist_ok=True)
    fig = plt.figure(figsize=(8.27, 11.69)); fig.suptitle("VAYU-NET Enforcement Evidence Pack", fontsize=14, y=0.98)
    ax0 = fig.add_axes([0.08, 0.78, 0.84, 0.13]); ax0.axis("off")
    ax0.text(0, 1, f"Ward: {a.ward_name} ({a.city})   Source: {a.category}   Confidence: {a.confidence:.0f}%\n"
                   f"At-risk facilities in ward: {int(a.get('n_schools',0))} schools, {int(a.get('n_hospitals',0))} hospitals\n"
                   f"Priority score: {a.priority}   Events: {a.n_events}   Mean PM2.5: {a.mean_pm25:.0f} ug/m3 (max {a.max_pm25:.0f})\n"
                   f"Window: {a.first_seen} to {a.last_seen}\n\nRECOMMENDED ACTION: {a.action}\nLEGAL BASIS: {a.statute}",
             va="top", fontsize=9, wrap=True)
    ax1 = fig.add_axes([0.08, 0.45, 0.84, 0.28])
    ax1.plot(ts.h, ts.pm25); ax1.axhline(250, ls="--", c="r", lw=1)
    ax1.set_title("Ward PM2.5 (hourly mean, station data)", fontsize=9); ax1.tick_params(labelsize=7)
    ax2 = fig.add_axes([0.08, 0.13, 0.35, 0.25], projection="polar")
    w = ts.dropna(subset=["wd", "pm25"])
    if len(w) > 10:
        sec = ((w.wd + 11.25) % 360 // 22.5).astype(int)
        m = w.groupby(sec).pm25.mean()
        ax2.bar(np.deg2rad(m.index * 22.5), m.values, width=0.35)
    ax2.set_theta_zero_location("N"); ax2.set_theta_direction(-1)
    ax2.set_title("Pollution rose (mean PM2.5 by wind dir)", fontsize=8)
    ax3 = fig.add_axes([0.5, 0.13, 0.42, 0.25]); ax3.axis("off")
    ax3.text(0, 1, "EVIDENCE (auto-generated, traceable):\n\n" + "\n".join(f"- {e}" for e in evidence[:7]),
             va="top", fontsize=8, wrap=True)
    fig.text(0.08, 0.05, "Generated by VAYU-NET from CPCB CAAQMS data (ODbL). Attribution is an evidence-weighted "
                         "likelihood, not legal proof.\nVulnerability weighting: " +
             ("applied" if (ROOT/"data/raw/osm_pois.csv").exists() else "not applied (OSM POI layer pending)"), fontsize=7)
    path = PACK_DIR / f"pack_{action_id}.pdf"
    fig.savefig(path); plt.close(fig)
    return str(path)

if __name__ == "__main__":
    out = rank_actions()
    print(out[["city", "ward_name", "category", "n_events", "confidence", "priority"]].head(12).to_string(index=False))
    p = evidence_pack(1); print("pack ->", p)
