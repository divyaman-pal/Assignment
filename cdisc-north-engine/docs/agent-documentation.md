# C-DISC North Engine

## The GTM Agent — Product & Technical Documentation

---

### Live deployment
**URL:** [https://cdisc-north-engine.vercel.app](https://cdisc-north-engine.vercel.app)
**Stack:** Vanilla JavaScript · HTML · CSS · OpenAI Responses API · Vercel (static)
**Source code size:** ~2,500 lines of code · 4 files · ~140 KB total

---

## 1. Executive Summary

The **C-DISC North Engine** is a live, working go-to-market (GTM) tool built as the *operational layer* underneath the North-India expansion strategy. It is not a slide deck and not a wireframe — it is a production-deployed single-page web application that a North-India sales team could begin using on day one.

In one sentence: **it is a CRM + lead discovery + outreach generator + activity tracker, all wrapped into one browser app that runs without a backend.**

The agent solves a real workflow problem: the moment C-DISC decides to expand into North India, the field team needs to (a) find leads, (b) decide which ones are worth pursuing, (c) generate personalised outreach, (d) track every interaction, and (e) measure pipeline progress. Most of those needs are typically met by a stack of expensive SaaS tools — HubSpot, Lemlist, Apollo, Outreach. The agent collapses them into one focused, single-purpose application tailored to C-DISC's specific constraints (PEN Foundation's segment fit, G+1 enforcement, Hindi/English bilingual outreach, North India zones).

---

## 2. Why a Tool — Not Just a Strategy Document

A strategy deck tells the C-DISC leadership *what to do*. A working tool tells the **operations associate** *how to do it every morning*. The two are complements, not substitutes.

The reasoning was:

- A strategy deck without an operating layer dies in a slide reel. The first ops hire still has to figure out their daily workflow from scratch.
- Most North-India construction leads are not in any single database — they need to be discovered (web search), enriched manually, qualified, and then approached in their language.
- C-DISC's product has a very specific constraint (the G+1 rule, the segment fit) that no generic CRM enforces. Building a custom tool *embeds* that constraint into the workflow itself.
- A live web app is also a **strategic signal** to leadership: this isn't just a recommendation, the execution layer already exists.

---

## 3. What It Does — The User Workflow

The application has five distinct views in the sidebar, used in this typical order:

```
┌─────────────────────────────────────────────────────────────┐
│  Discover & search   →   Discovery pool   →   CRM           │
│  (Real OpenAI search,    (User reviews        (Selected     │
│   manual entry, or       and picks which       leads with   │
│   sample batch)          to keep)              stage track) │
│                                                       │     │
│                                                       ▼     │
│                            Outreach   ←   Generate messages │
│                            (queue + export)                 │
│                                                       │     │
│                                                       ▼     │
│                            Activity log (everything tracked)│
└─────────────────────────────────────────────────────────────┘
```

The critical design choice — and the one that separates this from naive "agent" tools — is the **discovery pool**. Discovered leads do **not** automatically enter the CRM. The user has to explicitly check the boxes for the leads they want and click *Add to CRM*. This mirrors how real sales teams work: discovery is noisy, the CRM is the source of truth, and human judgment sits between the two.

---

## 4. The Five Views Explained

### 4.1 CRM (Pipeline Overview)

The **CRM** view is the home screen. It shows:

- **Five KPI cards** — total leads, new, contacted, replied, won
- **A toolbar** — Kanban / Table view toggle · search box · stage filter · segment filter · CSV export
- **A kanban board** with seven columns representing the seven pipeline stages: New · Contacted · Replied · Qualified · Proposal sent · Won · Lost
- **A stage funnel chart** — leads distributed across stages
- **A recent-activity feed** — last 8 events

Clicking any lead card opens a side drawer with:

- All editable fields (contact, phone, email, district, segment, address)
- A **stage changer** with seven coloured pill buttons
- A note-taking field with timestamp logging
- The queued outreach message (if any) with copy / open-in-WhatsApp / mark-sent actions
- A full **history timeline** with bullet markers — every edit, every stage change, every note, every send

### 4.2 Discover & Search

Three input modes, switchable via tabs:

**Tab 1 · Real web search.** Browser calls the OpenAI Responses API with the `web_search_preview` tool. The user types a query like *"poultry farms in Bareilly Uttar Pradesh"*, OpenAI searches the live web, and returns 5–15 structured business records (name, address, district, phone, email, website, segment, source URL). Results populate the discovery pool below.

