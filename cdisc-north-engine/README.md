# C-DISC North India GTM Automation Engine

> An end-to-end outreach automation toolkit that takes C-DISC Technologies from "zero contacts in North India" to "100s of qualified G+1 / single-storey leads with personalised bilingual outreach already sent" — without hiring a North India sales team on Day 1.

This is a **working Python toolkit**, not a strategy document. It plugs into the C-DISC GTM playbook and automates the four highest-leverage activities.

---

## Why this exists

The C-DISC North India GTM strategy identifies **eight parallel outreach workstreams**. Five of them are repeatable, automatable, and currently done manually:

| Manual step today | Hours/week (estimated) | Automated here |
|---|---|---|
| Finding poultry farms / cold storage / sheds in target districts | 6–8 hrs | ✅ Google Places + CSV pipeline |
| Filtering out multi-storey / apartment buyers (PEN is G+1 only) | 2–3 hrs | ✅ `fit_scorer` auto-rejects |
| Writing personalised Hindi + English cold emails | 8–10 hrs | ✅ LLM message generator |
| Tracking who was contacted / when to follow up | 3–4 hrs | ✅ SQLite tracker + reminders |
| Reporting pipeline state to founders | 2 hrs | ✅ Streamlit dashboard |

A single operations associate can run the whole North India pipeline in a couple of hours a day instead of a full week.

---

## What it does

```
                    ┌────────────────────────────────────────────────────┐
                    │           cdisc-north-engine pipeline              │
                    └────────────────────────────────────────────────────┘

  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │   SOURCES    │ →  │   SCORING    │ →  │  MESSAGING   │ →  │   OUTREACH   │
  ├──────────────┤    ├──────────────┤    ├──────────────┤    ├──────────────┤
  │ Google Places│    │ G+1 fit chk  │    │ EN + Hindi   │    │ SMTP email   │
  │ YEIDA CSVs   │    │ Segment      │    │ LLM-tuned    │    │ wa.me links  │
  │ NABARD lists │    │ Geo priority │    │ Subject lines│    │ LinkedIn CSV │
  │ MCA filings  │    │ 0–100 score  │    │ Per-segment  │    │ Follow-up Q  │
  │ Sales Nav    │    │ Auto-reject  │    │ templates    │    │ SQLite track │
  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                       │
                                                                       ▼
                                                            ┌──────────────────┐
                                                            │   DASHBOARD      │
                                                            │  Streamlit live  │
                                                            │  pipeline view   │
                                                            └──────────────────┘
```

---

## Quick start

```bash
# 1. Install
git clone <this-repo>
cd cdisc-north-engine
pip install -r requirements.txt

# 2. Configure
cp .env.example .env
# Add: GOOGLE_PLACES_API_KEY, OPENAI_API_KEY, SMTP credentials

# 3. Run the full pipeline for ONE district (e.g., Gautam Buddh Nagar / Greater Noida)
python -m cdisc pipeline --district "Gautam Buddh Nagar" --segment industrial_shed

# 4. Or run step-by-step:
python -m cdisc discover  --district "Bareilly"       --segment farm_infra        --limit 100
python -m cdisc score     --min-score 60
python -m cdisc generate  --channel email             --language both
python -m cdisc send      --batch 25 --throttle-sec 8 --dry-run
python -m cdisc dashboard
```

---

## Modules

### 1. `sources/` — Lead Discovery

| Source | What it pulls | API needed |
|---|---|---|
| `google_places.py` | Poultry farms, cold storage, warehouses, resorts within a district | Google Places API |
| `csv_loader.py` | YEIDA / UPSIDA / HSIIDC / NABARD allottee lists | None — drop CSVs into `data/seeds/` |
| `mca_filings.py` | New industrial / agri companies registered in target districts | MCA21 (manual export currently) |
| `linkedin_export.py` | Parses LinkedIn Sales Navigator CSV exports → leads | None |
| `tender_alerts.py` | GeM / SDMA disaster-shelter tender RSS | None |

