# Architecture — C-DISC North India Engine

## Design intent

C-DISC's GTM playbook calls for **eight parallel outreach workstreams**. The engine doesn't try to replace human judgement in any of them — it removes the repetitive grunt work so the GTM lead can focus on conversations, partnerships, and on-site demos.

## Module responsibilities

```
              ┌───────────────────────────────────────────────────────────┐
              │                       Operator (CLI / Dashboard)          │
              └───────────────────────────────────────────────────────────┘
                                          │
        ┌─────────────────────────────────┼─────────────────────────────────┐
        ▼                                 ▼                                 ▼
┌──────────────┐                 ┌────────────────┐                ┌────────────────┐
│   sources/   │                 │   scoring/     │                │  messaging/    │
├──────────────┤                 ├────────────────┤                ├────────────────┤
│ google_places│  raw leads      │ fit_scorer  ◀──── HARD REJECT   │ templates      │
│ csv_loader   │ ────────────▶   │ geo            │                │ generator (LLM)│
│ linkedin_exp │                 │ segment        │                │                │
└──────────────┘                 │ scorer         │                └────────────────┘
                                 └────────────────┘                         │
                                          │                                 ▼
                                          ▼                        ┌────────────────┐
                                 ┌────────────────┐                │   outreach/    │
                                 │     db.py      │                ├────────────────┤
                                 │  SQLite store  │ ◀──── queue ───│ email_sender   │
                                 │  leads/messages│ ──── status ──▶│ whatsapp       │
                                 └────────────────┘                │ linkedin_queue │
                                          │                        └────────────────┘
                                          ▼
                                 ┌────────────────┐
                                 │   dashboard/   │
                                 │   streamlit    │
                                 └────────────────┘
```

## Critical design rule — the G+1 hard reject

`scoring/fit_scorer.py` is the most important module in the system. C-DISC has clear product constraints: **PEN Foundation and MNZE Homes are for G+1 / single-storey only.** The biggest commercial risk is contacting a high-rise / apartment developer and being categorised as "wrong-fit" — once that happens with a CREDAI member or a YEIDA developer, word spreads.

The fit scorer **never returns a non-zero score** for any lead whose name or description contains:
- `apartment`, `apartments`, `flats`
- `tower`, `high-rise`, `multi-storey`
- `housing society`, `cooperative society`
- `mall`, `shopping complex`
- `G+2` through `G+10`

This rule is enforced at three layers:
1. **Scorer** — `final_score = 0`, lead status set to `rejected`
2. **DB query** — `get_leads()` always filters `WHERE rejected = 0`
3. **Message generator** — system prompt explicitly forbids pitching to high-rise

## Data model

```sql
leads:
  id, name, description, segment, district, state, address,
  phone, email, website, linkedin_url, source, source_id,
  fit_score, geo_score, segment_score, final_score,
  rejected, reject_reason, status, created_at, updated_at, metadata

messages:
  id, lead_id, channel, language, subject, body,
  touch_number,        -- 1 = first touch, 2 = day-5, 3 = day-14
  status,              -- queued / sent / failed / replied
  scheduled_for, sent_at, error, created_at
```

Status flows:

```
  Lead:  new → scored → messaged → replied → meeting → won/lost
                ↘ rejected
  Message: queued → sent → (optionally) replied → failed
```

## Scoring formula

```
final_score = 0.45 × fit_score   (G+1 keyword analysis)
            + 0.30 × geo_score   (proximity to Tier-1 zones)
            + 0.25 × segment_score (product-segment alignment)
```

| Component   | Range | What drives it |
|-------------|-------|----------------|
| fit_score   | 0–100 | Multi-storey signals → 0. Otherwise 40 + 12×positive_keywords_matched |
| geo_score   | 0–100 | Zone 1 YEIDA = 100, Zone 2 Rural UP = 85, Zone 3 Resort = 75, etc. |
| segment_score | 0–100 | farm_infra 95, industrial_shed 90, self_build_g1 85, resort 80, … |

## Messaging policy

- **Max 120 words** per message
- **Required phrases:** "G+1" and "NIT Calicut" must appear in every body
- **Hindi mandatory** for farm/self-build/compound-wall segments
- **WhatsApp uses Hinglish** (Roman-script Hindi) — easier to read on phones
- **3-touch sequence** auto-queued: Day 1 intro, Day 5 video share, Day 14 demo invite

## Why we don't scrape LinkedIn / WhatsApp

LinkedIn's User Agreement (§8.2) and WhatsApp's ToS (§5) both prohibit automated scraping and unsolicited bulk messaging. The engine instead:
- **LinkedIn:** produces a queue CSV. A human spends ~30 minutes copy-pasting DMs to 50 contacts — but with personalised text, not generic.
- **WhatsApp:** produces `wa.me` deep-links. The operator taps each link from their own phone and the message opens pre-filled. ToS-compliant.
- **WhatsApp at scale:** plug in a WhatsApp Business Solution Provider (Gupshup, Karix, Wati) — only the `whatsapp.py` sender changes; everything else stays.

## Extension points

| Need | What to change |
|------|----------------|
| Add a new geo zone | Edit `config.yaml → geo_zones` |
| Add a new segment | Edit `config.yaml → segments` + add a template in `messaging/templates.py` |
| Switch LLM provider | Edit `messaging/generator.py → llm_generate()` |
| Use WhatsApp BSP API | Replace `outreach/whatsapp.py → export_wa_links()` with API calls |
| Use HubSpot/Zoho instead of SQLite | Wrap `db.py` calls behind an interface, swap implementation |
| Add a new lead source | Drop a new file in `sources/`, register in `cli.py` |
