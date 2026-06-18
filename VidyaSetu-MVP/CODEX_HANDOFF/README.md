# VidyaSetu — Handoff for Codex

> **You are taking over an EXISTING, working codebase. DO NOT rebuild from scratch.**
> Read this whole document, then continue from section 6 ("Where to improve").
> Every source file is already present in the parent `VidyaSetu-MVP/` folder
> (`src/`, `api/`, `scripts/`, configs). This `CODEX_HANDOFF/` folder only adds
> this README plus `changes.patch` (the full diff of recent work vs. the original).

---

## 0. TL;DR for Codex

- Product: **VidyaSetu** — a voice-first, vernacular AI career/education bridge for first-generation, rural, low-income learners in India. Live: https://vidyasetu-mvp.vercel.app
- Stack: **React 19 + Vite** frontend (`src/`), **Vercel serverless functions** (`api/*.js`), **Supabase** persistence, **Anthropic Claude** (primary LLM) + **OpenAI** (fallback + web search) + **Sarvam** (Indic STT/TTS) + **Firecrawl** (deep web verification).
- The recent work (3 rounds, all DONE — see section 4) improved: pathway relevance, learning-journey clarity, a vernacular UI, real "this-week" actions, and a UI declutter. **Do not redo these.**
- Your job: continue improving (section 6), respecting the hard constraints (section 7) and gotchas (section 8).

---

## 1. What the product does (current flow)

1. **Language-first login** — learner picks a language, then logs in with a 10-digit phone number. Returning learners resume saved profile/progress.
2. **AI counselor "Meera"** (`api/counselor.js`) — extracts a structured profile from natural chat (type or voice), one question at a time, in the learner's language.
3. **Pathway** (`api/pathway.js`) — classifies the learner into a goal family and recommends 3 relevant, source-cited routes + a "Do this week" action list.
4. **Learning journey** (`api/journey.js`) — turns the chosen route into a weekly plan (lessons, daily tasks, proof tasks, unlock rules).
5. **Skill Passport** (`api/passport.js`) — consent-scoped proof package with a mock QR.
6. **Opportunity engine** (`api/jobs.js`) + **Outreach** (`api/outreach.js`) — consent-gated, never fabricates jobs/contacts.
7. **ADEWS / Worker support** (`api/adews.js`) — dropout-risk safety net.

---

## 2. How this code reached you / where it lives

