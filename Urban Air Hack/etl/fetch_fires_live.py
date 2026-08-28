"""Fetch CURRENT satellite fire detections (NASA FIRMS VIIRS) for the live pipeline.

The episode dataset shipped a fixed December window; for live operation the
attribution engine needs recent detections or its satellite signal silently
contributes nothing. This pulls the last N days over the Indian bounding box
and writes data/raw/firms_live.csv in the same schema the engine expects.

Uses VIIRS_NOAA20_NRT (near-real-time) which is published within ~3 hours.
"""
import os, sys, urllib.request
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from etl import env as _env  # noqa: E402,F401  (loads .env for local runs)

RAW = Path(__file__).resolve().parent.parent / "data" / "raw"
BBOX = "68,6,98,36"          # India
DAYS = 3                      # rolling window (FIRMS area API allows up to 10)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"}

def main():
    key = os.environ.get("NASA_FIRMS_API_KEY", "").strip()
    if not key:
        print("NASA_FIRMS_API_KEY not set — live fire layer skipped"); return 0
    frames = []
    for source in ("VIIRS_NOAA20_NRT", "VIIRS_SNPP_NRT"):
        url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/{source}/{BBOX}/{DAYS}"
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=120) as r:
                txt = r.read().decode("utf-8", "replace")
            if "latitude" not in txt.split("\n")[0]:
                print(f"  {source}: unexpected response: {txt[:120]}"); continue
            from io import StringIO
            df = pd.read_csv(StringIO(txt))
            frames.append(df)
            print(f"  {source}: {len(df)} detections")
        except Exception as e:
            print(f"  {source} failed: {e}")
    if not frames:
        print("no live fire data retrieved (episode file remains in place)"); return 0
    df = pd.concat(frames, ignore_index=True).drop_duplicates()
    if "confidence" in df:
        df = df[df.confidence.astype(str).str.lower().isin(["n", "h", "nominal", "high"])]
    t = (pd.to_datetime(df.acq_date) + pd.to_timedelta(df.acq_time // 100, unit="h")
         + pd.to_timedelta(df.acq_time % 100, unit="m"))
    df["h"] = t.dt.tz_localize("UTC").dt.tz_convert("Asia/Kolkata").dt.tz_localize(None)
    out = df[["h", "latitude", "longitude", "frp", "confidence", "daynight"]]

    # merge with the episode archive so both live and replay attribution work
    archive = RAW / "firms.csv"
    if archive.exists():
        old = pd.read_csv(archive, parse_dates=["h"])
        out = pd.concat([old, out], ignore_index=True).drop_duplicates(
            subset=["h", "latitude", "longitude"])
    out.to_csv(RAW / "firms.csv", index=False)
    print(f"firms.csv now {len(out)} detections | newest {out.h.max()}")
    push_to_store(out)
    return 0


def push_to_store(df):
    """A CSV written in a CI runner never reaches the deployed function, so the
    fire layer read 'archive-only' forever no matter how often this ran. The
    live store is the only channel both halves can see."""
    try:
        from etl.sb import connect, insert_rows
    except Exception as e:
        print(f"  store push skipped ({type(e).__name__})"); return
    try:
        conn = connect(); cur = conn.cursor()
        cur.execute("""create table if not exists fires (
                         h timestamp, latitude double precision, longitude double precision,
                         frp double precision, confidence text, daynight text,
                         primary key (h, latitude, longitude))""")
        rows = [(r.h.to_pydatetime(), float(r.latitude), float(r.longitude),
                 float(r.frp) if pd.notna(r.frp) else None, str(r.confidence), str(r.daynight))
                for r in df.itertuples(index=False)]
        insert_rows(cur, "fires",
                    ["h", "latitude", "longitude", "frp", "confidence", "daynight"], rows,
                    conflict="(h, latitude, longitude) do nothing")
        # keep the table bounded: attribution only ever looks back days
        cur.execute("delete from fires where h < (now() at time zone 'Asia/Kolkata') - interval '400 days'")
        conn.commit()
        cur.execute("select count(*), max(h) from fires")
        n, newest = cur.fetchone()
        conn.close()
        print(f"  live store: fires table now {n} detections | newest {newest}")
    except Exception as e:
        print(f"  store push failed non-fatally: {type(e).__name__}: {e}")

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"live fire fetch failed non-fatally: {type(e).__name__}: {e}")
        sys.exit(0)
