# VidyaSetu MVP Repository

VidyaSetu is a voice-first, vernacular AI career and education bridge for first-generation, rural, low-income learners in India. The MVP helps a learner speak naturally with Meera, build a structured profile, choose and lock one pathway, receive a day-by-day learning journey, save proof, and move toward verified opportunities only with consent.

Live MVP: https://vidyasetu-mvp.vercel.app

## Repository Map

```text
assignment/
  README.md                         # Judge-facing repository guide
  END_TO_END_USER_FLOW.md           # Complete target-user flow for evaluation
  VidyaSetu-MVP/
    README.md                       # Product architecture and developer setup
    package.json                    # Build, local server, and benchmark scripts
    vercel.json                     # Vercel function limits and daily reminder cron
    supabase_schema.sql             # Persistence schema reference
    src/                            # React/Vite frontend
    api/                            # Vercel serverless API functions
      _lib/                         # Shared AI, language, Supabase, and MVP helpers
    docs/                           # Evaluation reports, demo notes, proof docs
    scripts/                        # Local server, tests, reports, demo helpers
    CODEX_HANDOFF/                  # Handoff notes and implementation context
```

The complete product source code is in `VidyaSetu-MVP/`.

## What The MVP Demonstrates

1. **Voice-first intake:** Meera asks one question at a time and builds the learner profile from chat or speech.
2. **Vernacular experience:** Login, counselor, pathway, journey, voice playback, and key UI chrome adapt to the learner language.
3. **AI-generated pathway:** Claude generates personalized route options from the learner profile and selected goal.
4. **Pathway lock:** The learner can inspect options first; the pathway is locked only when they choose the lock-and-create-journey action.
5. **Learning journey:** The locked pathway becomes a week-by-week plan with daily tasks, resources, low-data fallback, and proof gates.
6. **Daily WhatsApp reminder:** After journey creation, WATI sends the first task reminder and the daily Vercel cron continues reminders.
7. **Skill Passport:** Proof is packaged only after learning/proof progress and remains consent-controlled.
8. **Opportunity guardrails:** VidyaSetu does not fabricate jobs, employers, contacts, salaries, loans, or scheme approvals.
9. **Admin CRM:** Admins can see learners, profile state, journey status, proof/passport readiness, ADEWS risk, and reminders.

## End-To-End User Flow

See [END_TO_END_USER_FLOW.md](END_TO_END_USER_FLOW.md) for the full target-user journey used for evaluation.

Short version: Riya, a Class 12 learner near Varanasi, logs in by phone, speaks to Meera in Hinglish, builds a profile for computer basics/typing/customer-service work, chooses and locks one pathway, receives a 4-week learning journey, gets daily WhatsApp task reminders, saves proof, unlocks a consent-controlled Skill Passport, and then sees only verified/source-backed opportunity steps.

## Local Setup

```bash
cd VidyaSetu-MVP
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill `.env.local` with your own keys. Do not commit real secrets.

Required for full local functionality:

```text
ANTHROPIC_API_KEY=...
SUPABASE_REST_URL=...
SUPABASE_SERVICE_KEY=...
SARVAM_API_KEY=...
WATI_API_BASE_URL=...
WATI_API_TOKEN=...
WATI_TEMPLATE_NAME=vidyasetu_daily_task_reminder
```

Optional/local controls:

```text
DISABLE_PATHWAY_WEB_SEARCH=true
DISABLE_AI_JOURNEY=true
DAILY_REMINDERS_LIVE_SEND=false
```

## Run Locally

Build once:

```bash
npm run build
```

Start the local MVP server:

```bash
npm run serve:mvp
```

Open:

```text
http://localhost:4175
```

For Vite development:

```bash
npm run dev
```

## Tests And Benchmarks

From `VidyaSetu-MVP/`:

```bash
npm run build
TEST_BASE_URL=http://localhost:4175 node scripts/persona-e2e-test.mjs
SLICE5_BASE_URL=http://localhost:4175 node scripts/slice5-journey-progress-benchmark.mjs
SLICE6_BASE_URL=http://localhost:4175 node scripts/slice6-final-smoke.mjs
```

For fast local tests, run the server with:

```bash
DISABLE_PATHWAY_WEB_SEARCH=true npm run serve:mvp
```

## Deployment

The Vercel project is connected to the production app:

```text
https://vidyasetu-mvp.vercel.app
```

Manual production deploy from `VidyaSetu-MVP/`:

```bash
npx vercel deploy --prod -y
```

## Key Documentation

- `VidyaSetu-MVP/README.md` - detailed architecture, API map, setup, constraints, and verification.
- `VidyaSetu-MVP/docs/VidyaSetu_AI_Final_Deck.pdf` - final judge presentation deck.
- `VidyaSetu-MVP/docs/VidyaSetu_Evaluation_Report.pdf` - AI/model evaluation and user validation report.
- `VidyaSetu-MVP/docs/VidyaSetu_Final_Deployment_And_Sustainability.pdf` - deployment, cost, maintenance, and sustainability plan.
- `VidyaSetu-MVP/docs/PHASE2_EVALUATION_REPORT.md` - AI/model evaluation and validation summary.
- `VidyaSetu-MVP/docs/PHASE2_FINAL_DELIVERABLE_REPORT.md` - consolidated deliverable report.
- `VidyaSetu-MVP/docs/DEMO_SCRIPT.md` - walkthrough script.
- `VidyaSetu-MVP/docs/PERSONA_TEST_MATRIX.md` - representative persona coverage.

## Responsible AI Notes

- No fake opportunities, employers, salaries, contacts, scheme approvals, or loan approvals.
- Offline/local actions require location and safe commute context.
- Outreach stays blocked until proof and consent are ready.
- Shared-phone login preserves separate learner records.
- Daily reminders start only after a learner locks a pathway and a journey exists.
