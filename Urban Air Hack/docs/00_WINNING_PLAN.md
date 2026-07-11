# VAYU-NET — Winning Plan
### AI-Powered Urban Air Quality Intelligence for Smart City Intervention
*(Working name: VAYU-NET — "Vayu" = air; feel free to rename)*

---

## 1. The Repo Decision (done)

**Primary base repo: [Vonter/india-cpcb-aqi](https://github.com/Vonter/india-cpcb-aqi)**

Why it wins over every alternative found:

| Factor | Vonter/india-cpcb-aqi | Typical alternatives (Kaggle dumps, student projects) |
|---|---|---|
| Coverage | 500+ CAAQMS stations, all-India, multi-city out of the box | Single city or stale 2015–2020 dumps |
| Granularity | **15-minute** pollutant readings + **hourly AQI** | Daily averages |
| Meteorology included | **WS, WD, temp, RH, rainfall, solar radiation, pressure per station** — this is the unlock for source attribution and dispersion | Almost never included |
| Pollutant breadth | PM2.5, PM10, NO/NO2/NOx, NH3, SO2, CO, O3, Benzene/Toluene/Xylene | PM2.5 only |
| Freshness | Live `fetch.py` pulls from CPCB; Parquet releases updated | Frozen CSVs |
| License | ODbL (open, hackathon-safe) | Often unlicensed |

**Supporting data sources (layered on top):**
- **Sentinel-5P (NO2, SO2, CO columns) + MODIS/VIIRS fire points** via Google Earth Engine — free, no download needed, satisfies the "satellite imagery" requirement
- **OpenStreetMap / Overpass API** — land use, industrial zones, road network per ward
- **Open-Meteo API** — free 72h weather forecasts (wind, boundary-layer proxy) for the forecasting agent
- **City ward boundary GeoJSONs** (Delhi, Bengaluru, Mumbai — available from DataMeet/india-open-data repos)
- **Benchmark/competitor**: ShreyaaAggarwal/BreatheSmart — we study it only to differentiate; we do NOT build on it.

## 2. What We Build (the unique angle)

Most teams will build **a dashboard with an AQI forecast**. Judges will see ten of those.

We build the **"signal → attribution → action" loop as an auditable multi-agent system**, with one number as the hero metric: **time from pollution signal to dispatched, evidence-backed enforcement action** (the exact thing the CAG audit said is missing — only 31% of cities have response protocols).

Four agents on a shared geospatial backbone, multi-city (Delhi + Bengaluru + Mumbai) from day 1:

1. **Attribution Agent** — fuses station spikes + wind direction (pollution rose / conditional probability function), OSM land-use upwind, VIIRS fire points, Sentinel-5P columns → source category per ward **with confidence score** (e.g., "Ward 74: 68% construction dust, high confidence — PM10/PM2.5 ratio 3.1, upwind construction cluster, no fire counts").
2. **Forecast Agent** — 24–72h AQI at 1-km grid: gradient-boosted spatio-temporal model (LightGBM) using lagged pollutants, met forecasts, calendar/festival features, upwind-station features. **Always reported vs persistence baseline RMSE** — the judges literally named this metric.
3. **Enforcement Agent** — ranks interventions by (forecast exposure averted × attribution confidence × population vulnerability from schools/hospitals density) → generates a one-page **evidence pack PDF** per action (map, satellite chip, pollution rose, statutory reference) that an inspector could act on.
4. **Advisory Agent** — LLM generates ward-level advisories in **English + Hindi + Kannada + Tamil + Marathi**, tiered by vulnerable group; demo via web + simulated IVR script.

**The demo moment:** live "war-room" replay of a real historical episode (e.g., a Nov 2025 Delhi spike from the dataset) — the system detects, attributes, forecasts, and issues an enforcement pack in under 60 seconds, side-by-side with "what actually happened over 3 days".

## 3. Judging-Criteria Mapping

| Criterion | Weight | How we score it |
|---|---|---|
| Business Impact | 25% | CAG 31% gap as anchor; ₹ cost of a poor-air day; signal→action time cut from days to seconds; direct NCAP alignment; buyer = municipal corp / SPCB |
| Technical Excellence | 25% | Real attribution science (CPF/pollution roses, PMF-lite ratios), forecast vs persistence RMSE shown honestly, multi-agent orchestration with tool-use logs, satellite fusion |
| Scalability | 20% | Multi-city day 1 (3 cities, same pipeline, config-driven); 500+ stations already in dataset; city onboarding = one GeoJSON + config file; cost estimate per city |
| Innovation | 15% | Confidence-scored attribution + auditable agent evidence packs — nobody else will have defensible attribution |
| User Experience | 15% | Two personas, two views: Commissioner war-room map + citizen advisory in 5 languages; evidence-pack PDF is a tangible artifact judges can hold |

## 4. 7-Day Build Timeline

| Day | Deliverable |
|---|---|
| 1 | Data backbone: pull Vonter parquet, load to DuckDB/PostGIS; ward GeoJSONs for 3 cities; station→ward mapping; FastAPI skeleton + React map shell |
| 2 | Forecast Agent v1 (LightGBM, per-station 24h) + persistence baseline + RMSE harness; IDW/kriging to 1-km grid |
| 3 | Attribution Agent: pollution roses, PM ratios, diurnal signatures, OSM land-use join, VIIRS fires via GEE |
| 4 | Enforcement Agent: priority score + evidence-pack PDF generation; Advisory Agent with multilingual LLM prompts |
| 5 | React dashboard: war-room map (deck.gl heat grid, agent activity feed), citizen view; agent orchestration (LangGraph) wired end-to-end |
| 6 | Historical-episode replay demo, metrics page (RMSE vs baseline, attribution validation vs TERI/SAFAR emission-inventory shares), polish |
| 7 | Architecture diagram, deck, 3-min demo video, rehearsal |

## 5. Risk Cuts (if time runs short)
- Drop Mumbai → 2 cities (keep multi-city claim)
- Grid forecast → station-level forecast + interpolated display
- IVR → scripted mock screen
- Never cut: attribution confidence scores, RMSE-vs-persistence chart, evidence pack PDF — these are the winning artifacts.

---
*Details in 01_PRD.md and 02_TRD.md.*
