"""Merge NASA FIRMS VIIRS CSVs into data/raw/firms.csv (normalised).
Keeps nominal+high confidence detections; converts UTC acq time -> IST."""
import pandas as pd
from pathlib import Path

RAW = Path(__file__).resolve().parent.parent / "data" / "raw"

def main():
    parts = sorted(RAW.glob("firm*_*.csv")) + sorted(RAW.glob("firms_*.csv"))
    parts = [p for p in parts if p.name != "firms.csv"]
    assert parts, "no FIRMS csvs found in data/raw"
    df = pd.concat([pd.read_csv(p) for p in parts], ignore_index=True).drop_duplicates()
    df = df[df.confidence.isin(["n", "h"])]  # drop low-confidence detections
    t = pd.to_datetime(df.acq_date) + pd.to_timedelta(df.acq_time // 100, unit="h") \
        + pd.to_timedelta(df.acq_time % 100, unit="m")
    df["h"] = t.dt.tz_localize("UTC").dt.tz_convert("Asia/Kolkata").dt.tz_localize(None)
    out = df[["h", "latitude", "longitude", "frp", "confidence", "daynight"]]
    out.to_csv(RAW / "firms.csv", index=False)
    print(f"firms.csv: {len(out)} detections, {out.h.min()} -> {out.h.max()}")

if __name__ == "__main__":
    main()
