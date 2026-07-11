# TRD — VAYU-NET: Technical Requirements & Design
**Version 1.0 | Stack: Python (FastAPI) + React | 7-day build | 3 cities**

---

## 1. System Overview

Event-driven multi-agent pipeline over a geospatial data backbone. Batch layer builds features and models from historical data; streaming/replay layer pushes 15-min readings through the agent chain; serving layer exposes REST + WebSocket to the React app.

## 2. Architecture

```
┌────────────────────────── DATA SOURCES ──────────────────────────┐
│ Vonter/india-cpcb-aqi (CPCB 15-min + hourly AQI, parquet)        │
│ Open-Meteo forecast API │ GEE: Sentinel-5P, VIIRS fires          │
│ OSM Overpass (land use, POI) │ Ward GeoJSONs (DataMeet)          │
└──────────────┬───────────────────────────────────────────────────┘
               ▼
┌────────────── INGESTION & STORAGE ───────────────┐
│ Python ETL (pandas/pyarrow)                      │
│ DuckDB (+spatial ext) = analytics store          │
│ GeoJSON/GeoParquet layer store │ Redis (pub/sub) │
└──────────────┬───────────────────────────────────┘
               ▼
┌────────────── FEATURE & MODEL LAYER ─────────────┐
│ Feature builder (lags, met, calendar, upwind)    │
│ LightGBM forecast models (per city, quantile)    │
│ Attribution stats: CPF/pollution rose, ratios    │
│ IDW/RBF grid interpolation (1-km)                │
└──────────────┬───────────────────────────────────┘
               ▼
┌────────────── AGENT ORCHESTRATION (LangGraph) ───┐
│ Sentinel(anomaly) → Attribution → Forecast ──┐   │
│        │                                     ▼   │
│        └────────────► Enforcement ──► Advisory   │
│ Shared state + reasoning log (JSON, auditable)   │
│ LLM: Claude API (attribution narration,          │
│      advisory generation, evidence-pack prose)   │
└──────────────┬───────────────────────────────────┘
               ▼
┌────────────── SERVING ───────────────────────────┐
│ FastAPI REST + WebSocket (replay events)         │
│ PDF service (WeasyPrint evidence packs)          │
└──────────────┬───────────────────────────────────┘
               ▼
┌────────────── FRONTEND (React + Vite) ───────────┐
│ deck.gl/MapLibre war-room map │ Recharts         │
│ Agent activity feed │ Citizen advisory view      │
│ Replay timeline │ Metrics/validation page        │
└──────────────────────────────────────────────────┘
```

Render this as the official architecture diagram (draw.io / excalidraw) for submission.

## 3. Data Layer

### 3.1 Sources & contracts

| Source | Access | Cadence | Use |
|---|---|---|---|
| Vonter/india-cpcb-aqi | Parquet from GitHub Releases; `fetch.py` for refresh | 15-min / hourly | Core pollutants, met, AQI |
| Open-Meteo | REST, free, no key | Hourly, 7-day horizon | Forecast features (wind, temp, RH, PBL proxy) |
| GEE (Sentinel-5P L3, VIIRS active fires) | Python `earthengine-api`; pre-export GeoTIFF chips for demo | Daily | Attribution corroboration, satellite chips in evidence packs |
| OSM Overpass | One-time pull per city, cached GeoJSON | Static | Land use, industrial polygons, roads, schools/hospitals |
| Ward boundaries | DataMeet/open-data GeoJSON | Static | Spatial unit of product |

### 3.2 Storage schema (DuckDB)

- `readings(station_id, ts, pm25, pm10, no, no2, nox, nh3, so2, co, o3, benzene, toluene, xylene, at, rh, ws, wd, rf, sr, bp)` — partitioned by city/month, from parquet.
- `aqi_hourly(station_id, date, h00..h23)` → unpivoted view `aqi(station_id, ts, aqi)`.
- `stations(station_id, name, city, state, lat, lon, ward_id)` — coords geocoded from station names (CPCB list); spatial-joined to wards.
- `wards(ward_id, city, name, geom, pop_est, n_schools, n_hospitals, industrial_area_m2, road_km, construction_sites)` — vulnerability + context features precomputed.
- `events(event_id, ts, station_id, ward_id, pollutant, zscore, status)` — anomalies.
- `attributions(event_id, source_cat, confidence, evidence_json)`.
- `forecasts(city, grid_id|station_id, ts_run, horizon_h, aqi_pred, p10, p90)`.
- `actions(action_id, event_id, ward_id, priority, pack_url, statute_ref)`.
- `agent_log(run_id, agent, step, input_summary, output_summary, ts)` — the auditability artifact.