- **Deployable source of truth:** GitHub `divyaman-pal/Assignment`, branch `vidyasetu-mvp-source`, folder `VidyaSetu-MVP/`. The Vercel project `vidyasetu-mvp` is **Git-connected to this repo**, so a push there redeploys https://vidyasetu-mvp.vercel.app.
- The recent changes were developed in a different private repo (`Github-FirstPR`, PR #16) because of access limits, then handed over as this folder + `changes.patch`.
- **`CODEX_HANDOFF/changes.patch`** is the full diff of all recent work against the original baseline. If you ever start from the original `VidyaSetu-MVP/`, apply it from the **repo root** with:
  ```bash
  git apply CODEX_HANDOFF/changes.patch    # paths inside are VidyaSetu-MVP/...
  ```
  (If applied from inside `VidyaSetu-MVP/`, use `git apply -p2 ... ` adjusting the path prefix.) Normally you do NOT need this — the code in this folder already includes every change.

---

## 3. Architecture (file-by-file)

### Frontend (`src/`)
| File | Purpose |
| --- | --- |
| `src/App.jsx` | The entire SPA (~3.4k lines): language-first login, Meera chat, profile card, and the Pathway / Journey / Passport / Jobs / Outreach / Support / Overview tabs. Components to know: `PathwaysTab`, `JourneyTab`, `PassportTab`, `JobsTab`, `MockQr`. |
| `src/i18n.js` | UI-chrome localization dictionaries (English, Hindi, Hinglish, Odia) + `getTranslations(languageName)` and `uiLangCode()`. |
| `src/styles.css` | All styling (mobile-first). |
| `src/main.jsx` | React bootstrap. |

### Serverless API (`api/`) — **exactly 12 functions; do not add more (Vercel limit)**
| File | Purpose |
| --- | --- |
| `api/signup.js` | Phone login, saved-profile restore, multi-learner. |
| `api/counselor.js` | Meera orchestration + profile extraction + language handling. |
| `api/intake.js` | Voice/audio intake (Sarvam STT) + TTS (`action:"tts"`). |
| `api/pathway.js` | Pathway recommendation endpoint (calls `generatePathways`). |
| `api/journey.js` | Builds the learning journey (calls `buildLearningJourney`). |
| `api/progress.js` | Saves lesson/proof progress; computes module status + unlocks. |
| `api/passport.js` | Skill Passport + consent + mock QR. |
| `api/resume.js` | Builds a truthful resume/proof summary from profile (no upload needed). |
| `api/jobs.js` | Opportunity engine (jobs/training/proof-to-work/startup/enterprise). |
| `api/outreach.js` | Consent-gated outreach drafts + reply classification. |
| `api/adews.js` | Dropout-risk scoring + worker escalation. |
| `api/health.js` | Service/config status. |

### Shared server libs (`api/_lib/`)
| File | Purpose |
| --- | --- |
| `api/_lib/mvp.js` | **Core deterministic brain**: KB docs, route templates, journey templates, goal-family validation, route explanations, journey enrichment, this-week actions, scoring, ADEWS. Most logic lives here. |
| `api/_lib/services.js` | Claude/provider wrappers (`callClaudeJson` / `callAnthropicJson`), `generatePathways`, profile extraction, OpenAI web search, Firecrawl, Sarvam STT. |
| `api/_lib/language.js` | Language detection, same-language reply policy, STT/TTS metadata. |
| `api/_lib/supabase.js` | Supabase REST wrapper **with an in-memory fallback** when env is absent. |
| `api/_lib/http.js` | Request/response helpers. |

### Tests (`scripts/`)
| File | Purpose |
| --- | --- |
| `scripts/local-mvp-server.mjs` | Runs all API handlers + serves `dist/` at `http://localhost:4175` (used by all tests). |
| `scripts/persona-e2e-test.mjs` | 25 persona end-to-end tests + content-quality assertions. |
| `scripts/slice5-journey-progress-benchmark.mjs` | Journey + progress + persistence checks. |
| `scripts/slice6-final-smoke.mjs` | 8-persona smoke (counselor→pathway→journey→progress→passport). |
| `scripts/slice3/slice4/benchmark-slices.mjs` | Opportunity + language/voice benchmarks. |

---

## 4. What is ALREADY implemented (do not redo)

### Round 1 — pathway relevance + journey clarity (`api/_lib/mvp.js`, `services.js`)
- **Goal-family route validation** so cards match the learner's goal. Key exported helpers in `mvp.js`:
  - `goalFamily(profile, ctx)` → one of `entrance_exam | board_exam | school_study | data_science_job | college | informal_skill | enterprise | job | vocational | generic`.
  - `routeMatchesGoalFamily(profile, route, family)`, `rejectUnrelatedRoute(...)`, `validatePathwayRoutes(profile, routes, opts)` (drops off-goal routes, backfills deterministic ones, always returns 3).
  - `buildLocationGuardrail(profile)` (no-location → ask for district/block instead of cards).
- **Deterministic enterprise routes** + enterprise journey template.
- **Route explanation fallbacks** via `decorateRouteExplanation`: `why_this_route`, `matched_profile_facts`, `next_action`, `locked_until`, `risk`, `expected_outcome`.
- **Journey enrichment**: `enrichJourneyForLearner`, `enrichModule`, `buildTodayTask`, `buildProofTask` → every module has `why_it_matters`, `daily_plan`, `proof_task`, `checkpoint`, `unlocks`, `lesson_details`; journey has `start_here`, `today_task`, `selected_pathway_summary`.
- Route-name normalization (`route_name`/`route_link` aliases) and a location-guardrail fix (ignores "no relocation").

### Round 2 — vernacular UI + "this week" actions
- `src/i18n.js`: nav, headers, buttons, pathway/journey panels in EN/HI/Hinglish/OR. A dedicated `uiLanguage` state in `App.jsx` keeps the chosen chrome language even after an English chat message.
- `buildThisWeekActions(profile, family)` in `mvp.js`: 5–10 concrete steps using **only real official portals** (NCS, DigiLocker, Skill India, NCERT/DIKSHA, NTA, NSP, Udyam, PMEGP, PM FME) and real local-action *types* — **no fabricated employers/contacts**. Attached to every pathway response (incl. the guardrail). Rendered as a numbered "Do this week" list on the Pathway screen.

### Round 3 — declutter + cross-vocation fix
- Removed backend/spec panels from the Journey screen (delivery grid, 4-box learning-contract grid, per-module low-data/voice/safety/dropout/metrics notes) and the duplicate "Why this pathway"/"What's blocked" cards from the Pathway screen. Learner now sees only actionable content.
- **Cross-vocation guard** in `mvp.js` (`VOCATIONS`, `crossVocationConflict`): a mobile-repair learner no longer gets a beauty/salon card (both said "training"). Applied for `vocational | informal_skill | generic | job` families.

---

## 5. How to run & test locally

```bash
cd VidyaSetu-MVP
npm install
npm run build                       # vite build -> dist/
DISABLE_PATHWAY_WEB_SEARCH=true npm run serve:mvp   # http://localhost:4175
```

`.env.local` (git-ignored — never commit real keys):
```
ANTHROPIC_API_KEY=...      # Claude reasoning model for counselor/pathway/journey/resume/jobs
OPENAI_API_KEY=...         # fallback + web-search evidence
# Optional (production Vercel project already has these set):
SUPABASE_REST_URL=... SUPABASE_SERVICE_KEY=...
SARVAM_API_KEY=...         # Indic STT/TTS (voice)
FIRECRAWL_API_KEY=...      # deep verification (NOT on every request)
ANTHROPIC_MODEL=claude-sonnet-4-5
OPENAI_MODEL=gpt-4.1-mini
MODEL_JSON_TIMEOUT_MS=20000
```

Run the tests (server must be running first):
```bash
TEST_BASE_URL=http://localhost:4175      node scripts/persona-e2e-test.mjs
SLICE5_BASE_URL=http://localhost:4175    node scripts/slice5-journey-progress-benchmark.mjs
SLICE6_BASE_URL=http://localhost:4175    node scripts/slice6-final-smoke.mjs
```
`DISABLE_PATHWAY_WEB_SEARCH=true` only skips the slow live web-search step (keeps tests fast/deterministic); leave it unset in production so OpenAI web search + Firecrawl still ground recommendations.

**Acceptance bar (keep green):** persona suite relevant per family + location guardrail fires; ≥5 this-week actions each; slice5 3/3; slice6 8/8; `npm run build` passes.

---

## 6. Where to improve (prioritized by impact-per-effort)

1. **Translate dynamic content into the learner's language.** The UI *chrome* is localized, but dynamic copy (this-week action titles/`how`, route names/`why_this_route`, journey lesson text) is still English. Add Hindi/Odia/Hinglish strings for `buildThisWeekActions` (parameterize titles per language) and pass the language into route/journey enrichment, or add a localized fallback layer. This is the single biggest "she can use it alone" gap.
2. **Extend i18n coverage to the rest of the app.** Only counselor/pathways/journey/passport/jobs *labels* + the pathway/journey panels are localized today. Localize the remaining tabs (Overview, Profile, Passport body, Jobs, Outreach, Support), the landing "Add new learner" button, the topbar, and module status pills. Add the other 8 languages' chrome to `src/i18n.js`.
3. **Prove voice end-to-end on a low-end Android.** Sarvam STT/TTS is wired (`api/intake.js`) and enabled in prod, but mic input + spoken replies must be verified on a cheap device + slow network, with a clean fallback when browser speech fails. Voice is the access method for low-literacy users.
4. **WhatsApp/IVR/SMS entry + data-light/offline.** Add a PWA (manifest + service worker, <5MB cache) for 2G survivability, and a WhatsApp entry via a gateway (Gupshup/Twilio) — central to the product thesis. (Gateway needs a number + credentials.)
5. **Real hyperlocal precision.** Capture district/block (add a profile field + a small UI input + counselor extraction), then upgrade `this_week_actions` to surface the *nearest* verified centre (use official locators / Firecrawl with caching) — still without fabricating contacts.
6. **Kill the resume wall + surface the Skill Passport QR.** Make "build proof from chat" (`api/resume.js`) the default in Jobs/Opportunity; the mock Aadhaar/DigiLocker QR already exists (`passport.qr_token` + `MockQr` in `App.jsx`) — make it prominent.
7. **Close one ADEWS dropout loop in the UI.** `computeAdews` + the Worker Support tab exist; wire a visible "7-day silence → worker alert" demo.
8. **Maintain the relevance guards** as new personas appear: extend `VOCATIONS` and the `ROUTE_FAMILY_RULES`/`FAMILY_EXPLANATIONS`/`buildThisWeekActions` maps in `mvp.js`.

---

## 7. Hard constraints (do NOT violate)

- **No new serverless files** — Vercel function count must stay **≤ 12** (it is exactly 12 now). Add logic to `api/_lib/*` instead.
- **No fake jobs/contacts/employers.** "0 verified opportunities" honesty is intentional; only real official portals + real action *types*.
- **Keep** Supabase persistence, saved-profile/returning-learner flow, language-first login, the voice layer, and the existing deployment setup.
- **Do not redesign the whole UI or remove tabs.** Improve labels/clarity only.
- **Never commit secrets.** **Firecrawl must not run on every request** (it's gated behind `ENABLE_FIRECRAWL_PATHWAY_FALLBACK` / used only for deep verification).

---

## 8. Gotchas / non-obvious behavior

- **Local Supabase is in-memory** (`globalThis.__VIDYASETU_FALLBACK_DB__`) — persists only within one running server process. Production uses real Supabase.
- **Language auto-switch is intentional**: the counselor updates `profile.preferred_language` from detection, but the UI chrome reads `uiLanguage` (the explicit login pick) so the menus don't flip when a learner types in English. Do **not** revert this to `preferred_language`.
- **Provider order** in `callClaudeJson` (`services.js`): Anthropic Claude → deterministic fallback. Set `ANTHROPIC_API_KEY` for live AI.
- **Pathway web search is slow** (~25–30s via OpenAI `web_search`); `DISABLE_PATHWAY_WEB_SEARCH=true` skips it in tests/dev. Production leaves it on.
- The pathway response includes a `route_validation` object (`family`, `kept`, `rejected`, `replaced`) — a useful debug aid.
- Journey modules keep BOTH the original string arrays (`lessons`, `practice_tasks`, `proof`) used by `progress.js`/the UI checklist AND the additive enriched fields (`lesson_details`, `proof_task`, etc.). Keep both when editing so progress tracking doesn't break.

---

## 9. Key functions to find fast (all in `api/_lib/mvp.js` unless noted)

`goalFamily` · `routeMatchesGoalFamily` · `rejectUnrelatedRoute` · `validatePathwayRoutes` · `buildLocationGuardrail` · `decorateRouteExplanation` · `buildThisWeekActions` · `enrichJourneyForLearner` · `enrichModule` · `buildTodayTask` · `buildProofTask` · `buildLearningJourney` · `sourceLimitedPathways` · `scoreJobs` · `computeAdews` · `consentLimitedOutreach` · `VOCATIONS`/`crossVocationConflict`.
Pathway orchestration + Claude + web search + deterministic fallback: `generatePathways`, `callClaudeJson`, `discoverPathwayEvidence` in `api/_lib/services.js`.
UI localization: `getTranslations`, `uiLangCode` in `src/i18n.js`.

---

## 10. ⚠️ Security TODO for the human (not Codex)

API keys and a Vercel token were shared in chat during development. **Rotate/revoke them**: OpenAI, Anthropic, and the Vercel deploy token. Do not paste live secrets into prompts again — put them in `.env.local` (local) and the Vercel project's Environment Variables (production).

---

## 11. Deploying after Codex's changes

The Vercel project is Git-connected to `Assignment`. Once Codex's changes are committed and pushed to `divyaman-pal/Assignment@vidyasetu-mvp-source`, Vercel auto-deploys to https://vidyasetu-mvp.vercel.app. (Manual CLI deploys are possible with a Vercel token but a Git push is the clean path, since CLI deploys get overwritten by the next Git push.)
