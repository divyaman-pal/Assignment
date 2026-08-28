# VAYU-NET — operations runbook

Everything needed to run this for someone else: what the pieces are, how to
deploy from nothing, what has to stay running, and how to tell when it hasn't.

## Architecture

```
data.gov.in (CPCB)  ─┐
Open-Meteo (wind)   ─┼─► ingest ─► Supabase Postgres ─► FastAPI (Vercel) ─► React (Vercel)
NASA FIRMS (fires)  ─┘              readings_hourly        /live /cities/*      map, actions,
                                    stations, wards        /compare /metrics    citizen mode
                                    attributions           /ingest /replay
                                    actions, fires
                                    agent_log, llm_spend

agent chain (runs after every ingest):
  sentinel ─► attribution ─► enforcement ─► advisory ─► agent_log
```

Two deploy targets, one repo:

| Piece | Vercel project | Root | Notes |
|---|---|---|---|
| Frontend | `vayu-net` | `web` | Vite/React. Needs `VITE_API_URL` |
| API | `vayu-net-api` | repo root | `vercel.json` routes everything to `api/index.py` |

The frontend works with no backend at all: without `VITE_API_URL` it falls back
to the bundled snapshot in `web/public/demo/`. Useful for offline demos.

## Deploying from scratch

1. **Database.** Create a Supabase project. Load the seed from
   `data/supabase_load/*.json` (stations, wards, readings, attributions,
   actions). Then run once:

   ```bash
   python etl/migrate_station_identity.py --dry-run   # inspect
   python etl/migrate_station_identity.py             # merge + ward backfill
   ```

2. **API project.** Root = repo root. Env: `SUPABASE_DB_URL`,
   `ANTHROPIC_API_KEY`, `DATA_GOV_IN_KEY`, `INGEST_TOKEN`.

3. **Frontend project.** Root = `web`. Env: `VITE_API_URL` = the API URL.

4. **Ingest schedule.** See below — this is the part that actually matters.

5. **Verify.** `python deploy/verify_live.py` — asserts every endpoint and
   fails on the specific regressions listed at the bottom of this file.

## Keeping the feed alive

**This is the single thing that determines whether the platform is useful.**
data.gov.in serves only the *current* hour. A missed hour is gone permanently:
there is no backfill source (the CPCB archive mirror's "latest" window lags by
months). Detection needs a baseline, so a sparse feed means no events, which
means no enforcement actions, however good the models are.

Observed on GitHub's free scheduler: hours captured per day fell from 17-20 to
1-3 over a week. Do not depend on it alone.

### Primary: Supabase `pg_cron` (recommended)

Runs on infrastructure you already have. No third-party account.

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- token lives in a table, not in the job body: cron.job is readable by anyone
-- who can query the database
create table if not exists ops_config (key text primary key, value text);
insert into ops_config(key, value) values
  ('ingest_url',   'https://<your-api>.vercel.app/ingest'),
  ('ingest_token', '<INGEST_TOKEN>')
on conflict (key) do update set value = excluded.value;

