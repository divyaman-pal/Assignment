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
    con = duckdb.connect(str(ROOT / "data" / "vayu.duckdb"), read_only=True)
    wards = con.sql("SELECT ward_id, city, name, geojson FROM wards").df()
    for city, slug in CITIES.items():
        feats = []
        for _, w in wards[wards.city == city].iterrows():
            geom = shape(json.loads(w.geojson)).simplify(0.0005, preserve_topology=True)
            feats.append({"type": "Feature", "properties": {"ward_id": w.ward_id, "name": w["name"]},
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
    (OUT / "metrics.json").write_text(json.dumps(metrics))
    print("exported:", [p.name for p in OUT.iterdir()])

if __name__ == "__main__":
    main()
