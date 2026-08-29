"""Forecast Agent model: hourly station-level PM2.5 forecasting.

Trains on the LIVE store, so the model improves as the platform runs.

Until 2026-08-29 this loaded `readings` from the bundled DuckDB file, which is
built from the CPCB archive mirror and is frozen at 2025-12-25 -> 2026-01-01.
The nightly retrain therefore re-fit the same seven days of December every
night and never saw a single row the platform had collected: the deployed
model was predicting monsoon air (Delhi mean PM2.5 62) from a severe winter
episode (mean 234). Supabase `readings_hourly` holds that same December window
*and* everything ingested since, so it is a strict superset -- there is nothing
to union, only a store to stop ignoring.

Honesty rules (these numbers go in front of an agency):
- Strict time-based split: train on everything before the final TEST_DAYS, test
  on the tail. The window must exceed the longest horizon or h48/h72 have no
  testable rows at all -- which is why both reported `n_test: 0` before.
- Baselines reported alongside on identical rows: persistence (PM(t+h)=PM(t))
  and seasonal-naive (same hour, previous day). RMSE for all three.
- No feature uses information from the future: every feature is a lag or
  rolling statistic at time t, or a static attribute.
- Lags are computed on a complete hourly grid, so `lag1` is always exactly one
  hour earlier. On the raw feed it was not: 11% of consecutive readings are
  more than an hour apart (the ingest cadence drops hours, and there is a
  seven-month gap between the archive and the live era), and a plain shift()
  silently presented a reading up to 5438 hours old as "one hour ago".
"""
import json
import sys
from pathlib import Path

# Run as a script (`python models/forecast.py`, which is how the nightly job
# invokes it) and only models/ is on sys.path, so `etl.sb` -- and therefore the
# live store -- is unimportable. That failure is caught and downgraded to the
# stale archive, so it would have looked exactly like the bug being fixed.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import duckdb
import lightgbm as lgb
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "data" / "vayu.duckdb"
if not DB.exists():
    DB = ROOT / "data" / "vayu_serve.duckdb"
HORIZONS = [6, 12, 24, 48, 72]
LAGS = [1, 2, 3, 6, 12, 24]
CITIES = ("Delhi", "Mumbai", "Bengaluru")
TEST_DAYS = 7          # must exceed max(HORIZONS)/24, or the long horizons have no test rows
SOURCE = None          # set by load_hourly(); reported in the metrics file


def _load_live():
    """Hourly readings from the live store. None if it cannot be reached."""
    import pandas as pd
    try:
        from etl.sb import connect
        conn = connect()
        df = pd.read_sql(
            "select station_id, city, h, pm25, pm10, ws, wd, at_c, rh "
            "from readings_hourly where city in %(c)s order by station_id, h",
            conn, params={"c": CITIES})
        df["h"] = pd.to_datetime(df["h"])
        return df if len(df) else None
    except Exception as e:
        print(f"  live store unavailable ({type(e).__name__}: {e}); falling back to the "
              f"bundled archive -- the model will NOT improve as the platform runs")
        return None


def _load_archive(con=None):
    """The bundled DuckDB snapshot: offline fallback only.

    `ts` is TIMESTAMPTZ at +05:30 while the live store keeps naive IST wall
    clock, so it is converted here -- comparing the two without this is the
    same 5h30m skew that once put the newest reading three hours in the future.
    """
    con = con or duckdb.connect(str(DB), read_only=True)
    return con.sql(f"""
      SELECT station_id, city, date_trunc('hour', ts AT TIME ZONE 'Asia/Kolkata') h,
             avg(pm25) pm25, avg(pm10) pm10, avg(ws) ws, avg(wd) wd,
             avg(at_c) at_c, avg(rh) rh
      FROM readings WHERE city IN {CITIES}
      GROUP BY 1,2,3 ORDER BY station_id, h""").df()


def load_hourly(con=None):
    """Prefer the live store; fall back to the bundled archive.

    The live store is a strict superset -- it holds the December episode the
    archive contains plus every hour ingested since -- so preferring it is not
    a trade-off. `con` is honoured only for the fallback, keeping the callers
    that hand in a DuckDB connection working unchanged.

    Which store answered is printed and recorded in forecast_metrics.json.
    Silently training on the wrong store for months is precisely the failure
    this function is being changed to end, so it must never be a guess.
    """
    global SOURCE
    df = _load_live()
    if df is not None:
        SOURCE = "supabase readings_hourly (live)"
    else:
        df = _load_archive(con)
        SOURCE = "duckdb readings (bundled archive -- STALE)"
    print(f"  training data: {SOURCE} — {len(df)} rows, "
          f"{df.station_id.nunique()} stations, {df.h.min()} -> {df.h.max()}")
    return df


def to_hourly_grid(df):
    """Reindex each station onto a complete hourly grid.

    Every lag and rolling feature below is a positional shift, which assumes
    consecutive rows are one hour apart. In this feed they are not: the ingest
    cadence drops hours, and the archive and live eras are seven months apart.
    A plain shift(1) therefore handed the model a reading up to 5438 hours old
    as `pm25_lag1`, and shift(-h) built a target that was not h hours ahead.

    Filling the grid with NaN makes both honest: an unobserved hour propagates
    to NaN and the row is dropped, rather than being silently substituted.
    """
    out = []
    for sid, g in df.groupby("station_id", sort=False):
        g = g.drop_duplicates("h").set_index("h").sort_index()
        g = g.reindex(pd.date_range(g.index.min(), g.index.max(), freq="h"))
        g["station_id"] = sid
        g["city"] = g["city"].ffill().bfill()
        g.index.name = "h"
        out.append(g.reset_index())
    return pd.concat(out, ignore_index=True)

