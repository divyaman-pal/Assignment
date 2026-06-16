# VidyaSetu MVP

VidyaSetu is a voice-first AI career bridge for rural, low-income, first-generation, and other disadvantaged learners. The MVP helps a learner speak or type naturally, builds a structured learner profile, recommends a personalized pathway, turns that pathway into a weekly learning journey, preserves progress, creates a consent-aware Skill Passport, and only then moves toward opportunity discovery or outreach.

Live app: https://vidyasetu-mvp.vercel.app

## Problem Statement

Learners from disadvantaged backgrounds face barriers across the skilling and career funnel:

- Low access to quality career guidance and skilling information.
- Language and digital-access gaps.
- Poor fit between learner context and recommended courses.
- Dropout because the journey is not paced around real constraints.
- Weak placement outcomes because proof, consent, and outreach are missing.

VidyaSetu addresses this as a full pathway-to-placement system, not just a course recommender.

## Current MVP Flow

1. **Language-first login**
   - The learner selects language before phone login.
   - The app does not assume Hindi by default.
   - Saved learner profiles can resume from the same phone login.

2. **AI counselor intake**
   - Meera, the AI counselor, asks one question at a time.
   - User can type or speak.
   - The counselor extracts profile facts: name, education stage, goal, location, time, device access, proof, commute, mobility, urgency, and language preference.
   - If the learner changes goal later, the latest message wins.

3. **Personalized pathway generation**
   - The system classifies the learner into the right route family:
     - school study support
     - board exam preparation
     - JEE or entrance exam preparation
     - vocational training
     - informal skill validation
     - formal job search
     - college internship or placement
     - startup or founder outreach
     - self-employment or enterprise setup
   - Study-only learners are not pushed into job outreach.
   - Offline recommendations require location and commute context.

4. **Learning journey**
   - Selected pathway becomes a weekly journey.
   - Journey includes modules, daily practice, micro-tasks, proof tasks, progress tracking, support notes, and unlock logic.
   - Course completion is not treated as passive watching. The learner must complete tasks and proof.

5. **Skill Passport**
   - Builds a consent-scoped proof package.
   - Designed for learners with certificates, projects, informal work proof, or voice/photo/sample proof.
   - Outreach or sharing is gated behind consent.

6. **Opportunity engine**
   - Job, apprenticeship, training, startup-outreach, RPL, and enterprise paths are separated.
   - The system does not fabricate jobs.
   - If live opportunities are not verified yet, it shows source tasks, missing proof/resume, and safe next actions instead of fake cards.
   - Firecrawl is used only for deeper verification or contact discovery to protect credits.

## Pathway relevance and journey clarity

Two quality layers keep recommendations relevant and journeys actionable. Both live in `api/_lib/mvp.js` as reusable helpers (no new serverless functions).

### Goal-family route validation

After routes are generated (LLM-first, deterministic fallback), every route is validated against the learner's **goal family** before it reaches the UI:

- `goalFamily(profile)` resolves one of: `entrance_exam`, `board_exam`, `school_study`, `data_science_job`, `college`, `informal_skill`, `enterprise`, `job`, `vocational`, `generic`.
- `routeMatchesGoalFamily(profile, route)` / `rejectUnrelatedRoute(profile, route)` accept a route only if it contains required terms for the family and none of the forbidden terms.
- `validatePathwayRoutes(profile, routes)` drops unrelated routes and back-fills with deterministic, family-correct routes so the learner always sees three relevant cards.
- `buildLocationGuardrail(profile)` returns a location prompt (no cards) when an offline route needs a district/commute that the learner has not shared. A learner who refuses to relocate and hides their location now correctly hits this guardrail.

Examples of what is enforced:

- A **JEE/IIT** learner only gets syllabus, concept, practice, mock, and error-log routes — never beauty/PMKVY/job-outreach cards.
- A **Class 10/12** learner gets NCERT/DIKSHA/sample-paper/revision study routes, not an employability route.
- A **BTech data-science job seeker** gets Python/SQL/project/portfolio/resume/outreach-readiness routes, never a computer-basics-only route.
- An **informal mechanic/tailor** gets proof/RPL/local-work/apprenticeship routes, not a generic beginner course.
- An **enterprise** learner gets setup/budget/scheme/buyer/risk/first-30-days routes, with job-outreach blocked as the primary route.

Each validated route also carries deterministic explanation fields when the model omits them: `why_this_route`, `matched_profile_facts`, `next_action`, `locked_until`, `risk` (tradeoff), and `expected_outcome`.

### Learner journey enrichment

`enrichJourneyForLearner(profile, route, journey)` (with `enrichModule`, `buildTodayTask`, and `buildProofTask`) makes every journey understandable for a real learner:

- Each **module** has `week`, `title`, `goal`, `why_it_matters`, `lessons`, `daily_plan`, `practice_tasks`, `proof_task`, `checkpoint`, and `unlocks`.
- Each **lesson** carries `title`, `type`, `estimated_time`, `instructions`, `completion_criteria`, `proof_required`, and a `resource`.
- The journey exposes a `start_here` panel and `today_task` so the learner knows what to start today, how to complete the step, what proof is required, and what unlocks next, plus a `selected_pathway_summary`.

These fields are additive, so existing progress tracking, persistence, and the opportunity engine continue to work unchanged.

## Vernacular UI and "this week" actions

Two changes make the product usable by a first-generation rural learner on her own and give her something to do today.

### Vernacular UI chrome (`src/i18n.js`)

The learner's language choice now drives the **interface chrome**, not just the chat. `src/i18n.js` provides dictionaries for English, Hindi, Hinglish, and Odia (the persona languages) covering the navigation, page headers, primary buttons, and the pathway/journey panels. The explicit login language is stored in a dedicated `uiLanguage` state and is **not** overwritten by later language detection, so the menus and labels stay in the chosen language even if the learner types a chat message in another language (the counselor still replies in the detected language). Other languages fall back to English chrome while the conversation stays in-language — full per-language chrome translation is a follow-up.

### "This week" hyperlocal actions (`buildThisWeekActions`)

Every pathway response now includes `this_week_actions`: 5-10 concrete steps the learner can take this week, tailored to her goal family and location, and surfaced as a numbered "Do this week" list on the Pathway screen. These use only **real official portals** (National Career Service, DigiLocker, Skill India Digital, NCERT/DIKSHA, NTA, National Scholarship Portal, Udyam, PMEGP, PM FME) and **real local-action types** (capture sample-work proof, ask nearby shops/customers for small work). Consistent with the no-fake-data policy, there are **no fabricated employers, phone numbers, or specific job listings**. The list also appears on the location guardrail, so a learner who has not shared her location still gets actionable steps plus a prompt to share her exact block/panchayat. The dynamic action descriptions are currently in simple English; translating them per language is the next step.

## Architecture

```mermaid
flowchart TD
  A["Learner: phone + language login"] --> B["React UI: Meera counselor"]
  B --> C["/api/counselor: profile extraction + next question"]
  C --> D["Supabase: learner memory + progress"]
  C --> E["/api/pathway: route generation"]
  E --> F["/api/journey: weekly learning journey"]
  F --> G["/api/progress: lesson and proof progress"]
  F --> H["/api/passport: consent-aware Skill Passport"]
  H --> I["/api/jobs: opportunity engine"]
  I --> J["Live search and contact discovery"]
  J --> K["OpenAI web search"]
  J --> L["Firecrawl deep verification"]
  I --> M["/api/outreach: consent-based outreach draft"]
```

## Tech Stack

- **Frontend:** React 19, Vite, Lucide icons, responsive CSS.
- **Hosting:** Vercel static frontend plus serverless API functions.
- **Database:** Supabase REST for learners, progress, passports, and outreach state.
- **Primary reasoning LLM:** Anthropic Claude, used for higher quality counseling and structured reasoning.
- **Fallback LLM:** OpenAI and Fireworks where configured.
- **Live search:** OpenAI web search for broad discovery.
- **Deep web/contact verification:** Firecrawl, used sparingly and only where needed.
- **Voice:** Browser speech recognition/playback first, Sarvam STT/TTS fallback for Indian language accessibility.
- **Email outreach:** AgentMail placeholder is wired conceptually, but production sending remains disabled until a real key is added.

## API Layer

| File | Purpose |
| --- | --- |
| `api/signup.js` | Phone-based learner session, saved profile recovery, and multi-learner handling. |
| `api/counselor.js` | Meera counselor orchestration, profile extraction, language handling, and one-question-at-a-time intake. |
| `api/intake.js` | Voice/audio intake, Sarvam STT, and Sarvam TTS fallback via `action: "tts"`. |
| `api/pathway.js` | Personalized pathway recommendation with study/job/location guardrails. |
| `api/journey.js` | Converts a selected pathway into a structured learning journey. |
| `api/progress.js` | Saves lesson completion, proof notes, and journey progress. |
| `api/passport.js` | Creates the Skill Passport and consent-scoped proof package. |
| `api/resume.js` | Builds a truthful resume/profile summary from counselor facts. |
| `api/jobs.js` | Opportunity engine for jobs, training, proof-to-work, startup outreach, and enterprise setup. |
| `api/outreach.js` | Drafts outreach only after consent and readiness checks. |
| `api/adews.js` | Early warning support layer for dropout, safety, and learner risk signals. |
| `api/health.js` | Shows configured service status and AI policy. |

Shared server helpers are in `api/_lib/`:

