# VAYU-NET — session handover

Updated 2026-08-29. Read this first to reload full context.

## Open item: the ward estimator is built and tested but NOT DEPLOYED

The citizen view showed the **city arithmetic mean** for every ward without a
sensor of its own — 251 of Delhi's 289 wards — rendered in 46px type under the
ward's own name, exactly like a real reading. On 2026-08-29 that meant those
wards displayed "AQI 130 · Moderate · reduce prolonged outdoor exertion" while
the sensor at Anand Vihar measured 448 Severe. The map was right and the
advisory was wrong, from the same store, at the same moment.

Fixed by `web/src/geo.js`: inverse-distance weighting over the nearest sensors
within 8 km, three explicit outcomes (`measured` / `estimated` / `unavailable`),
a ward with several sensors reporting the worst rather than the average, and a
worse-reading neighbour named in red instead of averaged away. Past 8 km no
number is shown at all. Delhi now resolves 39 measured / 248 estimated /
3 refused, with 115 distinct values instead of one repeated 130. Ward dropdowns
also carry the landmark (`I.P EXTENTION — Anand Vihar`), which is what made the
sensor unfindable: nobody searches for the municipal charge name.

**What is not done: the API half is not deployed.** `agents/advisory.py` and
`service/live_api.py` gained an `estimated` basis so an interpolated number is
never described as "measured now", and the endpoint echoes `basis` back. That
code is local only. `verify_live.py` passes because it drives a local
`TestClient(app)` against the remote database — it does **not** exercise the
deployed function, and this is a standing trap for anyone reading a green suite
as proof of what is live.

Until the API ships, the client refuses a server advisory whose `basis` does not
come back `estimated` and renders the local CPCB template instead, so the wrong
wording cannot reach a resident. **Deploy the API before the front end** —
that ordering keeps the guard from being needed.

```bash
node deploy/verify_ward_estimate.mjs      # 12 estimator assertions, incl. live data
PYTHONIOENCODING=utf-8 python -W ignore deploy/verify_live.py   # 17 checks, runs the above
```

## Status of everything else: no open items

The hourly ingest chain and the satellite fire sync are both closed and verified
end to end. `/health` reports `ingest_configured: true`; the Supabase cron fires
unattended and returns 200; the FIRMS step now reaches the live store.

```bash
curl -s https://vayu-net-api-ver-tex.vercel.app/health
# ingest_configured: true, ingest_token_source: "ops_config"
```

The FIRMS step was missing `SUPABASE_DB_URL`, so `push_to_store()` -- which
catches every exception so a satellite outage cannot fail the pipeline -- could
not reach the database and the fire layer would have stopped updating behind a
green check. Fixed by hand in the GitHub web UI, because `GITHUB_PAT` is
fine-grained without `workflow` scope and the `gh` login carries only
`gist, read:org, repo`; GitHub separates `workflow` from `repo` deliberately, so
neither credential can touch `.github/workflows/*`. Confirmed by the log line
`live store: fires table now 16939 detections`, which was absent from every
previous run. `verify_live.py` warns if the layer ever goes stale again.


The hourly ingest chain is closed and verified end to end. `/health` reports
`ingest_configured: true`, and `POST /ingest` returns `ok: true`.

```bash
curl -s https://vayu-net-api-ver-tex.vercel.app/health
# ingest_configured: true, ingest_token_source: "ops_config"
```

## What this is

VAYU-NET — multi-agent urban air quality intelligence over India's CPCB CAAQMS
network (Delhi, Mumbai, Bengaluru). Chain: signal → attribution → forecast →
enforcement → advisory.

| Piece | Where |
|---|---|
| Frontend | https://vayu-net-ten.vercel.app (Vercel project `vayu-net`, root `web`) |
| API | https://vayu-net-api-ver-tex.vercel.app (project `vayu-net-api`, repo root) |
| Database | Supabase `zdotoaqnybttrooqwygm` (ap-south-1) |
| Repo | `divyaman-pal/Assignment`, subdirectory `Urban Air Hack/` |

## How the ingest outage was actually resolved

The last session was chasing the wrong shape of fix. `INGEST_TOKEN` was set in
the Vercel dashboard repeatedly and never reached the running function, because
**a Vercel env var is applied only at build time and only to the project that
owns the deployment** — a value saved against the wrong project is byte-for-byte
indistinguishable, from inside the function, from one never set.

Fixing the token only surfaced the same bug one layer down: the very next call
failed on `DATA_GOV_IN_KEY`, lost the same way. Two secrets, same cause, each
costing days because the dashboard showed them present.

**The fix removes the failure mode instead of re-diagnosing it.** `etl/ops.py`
resolves a secret **environment first, then from the `ops_config` table**:

- It crosses no new trust boundary — anything reaching that table already holds
  the service-role DSN, without which it could not serve a request at all.
