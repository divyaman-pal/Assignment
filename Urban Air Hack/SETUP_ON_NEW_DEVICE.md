# VAYU-NET — handover notes

Current as of `main` of `divyaman-pal/Assignment`, path `Urban Air Hack/`.

## Where the workflows actually live

`.github/workflows/` at the **repository root** — not inside `Urban Air Hack/`.
GitHub reads workflows only from the repo root. A copy kept under this directory
is inert; editing it changes nothing. The `Refresh air quality data` job failed
100% of its runs for two weeks because the fix had been applied to the inert
copy while the root file still installed the slim `requirements.txt` (no
`duckdb`, `lightgbm` or `shapely`) and died on import.

## Preferred way to move to the new device

Do **not** copy this folder. Clone instead — it is smaller and stays in sync:

```
git clone https://github.com/divyaman-pal/Assignment.git
cd "Assignment/Urban Air Hack"
```

Then copy across `.env` by hand (see "Secrets" below). It is gitignored and is
the only thing the clone will not give you.

## Secrets — read this before you share the folder

`.env` in this folder contains live credentials:

- `ANTHROPIC_API_KEY`
- `GITHUB_PAT` (write access to your repo)
- `SUPABASE_SERVICE_KEY` and `SUPABASE_DB_URL` (full database access)
- `VERCEL_API_TOKEN`, `VERCEL_TOKEN`
- `DATA_GOV_IN_KEY`, `NASA_FIRMS_API_KEY`

**Delete `.env` before putting this folder on a shared drive, Google Drive,
WhatsApp, email, or a USB stick that leaves your hands.** Anyone holding that
file can spend your Anthropic credit, push to your GitHub, and read or wipe the
Supabase database. If it does leak, rotate every key listed above.

The same values are already stored as GitHub Actions secrets and Vercel
environment variables, so the deployed system keeps running without the file.

## Stale files — removed

The Railway-era leftovers have now been deleted: `api/main.py` (superseded by
`api/index.py` + `service/live_api.py`), `railway.toml`, `Procfile`, every
`__pycache__/`, the 117 MB `data/.vayu.duckdb.ZNw9lI` temp file, the split
December FIRMS downloads (`firm_1.csv`, `firm_2.csv`, `PUT_FIRMS_CSV_HERE.txt`
— all merged into `data/raw/firms.csv`), and `data/packs/` (byte-identical to
`web/public/demo/packs/`, which is the copy the frontend serves).

Still true, and still worth knowing: **`.git/` here is an empty stub, not a
working clone.** There is no local history, so nothing deleted in this folder is
recoverable. Clone from GitHub if you need history.

## Running it on the new device

```
# API (local)
pip install -r requirements.txt
uvicorn service.live_api:app --reload --port 8000

# Full pipeline (models, backtests, ETL)
pip install -r requirements-pipeline.txt

# Frontend
cd web && npm install && npm run dev
```

`web/.env` needs `VITE_API_URL=https://vayu-net-api-ver-tex.vercel.app`
(or `http://localhost:8000` when running the API locally).

## What is running unattended right now

| Piece | Where | Notes |
|---|---|---|
| Frontend | https://vayu-net-ten.vercel.app | Vercel project `vayu-net` |
| API | https://vayu-net-api-ver-tex.vercel.app | Vercel project `vayu-net-api`, entrypoint `api/index.py` |
| Database | Supabase `zdotoaqnybttrooqwygm` (ap-south-1) | `readings_hourly`, `stations`, `wards`, `attributions`, `actions`, `fires`, `agent_log`, `llm_spend` |
| Hourly ingest | root `.github/workflows/live-hourly.yml` | cron `10 * * * *` — CPCB via data.gov.in, Open-Meteo wind, NASA FIRMS, then the agent chain, then `deploy/verify_live.py` |
| Weekly rebuild | root `.github/workflows/main.yml` | Sundays — retrains forecasts, refreshes the demo snapshot. Batch only; the live path does not depend on it |

GitHub's scheduled runners are best-effort: the hourly cron has drifted to
9–13 hour gaps under load, and GitHub disables schedules entirely after 60 days
with no commits to the repo. The UI now prints the true age of the newest
reading, so a lagging feed is visible rather than hidden behind a "refreshed
hourly" label. `workflow_dispatch` is enabled on both jobs if you need to force
a run before a demo.

## Health check

```bash
curl -s https://vayu-net-api-ver-tex.vercel.app/health
# {"ok":true, ..., "age_hours":2.5, "feed":"current"}   # "lagging" >6h, "stale" >24h
```

If you move the repo to a different GitHub account, the Actions secrets and the
Vercel git integration both need to be reconnected, or live ingestion stops and
the feed goes stale within a few hours.