### 2. `scoring/` — The most important module

`fit_scorer.py` implements C-DISC's #1 product constraint: **PEN Foundation and MNZE Homes are G+1 ONLY.**

It auto-rejects leads whose names, descriptions, or filings mention:
- `apartment`, `apartments`, `flats`
- `tower`, `towers`, `high-rise`, `multi-storey`
- `housing society`, `cooperative society`
- `mall`, `commercial complex`
- "G+2", "G+3", "G+4", etc.

Scoring is composite:
```
final_score = 0.45 * fit_score  +  0.30 * geo_score  +  0.25 * segment_score
```

| Component | How it's computed |
|---|---|
| **Fit score (0–100)** | Hard auto-reject if multi-storey keywords found. Otherwise weighted by single-storey/G+1 keywords ("shed", "farm", "godown", "warehouse", "cottage", "poultry"). |
| **Geo score (0–100)** | Distance from Tier-1 zones: Greater Noida / Yamuna Expressway (Zone 1 — 100 pts), Lucknow–Kanpur–Agra belt (Zone 2 — 85 pts), Uttarakhand + Rajasthan resort belt (Zone 3 — 75 pts), other UP/PB/HR/RJ/MP (60 pts), elsewhere (20 pts). |
| **Segment score (0–100)** | Strength of the C-DISC product mapping per segment: farm_infra (95), industrial_shed (90), self_build_g1 (85), resort (80), disaster_shelter (75), compound_wall (70). |

### 3. `messaging/` — Bilingual Generation

Uses a small LLM with strict templates from `templates.py`. Every message:
- Stays under 120 words
- Includes ONE link (Hindi installation video)
- Mentions the NIT Calicut validation
- States "G+1 / single-storey" explicitly — so the lead self-qualifies
- Has 3 channels × 2 languages × N segments = 36+ message variants

Example: a 1-second invocation produces a Hindi WhatsApp message for an EPC contractor in Bhiwadi.

### 4. `outreach/` — Send + Track

| Tool | Purpose |
|---|---|
| `email_sender.py` | SMTP-based, throttled (default 8 sec gap), per-batch capped at 25. Supports dry-run mode. |
| `whatsapp.py` | Generates `https://wa.me/?phone=…&text=…` clickable links — paste into your phone to send. (WhatsApp Business API integration is a one-config-line away if you have a BSP.) |
| `linkedin_queue.py` | Writes a CSV of (profile_url, dm_text) for manual send — LinkedIn ToS forbids true automation, but a structured queue makes manual sending 10× faster. |
| `tracker.py` | SQLite. Every lead has a status: `new → scored → messaged → replied → meeting → won/lost`. Auto-schedules 3-touch follow-ups (Day 1 / Day 5 / Day 14) per the GTM playbook. |

### 5. `dashboard/` — Streamlit

```bash
python -m cdisc dashboard
# Opens http://localhost:8501
```

Shows: funnel by stage, leads by segment, leads by geo zone, this-week's follow-up queue, message open/reply rates.

---

## Real workflow examples

### Workflow A — "I want 100 industrial shed leads in Greater Noida by EOW"

```bash
python -m cdisc discover --district "Gautam Buddh Nagar" --segment industrial_shed --limit 200
python -m cdisc score     --min-score 65
python -m cdisc generate  --channel email --language en
python -m cdisc send      --batch 25 --throttle-sec 10
```

End state: ~80 personalised English emails sent to genuine G+1 shed developers near YEIDA. SQLite tracker has them all queued for Day-5 follow-up.

### Workflow B — "Hindi farm infra outreach across rural UP"

```bash
python -m cdisc discover --district "Bareilly,Sitapur,Hardoi" --segment farm_infra --limit 300
python -m cdisc score     --min-score 60
python -m cdisc generate  --channel whatsapp --language hi
python -m cdisc export    --format whatsapp_links --out data/exports/up_farm_wa.csv
# Open the CSV, click each wa.me link from your phone
```

