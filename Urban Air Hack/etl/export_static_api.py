"""Export everything the frontend needs as STATIC files, so the platform runs
with no backend at all (single-host deployment on Vercel).

Produces, under web/public/demo/:
  replay_<city>.json   pre-computed war-room replay timeline (real agent run)
  packs/pack_<id>.pdf  evidence packs for every ranked action
  advisories.json      CPCB-template advisories for the top wards x groups
"""
import json, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
OUT = ROOT / "web" / "public" / "demo"
PACKS = OUT / "packs"

def main():
    OUT.mkdir(parents=True, exist_ok=True); PACKS.mkdir(exist_ok=True)
    from agents.orchestrator import Orchestrator
    from agents.enforcement import evidence_pack
    from agents.advisory import english_template, GROUP_ACTIONS
    from models.aqi import pm_aqi, band
    import duckdb

    # 1) Replay timelines — a genuine agent run per city, frozen to JSON
    for city, window in [("Delhi", ("2025-12-31 18:00", "2026-01-01 02:00")),
                         ("Mumbai", ("2025-12-26 00:00", "2026-01-01 00:00")),
                         ("Bengaluru", ("2025-12-26 00:00", "2026-01-01 00:00"))]:
        o = Orchestrator()
        state, elapsed = o.run_window(window[0], window[1], city=city)
        log = o.con.execute(
            "SELECT step, agent, elapsed_s, input_summary, output_summary FROM agent_log "
            "WHERE run_id = ? ORDER BY step", [state.run_id]).df()
        payload = {"run_id": state.run_id, "elapsed_s": elapsed,
                   "events": len(state.events),
                   "actions": 0 if state.actions is None else len(state.actions),
                   "advisories": state.advisories,
                   "log": json.loads(log.to_json(orient="records")),
                   "window": window, "city": city,
                   "note": "Pre-computed from a real agent run; timings are as measured."}
        (OUT / f"replay_{city.lower()}.json").write_text(json.dumps(payload))
        print(f"replay_{city.lower()}.json: {payload['events']} events, {elapsed}s")
        o.con.close()

    # 2) Evidence packs for every action
    db = ROOT / "data" / "vayu.duckdb"
    if not db.exists(): db = ROOT / "data" / "vayu_serve.duckdb"
    con = duckdb.connect(str(db), read_only=True)
    ids = [r[0] for r in con.sql("SELECT action_id FROM actions ORDER BY action_id").fetchall()]
    made = 0
    for aid in ids:
        try:
            p = evidence_pack(aid, con=con)
            shutil.copy(p, PACKS / f"pack_{aid}.pdf"); made += 1
        except Exception as e:
            print(f"  pack {aid} failed: {e}")
    print(f"packs: {made}/{len(ids)}")

    # 3) Advisories (CPCB templates) for ranked wards x groups
    adv = {}
    rows = con.sql("SELECT action_id, city, ward_name, mean_pm25 FROM actions").fetchall()
    for aid, city, ward, pm in rows:
        aqi = pm_aqi(pm, None) or 0
        b = band(aqi) or "Poor"
        for g in GROUP_ACTIONS:
            adv[f"{aid}|{g}"] = {"ward": ward, "city": city, "aqi": round(aqi),
                                 "band": b, "group": g,
                                 "text": english_template(ward, b, round(aqi), g, 24)}
    (OUT / "advisories.json").write_text(json.dumps(adv))
    print(f"advisories.json: {len(adv)} entries")
    con.close()

if __name__ == "__main__":
    main()
