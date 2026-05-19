# C-DISC North Engine

## The GTM Agent — Product & Technical Documentation *(footnoted edition)*

---

### Live deployment
**URL:** [cdisc-north-engine.vercel.app](https://cdisc-north-engine.vercel.app)[^28]  
**Stack:** Vanilla JavaScript · HTML · CSS · OpenAI Responses API[^5] · Vercel (static)[^9]  
**Source code size:** ~2,500 lines of code · 4 files · ~140 KB total

---

## 1. Executive Summary

The **C-DISC North Engine** is a live, working go-to-market (GTM) tool built as the *operational layer* underneath the North-India expansion strategy. It is not a slide deck and not a wireframe — it is a production-deployed single-page web application that a North-India sales team could begin using on day one.

In one sentence: **it is a CRM + lead discovery + outreach generator + activity tracker, all wrapped into one browser app that runs without a backend.**

The agent solves a real workflow problem: the moment C-DISC[^1] decides to expand into North India, the field team needs to (a) find leads, (b) decide which ones are worth pursuing, (c) generate personalised outreach, (d) track every interaction, and (e) measure pipeline progress. Most of those needs are typically met by a stack of expensive SaaS tools. The agent collapses them into one focused, single-purpose application tailored to C-DISC's specific constraints — the PEN Foundation's segment fit[^2], G+1 enforcement, and Hindi/English bilingual outreach.

## 2. Why a Tool — Not Just a Strategy Document

A strategy deck tells the C-DISC leadership *what to do*. A working tool tells the **operations associate** *how to do it every morning*. The two are complements, not substitutes.

The reasoning:

- A strategy deck without an operating layer dies in a slide reel. The first ops hire still has to figure out their daily workflow from scratch.
- Most North-India construction leads are not in any single database — they need to be discovered (web search), enriched manually, qualified, and then approached in their language.
- C-DISC's product has a very specific constraint (the G+1 rule, the segment fit) that no generic CRM enforces. Building a custom tool *embeds* that constraint into the workflow itself.
- A live web app is also a **strategic signal** to leadership: this isn't just a recommendation, the execution layer already exists.

## 3. What It Does — The User Workflow

The application has five distinct views in the sidebar, used in this typical order:

```
   Discover  →  Discovery Pool  →  CRM  →  Outreach  →  Activity log
   (real OpenAI    (user reviews     (selected leads     (queue + send +
    search,         and picks)        with stage track,   mark-sent +
    manual entry,                     drawer, history)    export)
    sample batch)
```

The critical design choice — and the one that separates this from naive "agent" tools — is the **discovery pool**. Discovered leads do **not** automatically enter the CRM. The user has to explicitly check the boxes for the leads they want and click *Add to CRM*. This mirrors how real sales teams work: discovery is noisy, the CRM is the source of truth, and human judgment sits between the two.

## 4. The Five Views Explained

### 4.1 CRM (Pipeline Overview)

Five KPI cards (total leads, new, contacted, replied, won) · Kanban/Table view toggle with search and filters · seven-column kanban board for the pipeline stages · stage funnel chart · recent-activity feed. Clicking any lead opens a **side drawer** with editable fields, seven-pill stage changer, timestamped notes, the queued message (if any), and a full history timeline.

### 4.2 Discover & Search

Three input modes:

**Tab 1 · Real web search.** Browser calls the OpenAI Responses API[^5] with the `web_search_preview` tool[^6]. The user types a query like *"poultry farms in Bareilly UP"*, OpenAI searches the live web, returns 5–15 structured business records (name, address, district, phone, email, website, segment, source URL).

**Tab 2 · Manual entry.** Form for one lead at a time — name, segment, district, contact, phone, email, address. Either add to discovery pool or push to CRM directly.

**Tab 3 · Sample batch.** Generator for realistic mock leads (zone + segment + count) for testing. Includes an apartment-trap lead in every batch ≥ 8 to demonstrate the G+1 reject rule.

Below all tabs sits the **discovery pool** — a table with checkboxes per row, an inline *Add contact* edit if info is missing, a source badge (web / manual / sample), and a status pill (ready / G+1 reject).

### 4.3 Outreach

Three sub-tabs:

- **Generate & queue.** Per-lead personalised messages in the chosen channel + language.
- **Outreach queue.** Grouped by channel. WhatsApp tab has an *Open WhatsApp* button producing a real `wa.me` deep-link[^14]. Email and LinkedIn tabs export CSVs for manual send (respecting LinkedIn's no-automation policy[^16]).
- **Sent.** History of every sent message with channel, current stage, preview, and re-queue option.

Marking a message sent (or opening a `wa.me` link) auto-bumps the lead's stage from `new` to `contacted` and logs a history entry.

### 4.4 Activity

Reverse-chronological log of every workspace event — searches, lead adds, stage changes, notes, messages queued / sent, CSV exports. Coloured icons by type, relative timestamps, clear-log button.

### 4.5 Configure

Three sections:

- **Search engine · OpenAI.** API key field (stored only in browser localStorage[^11]), model picker (gpt-4o-mini / gpt-4o / gpt-4.1-mini / gpt-4.1), Save / Test / Clear buttons. Get a key at platform.openai.com[^8].
- **Score blend.** Tunable weights for the scoring formula (fit% / geo% / segment%) and the minimum qualifying score.
- **Rules & metadata.** The 28 G+1 reject keywords, the five segment definitions, and the four geo zones.

## 5. Architecture

```
   ┌───────────────────────────────────────────────────────────┐
   │                   BROWSER (no backend)                    │
   │                                                           │
   │   index.html  ·  app.css  ·  app.js                       │
   │                          │                                │
   │                          ▼                                │
   │                  localStorage (state.v5)                  │
   │                          │                                │
   └──────────────────────────┼────────────────────────────────┘
                              │
                              ▼ External API call (user-initiated)
                       ┌──────────────────┐
                       │  api.openai.com  │  (Responses API +
                       │                  │   web_search_preview)
                       └──────────────────┘
```

Hosted on Vercel as a pure static site[^9] — no build step, no serverless functions, no database.

**Why no backend?**

1. **Privacy.** The OpenAI API key never touches our server. Browser → OpenAI direct.
2. **Cost.** Zero infrastructure cost beyond Vercel's free static hosting.
3. **Simplicity.** The entire stack is HTML + CSS + JS. One ops associate can read and modify it.
4. **Portability.** State lives in localStorage[^11] — easy to export, easy to reset, no database to migrate.

**Why vanilla JavaScript?**

1. **No build step.** Edit a line, refresh, see the change.
2. **No framework lock-in.** Future maintainers can read it without learning React/Vue/Svelte.
3. **Lightweight.** Entire JS payload is ~85 KB unminified, loads instantly.

## 6. The Discovery Engine (OpenAI Integration)

The real-search workflow runs entirely in the browser. When the user types a query and hits search:

```
1.  Browser checks: is an OpenAI key configured?
    └─ If no → friendly error linking to Configure

2.  Browser POSTs to https://api.openai.com/v1/responses [^5]
    Headers: Authorization: Bearer <user key>
             Content-Type: application/json
    Body:    { model: 'gpt-4o-mini', input: <prompt>,
               tools: [{ type: 'web_search_preview' }],
               tool_choice: 'auto' }

3.  Prompt instructs OpenAI to:
    - Search the live web for businesses matching the query
    - Find 5-15 REAL businesses (verified via search) [^6]
    - SKIP anything resembling apartments / towers /
      multi-storey buildings (the G+1 hard rule)
    - Return strict JSON in the documented shape
    - Map each result to one of C-DISC's five segments

4.  Browser strips markdown fences, parses JSON, renders results

5.  Local G+1 keyword scan runs as belt-and-braces second layer

6.  Each result remains in the pool until user clicks "Add to CRM"
```

**Error handling:**

- HTTP `401` → "Invalid API key — check Configure"
- HTTP `429` → "Rate limit hit, wait a few seconds"
- Network timeout (28s) → friendly fallback message
- Malformed JSON → graceful error with retry option

**Cost.** Each search call typically costs ~$0.001 (gpt-4o-mini) to ~$0.02 (gpt-4o), per OpenAI's published pricing[^7].

## 7. The CRM Data Model

Every CRM lead is one JavaScript object in `state.crm`:

```javascript
{
  id:           "crm_lq9p3z_a8b2",
  name:         "Saraswati Poultry Farm",
  contact:      "Ravi Sharma",
  phone:        "+91 98XXXXXXXX",
  email:        "ravi@example.com",
  website:      "https://...",
  address:      "Pilibhit Road, Bareilly, UP",
  district:     "Bareilly",
  segment:      "farm_infra",         // one of 5 segments
  source:       "openai",             // openai / manual / sample
  stage:        "contacted",          // one of 7 stages
  addedAt:      1736512348000,
  lastActivity: 1736598734000,
  history: [                          // append-only timeline
    { ts: ..., type: 'created',  note: 'Added from web search' },
    { ts: ..., type: 'edit',     note: 'phone: "" → "+91 ..."' },
    { ts: ..., type: 'sent',     note: 'Sent via whatsapp' },
    { ts: ..., type: 'stage_change', note: 'New → Contacted' },
  ],
  msgChannel:  "whatsapp",            // whatsapp / email / linkedin
  msgLang:     "hi",                  // en / hi
  msgSubject:  null,                  // email-only
  msgBody:     "Namaste Ravi ji, ...",
  queuedFor:   "whatsapp",            // null if not queued
  sentAt:      1736598734000,         // null if not sent
  notes:       ""
}
```

**Seven pipeline stages:**

| Stage | Colour | When it changes |
|---|---|---|
| `new` | grey | Default when added |
| `contacted` | blue | Auto-set when message marked sent / WhatsApp opened |
| `replied` | purple | Manual — when prospect responds |
| `qualified` | amber | Manual — confirmed interest |
| `proposal` | green | Manual — quote / BoQ shared |
| `won` | green | Manual — closed-won |
| `lost` | red | Manual — closed-lost |

## 8. The Outreach Engine — Templates Matrix

The outreach engine is built around a **30-block template matrix**: 3 channels × 2 languages × 5 segments.

A typical WhatsApp template (Hindi) for the `industrial_shed` segment:

```
Namaste {contact} ji, C-DISC यहाँ। {name} के G+1 shed के लिए
PEN panels — RCC से 25-30% कम लागत, 3-4 weeks में तैयार।
Sample BoQ चाहिए? YES reply करें। 🙏
```

Placeholders `{contact}`, `{name}`, `{district}`, `{zoneLabel}` are substituted from each lead's record. Hindi templates use real Devanagari for emails and Hinglish (Latin script + English nouns) for WhatsApp — matching how each medium is actually read in North India.

The WhatsApp queue produces real `wa.me` deep-links per WhatsApp's click-to-chat specification[^14]: `https://wa.me/919XXXXXXXXX?text=<URL-encoded>`. Tapping the link opens WhatsApp pre-filled, ready for manual send. This stays **fully compliant with WhatsApp's Messaging Policy**[^15] — no auto-sending, no headless bots.

## 9. The G+1 Enforcement — Three Defensive Layers

C-DISC's PEN Foundation is specified for ground-floor buildings only[^2]. Pitching to a multi-storey developer is a strategic failure mode the agent prevents in three layers:

**Layer 1 — Local reject-keyword scan.** 28 keywords (`apartment`, `tower`, `G+2`-`G+6`, `multi-storey`, `flats`, `heights`, `penthouse`, `condo`, `tower a/b`, `block a/b`, etc.) checked against every lead name. A hit flags red, disables checkbox, prevents CRM addition.

**Layer 2 — Prompt instruction to OpenAI.** The Responses API prompt[^5] explicitly tells the model to skip multi-storey / apartment / tower / G+2+ buildings before returning results. This filters at the source.

**Layer 3 — Template absence.** There are no message templates for "multi-storey" or "tower" segments. `generateMessageFor()` returns `null` for any unknown segment.

The agent literally **cannot** generate a PEN pitch to a multi-storey developer through any path.

## 10. State, Storage & Persistence

The entire application state lives in **one JavaScript object**, serialised to `localStorage`[^11] under the key `cdisc-north-state-v5`:

```javascript
{
  discovered: [...],     // transient pool
  crm:        [...],     // committed leads
  activity:   [...],     // event log (max 200 entries)
  weights:    { fit: 45, geo: 30, seg: 25 },
  config:     { language, channel, minScore,
                openAiKey, openAiModel },
  meta:       { totalSearches, totalAddedToCRM, lastSearch },
  theme:      'light' | 'dark'
}
```

State survives browser refresh, inspectable via DevTools → Application → Local Storage, resettable with the *Reset workspace* button. The version-bumping pattern (`v1`, `v2`, … `v5`) invalidates stale schemas when the data shape evolves.

**No data ever leaves the user's browser** except (a) the OpenAI API call[^5], and (b) the optional `wa.me` link[^14] when the user clicks to send a WhatsApp message.

## 11. Build History — An Honest Account

Five major iterations, each driven by a real failure observed in use:

| Version | What it was | Why it changed |
|---|---|---|
| V1 | Static landing page | Not an operational tool |
| V2 | Single-page agent with auto-flow | Auto-dumped discovered leads into CRM — wrong UX |
| V3 | Two-stage flow (pool → CRM) | Discovery pool + per-lead drawer + 7 stages |
| V4 | Real search via OpenStreetMap | Nominatim is a geocoder (empty for businesses); Overpass blocked by Vercel IPs |
| V5 | OpenAI web search (current) | Genuinely structured business data with contacts[^6] |

Each iteration corrected a real failure. That's the right way to build.

## 12. Running, Deploying, Iterating

**Local development (no install):**
```bash
cd cdisc-app/
python3 -m http.server 8000
# open http://localhost:8000
```

**Deploy to Vercel**[^9]:
```bash
cd cdisc-app/
vercel deploy --prod --yes
```

Static site, no build step. Vercel auto-detects `index.html` and serves the directory as-is. Aliasing to a custom domain is one CLI command[^10].

**Iterate on a feature:**

1. Edit `app.js` (state, router, views, logic all in one file)
2. Refresh the browser
3. State persists via localStorage[^11]
4. If state shape changes, bump `STORAGE_KEY` to a new version

**File map:**

| File | Lines | Role |
|---|---|---|
| `index.html` | ~80 | Sidebar shell + drawer + toast scaffolding |
| `app.css` | ~1,600 | Complete design system (light + dark themes) |
| `app.js` | ~2,500 | Constants, state, OpenAI calls, CRM logic, templates, views |
| `vercel.json` | ~25 | Security headers + cache policies |

## 13. Honest Limitations & Caveats

- **Single-user.** State is in browser localStorage[^11]. No multi-user sync. Two ops associates have two separate copies.
- **API key exposure.** The OpenAI key sits in the user's browser. Anyone with devtools access can read it. Mitigation: use a project-scoped key[^8] with a low usage cap, and rotate periodically.
- **No email delivery.** The Email tab exports CSVs but doesn't send. Connecting an SMTP service via a Vercel function is the natural next step.
- **No WhatsApp Business API integration.** The `wa.me` approach[^14] is ToS-safe[^15] but manual. A BSP (Twilio / Gupshup / Meta Cloud) would enable bulk send.
- **Search quality depends on OpenAI.** Some queries return excellent structured data; others sparse. Quality varies by prompt specificity and chosen model.
- **OpenAI cost.** Each search call costs ~$0.001 to ~$0.02 per query[^7]. Without an account cap, aggressive use could rack up bills.

## 14. Future Enhancements

Roughly in order of value:

1. **Server-side OpenAI proxy** — move the API key into Vercel env vars, expose `/api/search` as the only public surface. Removes the key-exposure risk.
2. **Real email integration** via a Vercel function calling Resend/SendGrid. Templates are already in place.
3. **WhatsApp BSP integration** — once C-DISC has a verified business profile, replace `wa.me` links with direct BSP sends.
4. **Multi-user sync** — replace localStorage[^11] with a Postgres/Supabase backend. Adds auth, makes the tool team-usable.
5. **Lead enrichment** — automatic LinkedIn / website lookup for each lead (within LinkedIn's policies[^16]).
6. **Pipeline analytics** — conversion-rate charts per channel, beachhead, segment.
7. **Mobile-first UI for the WhatsApp workflow** — `wa.me` links open on phones; a clean mobile view for the queue would be high-leverage.
8. **Integration with the strategy deck data** — once C-DISC shares the [TBD] numbers, populate this tool with real targets so the KPI dashboard becomes live.

## 15. Why This Matters Strategically

A strategy document tells leadership *what the right answer is*. A working tool proves that **the team building the strategy understood the operational reality well enough to make the answer executable**. That is the single biggest credibility signal a strategy team can offer.

Most North-India expansion plans for South-based construction companies have failed in the same way: a strategic recommendation lands on the leadership's desk, gets approved, and then dies in execution because the field team — sitting in a city the company has never operated in — has no tools, no playbook, no operating layer. They are left to invent their workflow from scratch.

The C-DISC North Engine pre-empts that failure mode by **shipping the operating layer alongside the strategy.** The first North-India ops hire can sit down at their laptop on day one and start working. Discovery, qualification, outreach, tracking — all in one place, all designed around C-DISC's specific product constraints[^2][^3].

That is the strategic value of building the tool. The strategy deck answers *should we expand North?* The agent answers *yes, and here is how Tuesday morning looks.*

---

## References & Footnotes

The numbered superscripts above link to the references listed below. Every external claim, technical assertion, or product specification has its source named here.

[^1]: C-DISC Technologies — public website (home page).  
    [https://cdisctechnologies.com](https://cdisctechnologies.com)

[^2]: C-DISC Technologies — PEN Foundation product page (15 MT load-bearing capacity stated, NIT Calicut partnership, under-certification status).  
    [https://cdisctechnologies.com/pen-foundation](https://cdisctechnologies.com/pen-foundation)

[^3]: C-DISC Technologies — MNZE Homes product page (light gauge steel frames, customisable envelopes).  
    [https://cdisctechnologies.com/mnzeh](https://cdisctechnologies.com/mnzeh)

[^4]: C-DISC Technologies — About page (mission statement, R&D positioning).  
    [https://cdisctechnologies.com/about](https://cdisctechnologies.com/about)

[^5]: OpenAI — Responses API reference (endpoint, request/response shape, tool support).  
    [https://platform.openai.com/docs/api-reference/responses](https://platform.openai.com/docs/api-reference/responses)

[^6]: OpenAI — Web search tool (web_search_preview, GA models).  
    [https://platform.openai.com/docs/guides/tools-web-search](https://platform.openai.com/docs/guides/tools-web-search)

[^7]: OpenAI — Pricing page (per-token cost estimates for gpt-4o-mini and gpt-4o).  
    [https://openai.com/api/pricing/](https://openai.com/api/pricing/)

[^8]: OpenAI — API key management & best practices.  
    [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

[^9]: Vercel — Static site hosting (free tier, CDN distribution).  
    [https://vercel.com/docs/concepts/projects/overview](https://vercel.com/docs/concepts/projects/overview)

[^10]: Vercel — Custom domains and aliasing.  
    [https://vercel.com/docs/projects/domains/add-a-domain](https://vercel.com/docs/projects/domains/add-a-domain)

[^11]: Mozilla MDN — Window.localStorage (browser storage API).  
    [https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

[^12]: Mozilla MDN — Fetch API (used for direct browser-to-OpenAI calls).  
    [https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

[^13]: Mozilla MDN — CORS-safelisted request headers (why no preflight on application/x-www-form-urlencoded).  
    [https://developer.mozilla.org/en-US/docs/Glossary/CORS-safelisted_request_header](https://developer.mozilla.org/en-US/docs/Glossary/CORS-safelisted_request_header)

[^14]: WhatsApp — Click-to-chat (wa.me deep-link format).  
    [https://faq.whatsapp.com/5913398998672934](https://faq.whatsapp.com/5913398998672934)

[^15]: WhatsApp Business — Messaging Policy (no auto-DM / unsolicited bulk; user-initiated only).  
    [https://www.whatsapp.com/legal/messaging-policy](https://www.whatsapp.com/legal/messaging-policy)

[^16]: LinkedIn — Professional Community Policies (manual outreach only; no scraping/automation).  
    [https://www.linkedin.com/legal/professional-community-policies](https://www.linkedin.com/legal/professional-community-policies)

[^17]: IBEF — Indian construction industry report FY25 ($640 bn sector estimate).  
    [https://www.ibef.org/industry/construction](https://www.ibef.org/industry/construction)

[^18]: CRISIL — Construction Outlook (CAGR projections for the sector).  
    [https://www.crisil.com/en/home/our-businesses/india-research.html](https://www.crisil.com/en/home/our-businesses/india-research.html)

[^19]: Mordor Intelligence — India Pre-Engineered Buildings market report 2025.  
    [https://www.mordorintelligence.com/industry-reports/india-pre-engineered-buildings-market](https://www.mordorintelligence.com/industry-reports/india-pre-engineered-buildings-market)

[^20]: NIAL — Noida International Airport (Jewar) project documents (₹10,050 cr Phase 1 stated).  
    [https://nialjewarairport.com](https://nialjewarairport.com)

[^21]: NICDC — National Industrial Corridor Development Corporation (11-city programme).  
    [https://www.nicdc.in](https://www.nicdc.in)

[^22]: MoRD — PMAY-G (Pradhan Mantri Awas Yojana — Gramin) Annual Progress.  
    [https://pmayg.nic.in](https://pmayg.nic.in)

[^23]: NABARD — Annual Report (agri-infrastructure financing).  
    [https://www.nabard.org](https://www.nabard.org)

[^24]: DMIC — Delhi-Mumbai Industrial Corridor official site.  
    [https://www.dmicdc.com](https://www.dmicdc.com)

[^25]: NSDC — National Skill Development Corporation (construction-trade certification standards referenced for installer training).  
    [https://www.nsdcindia.org](https://www.nsdcindia.org)

[^26]: NIT Calicut — Research partnership context for PEN Foundation development.  
    [https://nitc.ac.in](https://nitc.ac.in)

[^27]: C-DISC GROW NORTH — Source repository on GitHub (this project).  
    [https://github.com/divyaman-pal/Assignment](https://github.com/divyaman-pal/Assignment)

[^28]: Live deployment of the GTM agent.  
    [https://cdisc-north-engine.vercel.app](https://cdisc-north-engine.vercel.app)

---

### Contact

| Item | Detail |
|---|---|
| Live app | [cdisc-north-engine.vercel.app](https://cdisc-north-engine.vercel.app) |
| Source repo | [github.com/divyaman-pal/Assignment](https://github.com/divyaman-pal/Assignment)[^27] |
| Strategy deck | `cdisc-north-india-gtm/cdisc-north-india-gtm.pptx` in the same repo |
| Company website | [cdisctechnologies.com](https://cdisctechnologies.com)[^1] |

*Document v2 · footnoted edition · ~3,600 words · 27 numbered references*