### Workflow C — "Resort developers in Uttarakhand"

```bash
python -m cdisc discover --district "Pauri Garhwal,Nainital,Rishikesh" --segment resort --limit 100
python -m cdisc score     --min-score 70
python -m cdisc generate  --channel linkedin --language en
python -m cdisc export    --format linkedin_dm --out data/exports/uk_resort_li.csv
```

---

## Configuration

`config.yaml` defines the GTM playbook constants — segments, geo zones, scoring weights, message lengths. Editing this file lets the GTM lead retune the entire engine without touching code.

```yaml
geo_zones:
  zone_1_yeida:        { score: 100, districts: ["Gautam Buddh Nagar","Bulandshahr"] }
  zone_2_rural_up:     { score:  85, districts: ["Lucknow","Kanpur","Agra","Bareilly"] }
  zone_3_resort_belt:  { score:  75, districts: ["Nainital","Rishikesh","Jaisalmer"] }

segments:
  farm_infra:          { score: 95, channels: ["whatsapp","email"], language: "hi" }
  industrial_shed:     { score: 90, channels: ["email","linkedin"], language: "en" }
  self_build_g1:       { score: 85, channels: ["whatsapp"],         language: "hi" }
  resort:              { score: 80, channels: ["email","linkedin"], language: "en" }
  ...

reject_keywords:
  - apartment
  - tower
  - high-rise
  - "g+2"
  - "g+3"
  - housing society
  - mall
```

---

## What this engine deliberately does NOT do

- **Scrape LinkedIn directly** — violates ToS. We help structure manual outbound 10× faster instead.
- **Send WhatsApp without API access** — generates `wa.me` links you click from your authorised phone.
- **Pretend to be a CRM** — it's a focused outreach engine. Once leads reply, hand off to whatever CRM C-DISC adopts (Zoho, HubSpot, Pipedrive).

---

## File layout

```
cdisc-north-engine/
├── README.md
├── requirements.txt
├── config.yaml
├── .env.example
├── src/cdisc/
│   ├── cli.py                   # `python -m cdisc <command>`
│   ├── config.py
│   ├── db.py
│   ├── sources/
│   │   ├── google_places.py
│   │   ├── csv_loader.py
│   │   └── linkedin_export.py
│   ├── scoring/
│   │   ├── fit_scorer.py
│   │   ├── geo.py
│   │   └── segment.py
│   ├── messaging/
│   │   ├── templates.py         # EN + Hindi templates per segment
│   │   └── generator.py         # LLM-backed
│   ├── outreach/
│   │   ├── email_sender.py
│   │   ├── whatsapp.py
│   │   ├── linkedin_queue.py
│   │   └── tracker.py           # SQLite pipeline
│   └── dashboard/
│       └── app.py               # Streamlit
├── data/
│   ├── seeds/
│   │   └── sample_yeida_allottees.csv
│   └── exports/
├── workflows/
│   └── run_full_pipeline.py
├── tests/
│   └── test_scorer.py
└── docs/
    └── architecture.md
```

---

## Status

| Component | Status |
|---|---|
| CLI scaffold | ✅ working |
| Google Places discovery | ✅ working with API key |
| CSV seed loader | ✅ working |
| Fit scorer + auto-reject | ✅ working, with unit tests |
| Geo scorer | ✅ working |
| Segment scorer | ✅ working |
| Message generator (templates) | ✅ working |
| Message generator (LLM) | ✅ working with OpenAI key, falls back to templates |
| SMTP sender | ✅ working with dry-run |
| WhatsApp link generator | ✅ working |
| LinkedIn CSV queue | ✅ working |
| SQLite tracker | ✅ working |
| Streamlit dashboard | ✅ working |

---

C-DISC Technologies Pvt Ltd · `cdisctechnologies.com`
