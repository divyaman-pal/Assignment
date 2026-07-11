# PRD — VAYU-NET: Urban Air Quality Intelligence Platform
**Version 1.0 | Hackathon build | Cities: Delhi, Bengaluru, Mumbai**

---

## 1. Problem Statement

India has 900+ CAAQMS monitoring stations but the CAG (2024) found only 31% of monitored cities have any multi-agency response protocol tied to readings. Data exists; the intelligence layer that converts a pollution signal into a targeted, evidence-backed intervention does not. Result: 1.67M premature deaths/year (Lancet), advisories issued days after episodes peak, enforcement deployed blindly.

**Core insight:** cities don't need another dashboard — they need to know *which source, which ward, right now, what to do, with what evidence*.

## 2. Product Vision

An AI intelligence layer over India's existing monitoring infrastructure that closes the loop **signal → attribution → forecast → enforcement → citizen advisory** in under 60 seconds, auditable end-to-end, deployable to any Indian city with one config file.

**Hero metric:** time from pollution signal to dispatched, evidence-backed action — from ~3 days (manual) to <60 seconds.

## 3. Users & Personas

| Persona | Role | Pain today | What VAYU-NET gives them |
|---|---|---|---|
| **Municipal Commissioner / Smart City CEO** | Accountable for NCAP targets | Sees AQI dashboards, no idea what to *do* | War-room map: attributed hotspots, ranked interventions, city-vs-city benchmark |
| **SPCB Enforcement Officer** | Deploys ~limited inspectors across huge city | Complaint-driven, no prioritisation, weak evidence trail | Daily prioritised action list + one-page evidence pack per site (map, satellite chip, pollution rose, statute reference) |
| **Ward-level citizen (esp. vulnerable)** | Outdoor worker, parent, elderly | Generic city-wide AQI number, English-only | Ward-level 24h risk forecast + advisory in own language (Hindi/Kannada/Tamil/Marathi/English) |
| **NCAP programme officer (secondary)** | Tracks 130 cities' progress | No comparable intervention-effectiveness data | Multi-city comparative view: which interventions moved AQI where |

## 4. Scope

### In scope (hackathon)
- 3 cities live: Delhi, Bengaluru, Mumbai (config-driven; onboarding path shown for any CAAQMS city)
- 4 AI agents: Attribution, Forecast, Enforcement, Advisory — orchestrated, with visible reasoning logs
- Commissioner war-room web app + citizen advisory view
- Historical episode replay (the demo centerpiece)
- Evaluation page: forecast RMSE vs persistence, attribution vs published emission inventories

### Out of scope (roadmap slide only)
- Real IVR/telecom integration (mocked), mobile apps, CPCB write-back APIs, legal workflow integration, IoT sensor onboarding beyond CAAQMS

## 5. Features & Requirements

### F1 — Geospatial Data Backbone
- **F1.1** Ingest Vonter/india-cpcb-aqi (15-min pollutants + met, hourly AQI, 500+ stations); refresh path via its `fetch.py`.
- **F1.2** Ward boundary layers for 3 cities; every station, reading, and forecast mapped to a ward.
- **F1.3** Context layers per ward: OSM land use (industrial/construction/roads), VIIRS/MODIS fire points, Sentinel-5P NO2/SO2/CO columns, POI vulnerability layer (schools, hospitals).
- **Acceptance:** any ward click returns station data, context layers, and vulnerability profile in <2s.

### F2 — Attribution Agent (source attribution with confidence)
- **F2.1** Detect anomalies: rolling z-score spikes per station-pollutant at 15-min resolution.
- **F2.2** Attribute each hotspot to source categories — traffic, construction dust, industrial, biomass/waste burning, secondary/regional transport — using:
  - pollution rose / conditional probability function (wind direction × concentration)
  - pollutant fingerprints (PM2.5/PM10 ratio, NOx/CO for traffic, SO2 for industry, NH3/K-proxy patterns for burning)
  - diurnal signatures (rush-hour vs 24h-flat industrial vs evening burning)
  - upwind land-use within directional sector (OSM)
  - satellite corroboration (fire points, NO2 column anomaly)
- **F2.3** Output: ranked source categories **with confidence score (0–100) and human-readable evidence bullets**.
- **F2.4** Validation view: compare city-level attributed shares vs published source apportionment (TERI 2018 Delhi, SAFAR inventories).
- **Acceptance:** every attribution displays ≥3 evidence bullets and a confidence score; no black-box claims.