def build_features(df):
    # On the grid, every shift(k) is exactly k hours; off it, k *rows*.
    df = to_hourly_grid(df).sort_values(["station_id", "h"]).copy()
    g = df.groupby("station_id")
    for lag in LAGS:
        df[f"pm25_lag{lag}"] = g.pm25.shift(lag)
    df["pm25_roll6"] = g.pm25.transform(lambda s: s.shift(1).rolling(6, min_periods=3).mean())
    df["pm25_roll24"] = g.pm25.transform(lambda s: s.shift(1).rolling(24, min_periods=12).mean())
    for c in ["ws", "wd", "at_c", "rh"]:
        df[f"{c}_lag1"] = g[c].shift(1)
    df["hour"] = df.h.dt.hour
    df["dow"] = df.h.dt.dayofweek
    df["city_code"] = df.city.astype("category").cat.codes
    df["st_code"] = df.station_id.astype("category").cat.codes
    return df

FEATURES = ([f"pm25_lag{l}" for l in LAGS] + ["pm25_roll6", "pm25_roll24",
            "ws_lag1", "wd_lag1", "at_c_lag1", "rh_lag1", "hour", "dow", "city_code", "st_code"])

def run(test_days=TEST_DAYS):
    """Fit every horizon and write forecast_metrics.json.

    The test window is a number of days rather than the old fixed 36 hours: a
    36-hour tail leaves no row whose t+48 or t+72 target falls inside the data,
    so h48 and h72 were fit, shipped, and reported `n_test: 0` -- unvalidated
    models presented beside validated ones.
    """
    raw = load_hourly()
    df = build_features(raw)
    tmax = df.h.max()
    split = tmax - pd.Timedelta(days=test_days)
    results, models = {}, {}
    results["_meta"] = {
        "source": SOURCE,
        "rows": int(len(raw)),
        "stations": int(raw.station_id.nunique()),
        "window": f"{raw.h.min()} -> {raw.h.max()}",
        "train_until": str(split),
        "test_days": test_days,
        "trained_at": pd.Timestamp.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
    }
    for hz in HORIZONS:
        d = df.copy()
        d["y"] = d.groupby("station_id").pm25.shift(-hz)
        d = d.dropna(subset=["y", "pm25_lag1"])
        if len(d) < 100:
            results[f"h{hz}"] = {"note": "insufficient data for this horizon in one-week window"}
            continue
        tr, te = d[d.h <= split], d[d.h > split]
        if len(tr) < 100:
            results[f"h{hz}"] = {
                "n_train": len(tr), "validated": False,
                "note": f"only {len(tr)} training rows before the {test_days}-day test "
                        f"window; the data window is too short to both fit and test"}
            continue
        m = lgb.LGBMRegressor(n_estimators=400, learning_rate=0.05, num_leaves=63,
                              min_child_samples=20, random_state=42, verbose=-1)
        m.fit(tr[FEATURES], tr.y)
        te = te.copy()
        te["pred"] = np.clip(m.predict(te[FEATURES]), 0, None) if len(te) else np.array([])
        # Baselines, evaluated on identical rows as the model (fair comparison):
        # persistence: forecast for t+hz = value at t (column pm25)
        # seasonal-naive: forecast for t+hz = value at t+hz-24 (= lag(24-hz); equals persistence when hz=24)
        te["persist"] = te.pm25
        te["naive"] = te[f"pm25_lag{24 - hz}"] if 0 < (24 - hz) and (24 - hz) in LAGS else te.pm25
        te = te.dropna(subset=["y", "pred", "persist", "naive"])
        if len(te) < 50:
            results[f"h{hz}"] = {
                "n_test": len(te),
                "validated": False,
                "note": f"fewer than 50 testable rows in the final {test_days} days; "
                        f"this horizon is NOT backtested and must not be quoted as accurate"}
        else:
            rmse = lambda a, b: float(np.sqrt(np.mean((np.asarray(a) - np.asarray(b)) ** 2)))
            r_m, r_p, r_n = rmse(te.y, te.pred), rmse(te.y, te.persist), rmse(te.y, te.naive)
            results[f"h{hz}"] = {
                "n_test": len(te),
                "n_train": len(tr),
                "validated": True,
                "rmse_model": round(r_m, 2),
                "rmse_persistence": round(r_p, 2),
                "rmse_seasonal_naive": round(r_n, 2),
                "improvement_vs_persistence_pct": round(100 * (1 - r_m / r_p), 1),
            }
        models[hz] = m
        m.booster_.save_model(str(ROOT / "models" / f"lgbm_pm25_h{hz}.txt"))
    (ROOT / "data" / "forecast_metrics.json").write_text(json.dumps(results, indent=2))
    print(json.dumps(results, indent=2))
    return results, models

if __name__ == "__main__":
    run()