- It makes each secret single-sourced. The Supabase cron already read its copy
  of the token from `ops_config`, so both ends of the call now agree by
  construction and cannot drift apart.
- Rotation is one `UPDATE`, no redeploy.
- A correctly-configured environment still wins, at no round-trip cost.

`/health` reports `ingest_token_source` (`env` | `ops_config` | `unset` |
`unavailable`), so "saved in the dashboard" and "visible to the running code"
stay distinguishable — conflating those is what made the outage slow to
attribute.

Commits `e093e4e` (token) and `1bf7e41` (generalised to `etl/ops.py`,
`DATA_GOV_IN_KEY`, and the verification assertion).

### Note for whoever picks this up

`ANTHROPIC_API_KEY` and `SUPABASE_DB_URL` **are** correctly set on the API
deployment — only the two most recently added variables were lost. If a *new*
secret ever needs to reach the API, prefer `ops_config` over the dashboard: that
path is verifiable from SQL, and the dashboard path is not observable from here.

## Environment quirks that cost time — do not rediscover these

- **Neither Vercel token in `.env` can see the deployed projects.** They belong
  to `divyamanpal490@gmail.com` and `divyaman@elixiriq.net`; `vayu-net` and
  `vayu-net-api` live under a third account (`ver-tex`). Confirmed by listing
  projects on both. **You cannot set or read a Vercel env var from here** —
  which is exactly why the `ops_config` path exists.
- **Deploys are triggered by pushing to the repo**, which works fine via the
  GitHub Contents / Git Data API with `GITHUB_PAT` — no 512 MB clone needed. Use
  the Git Data API to land several files in one commit and one rebuild.
- **Workflows live at the REPO ROOT** `.github/workflows/`, not inside
  `Urban Air Hack/`. The copy in this folder is **inert**. A fix applied to the
  inert copy is why `main.yml` failed 19 consecutive runs.
- **This folder's `.git/` is an empty stub.** No history, nothing recoverable.
- **`GITHUB_PAT` has Contents:write but NOT Workflows or Actions.** Code pushes
  work; editing `.github/workflows/*` is rejected and `workflow_dispatch` 403s.
- **Git Bash `/tmp` and Python `/tmp` are different directories on Windows**
  (`C:\Users\...\AppData\Local\Temp` vs `C:\tmp`). Passing `/tmp/x` between a
  shell heredoc and a Python script silently writes and reads two files.
- **Windows/Python encoding:** always pass `encoding="utf-8"` to
  `read_text`/`write_text`, and `PYTHONIOENCODING=utf-8` when printing Devanagari.
  Default cp1252 silently corrupts em-dashes in source files.
- **Repo has CRLF checked out** (`.gitattributes`), local folder is LF. Most
  files "differ" by line endings only — diff with `tr -d '\r'` before believing
  a change is real.
- **Screenshots of the live site are flaky** (WebGL map keeps the renderer busy).
  Use `get_page_text`. Repeated reloads in one tab exhaust WebGL contexts and the
  map goes blank — a browser artifact, not a bug. Use a fresh tab.
- **Click by `ref` not coordinates** — the viewport is 2552x1300 but screenshots
  come back 1540x784, so coordinate clicks miss.

## What was broken earlier, and what fixed it

**Root cause of most of it — duplicate station identity.** The CPCB archive keys
sensors `site_NNN` with the readable name in `station_name`; the data.gov.in feed
gives only the name, which ingest wrote straight into `station_id`. Every sensor
existed twice and the two sets were exactly disjoint: every ward-mapped row was
frozen in the archive, every live row had no ward. Enforcement joins on ward, so
300/300 recent Delhi events were structurally unreachable by it.
→ `etl/station_identity.py`, `etl/wards_geo.py`, `etl/migrate_station_identity.py`.
163 station rows merged to 90 real sensors, all ward-mapped, 0 duplicates.

Other fixes, each with an assertion in `deploy/verify_live.py`:

- **Enforcement windowing** — one pool let December's crisis (PM2.5 500-620)
  outrank every current event forever, so live could never show an action. Now
  two pools via `actions.era`.
- **Enforcement floor** — severity clips at 60 µg/m³, so all Mumbai/Bengaluru
  actions scored exactly 0.00, tied and arbitrarily sorted, each printing a
  statutory citation over officially-Good air. Sub-floor wards are now dropped.
- **Freshness** — banner read a build artefact (12 days stale) while the store
  was 2h old. `/live` and `/health` now report `age_hours` from the DB clock.
- **Timezone** — readings are IST wall-clock, DB clock is UTC; every
  `h > now() - interval` was skewed 5h30m. Now `now() at time zone 'Asia/Kolkata'`.
