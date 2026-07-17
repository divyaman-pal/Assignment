"""Build the LIVE view export from accumulated data.gov.in snapshots.

Produces web/public/demo/live.json: per-station current readings (latest
snapshot), pivoted from per-pollutant rows to one record per station with
PM2.5/PM10-based AQI, plus honest metadata (data timestamp, station count).
No-ops gracefully when no snapshots exist yet.
"""
import json, sys
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
SNAP = ROOT / "data" / "raw" / "live_snapshots.parquet"
OUT = ROOT / "web" / "public" / "demo" / "live.json"
sys.path.insert(0, str(ROOT))
from models.aqi import pm_aqi, band

CITY_MAP = {"Delhi": "Delhi", "Mumbai": "Mumbai", "Bengaluru": "Bengaluru"}

def main():
    if not SNAP.exists():
        OUT.write_text(json.dumps({"available": False,
            "note": "No live snapshots yet - set DATA_GOV_IN_KEY secret; history accumulates every 6h"}))
        print("no snapshots; wrote unavailable stub"); return 0
    df = pd.read_parquet(SNAP)
    df = df[df.city.isin(CITY_MAP)].copy()
    df["last_update_ts"] = pd.to_datetime(df.last_update, format="%d-%m-%Y %H:%M:%S", errors="coerce")
    latest_ts = df.last_update_ts.max()
    cur = df[df.last_update_ts == latest_ts]
    piv = cur.pivot_table(index=["station", "city", "latitude", "longitude"],
                          columns="pollutant_id", values="pollutant_avg", aggfunc="first").reset_index()
    piv.columns = [str(c) for c in piv.columns]
    out = []
    for _, r in piv.iterrows():
        pm25, pm10 = r.get("PM2.5"), r.get("PM10")
        aqi = pm_aqi(pm25 if pd.notna(pm25) else None, pm10 if pd.notna(pm10) else None)
        out.append({"station": r.station, "city": r.city, "lat": r.latitude, "lon": r.longitude,
                    "pm25": None if pd.isna(pm25) else round(pm25, 1),
                    "pm10": None if pd.isna(pm10) else round(pm10, 1),
                    "aqi": None if aqi is None else round(aqi), "band": band(aqi)})
    hist_days = (df.last_update_ts.max() - df.last_update_ts.min()).days
    OUT.write_text(json.dumps({"available": True, "as_of": str(latest_ts),
        "stations": out, "history_days_accumulated": int(hist_days),
        "note": "Live snapshot from data.gov.in official real-time AQI feed",
        "analytics_ready": hist_days >= 7}))
    print(f"live.json: {len(out)} stations as of {latest_ts}, history {hist_days}d")
    return 0

if __name__ == "__main__":
    sys.exit(main())