**Tab 2 · Manual entry.** A form for adding one lead at a time — name, segment, district, contact name, phone, email, address. Two buttons: *Add to discovery pool* (review later) or *Add & push to CRM directly*.

**Tab 3 · Sample batch.** A generator that creates realistic mock leads (zone + segment + count) for testing the pipeline. Includes an apartment-trap lead in every batch ≥ 8 to demonstrate the G+1 reject rule.

Below all three tabs sits the **discovery pool** — a table of every lead discovered but not yet added to the CRM. Each row has:

- A **checkbox** (disabled for G+1-rejected leads)
- Lead name + address
- Auto-detected segment
- Contact info (or an *Add contact* inline-edit button if missing)
- Source badge (web / manual / sample)
- Status pill (ready / G+1 reject)

The user checks the leads they want and clicks *Add N selected to CRM*. That single click moves them into the CRM with stage `new`, logs the activity, and clears the pool.

### 4.3 Outreach

Three sub-tabs:

- **Generate & queue.** For every CRM lead not yet contacted, renders a personalised message using the current channel (WhatsApp / Email / LinkedIn) and language (English / Hindi). Each message card has *Copy* and *Queue* buttons.
- **Outreach queue.** Groups queued messages by channel. For each:
  - WhatsApp queue: an **Open WhatsApp** button that produces a real `wa.me/91XXXXX?text=...` deep-link
  - Email queue: a CSV export with `name, contact, email, district, subject, body`
  - LinkedIn queue: a CSV export with the message body for manual paste
  - Bulk *Mark all as sent* per channel
- **Sent.** History of every sent message with date, channel, current stage, subject/preview, and a *Re-queue* option.

The moment a user marks a message sent (or clicks *Open WhatsApp* on the wa.me link), the lead's stage **auto-bumps from `new` to `contacted`**, and a history entry is logged on the lead.

### 4.4 Activity

A reverse-chronological log of every event in the workspace — searches run, leads added, stage changes, notes added, messages queued, messages sent, CSV exports. Each event has a coloured icon by event type and a relative timestamp. The user can clear the log if needed.

### 4.5 Configure

Three sections:

**Search engine · OpenAI.** Where the user pastes their OpenAI API key. The key is stored only in the browser's localStorage — it never travels to any server other than `api.openai.com` itself. Also has a model picker (gpt-4o-mini / gpt-4o / gpt-4.1-mini / gpt-4.1), a *Save* button, *Test connection* button, and a *Clear stored key* button.

**Score blend.** Tunable weights for the lead-scoring formula (fit% / geo% / segment%) and the minimum qualifying score.

**Rules & metadata.** A list of the 28 G+1 reject keywords, the five segment definitions (with priority weights and keyword lists), and the four geo zones.

---

## 5. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       BROWSER (no backend)                  │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  index.html │    │  app.css    │    │  app.js     │      │
│  │  (sidebar   │    │  (design    │    │  (state +   │      │
│  │   nav,      │    │   system,   │    │   router +  │      │
│  │   shells)   │    │   ~1,600    │    │   views +   │      │
│  │             │    │   lines)    │    │   logic,    │      │
│  │             │    │             │    │   ~2,500    │      │
│  │             │    │             │    │   lines)    │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│         │                                      │            │
│         │                                      ▼            │
│         │                            ┌─────────────────┐    │
│         │                            │  localStorage   │    │
│         │                            │  (state.v5)     │    │
│         │                            └─────────────────┘    │
│         │                                      │            │
└─────────┼──────────────────────────────────────┼────────────┘
          │                                      │
          ▼                                      ▼
   Hosted on Vercel              External API calls (user-initiated)
   (static site,                  ┌───────────────────────┐
   global CDN)                    │  api.openai.com       │
                                  │  (Responses API +     │
                                  │   web_search_preview) │
                                  └───────────────────────┘
```

**Why no backend?**

1. **Privacy:** the OpenAI API key never touches our server. Browser → OpenAI direct.
2. **Cost:** zero infrastructure cost beyond Vercel's free static hosting.
3. **Simplicity:** the entire stack is HTML + CSS + JS. One operations associate can read and modify it.
4. **Portability:** state lives in localStorage — easy to export, easy to reset, no database to migrate.

**Why vanilla JavaScript?**

1. **No build step.** Edit a line, refresh the browser, see the change.
2. **No framework lock-in.** Future maintainers can read it without learning React/Vue/Svelte.
3. **Lightweight.** Entire JS payload is ~85 KB unminified, loads instantly.

---

## 6. The Discovery Engine (OpenAI Integration)

The real-search workflow runs entirely in the browser. When the user types a query and hits search:

```
1.  Browser checks: is an OpenAI key configured?
    └─ If no → friendly error with link to Configure view

