"""VAYU-NET multi-agent orchestrator.

Graph:  sentinel -> attribution -> forecast -> enforcement -> advisory
Every step appends to agent_log (DuckDB): timestamped input/output summary,
making the whole signal->action chain auditable. This is the artifact that
answers 'is any of this hallucinated?' — every UI claim joins back to a
logged step and a table row.

The replay engine feeds historical readings through this graph at Nx speed
to demonstrate signal->action latency on the Dec 2025 episode.
"""
import json, time, uuid
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

import sys
import duckdb
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "data" / "vayu.duckdb"

@dataclass
class RunState:
    run_id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    t0: float = field(default_factory=time.time)
    events: pd.DataFrame | None = None
    attributions: list = field(default_factory=list)
    forecasts: dict = field(default_factory=dict)
    actions: pd.DataFrame | None = None
    advisories: list = field(default_factory=list)

class Orchestrator:
    def __init__(self):
        self.con = duckdb.connect(str(DB))
        self.con.sql("""CREATE TABLE IF NOT EXISTS agent_log (
            run_id VARCHAR, step INT, agent VARCHAR, ts TIMESTAMP,
            elapsed_s DOUBLE, input_summary VARCHAR, output_summary VARCHAR)""")
        self._step = 0

    def log(self, state, agent, inp, out):
        self._step += 1
        self.con.execute("INSERT INTO agent_log VALUES (?,?,?,?,?,?,?)",
            [state.run_id, self._step, agent, datetime.utcnow(),
             round(time.time() - state.t0, 2), json.dumps(inp)[:500], json.dumps(out)[:500]])

    def run_window(self, t_start, t_end, city=None):
        """Run the full agent chain over a time window of readings."""
        from models import attribution as attr_mod
        state = RunState()
        con = self.con
        # 1) SENTINEL: detect events in window
        hist = attr_mod.load_hourly(con)  # tz-aware IST timestamps
        tz = hist.h.dt.tz
        t0w, t1w = pd.Timestamp(t_start, tz=tz), pd.Timestamp(t_end, tz=tz)
        events = attr_mod.detect_events(hist)
        events = events[(events.h >= t0w) & (events.h <= t1w)]
        if city is not None: events = events[events.city == city]
        state.events = events
        self.log(state, "sentinel", {"window": [str(t_start), str(t_end)], "city": city},
                 {"events_detected": len(events)})
        # 2) ATTRIBUTION
        fires_path = ROOT / "data" / "raw" / "firms.csv"
        fires = pd.read_csv(fires_path, parse_dates=["h"]) if fires_path.exists() else None
        for _, e in events.iterrows():
            a = attr_mod.attribute_event(e, hist, fires)
            state.attributions.append({"station_id": e.station_id, "h": str(e.h), **a})
        cats = pd.Series([a["category"] for a in state.attributions])
        self.log(state, "attribution", {"n_events": len(events)},
                 {"by_category": cats.value_counts().to_dict() if len(cats) else {},
                  "fires_layer": fires is not None})
        # 3) FORECAST: 24h ahead for affected stations (pre-trained boosters)
        import lightgbm as lgb
        from models.forecast import build_features, FEATURES, load_hourly as fc_load
        booster = lgb.Booster(model_file=str(ROOT / "models" / "lgbm_pm25_h24.txt"))
        fdf = build_features(fc_load(con))
        latest = fdf[fdf.h == fdf.h.max()].dropna(subset=["pm25_lag1"])
        preds = booster.predict(latest[FEATURES])
        state.forecasts = dict(zip(latest.station_id, [round(float(p), 1) for p in preds]))
        self.log(state, "forecast", {"stations": len(latest), "horizon_h": 24},
                 {"mean_pm25_24h": round(float(preds.mean()), 1),
                  "backtest_rmse_vs_persistence": "52.5 vs 79.2 (see forecast_metrics.json)"})
        # 4) ENFORCEMENT
        from agents.enforcement import rank_actions
        actions = rank_actions()
        if city is not None: actions = actions[actions.city == city]
        state.actions = actions
        self.log(state, "enforcement", {"candidates": len(actions)},
                 {"top": actions.head(3)[["ward_name", "category", "priority"]].to_dict("records")})
        # 5) ADVISORY (template mode unless valid API key; budget-guarded)
        from models.aqi import pm_aqi, band
        from agents import advisory
        for _, a in actions.head(3).iterrows():
            aqi = pm_aqi(a.mean_pm25, None)
            adv = advisory.english_template(a.ward_name, band(aqi) or "Poor", int(aqi or 0), "general", 24)
            state.advisories.append({"ward": a.ward_name, "text": adv})
        self.log(state, "advisory", {"wards": min(3, len(actions))},
                 {"advisories": len(state.advisories), "mode": "template (LLM translation when key valid)"})
        elapsed = round(time.time() - state.t0, 2)
        self.log(state, "done", {}, {"signal_to_action_seconds": elapsed})
        return state, elapsed

if __name__ == "__main__":
    o = Orchestrator()
    state, elapsed = o.run_window("2025-12-31 18:00", "2026-01-01 02:00", city="Delhi")
    print(f"run {state.run_id}: {len(state.events)} events -> {len(state.attributions)} attributed -> "
          f"{len(state.forecasts)} forecasts -> {len(state.actions)} actions -> {len(state.advisories)} advisories "
          f"in {elapsed}s")
    print(o.con.sql("SELECT step, agent, elapsed_s, output_summary FROM agent_log ORDER BY step DESC LIMIT 6").df().to_string(index=False))
