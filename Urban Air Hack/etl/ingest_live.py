"""Hourly live ingestion into Supabase.

Two public sources, both official/free:
  1. data.gov.in real-time AQI (CPCB)  -> pollutant concentrations per station
  2. Open-Meteo                         -> wind speed/direction, temp, humidity
     (the CPCB real-time feed carries no meteorology, and wind is required for
      the attribution engine's directional analysis)

Writes one row per station per hour into readings_hourly. Idempotent: repeated
runs for the same hour update in place rather than duplicating.
"""
import json, os, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from etl.sb import connect, insert_rows

RESOURCE = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"
CITIES = {"Delhi": (28.61, 77.21), "Mumbai": (19.08, 72.88), "Bengaluru": (12.97, 77.59)}
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36", "Accept": "application/json"}
IST = timezone(timedelta(hours=5, minutes=30))

def _get(url, tries=3, timeout=90):
    for a in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.load(r)
        except Exception as e:
            print(f"    attempt {a+1} failed: {e}")
            time.sleep(4 * (a + 1))
    return None

def fetch_cpcb(key):
    """Current-hour pollutant readings for the three served cities."""
    rows, offset, page = [], 0, 500
    while offset <= 8000:
        d = _get(f"https://api.data.gov.in/resource/{RESOURCE}?api-key={urllib.parse.quote(key)}"
                 f"&format=json&limit={page}&offset={offset}")
        if not d:
            break
        recs = d.get("records", [])
        rows.extend([r for r in recs if r.get("city") in CITIES])
        if len(recs) < page:
            break
        offset += page
    return rows

def fetch_weather():
    """Current-hour meteorology per city centroid (Open-Meteo, no key needed)."""
    out = {}
    for city, (lat, lon) in CITIES.items():
        d = _get(f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
                 f"&current=wind_speed_10m,wind_direction_10m,temperature_2m,relative_humidity_2m"
                 f"&wind_speed_unit=ms&timezone=Asia%2FKolkata")
        if d and "current" in d:
            c = d["current"]
            out[city] = (c.get("wind_speed_10m"), c.get("wind_direction_10m"),
                         c.get("temperature_2m"), c.get("relative_humidity_2m"))
    return out

def main():
    key = os.environ.get("DATA_GOV_IN_KEY", "").strip()
    if not key:
        print("DATA_GOV_IN_KEY missing — skipping live ingest"); return 0
    recs = fetch_cpcb(key)
    if not recs:
        print("no records from CPCB feed — skipping (next cycle will retry)"); return 0
    wx = fetch_weather()
    print(f"CPCB records for served cities: {len(recs)} | weather cities: {len(wx)}")

    # pivot pollutant rows -> one row per (station, hour)
    by_station = {}
    for r in recs:
        st, city = r.get("station"), r.get("city")
        try:
            ts = datetime.strptime(r["last_update"], "%d-%m-%Y %H:%M:%S").replace(minute=0, second=0)
        except Exception:
            continue
        k = (st, ts)
        d = by_station.setdefault(k, {"city": city, "lat": r.get("latitude"), "lon": r.get("longitude")})
        try:
            v = float(r.get("avg_value"))
        except (TypeError, ValueError):
            v = None
        d[{"PM2.5": "pm25", "PM10": "pm10", "NO2": "no2", "CO": "co", "SO2": "so2",
           "NH3": "nh3", "OZONE": "o3"}.get(r.get("pollutant_id"), "_")] = v

    cols = ["station_id", "city", "h", "pm25", "pm10", "no2", "co", "so2", "nh3", "o3",
            "ws", "wd", "at_c", "rh"]
    rows = []
    for (st, ts), d in by_station.items():
        w = wx.get(d["city"], (None, None, None, None))
        rows.append((st, d["city"], ts, d.get("pm25"), d.get("pm10"), d.get("no2"), d.get("co"),
                     d.get("so2"), d.get("nh3"), d.get("o3"), w[0], w[1], w[2], w[3]))

    conn = connect(); cur = conn.cursor()
    insert_rows(cur, "readings_hourly", cols, rows,
                conflict="(station_id, h) do update set "
                         "pm25=excluded.pm25, pm10=excluded.pm10, no2=excluded.no2, co=excluded.co, "
                         "so2=excluded.so2, nh3=excluded.nh3, o3=excluded.o3, ws=excluded.ws, "
                         "wd=excluded.wd, at_c=excluded.at_c, rh=excluded.rh")
    # keep the station registry current (new stations appear over time)
    st_rows = [(st, st, d["city"], None,
                float(d["lat"]) if d.get("lat") else None,
                float(d["lon"]) if d.get("lon") else None)
               for (st, _), d in by_station.items() if d.get("lat")]
    insert_rows(cur, "stations", ["station_id", "station_name", "city", "state", "lat", "lon"],
                st_rows, conflict="(station_id) do nothing")
    conn.commit()
    cur.execute("select count(*), max(h) from readings_hourly")
    n, latest = cur.fetchone()
    print(f"ingested {len(rows)} station-hours | table now {n} rows | latest {latest}")
    conn.close()
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"live ingest failed non-fatally: {type(e).__name__}: {e}")
        sys.exit(0)