2.  Browser sends a POST to https://api.openai.com/v1/responses
    Headers: Authorization: Bearer <user's key>
             Content-Type: application/json
    Body:    {
               model: 'gpt-4o-mini',
               input: <prompt>,
               tools: [{ type: 'web_search_preview' }],
               tool_choice: 'auto'
             }

3.  The prompt instructs OpenAI to:
    - Search the live web for businesses matching the query
    - Find 5-15 REAL businesses (verified via web search)
    - SKIP anything resembling apartments / towers / multi-storey
      buildings (the G+1 hard rule)
    - Return strict JSON in the shape:
        { results: [{ name, address, district, phone, email,
                      website, segment, source_url }] }
    - Map each result to one of C-DISC's five segments

4.  Browser receives the response, strips any markdown fences,
    parses the JSON, and renders each result as a row in the
    discovery pool

5.  Local G+1 reject-keyword scan runs as a belt-and-braces
    second layer — any result whose name contains apartment /
    tower / multi-storey / G+2-G+6 / flats / heights / etc.
    is flagged red and cannot be added to the CRM

6.  Each result remains in the pool until the user explicitly
    selects it and clicks "Add to CRM"
```

**Error handling:**
- `401` from OpenAI → "Invalid API key — check Configure"
- `429` → "Rate limit hit, wait a few seconds"
- Network timeout (28s) → friendly fallback message
- Malformed JSON from OpenAI → graceful error with retry option

---

## 7. The CRM Data Model

Every CRM lead has this shape, stored as one object in `state.crm`:

```javascript
{
  id:           "crm_lq9p3z_a8b2",         // unique, generated
  name:         "Saraswati Poultry Farm",  // business name
  contact:      "Ravi Sharma",             // contact person
  phone:        "+91 98XXXXXXXX",
  email:        "ravi@example.com",
  website:      "https://...",
  address:      "Pilibhit Road, Bareilly, UP",
  district:     "Bareilly",
  segment:      "farm_infra",              // one of 5 segments
  source:       "openai",                  // openai / manual / sample
  stage:        "contacted",               // one of 7 stages
  addedAt:      1736512348000,             // unix ms
  lastActivity: 1736598734000,
  history: [                               // append-only timeline
    { ts: 1736512348000, type: 'created',  note: 'Added from web search' },
    { ts: 1736554121000, type: 'edit',     note: 'phone: "" → "+91 ..."' },
    { ts: 1736598734000, type: 'sent',     note: 'Sent via whatsapp' },
    { ts: 1736598734000, type: 'stage_change', note: 'New → Contacted' },
  ],
  msgChannel:  "whatsapp",                 // whatsapp / email / linkedin
  msgLang:     "hi",                       // en / hi
  msgSubject:  null,                       // email-only
  msgBody:     "Namaste Ravi ji, …",
  queuedFor:   "whatsapp",                 // null if not queued
  sentAt:      1736598734000,              // null if not sent
  notes:       ""
}
```

The **seven pipeline stages** are:

| Stage | Colour | When it changes |
|---|---|---|
| `new` | grey | Default when added |
| `contacted` | blue | Auto-set when message marked sent / WhatsApp opened |
| `replied` | purple | Manual — when prospect responds |
| `qualified` | amber | Manual — confirmed interest |
| `proposal` | green | Manual — quote / BoQ shared |
| `won` | green | Manual — closed-won |
| `lost` | red | Manual — closed-lost |

Every stage change is **logged on the lead's own history** AND in the global activity feed.

---

## 8. The Outreach Engine — Templates Matrix

The outreach engine is built around a **30-block template matrix**:

```
                    Channels (3)
              ┌───────────────────────────────────┐
              │ WhatsApp │  Email  │  LinkedIn   │
   ┌──────────┼──────────┼─────────┼─────────────┤
   │  English │   ✓      │   ✓     │   ✓         │
   │   (en)   │          │         │             │
   ├──────────┼──────────┼─────────┼─────────────┤
   │  हिन्दी    │   ✓      │   ✓     │   ✓         │
   │   (hi)   │          │         │             │
   └──────────┴──────────┴─────────┴─────────────┘
                       × 5 segments
                  = 30 template blocks