### 3.3 ETL requirements
- Idempotent loaders; snapshot dataset frozen for demo (`data/snapshot_2026-07`) + live-refresh path documented.
- Missing-data policy: forward-fill ≤2 intervals; station excluded from grid interpolation if >30% missing in window.
- All timestamps stored UTC, displayed IST.

## 4. Model Specifications

### 4.1 Anomaly detection (Sentinel agent)
Rolling robust z-score per (station, pollutant): median/MAD over trailing 7 days same-hour window; trigger at |z| ≥ 3 sustained ≥ 2 intervals. Cheap, explainable, tunable.

### 4.2 Source attribution (Attribution agent)
Evidence-fusion scorer, not a black box. For each event:

1. **Wind sector analysis:** conditional probability function CPF = P(concentration > 75th pct | wind from sector θ) over trailing 30 days → dominant upwind sectors.
2. **Fingerprint ratios:** PM2.5/PM10 (<0.4 → dust/construction; >0.6 → combustion), NO2 & CO elevated + rush-hour diurnal → traffic; SO2 elevated + flat diurnal → industrial/stack; NH3 + evening peak + fire counts → burning.
3. **Spatial context:** OSM land-use classes within 2-km directional sector upwind.
4. **Satellite corroboration:** VIIRS fire points within 10 km / 24 h; Sentinel-5P NO2 column anomaly vs 30-day mean.
5. **Fusion:** weighted log-odds sum per source category → softmax → confidence 0–100. Weights hand-tuned on 3 labelled historical episodes (Diwali = burning; June dust storm = dust; weekday rush = traffic).
6. **LLM narration:** Claude converts evidence JSON → 3–5 human-readable bullets. LLM never decides the category — it only narrates. (Guards against domain-judge attack.)

**Validation:** aggregate attributed shares per city-season vs published inventories (TERI 2018 Delhi, SAFAR); show side-by-side bar chart, target ±15pp.

### 4.3 Forecasting (Forecast agent)
- **Model:** LightGBM per city, global across stations (station id as categorical), direct multi-horizon (separate heads for 24/48/72h), quantile objectives (p10/p50/p90).
- **Features:** pollutant lags (1h,3h,6h,24h,168h), rolling means; Open-Meteo forecast wind/temp/RH; calendar (hour, dow, holiday/festival flags incl. Diwali, stubble season Oct 15–Nov 30); upwind transport = distance-weighted upwind-station PM2.5 given forecast wind direction.
- **Baseline:** persistence (AQI(t+24)=AQI(t)) and seasonal-naive (same hour yesterday). Report RMSE/MAE per horizon per city on 3-month rolling backtest, time-based split (no leakage).
- **Grid:** IDW (power=2) of station forecasts to 1-km grid clipped to city boundary; mask cells >8 km from any station as "low confidence" (honesty feature).
- **Targets:** beat persistence RMSE by ≥15% at 24h; inference <5s/city/run.

### 4.4 Enforcement prioritisation (Enforcement agent)
`priority = z_exposure × confidence × vulnerability` where:
- `z_exposure` = normalized (forecast AQI − 200)⁺ × ward population estimate over next 24h
- `confidence` = attribution confidence (0–1)
- `vulnerability` = 1 + 0.5·norm(schools+hospitals density)

Top-N per city per day. Statute mapping table: source category → {Air Act §31A, C&D Waste Rules 2016, GRAP stage actions (Delhi), MoEFCC dust norms}. Evidence pack = Jinja2 HTML → WeasyPrint PDF: map snapshot (staticmaps), pollution rose (matplotlib), spike time-series, satellite/fire chip, evidence bullets, statute reference, QR link to live ward view.

### 4.5 Advisory generation (Advisory agent)
- Severity from CPCB AQI bands (hard-coded health statements per band — no LLM freedom on medical claims).
- Claude fills constrained templates per (ward, band, group, language): EN/HI/MR/KN/TA. Prompt includes glossary; output validated: must contain band name, ward name, ≤80 words, no numbers other than provided.
- TTS sample for IVR mock: edge-tts or browser SpeechSynthesis.

## 5. Agent Orchestration

