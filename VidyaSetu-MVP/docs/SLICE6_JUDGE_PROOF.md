# VidyaSetu MVP - Slice 6 Judge Proof

Production app: https://vidyasetu-mvp.vercel.app

Slice 6 turns the MVP from a prototype into a judge-demo-ready product: repeatable persona tests, preserved learner state, proof-based learning progress, and a clear demo script.

## What Is Working

- New learner signup by phone number creates a fresh profile when requested.
- Returning learner signup restores profile, counselor history, pathway, journey progress, proof notes, and Skill Passport proof.
- AI counselor adapts to school students, entrance exam aspirants, informal workers, vocational learners, college students, and job-ready candidates.
- Pathway generation uses profile facts and missing-fact guards instead of pushing the same route to every user.
- Learning Journey is actionable: modules unlock step-by-step, lesson/task completion is saved, proof notes are captured, and the next action is visible.
- Skill Passport reflects live journey progress and proof readiness.
- Opportunity and outreach layers remain separate from study-only users.

## Production Verification

Manual production smoke passed on June 13, 2026:

1. Opened `https://vidyasetu-mvp.vercel.app`.
2. Logged in with a fresh phone number.
3. Used a rural tailoring persona with location, commute radius, informal skill proof, and shared-phone constraints.
4. Built pathway and learning journey.
5. Completed Week 1 lessons and tasks.
6. Saved a proof note.
7. Opened a fresh tab, logged in with the same phone number, and confirmed Week 1 completion/proof restored with Week 2 unlocked.

## Benchmark Commands

Local low-credit full smoke:

```powershell
npm run build
npm run serve:mvp
```

Then in a second terminal:

```powershell
$env:SLICE6_BASE_URL="http://localhost:4175"
$env:SLICE6_REQUIRE_PERSISTENCE="0"
npm run benchmark:slice6
```

Production full smoke after Vercel Attack Mode is disabled:

```powershell
$env:SLICE6_BASE_URL="https://vidyasetu-mvp.vercel.app"
npm run benchmark:slice6
```

Optional job/contact layer smoke:

```powershell
$env:SLICE6_INCLUDE_JOBS="1"
npm run benchmark:slice6
```

## Known Deployment Caveat

Vercel Attack Mode is currently enabled. Browser users can pass the checkpoint, but direct API benchmark calls return the Vercel Security Checkpoint page instead of JSON.

Before the hackathon demo, run this interactively in a terminal:

```powershell
npx vercel firewall attack-mode disable
```

Vercel does not allow agents to disable Attack Mode on behalf of the user.

## Judge Story

VidyaSetu is not a generic course recommender. It is a learner-support operating system for disadvantaged learners:

- Layer 1: AI counselor builds a trusted profile in the learner's language.
- Layer 2: Pathway engine chooses the right route based on age, goal, education, skill proof, location, device, time, mobility, and constraints.
- Layer 3: Learning Journey converts the route into weekly actions, proof, and unlocks.
- Layer 4: Skill Passport turns learning/proof into a portable employability record.
- Layer 5: Opportunity and outreach agent activates only when the learner is ready for job or employer matching.