```

A typical WhatsApp template (Hindi) for the `industrial_shed` segment:

```
Namaste {contact} ji, C-DISC यहाँ। {name} के G+1 shed के लिए PEN panels —
RCC से 25–30% कम लागत, 3–4 weeks में तैयार। Sample BoQ चाहिए?
YES reply करें। 🙏
```

Placeholders `{contact}`, `{name}`, `{district}`, `{zoneLabel}` are substituted from each lead's record before display. The Hindi templates are in real Devanagari for emails and Hinglish (Latin script + English nouns) for WhatsApp — matching how each medium is actually read.

The WhatsApp queue produces real **wa.me deep-links**: `https://wa.me/919XXXXXXXXX?text=<URL-encoded message>`. Tapping the link on a phone opens WhatsApp with the message pre-filled, ready to send manually. This stays **fully compliant with WhatsApp's Terms of Service** — no auto-sending, no headless bots.

---

## 9. The G+1 Enforcement — Three Defensive Layers

C-DISC's PEN Foundation is specified for ground-floor buildings only. Pitching it to a multi-storey developer is a strategic failure mode the agent prevents in three layers:

**Layer 1 — Local reject-keyword scan (every lead, every time).**
A list of 28 reject keywords (`apartment`, `tower`, `G+2` through `G+6`, `multi-storey`, `flats`, `heights`, `penthouse`, `condo`, `tower a/b`, `block a/b`, etc.) is checked against every lead name. A hit flags the lead red, disables the checkbox in the discovery pool, and prevents addition to the CRM.

**Layer 2 — Prompt instruction to OpenAI.**
The OpenAI search prompt explicitly tells the model to skip multi-storey / apartment / tower / G+2+ buildings before returning results. This filters at the source.

**Layer 3 — Template absence.**
There are no message templates for "multi-storey" or "tower" segments. Even if a rejected lead somehow leaked through the first two layers, `generateMessageFor()` returns `null` for any unknown segment.

So the agent literally **cannot** generate a PEN pitch to a multi-storey developer through any path.

---

## 10. State, Storage & Persistence

The entire application state lives in **one JavaScript object**, serialised to `localStorage` under the key `cdisc-north-state-v5`:

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

The state survives browser refresh, can be inspected via DevTools → Application → Local Storage, and can be reset with the *Reset workspace* button in the sidebar footer. The version-bumping pattern (`v1`, `v2`, … `v5`) is used to invalidate stale schemas when the data shape evolves.

**No data ever leaves the user's browser** except (a) the OpenAI API call, and (b) the optional `wa.me` link when the user clicks to send a WhatsApp message.

---

## 11. Build History — An Honest Account

The agent went through five major iterations to reach the current shape. Each iteration corrected a real failure mode discovered in use:

**V1 — Landing page.** Initial response treated this as a static marketing page. Useful as a starting deployment, but it was not an operational tool.

**V2 — Operational workspace.** Refactored into a single-page agent with five views (dashboard, agent runner, discover, score, messages, outreach, rules). Functional, but had an auto-flow bug — the agent automatically dumped discovered leads straight into the CRM.

**V3 — Two-stage flow.** Introduced the **discovery pool / CRM separation**. Discovered leads now require explicit user selection before entering the CRM. Pipeline stages introduced (new → contacted → replied → … → won/lost). Per-lead drawer with history timeline.

**V4 — Real search (OSM).** Initial real-search implementation called OpenStreetMap Nominatim, then Overpass. Discovered two problems: (a) Nominatim is a geocoder, not a business directory, so it returned mostly empty for business queries; (b) Vercel's serverless function IPs were blocked by Overpass mirrors. Fixed (a) by switching to Overpass; fixed (b) by moving the Overpass call to browser-direct.