- `http.js`: request/response utilities.
- `supabase.js`: Supabase REST wrapper.
- `services.js`: LLM, Sarvam, OpenAI search, and Firecrawl service wrappers.
- `language.js`: language detection, same-language response policy, STT/TTS metadata.
- `mvp.js`: deterministic knowledge base, route templates, journey templates, guardrails, and fallback logic.

## Frontend Structure

| File | Purpose |
| --- | --- |
| `src/App.jsx` | Main product shell, counselor UI, profile card, pathways, journey, passport, jobs, CRM, support, and evaluation proof. |
| `src/main.jsx` | React app bootstrapping. |
| `src/styles.css` | Responsive product UI, mobile bottom nav, counselor avatar, pathway cards, journey views, and accessibility states. |

The UI is intentionally mobile-first because the target learner is likely to use a phone, shared device, low-data browser, or voice input.

## Environment Variables

Create `.env.local` for local development. Do not commit real keys.

```bash
SUPABASE_REST_URL=https://your-project.supabase.co/rest/v1
SUPABASE_SERVICE_KEY=replace-with-service-role-key
OPENAI_API_KEY=replace-with-openai-key
ANTHROPIC_API_KEY=replace-with-anthropic-key
SARVAM_API_KEY=replace-with-sarvam-key
FIREWORKS_API_KEY=replace-with-fireworks-key
FIRECRAWL_API_KEY=replace-with-firecrawl-key
AGENTMAIL_API_KEY=placeholder
WHATSAPP_SENDER_ID=replace-with-demo-sender-number
```

Optional cost controls:

```bash
OPENAI_JOB_SEARCH_QUERY_LIMIT=1
FIRECRAWL_JOB_SEARCH_LIMIT=2
ENABLE_FIRECRAWL_STARTUP_AUTO=false
ENABLE_FIRECRAWL_SCRAPE=false
MODEL_JSON_TIMEOUT_MS=12000
OPENAI_SEARCH_TIMEOUT_MS=10000
FIRECRAWL_TIMEOUT_MS=8000
SARVAM_TTS_TIMEOUT_MS=12000
```

## Local Development

```bash
npm install
npm run build
npm run serve:mvp
```

Open:

```bash
http://localhost:4175
```

For development with Vite:

```bash
npm run dev
```

## Verification

The repository includes automated smoke and benchmark scripts:

```bash
npm run build
node scripts/persona-e2e-test.mjs
npm run benchmark:slice3
npm run benchmark:slice4
npm run benchmark:slice5
npm run benchmark:slice6
```

The current persona suite covers school, Class 12, JEE switch, dropout tailoring, ITI electrician, nursing, mobile repair, BTech data science, no-location job, no-location training, informal mechanic, poultry enterprise, driver, hospitality, design, agri drone, and open counseling cases. Beyond pass/fail, the persona and slice-5 suites now assert pathway/journey **content quality** per family (for example: JEE output contains mock/practice/error-log and never beauty/job-outreach; data-science output contains Python/SQL/project/resume; informal output contains proof/RPL/local work; enterprise output contains setup/budget/scheme), that every route carries explanation fields, and that journeys have at least three modules with lessons, completion criteria, proof tasks, and unlock logic.

For fast, low-cost local runs, set `DISABLE_PATHWAY_WEB_SEARCH=true` and point the suites at the local server:

```bash
npm run build
DISABLE_PATHWAY_WEB_SEARCH=true npm run serve:mvp   # in one terminal
TEST_BASE_URL=http://localhost:4175 node scripts/persona-e2e-test.mjs
SLICE5_BASE_URL=http://localhost:4175 node scripts/slice5-journey-progress-benchmark.mjs
SLICE6_BASE_URL=http://localhost:4175 node scripts/slice6-final-smoke.mjs
```

`DISABLE_PATHWAY_WEB_SEARCH` only skips the live web-search evidence step (keeping tests fast and deterministic); production leaves it unset so OpenAI web search and Firecrawl still ground recommendations.

## Responsible AI and Product Guardrails

- No fake jobs or fabricated employer contacts.
- No offline recommendation without location or mobility context.
- Study-first learners remain study-first until they explicitly ask for career or job mode.
- Same-language counseling is preserved across text, speech, and pathway outputs.
- Outreach is blocked until proof and consent are ready.
- Shared-phone and returning-profile flows are supported.
- Firecrawl is credit-safe and used only for deep verification, not every request.

## Current Limitations

- AgentMail sending is still a placeholder until a real production key is configured.
- Live opportunity quality depends on available public sources and configured search providers.
- Voice playback may fall back to Sarvam if browser speech is unavailable.
- This is a hackathon MVP and demo-ready system, not a fully field-tested deployment.

## Deployment

The app is configured for Vercel:

```bash
npx vercel deploy --prod
```

Production alias:

```bash
https://vidyasetu-mvp.vercel.app
```