- **Advisory** — `budget.record` wrote to a read-only Vercel path and raised
  *after* the model was billed, discarding paid translations; the validator also
  rejected Devanagari numerals (Marathi renders 380 as ३८०). Spend now persists
  to the `llm_spend` table and `record()` never raises.
- **`band()` returned "Severe" for NaN** — painted no-data sensors red.
- **"forecast AQI"** was printed over measured readings. `basis` param added.
- Events tab showed the oldest 80; Metrics had blank 48h/72h rows and an empty
  CAQM table (excluded from the bundle by `.vercelignore`); `/compare` now
  computed in SQL so Delhi stops reporting the 300-row page cap as its count.
- **`main.yml` failed 19/19 runs** — installed slim `requirements.txt` (no
  duckdb/lightgbm/shapely). Line 22 now uses `requirements-pipeline.txt`.

## The cadence problem (why /ingest exists)

data.gov.in serves **only the current hour**. A missed hour is gone permanently —
there is no backfill: the CPCB mirror's `latest-air-quality.parquet` is still
stuck at 2025-12-24→12-31. Detection needs a baseline, so a sparse feed means no
events regardless of model quality.

GitHub's free scheduler degraded badly — hours captured per day:
`Aug 17-23: 17-20 → Aug 24: 12 → Aug 25: 6 → Aug 26: 5 → Aug 27: 1 → Aug 28: 3`.
That is why Mumbai showed only 1 event in the 72h window. **Not a code bug.**

**Fix:** `POST /ingest` (token-protected, ~15s, inside the 60s limit) plus a
Supabase `pg_cron` schedule — job `vayu-hourly-ingest`, `5 * * * *`, reading its
token from `ops_config` (not from the job body: `cron.job` is readable by anyone
with DB access). GitHub Actions remains the backup path and is where
`verify_live.py` runs.

## Current live state (all verified)

13/13 checks pass. Feed ~1h old, `feed: "current"`. Delhi shows live ranked
actions with evidence-pack PDFs; Mumbai and Bengaluru correctly report no
enforcement needed (air is 21-34 µg/m³). Crisis episode shows 10 ranked wards
per city. Hindi/Marathi/Kannada advisories return `llm_translated`. Fire layer
`live`. LLM spend $0.04 of the $10 cap.

## Useful commands

```bash
cd "C:/Users/divya/Downloads/Urban Air hackathon"
PYTHONIOENCODING=utf-8 python -W ignore deploy/verify_live.py     # full assert suite
PYTHONIOENCODING=utf-8 python -W ignore etl/ingest_live.py        # one ingest
PYTHONIOENCODING=utf-8 python -W ignore agents/live_pipeline.py   # agent chain
curl -s https://vayu-net-api-ver-tex.vercel.app/health
```

Check the schedule (status codes only — do not select response bodies, they
contain the ingest summary and, on failure, echoed request detail):

```sql
select jobid, jobname, schedule, active from cron.job;
select id, status_code, created from net._http_response order by id desc limit 10;
select key, length(value) from ops_config;
```

## Safety / rollback

- Full DB backup: `_backup/*_20260829_010955.parquet` (all 6 tables, gitignored).
- `.env` holds live credentials. `ops_config` now also holds `ingest_token` and
  `data_gov_in_key`. That is the same trust boundary as the service-role DSN
  already needed to serve a request, but it does widen the blast radius of DB
  access from "all the data" to "all the data plus these two keys".
- **`ops_config` was world-readable and this was fixed.** RLS was disabled with
  full `anon` / `authenticated` grants, and Supabase serves every public-schema
  table over PostgREST — so the ingest token was readable by anyone holding the
  project's anon key, which is a published credential by design. RLS is now on
  with no policy and those grants revoked; `verify_live.py` asserts it. The API
  and cron connect as a role that bypasses RLS, so nothing broke.
  **If you ever add a table holding secrets, check RLS before trusting it.**
- **The ingest token was pasted into a chat transcript.** Rotate it if that
  transcript is ever shared — now a single statement, no redeploy:
  `update ops_config set value = '<new>' where key = 'ingest_token';`
- `docs/OPERATIONS.md` is the full runbook (deploy from scratch, secrets,
  health, symptom→cause table, onboarding a city).

## Commercial assessment (summary)

Pilot-ready, not yet a product. Differentiator is answering *which ward, why,
under what statute* with an evidence-pack PDF — not another AQI dashboard.
Buyers: State Pollution Control Boards (primary), CAQM, municipal corporations,
Smart City missions, school/hospital groups.
Blocking gaps, in build order: **no auth at all** → no multi-tenancy → no
alerting → no action workflow (assign/track/close) → forecast validated on only
one week → free-tier infra, no SLA.
Always sell as prioritisation and evidence assembly, never as proof of liability
— attribution is evidence-weighted likelihood and the UI says so.