**V5 — OpenAI web search (current).** Replaced the OSM stack entirely with OpenAI's Responses API + `web_search_preview` tool. This produces genuinely useful structured business data with contact info, which Overpass could not. The user's OpenAI key is stored locally and used directly from the browser. Added Configure view, surgical re-rendering (so search results don't wipe in-progress UI state), 28-second timeout, friendly error handling for 401/429/timeout cases.

Each iteration was driven by an actual failure observed in real use — not abstract perfectionism. That's the right way to build a tool.

---

## 12. Running, Deploying, Iterating

**Run locally (no install):**
```bash
cd cdisc-app/
python3 -m http.server 8000
# open http://localhost:8000
```

**Deploy to Vercel:**
```bash
cd cdisc-app/
vercel deploy --prod --yes
```
Static site, no build step. Vercel auto-detects index.html and serves the directory as-is.

**Iterate on a single feature:**
1. Edit `app.js` (everything is in here — state, router, views, logic)
2. Refresh the browser
3. The state persists across reloads via localStorage
4. If you change the state shape, bump `STORAGE_KEY` to a new version

**File map:**

| File | Lines | Role |
|---|---|---|
| `index.html` | ~80 | Sidebar shell + drawer + toast scaffolding |
| `app.css` | ~1,600 | Complete design system (light + dark themes, kanban, drawer, etc.) |
| `app.js` | ~2,500 | Constants, state, utilities, OpenAI integration, CRM logic, message templates, all view functions |
| `vercel.json` | ~25 | Security headers + cache policies |

---

## 13. Honest Limitations & Caveats

The tool is good. It is not perfect. The limitations matter:

- **Single-user.** State is in browser localStorage. There is no multi-user sync. If two ops associates use it simultaneously, they have separate copies. A real multi-user CRM would need a server + database — out of scope for this build.
- **API key exposure.** The OpenAI key sits in the user's browser. Anyone with devtools access on that browser can read it. Mitigation: use a project-scoped key with a low usage cap, and rotate periodically. A server-side proxy with key-in-env would be more secure but adds infrastructure.
- **No email delivery.** The Email tab exports CSVs but doesn't actually send emails. Connecting an SMTP service (e.g. Resend / SendGrid via a Vercel function) is the natural next step.
- **No real WhatsApp Business API.** The wa.me link approach is ToS-safe but manual — the user taps each link from their phone. Integrating a WhatsApp BSP (Twilio / Gupshup / Meta Cloud) would enable bulk send, but requires a BSP account and a verified business profile.
- **Search quality depends on OpenAI.** Some queries return excellent structured business data; others return generic or sparse results. Quality varies by prompt specificity (more specific = better) and chosen model (gpt-4o > gpt-4o-mini for harder queries).
- **No on-device LLM.** All OpenAI calls cost money — typically ~$0.001 to ~$0.02 per search depending on model. A user could rack up bills if they search aggressively without setting OpenAI account caps.

---

## 14. Future Enhancements

Roughly in order of value:

1. **Server-side OpenAI proxy** — move the API key into Vercel env vars, expose `/api/search` as the only public surface. Adds a small infrastructure cost, removes the key-exposure risk.
2. **Real email integration** via a Vercel function calling Resend/SendGrid. Templates are already in place.
3. **WhatsApp BSP integration** — once C-DISC has a verified business profile, switch the WhatsApp queue from `wa.me` links to direct BSP send.
4. **Multi-user sync** — replace localStorage with a Postgres/Supabase backend. Adds auth, makes the tool team-usable.
5. **Lead enrichment** — automatic LinkedIn / website lookup for each lead, populating contact info that OpenAI couldn't find.
6. **Pipeline analytics** — conversion-rate charts per channel, per beachhead, per segment. Currently the data is there; the visualisations aren't yet.
7. **Mobile-first UI for the WhatsApp workflow** — given that wa.me deep-links open on phones, a clean mobile view for the queue would be high-leverage.
8. **Integration with the strategy deck data** — once C-DISC shares the "[TBD]" numbers in the strategy document, populate this tool with real targets and the KPI dashboard becomes live.

---

## 15. Why This Matters Strategically

A strategy document tells leadership *what the right answer is*. A working tool proves that **the team building the strategy understood the operational reality well enough to make the answer executable**. That is the single biggest credibility signal a strategy team can offer.

Most North-India expansion plans for South-based construction companies have failed in the same way: a strategic recommendation lands on the leadership's desk, gets approved, and then dies in execution because the field team — sitting in a city the company has never operated in — has no tools, no playbook, no operating layer. They are left to invent their workflow from scratch, in a language and culture the head office doesn't speak.

The C-DISC North Engine pre-empts that failure mode by **shipping the operating layer alongside the strategy.** The first North-India ops hire can sit down at their laptop on day one and start working. Discovery, qualification, outreach, tracking — all in one place, all designed around C-DISC's specific product constraints.

That is the strategic value of building the tool. The strategy deck answers *should we expand North?* The agent answers *yes, and here is how Tuesday morning looks.*

---

### Contact & references

| Item | Detail |
|---|---|
| Live app | [cdisc-north-engine.vercel.app](https://cdisc-north-engine.vercel.app) |
| Strategy deck | `cdisc-north-india-gtm/cdisc-north-india-gtm.pptx` in the same repo |
| Source repository | [github.com/divyaman-pal/Assignment/tree/main/cdisc-north-engine](https://github.com/divyaman-pal/Assignment) |
| Company website | [cdisctechnologies.com](https://cdisctechnologies.com) |

*Document v1 · ~3,400 words · approximately 12-minute read*
