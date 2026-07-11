# VAYU-NET — AI-Powered Urban Air Quality Intelligence

Signal → Attribution → Forecast → Enforcement → Advisory, in under 60 seconds.
Multi-agent geospatial intelligence over India's CAAQMS network (Delhi · Bengaluru · Mumbai).

## Docs
- [Winning Plan](docs/00_WINNING_PLAN.md)
- [PRD](docs/01_PRD.md)
- [TRD](docs/02_TRD.md)

## Structure (per TRD)
`/etl` · `/models` · `/agents` · `/api` · `/web` · `/data` · `/prompts` · `/docs`

## Data
Primary dataset: [Vonter/india-cpcb-aqi](https://github.com/Vonter/india-cpcb-aqi) (ODbL).

## Run locally

```bash
pip install -r requirements.txt
python etl/fetch_data.py          # pulls all open data (git-based, no keys)
python etl/build_backbone.py      # builds data/vayu.duckdb + build_report.json
python models/forecast.py         # trains + backtests (writes forecast_metrics.json)
python models/attribution.py      # detects + attributes events
python agents/enforcement.py      # ranks actions, sample evidence pack PDF
python etl/export_geo.py          # exports frontend demo snapshot
uvicorn api.main:app --port 8000  # API
cd web && npm install && npm run dev   # frontend (VITE_API_URL=http://localhost:8000)
```

## Deploy

- **Frontend (Vercel):** Import the GitHub repo in Vercel → Root Directory: `Urban Air Hack/web` → framework auto-detects Vite. Set env `VITE_API_URL` to the Railway URL. Without it the app runs in demo-snapshot mode (fully functional replay data, precomputed).
- **API (Railway):** New project → Deploy from GitHub → Root Directory: `Urban Air Hack` → uses `railway.toml`/`Procfile`. Set env `ANTHROPIC_API_KEY` (advisory translations; budget-guarded at $10).

## Honesty & data integrity

- Station coordinates: accepted only when two independent data.gov.in snapshots agree (444 verified; 0 conflicts; see `data/build_report.json`).
- Forecast accuracy: strict time-split backtest, test window contains the NYE spike (hardest case). Model RMSE 52.5 vs persistence 79.2 at 24h. See `data/forecast_metrics.json`.
- Attribution: evidence-weighted likelihood with confidence scores and visible evidence bullets; the LLM never chooses categories, only narrates/translates, with output validation + template fallback.
- Every UI claim joins back to `agent_log` / DuckDB tables.
