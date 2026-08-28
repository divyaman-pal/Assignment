# VAYU-NET — AI-Powered Urban Air Quality Intelligence

Signal → Attribution → Forecast → Enforcement → Advisory, in under 60 seconds.
Multi-agent geospatial intelligence over India's CAAQMS network (Delhi · Bengaluru · Mumbai).

## Docs
- [Operations runbook](docs/OPERATIONS.md) — deploy, keep the feed alive, health checks, onboarding a city
- [Winning Plan](docs/00_WINNING_PLAN.md)
- [PRD](docs/01_PRD.md)
- [TRD](docs/02_TRD.md)

## Structure (per TRD)
`/etl` · `/models` · `/agents` · `/api` · `/web` · `/data` · `/prompts` · `/docs`

## Data
Primary dataset: [Vonter/india-cpcb-aqi](https://github.com/Vonter/india-cpcb-aqi) (ODbL).

## Run locally

**API only** (reads the live Supabase store — this is what the deployed platform runs):

```bash
pip install -r requirements.txt
uvicorn service.live_api:app --reload --port 8000
cd web && npm install && npm run dev   # frontend (VITE_API_URL=http://localhost:8000)
```

**Full pipeline** (rebuilds the episode backbone, models and demo snapshot):

```bash
pip install -r requirements-pipeline.txt
python etl/fetch_data.py          # pulls all open data (git-based, no keys)
python etl/build_backbone.py      # builds data/vayu.duckdb + build_report.json
python etl/apply_pois.py          # ward vulnerability counts from OSM
python models/forecast.py         # trains + backtests (writes forecast_metrics.json)
python models/attribution.py      # detects + attributes events
python agents/enforcement.py      # ranks actions, sample evidence pack PDF
python etl/make_serve.py          # slims backbone -> data/vayu_serve.duckdb
python etl/export_geo.py          # exports frontend demo snapshot
python etl/export_static_api.py   # replay timelines, evidence packs, advisories
```

## Deploy

Both halves run on Vercel; the API is serverless and reads Supabase, so no
always-on server is involved.

- **Frontend (Vercel):** project `vayu-net` → Root Directory `web` → framework auto-detects Vite. Set env `VITE_API_URL` to the API deployment URL. Without it the app runs in demo-snapshot mode (fully functional replay data, precomputed).
- **API (Vercel):** project `vayu-net-api` → repo root → `vercel.json` routes every path to `api/index.py`, which re-exports the FastAPI app from `service/live_api.py`. Set env `SUPABASE_DB_URL` and `ANTHROPIC_API_KEY` (advisory translations; budget-guarded at $10).
- **Hourly ingest (primary):** Supabase `pg_cron` calls `POST /ingest` every hour. data.gov.in serves only the current hour and nothing can backfill a missed one, so cadence is the thing that decides whether the platform works. See [OPERATIONS.md](docs/OPERATIONS.md).
- **Hourly ingest (secondary):** `.github/workflows/live-hourly.yml` (cron `10 * * * *`) pulls CPCB + Open-Meteo + NASA FIRMS into Supabase and reruns the agent chain, then runs `deploy/verify_live.py` end to end.
- **Weekly rebuild:** `.github/workflows/main.yml` retrains the forecast models and refreshes the bundled demo snapshot. It is a batch job — the live platform does not depend on it.

Both workflow files live at the **repository root**, not inside this directory:
GitHub only reads `.github/workflows/` at the root of the repo.

## Station identity

One physical sensor, one `station_id`. The CPCB archive keys stations as
`site_NNN` and carries the readable name in `station_name`; the data.gov.in live
feed supplies only that name. `etl/station_identity.py` maps an incoming feed
name back onto the archive id (exact name, then locality + coordinates), so live
readings extend that sensor's history instead of starting a parallel row.

This matters beyond tidiness: ward assignment lives on the station row, and the
enforcement agent can only rank a ward it can join to. A station without a ward
is invisible to enforcement no matter how bad its air is. New stations are
ward-mapped at ingest by `etl/wards_geo.py` (point-in-polygon, no geo deps), and
any station still unmapped is retried every cycle.

`etl/migrate_station_identity.py` performs the one-off merge for a store that
already accumulated duplicates. It is idempotent; run it with `--dry-run` first.

## Honesty & data integrity

- Station coordinates: accepted only when two independent data.gov.in snapshots agree (444 verified; 0 conflicts; see `data/build_report.json`).
- Forecast accuracy: strict time-split backtest, test window contains the NYE spike (hardest case). The 6/12/24h horizons beat persistence by 30-50%; 48h and 72h are trained but have no honest test window on a one-week dataset, and the UI prints that instead of blank cells. Exact figures move with each retrain — read them from `data/forecast_metrics.json` (served at `/metrics`) rather than from prose.
- Attribution: evidence-weighted likelihood with confidence scores and visible evidence bullets; the LLM never chooses categories, only narrates/translates, with output validation + template fallback.
- Freshness is measured, not asserted. `/live` and `/health` report `age_hours`
  computed against the database clock, and the UI prints that age. The banner
  never claims a refresh cadence it cannot verify.
- Enforcement ranks the live window and the historical episode as two separate
  pools (`actions.era`). Sharing one pool let the December crisis outrank every
  current event permanently, so the live view could never surface an action.
- The satellite fire layer reports its real state (`live` / `archive-only`).
  Detections are written to the store, not only to a CSV in the CI runner —
  a file written there never reaches the deployed function.
- Every UI claim joins back to `agent_log` / the live store.

## Verifying a deployment

```bash
python deploy/verify_live.py    # asserts, not just smoke tests; runs in CI hourly
```

It fails the build on: a band assigned to a null AQI, the same sensor under two
id schemes, a missing live/episode action split, an action published at priority
zero, absent freshness reporting, a missing inventory table, or spend
bookkeeping and translation validation that would silently discard a paid
result. The hourly run costs nothing — set `VAYU_VERIFY_LLM=1` for a real
translation round trip on demand.