### F3 — Forecast Agent (hyperlocal 24–72h)
- **F3.1** 24/48/72h AQI forecasts per station, interpolated to 1-km grid per city.
- **F3.2** Features: lagged pollutants, met forecast (Open-Meteo), calendar (day-of-week, festivals incl. Diwali, crop-burning season), upwind-station transport features.
- **F3.3** Every forecast surface shows **RMSE vs persistence baseline** on a rolling backtest — honest, judge-named metric.
- **F3.4** Threshold-crossing alerts ("Ward X enters Severe in ~18h") feed Enforcement + Advisory agents.
- **Acceptance:** 24h forecast beats persistence RMSE on backtest for ≥70% of stations; metric publicly displayed in-app.

### F4 — Enforcement Agent
- **F4.1** Priority score per candidate action = forecast exposure averted × attribution confidence × vulnerable population within impact radius.
- **F4.2** Generate **evidence pack (PDF)** per recommended action: ward map, pollution rose, time-series of spike, satellite/fire chip, suspected source category + nearest registered source proxies (OSM industrial polygons, construction sites), suggested statutory basis (Air Act 1981 §31A, dust-control norms, GRAP stage for Delhi).
- **F4.3** Daily ranked action list (top 10) per city; every recommendation traceable to agent reasoning log.
- **Acceptance:** evidence pack generated in <10s; a domain reviewer can follow the logic without seeing code.

### F5 — Advisory Agent (citizen)
- **F5.1** Ward-level advisories tiered by group (children/schools, elderly, outdoor workers, general) from forecast + vulnerability layer.
- **F5.2** Languages: English, Hindi, Marathi (Mumbai), Kannada (Bengaluru), Tamil (roadmap Chennai) — LLM-generated, template-constrained to avoid hallucinated health claims.
- **F5.3** Channels demoed: web view, WhatsApp-style message preview, IVR script mock with TTS audio sample.
- **Acceptance:** advisory for any ward in ≤3s, all languages, content matches forecast severity level exactly.

### F6 — Multi-City Comparative View
- **F6.1** Leaderboard: current AQI, 7-day trend, response-time metric, intervention count per city.
- **F6.2** "What worked" panel: episode → intervention → post-intervention delta (demonstrated on historical replay data).

### F7 — War-Room Replay (demo mode)
- **F7.1** Replay a real historical episode from the dataset at accelerated speed; agents fire live; timeline shows signal → attribution → forecast → enforcement pack → advisory with timestamps.
- **F7.2** Split screen: "What the city actually did (3 days)" vs "VAYU-NET (58 seconds)".

## 6. Success Metrics (judge-facing)

| Metric | Target | Where shown |
|---|---|---|
| Signal → action time | <60s vs ~3-day status quo | Replay timeline |
| 24h forecast RMSE vs persistence | ≥15% improvement, ≥70% of stations | Metrics page |
| Attribution sanity | City source shares within ±15pp of TERI/SAFAR inventories | Validation view |
| Language coverage | 4 languages live | Advisory demo |
| City onboarding effort | 1 GeoJSON + 1 config file, shown live | Scalability slide/demo |

## 7. Judging-Criteria Traceability

| Criterion (weight) | Features that earn it |
|---|---|
| Business Impact 25% | F4 evidence packs (the missing CAG protocol layer), F7 response-time story, F6 NCAP comparability |
| Technical Excellence 25% | F2 multi-signal attribution with confidence, F3 honest RMSE benchmarking, agent orchestration logs |
| Scalability 20% | F1 config-driven cities, 3 live cities, 500+ stations ready, onboarding demo |
| Innovation 15% | Confidence-scored attribution + auditable agent evidence packs (unique vs dashboard clones) |
| UX 15% | Two-persona design, war-room map, multilingual citizen view, tangible PDF artifact |

## 8. Deliverables Checklist (per brief)
- Working prototype (3-city web app, agents live) ✅ F1–F7
- Architecture diagram ✅ TRD §2
- Presentation deck ✅ day 7
- Demo video (3 min, replay-centered) ✅ day 7

## 9. Assumptions & Risks

| Risk | Mitigation |
|---|---|
| CPCB live endpoint flaky during demo | Demo runs on snapshot + replay; live fetch shown separately |
| Attribution challenged by domain judge | Never claim causality — "evidence-weighted likelihood with confidence"; validation vs published inventories |
| GEE quota/auth issues | Pre-export satellite chips for demo wards |
| Ward GeoJSON gaps (Mumbai) | Fall back to grid cells labelled as "zones" |
| LLM hallucinating health advice | Template-constrained generation; severity levels hard-coded from CPCB AQI health statements |