- **Framework:** LangGraph (Python). Graph: `sentinel → attribution → (forecast, enforcement) → advisory`; forecast also runs on cron (hourly in replay time).
- **State:** typed dict (event, evidence, forecast slice, action) checkpointed to DuckDB `agent_log` — every step's input/output summary persisted → auditable trail surfaced in UI feed.
- **LLM calls:** Claude API (claude-sonnet class) for narration/advisories only; temperature 0.2; all prompts in `prompts/` versioned. Budget: <50 calls per replay.
- **Replay engine:** async task reads snapshot readings at N× speed, publishes to Redis; agents subscribe; WebSocket pushes agent events to UI timeline with wall-clock timestamps (proves the <60s claim).

## 6. API Design (FastAPI)

| Endpoint | Method | Purpose |
|---|---|---|
| `/cities` | GET | Config list (bounds, wards, stations) |
| `/cities/{c}/current` | GET | Latest AQI grid + station readings |
| `/cities/{c}/wards/{w}` | GET | Ward detail: readings, context, vulnerability |
| `/cities/{c}/forecast?h=24` | GET | Grid forecast GeoJSON + confidence mask |
| `/cities/{c}/events` | GET | Active anomalies + attributions |
| `/cities/{c}/actions` | GET | Ranked enforcement list |
| `/actions/{id}/pack.pdf` | GET | Evidence pack |
| `/cities/{c}/advisory?ward=&lang=&group=` | GET | Advisory text (+audio url) |
| `/metrics` | GET | RMSE tables, attribution validation |
| `/replay/start?episode=&speed=` | POST | Start demo replay |
| `/ws/feed` | WS | Agent activity + replay events |

All GeoJSON responses gzipped; ward geometries simplified (topojson, ~50m tolerance).

## 7. Frontend (React + Vite + TS)

- **Map:** MapLibre GL + deck.gl (HeatmapLayer for grid, GeoJsonLayer wards, IconLayer stations/fires/actions). Free tiles (CartoDB).
- **Views:** War-room (map + right-rail agent feed + top-10 actions), Ward drawer, Citizen view (searchable ward, language toggle, advisory card + audio), Metrics page, Multi-city leaderboard, Replay mode with timeline scrubber + split "then vs now" panel.
- **State:** TanStack Query + WebSocket reducer. Charts: Recharts. Styling: Tailwind.
- **UX budget:** first meaningful paint <3s on demo laptop; replay runs offline (snapshot) — no live-API dependency on stage.

## 8. Infrastructure & Repo

- **Monorepo:** `/etl`, `/models`, `/agents`, `/api`, `/web`, `/data` (snapshot, gitignored large files → HF dataset or release), `/prompts`, `/docs` (diagram, deck, PRD/TRD).
- **Run:** docker-compose (api, redis, web); single `make demo` target boots replay end-to-end.
- **Deploy (optional):** web on Vercel, api on a small VM/Fly.io; judges also get local run instructions.
- **Secrets:** `.env` (Claude API key, GEE service account); never committed.

## 9. Testing & Verification

| Layer | Test |
|---|---|
| ETL | Row counts vs source parquet; null-policy unit tests; station→ward join spot checks |
| Forecast | Time-split backtest harness (`make backtest`), leakage check (no future features), RMSE report artifact committed |
| Attribution | 3 labelled episodes must classify correctly (Diwali→burning, dust storm→dust, weekday rush→traffic); inventory comparison chart |
| Agents | Golden-path integration test on 1 replay episode; agent_log completeness assert |
| Advisory | Language/format validator on 100 generated samples; banned-phrase list (no dosage/medical advice) |
| Demo | Full rehearsal script; offline mode test (network killed) |

## 10. Performance & Scalability Targets

- Snapshot for 3 cities ≈ 2–4 GB parquet → DuckDB handles on laptop; no cluster needed.
- New city onboarding = add `cities/{name}.yaml` (bbox, ward GeoJSON path, station list) + run `make onboard CITY=x` (ETL + model fit ≈ 20 min). Demonstrate live on a 4th city (Kolkata) if time allows — strongest possible scalability proof.
- Cost/city/month estimate for deck: <₹8k (one small VM + LLM calls) vs ₹ crores for new monitoring hardware — intelligence layer reuses existing CAAQMS capex.

## 11. Security/Compliance Notes (deck slide)
- All data sources open/ODbL/public; attribution framed as "evidence-weighted likelihood", not legal proof; advisories use CPCB-approved health language; no PII anywhere.

## 12. Team Split (suggested, 4 people)
- **P1 Data/ETL + GEE**, **P2 Models (forecast + attribution stats)**, **P3 Agents + API + PDF**, **P4 Frontend + deck/video**. Integration checkpoints end of day 2, 4, 5.
