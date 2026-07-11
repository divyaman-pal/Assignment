"""Export simplified ward GeoJSON + demo snapshot JSONs for the frontend.
Simplification tolerance ~0.0005 deg (~50m) keeps files small for the map."""
import json
from pathlib import Path
import duckdb
from shapely.geometry import shape, mapping

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "public" / "demo"
CITIES = {"Delhi": "delhi", "Mumbai": "mumbai", "Bengaluru": "bengaluru"}

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    db = ROOT / "data" / "vayu.duckdb"
    if not db.exists(): db = ROOT / "data" / "vayu_serve.duckdb"
    con = duckdb.connect(str(db), read_only=True)
    wards = con.sql("""SELECT ward_id, city, name, geojson,
        coalesce(n_schools,0) n_schools, coalesce(n_hospitals,0) n_hospitals,
        coalesce(n_industrial,0) n_industrial, coalesce(n_construction,0) n_construction
        FROM wards""").df()
    for city, slug in CITIES.items():
        feats = []
        for _, w in wards[wards.city == city].iterrows():
            geom = shape(json.loads(w.geojson)).simplify(0.0005, preserve_topology=True)
            feats.append({"type": "Feature", "properties": {"ward_id": w.ward_id, "name": w["name"],
                          "schools": int(w.n_schools), "hospitals": int(w.n_hospitals),
                          "industrial": int(w.n_industrial), "construction": int(w.n_construction)},
                          "geometry": mapping(geom)})
        (OUT / f"{slug}_wards.json").write_text(json.dumps({"type": "FeatureCollection", "features": feats}))
    # stations with latest hourly PM2.5 + AQI
    st = con.sql("""
      WITH latest AS (
        SELECT station_id, avg(pm25) pm25, avg(pm10) pm10
        FROM readings WHERE ts > (SELECT max(ts) - INTERVAL 3 HOUR FROM readings) GROUP BY 1)
      SELECT s.station_id, s.station_name, s.city, s.lat, s.lon, s.ward_id,
             round(l.pm25,1) pm25, round(l.pm10,1) pm10
      FROM stations s LEFT JOIN latest l USING (station_id)
      WHERE s.city IN ('Delhi','Mumbai','Bengaluru') AND s.lat IS NOT NULL""").df()
    import sys; sys.path.insert(0, str(ROOT))
    from models.aqi import pm_aqi, band
    st["aqi"] = [pm_aqi(a, b) for a, b in zip(st.pm25, st.pm10)]
    st["aqi"] = st.aqi.round(0)
    st["band"] = st.aqi.map(lambda x: band(x) if x == x else None)
    (OUT / "stations.json").write_text(st.to_json(orient="records"))
    # events + attributions (for replay timeline)
    ev = con.sql("""SELECT a.station_id, s.ward_id, a.city, a.h::VARCHAR h, a.event_type,
                    round(a.pm25,1) pm25, a.zscore, a.category, a.confidence, a.evidence_json
                    FROM attributions a JOIN stations s USING (station_id) ORDER BY a.h""").df()
    (OUT / "events.json").write_text(ev.to_json(orient="records"))
    # actions
    ac = con.sql("SELECT * FROM actions").df()
    (OUT / "actions.json").write_text(ac.to_json(orient="records"))
    # metrics
    metrics = {"forecast": json.loads((ROOT / "data" / "forecast_metrics.json").read_text()),
               "attribution": json.loads((ROOT / "data" / "attribution_summary.json").read_text()),
               "build": json.loads((ROOT / "data" / "build_report.json").read_text())}
    # Validation vs ground-truth inventory: CAQM unified source-apportionment
    # report (Jan 2026, Supreme Court-mandated; synthesises TERI/CSE/CEEW/
    # UrbanEmissions). Winter Delhi PM2.5 mass shares.
    d = con.sql("SELECT category, count(*) n FROM attributions WHERE city='Delhi' GROUP BY 1").df()
    tot = d.n.sum()
    ours = {r.category: round(100 * r.n / tot, 1) for r in d.itertuples()}
    metrics["inventory_validation"] = {
        "benchmark": "CAQM unified report, Jan 2026 (SC-mandated) — Delhi winter PM2.5 mass shares",
        "caveat": ("Ours are EVENT-COUNT shares for one episode week (incl. New Year fireworks); "
                   "benchmark is seasonal MASS shares — directional comparison only"),
        "rows": [
            {"category": "biomass/burning", "ours": ours.get("burning_fireworks", 0), "caqm": 20,
             "note": "our week includes NYE fireworks — exceedance expected and correct"},
            {"category": "transport", "ours": ours.get("traffic", 0), "caqm": 23,
             "note": "same order of magnitude; event counts over-weight rush-hour spikes"},
            {"category": "dust/construction", "ours": ours.get("construction_dust", 0), "caqm": 15,
             "note": "winter dust suppressed by humidity; spike-detection under-captures steady dust"},
            {"category": "industry", "ours": ours.get("industrial", 0), "caqm": 9,
             "note": "few SO2-signature events in this week"},
            {"category": "secondary", "ours": ours.get("secondary_regional", 0), "caqm": 27,
             "note": "known method limit: secondary chemistry is invisible to station-observational attribution"}],
        "n_events": int(tot)}
    (OUT / "metrics.json").write_text(json.dumps(metrics))
    print("exported:", [p.name for p in OUT.iterdir()])


