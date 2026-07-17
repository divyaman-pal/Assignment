"""Fetch the CURRENT hour's readings from data.gov.in (official government
real-time AQI API) and append to an accumulating history file.

- Requires DATA_GOV_IN_KEY env var (free key from data.gov.in).
- Each run appends one timestamped snapshot; run every 6h via GitHub Actions,
  history accumulates -> after ~7 days the full forecast/attribution pipeline
  can run on genuinely live data.
- Gracefully no-ops (exit 0) when the key is missing, so the pipeline still
  works for contributors without a key.
"""
import os, sys, json, urllib.request, urllib.parse
from pathlib import Path
import pandas as pd

RAW = Path(__file__).resolve().parent.parent / "data" / "raw"
OUT = RAW / "live_snapshots.parquet"
RESOURCE = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"  # "Real time AQI from various locations"

def main():
    key = os.environ.get("DATA_GOV_IN_KEY", "").strip()
    if not key:
        print("DATA_GOV_IN_KEY not set - skipping live snapshot (pipeline continues on archive data)")
        return 0
    rows, offset = [], 0
    while True:
        url = (f"https://api.data.gov.in/resource/{RESOURCE}?api-key={urllib.parse.quote(key)}"
               f"&format=json&limit=1000&offset={offset}")
        with urllib.request.urlopen(url, timeout=60) as r:
            payload = json.load(r)
        recs = payload.get("records", [])
        rows.extend(recs)
        if len(recs) < 1000 or offset > 20000:
            break
        offset += 1000
    if not rows:
        print("API returned no records - skipping append"); return 0
    df = pd.DataFrame(rows)
    # JSON API uses min_value/max_value/avg_value; normalise to the CSV-style names
    df = df.rename(columns={"min_value": "pollutant_min", "max_value": "pollutant_max",
                            "avg_value": "pollutant_avg"})
    keep = ["country", "state", "city", "station", "last_update", "latitude", "longitude",
            "pollutant_id", "pollutant_min", "pollutant_max", "pollutant_avg"]
    df = df[[c for c in keep if c in df.columns]]
    df["fetched_at"] = pd.Timestamp.utcnow().isoformat()
    for c in ["latitude", "longitude", "pollutant_min", "pollutant_max", "pollutant_avg"]:
        if c in df:
            df[c] = pd.to_numeric(df[c], errors="coerce")
    if OUT.exists():
        old = pd.read_parquet(OUT)
        df = pd.concat([old, df], ignore_index=True)
        # dedupe: same station+pollutant+last_update means the API hasn't moved
        df = df.drop_duplicates(subset=["station", "pollutant_id", "last_update"], keep="first")
    df.to_parquet(OUT, index=False)
    print(f"live_snapshots.parquet: {len(df)} rows total, "
          f"latest update in data: {df.last_update.max()}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