create or replace function public.vayu_hourly_ingest() returns bigint
language sql security definer as $$
  select net.http_post(
    url := (select value from ops_config where key = 'ingest_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select value from ops_config where key = 'ingest_token')),
    timeout_milliseconds := 55000)
$$;

select cron.schedule('vayu-hourly-ingest', '5 * * * *',
                     'select public.vayu_hourly_ingest()');
```

Check it is firing:

```sql
select * from cron.job;                                    -- is it scheduled and active
select status, start_time from cron.job_run_details        -- did it run
  order by start_time desc limit 10;
select id, status_code, left(content, 120) from net._http_response  -- what came back
  order by id desc limit 5;
```

### Secondary: GitHub Actions

`.github/workflows/live-hourly.yml` (repo **root**, not inside `Urban Air Hack/`)
does the same work plus the FIRMS pull and the end-to-end verification. Keep it —
it is the belt to pg_cron's braces, and it is where `verify_live.py` runs. Just
do not rely on its timing.

### Manual

```bash
curl -X POST -H "Authorization: Bearer $INGEST_TOKEN" https://<api>/ingest
```

Roughly 15s: pulls the hour, upserts, reruns the agent chain, returns a summary.

## Secrets

| Name | Used by | Purpose |
|---|---|---|
| `SUPABASE_DB_URL` | API, CI | Postgres connection |
| `DATA_GOV_IN_KEY` | ingest | CPCB real-time feed |
| `INGEST_TOKEN` | API, cron | Bearer token for `POST /ingest` |
| `ANTHROPIC_API_KEY` | API | Advisory translation only |
| `NASA_FIRMS_API_KEY` | CI | Satellite fire detections |

### Where the API reads secrets from

`INGEST_TOKEN` and `DATA_GOV_IN_KEY` resolve **environment first, then the
`ops_config` table** (`etl/ops.py`). Everything else is environment-only.

That fallback exists because a Vercel environment variable is applied only at
build time and only to the project that owns the deployment, so a value saved
against the wrong project reads exactly like a value never set — the function
sees an empty string and the dashboard still shows the variable present. Both
of these secrets were lost that way, each costing days to attribute.

**Rotating either one is now a single statement**, and the cron reads the same
row, so the two ends cannot drift apart:

```sql
update ops_config set value = '<new value>' where key = 'ingest_token';
```

No redeploy is needed — the value is cached per warm instance and re-read on the
next cold start. If you also set the Vercel env var, that wins; keep the two in
sync or set only the table.

`GET /health` reports `ingest_token_source` (`env` | `ops_config` | `unset` |
`unavailable`), so "saved in the dashboard" and "visible to the running code"
stay distinguishable. `ingest_configured: false` ⇒ `/ingest` returns 503 and is
inert.

LLM spend is capped at $10 (`agents/budget.py`) and tracked in the `llm_spend`
table. Only non-English advisories call the model; English is pure template. The
hourly verification deliberately does **not** make a paid call.

## Health

```bash
curl https://<api>/health
# {"ok":true,"readings":28146,"newest_reading":"...","age_hours":0.7,"feed":"current"}
```

`feed` is `current` (≤6h), `lagging` (≤24h) or `stale` (>24h). The UI banner
prints the same age, so a starved feed is visible rather than hidden.

| Symptom | Cause | Fix |
|---|---|---|
| `feed: stale` | ingest not firing | check `cron.job_run_details`, then `net._http_response` |
| Few or no events | sparse readings — see above | restore hourly cadence; the gap cannot be backfilled |
| No live actions, clean air | correct behaviour | wards below 60 µg/m³ PM2.5 are not enforcement matters |
| Advisory returns English | budget cap or validation | check `select * from llm_spend` |
| Fire layer `archive-only` | FIRMS pull not running | run `etl/fetch_fires_live.py`; it syncs to the store |
| `/ingest` returns 503 | token resolves nowhere | `select key from ops_config` — see `ingest_token_source` in `/health` |
| `/ingest` 200 with `reason: ... missing (source=unset)` | secret absent from env **and** `ops_config` | insert the row; no redeploy needed |
| A secret is set in Vercel but the function cannot see it | saved to the wrong project, or saved without a rebuild | put it in `ops_config` instead — that path is verifiable from SQL |

## Onboarding a city

1. Ward GeoJSON with `ward_id`, `name`, `schools`, `hospitals`, `industrial`,
   `construction` properties → `data/wards_geo/<slug>_wards.json` and
   `web/public/demo/<slug>_wards.json`.
2. Add the city to `CITIES` in `service/live_api.py`, `web/src/App.jsx`,
   `etl/ingest_live.py` and `etl/wards_geo.py`.
3. Load ward rows into the `wards` table.
4. Run the ingest — stations are discovered from the feed and ward-mapped
   automatically by point-in-polygon.

All data sources are national, so nothing else changes.

## What `verify_live.py` guards

Each assertion corresponds to a failure that reached production once:

- a band assigned to a null AQI (no-data sensors rendered "Severe")
- the same physical sensor under two id schemes (halves the ward mapping and
  makes enforcement structurally impossible)
- a missing live/episode action split (December's crisis outranks all current
  events forever)
- an action published at priority 0 (severity clipped — the air did not warrant
  enforcement, but a statutory citation was printed anyway)
- absent freshness reporting (banner showed build time, not data age)
- a missing inventory table (excluded from the serverless bundle)
- spend bookkeeping that does not persist, or a validator that rejects a correct
  Devanagari translation

## Known limits

- **PM-only AQI.** Sub-indices use PM2.5/PM10 only. Stated in the UI.
- **Attribution is evidence-weighted likelihood, not proof.** Confidence and the
  contributing evidence are always shown. The LLM never picks a category.
- **Secondary aerosol is invisible** to station-observational attribution. The
  Metrics tab compares against the CAQM inventory and says so.
- **48h/72h forecasts are trained but not backtested** on a one-week window.
  The UI prints that instead of a number.
- **Three cities.** The pipeline is city-agnostic; only config and boundaries
  are per-city.