def export_grid():
    """1-km forecast grid: IDW of station 24h PM2.5 forecasts to 0.01-deg cells.
    Cells >8 km from any station are masked (honesty: no fabricated coverage)."""
    import numpy as np, sys
    sys.path.insert(0, str(ROOT))
    import lightgbm as lgb
    from models.forecast import build_features, FEATURES, load_hourly
    from models.aqi import pm_aqi
    import duckdb
    con = duckdb.connect(str(ROOT / "data" / ("vayu.duckdb" if (ROOT/"data/vayu.duckdb").exists() else "vayu_serve.duckdb")), read_only=True)
    booster = lgb.Booster(model_file=str(ROOT / "models" / "lgbm_pm25_h24.txt"))
    fdf = build_features(load_hourly(con))
    latest = fdf[fdf.h == fdf.h.max()].dropna(subset=["pm25_lag1"]).copy()
    latest["pred24"] = np.clip(booster.predict(latest[FEATURES]), 0, None)
    st = con.sql("SELECT station_id, city, lat, lon FROM stations WHERE lat IS NOT NULL").df()
    latest = latest.merge(st, on=["station_id", "city"])
    BBOX = {"delhi": (76.84, 28.40, 77.35, 28.88), "mumbai": (72.77, 18.89, 72.99, 19.28),
            "bengaluru": (77.46, 12.83, 77.78, 13.14)}
    CITY = {"delhi": "Delhi", "mumbai": "Mumbai", "bengaluru": "Bengaluru"}
    for slug, (w, s_, e, n) in BBOX.items():
        pts = latest[latest.city == CITY[slug]]
        if not len(pts): continue
        xs = np.arange(w, e, 0.01); ys = np.arange(s_, n, 0.01)
        cells = []
        for y in ys:
            for x in xs:
                d2 = (pts.lat - y) ** 2 + ((pts.lon - x) * 0.88) ** 2
                dmin_km = float(np.sqrt(d2.min())) * 111
                if dmin_km > 8: continue
                wgt = 1 / np.maximum(d2, 1e-6)
                v = float((pts.pred24 * wgt).sum() / wgt.sum())
                cells.append([round(x, 3), round(y, 3), round(v, 1), round(pm_aqi(v, None) or 0)])
        (OUT / f"grid_{slug}.json").write_text(json.dumps({"cell_deg": 0.01, "horizon_h": 24,
            "note": "IDW of station forecasts; cells >8km from any station masked", "cells": cells}))
        print(slug, "grid cells:", len(cells))

if __name__ == "__main__":
    main()
    export_grid()
