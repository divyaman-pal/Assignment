"""Forecast Agent model: hourly station-level PM2.5 forecasting, 24h ahead.

Honesty rules (these numbers go in front of judges):
- Strict time-based split: train on the first part of the window, test on the
  final 36 hours (which contain the hardest event: the NYE fireworks spike).
- Baselines reported alongside: persistence-24h (AQI(t+24)=AQI(t)) and
  seasonal-naive (same hour, previous day). We report RMSE for all three.
- No feature uses information from the future (verified by construction:
  every feature is a lag/rolling stat at time t or a static attribute).
"""
import json
from pathlib import Path

import duckdb
import lightgbm as lgb
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "data" / "vayu.duckdb"
HORIZONS = [6, 12, 24]
LAGS = [1, 2, 3, 6, 12, 24]

def load_hourly(con=None):
    con = con or duckdb.connect(str(DB), read_only=True)
    df = con.sql("""
      SELECT station_id, city, date_trunc('hour', ts) h,
             avg(pm25) pm25, avg(pm10) pm10, avg(ws) ws, avg(wd) wd,
             avg(at_c) at_c, avg(rh) rh
      FROM readings WHERE city IN ('Delhi','Mumbai','Bengaluru')
      GROUP BY 1,2,3 ORDER BY station_id, h""").df()
    return df

def build_features(df):
    df = df.sort_values(["station_id", "h"]).copy()
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

def run(train_frac_hours=36):
    df = build_features(load_hourly())
    tmax = df.h.max()
    split = tmax - pd.Timedelta(hours=train_frac_hours)
    results, models = {}, {}
    for hz in HORIZONS:
        d = df.copy()
        d["y"] = d.groupby("station_id").pm25.shift(-hz)
        d = d.dropna(subset=["y", "pm25_lag1"])
        tr, te = d[d.h <= split], d[d.h > split]
        m = lgb.LGBMRegressor(n_estimators=400, learning_rate=0.05, num_leaves=63,
                              min_child_samples=20, random_state=42, verbose=-1)
        m.fit(tr[FEATURES], tr.y)
        te = te.copy()
        te["pred"] = np.clip(m.predict(te[FEATURES]), 0, None)
        # Baselines, evaluated on identical rows as the model (fair comparison):
        # persistence: forecast for t+hz = value at t (column pm25)
        # seasonal-naive: forecast for t+hz = value at t+hz-24 (= lag(24-hz); equals persistence when hz=24)
        te["persist"] = te.pm25
        te["naive"] = te[f"pm25_lag{24 - hz}"] if 0 < (24 - hz) and (24 - hz) in LAGS else te.pm25
        te = te.dropna(subset=["y", "pred", "persist", "naive"])
        rmse = lambda a, b: float(np.sqrt(np.mean((np.asarray(a) - np.asarray(b)) ** 2)))
        r_m, r_p, r_n = rmse(te.y, te.pred), rmse(te.y, te.persist), rmse(te.y, te.naive)
        results[f"h{hz}"] = {
            "n_test": len(te),
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
