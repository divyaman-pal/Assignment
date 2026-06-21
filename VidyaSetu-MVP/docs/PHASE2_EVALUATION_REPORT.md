# VidyaSetu Phase 2 Evaluation Report

Date: 21 June 2026  
Product: VidyaSetu MVP, a voice-first vernacular AI career/education bridge for first-generation, rural and low-income learners in India  
Demo video: `docs/demo/VidyaSetu_MVP_hackathon_demo.mp4` and `C:\Users\divya\Downloads\VidyaSetu_MVP_hackathon_demo.mp4`  
Preview used for demo/testing: `https://vidyasetu-5clairq1a-divyamanpal490-5829s-projects.vercel.app`

## 1. What Was Evaluated

VidyaSetu was evaluated on whether a learner can move through the core MVP flow:

1. Voice/text intake with Meera in the learner's language.
2. Profile extraction from chat, without a long form.
3. Goal-specific pathway generation.
4. Learning journey generation with weekly/day-wise tasks and proof.
5. Proof-gated Skill Passport behavior.
6. Returning-user memory and progress persistence.
7. Admin CRM visibility for central follow-up.

The evaluation focused on the intended users: rural, low-income, first-generation learners who may use shared phones, regional languages, voice notes, and need safe, realistic pathways instead of generic career advice.

## 2. AI / Model Evaluation

### Method

We used automated persona tests against the local MVP server. The test set covered:

- Local office/job seeker: Class 12 Riya near Varanasi, computer basics, typing, customer service.
- Vocational learner: mobile repair, plumbing.
- Small-business/self-employment: mushroom, poultry, tiffin.
- Informal worker proof: tailoring.
- School and exam support: Class 8, Class 12 boards, JEE switch.
- College-to-job: data science pathway.
- Formal job-ready candidate: ITI electrician.
- Missing-fact guardrail: training user without location.

Languages/scripts covered: Hinglish, Hindi, Odia, Tamil, Bengali, Marathi, plus English UI paths.

### Automated Test Runs

| Test suite | Command | Result |
| --- | --- | --- |
| Counselor/profile extraction regression | `TEST_BASE_URL=http://localhost:4175 node scripts/codex-counselor-profile-check.mjs` | 9/9 personas passed |
| Vernacular pathway + journey + voice check | `TEST_BASE_URL=http://localhost:4175 node scripts/codex-vernacular-persona-check.mjs` | 5/5 personas passed |
| Journey/progress/passport benchmark | `SLICE5_BASE_URL=http://localhost:4175 node scripts/slice5-journey-progress-benchmark.mjs` | 3/3 cases passed, 69/69 checks |
| Final broad smoke suite | `SLICE6_BASE_URL=http://localhost:4175 node scripts/slice6-final-smoke.mjs` | 8/8 cases passed, 87/87 checks |

### Metrics And Results

| Evaluation metric | What we checked | Result |
| --- | --- | --- |
| Profile extraction | Name, location, education, goal, time, phone, commute, urgency, proof signals extracted from chat | Passed in counselor suite: 9/9 |
| Goal stability | Exact goal stayed stable; Riya remained office/customer-service, mushroom remained self-employment | Passed in counselor and demo QA |
| Language match | Counselor replies and journey/pathway content stayed in selected/spoken language/script | Passed in 5-language vernacular suite |
| Voice readiness | Sarvam TTS returned audio with expected language codes | 5/5 vernacular voice cases passed |
| Pathway relevance | Pathway names and first steps were specific to learner goal, not generic | 5/5 vernacular cases passed |
| Journey usefulness | Generated weekly tasks, resources, proof tasks, unlock logic | Slice 5: 3/3, Slice 6: 8/8 |
| Safety/honesty | No fabricated opportunities; location guard blocks offline routes when location missing | Slice 6 no-location guard passed |
| Persistence | Returning learner restores journey progress, proof notes, and passport state | Slice 5 persistence checks passed |
| Proof gating | Passport reflects learning proof and does not unlock as a fake final credential | Slice 5 and Slice 6 passed |

### Representative Persona Outcomes

| Persona | Expected behavior | Observed result |
| --- | --- | --- |
| Riya, Class 12, Varanasi, typing/customer-service job | Keep office-job goal; ask for proof; pathway should not drift to study or mushroom | Passed |
| Mushroom learner, low schooling, Basti | Build enterprise path: training, cost, buyer, supplier, scheme/loan risk | Passed |
| Odia poultry learner | Reply in Odia, create poultry-specific enterprise path and voice | Passed |
| Tamil plumbing learner | Reply in Tamil, create plumbing training/helper journey | Passed |
| Bengali tiffin learner | Create home tiffin business path with buyer/cost/hygiene checks | Passed |
| Marathi mobile repair learner | Create mobile repair practice/training route with voice support | Passed |
| No-location training user | Do not invent local/offline centres; ask for location | Passed |

### Key AI Findings

- Meera can extract a profile from normal chat and one-question-at-a-time intake.
- The system now distinguishes a generic answer like "work skill" from an actual goal; it asks for the exact skill before building a pathway.
- Claude-driven pathway/journey generation works better when given the full profile, goal, language, location, constraints and safety instructions.
- Sarvam TTS is working in tested vernacular flows.
- Persistence works locally through the fallback profile JSON store when local Supabase tables are not present.

### Known AI Limitations

- Automated tests are stronger than field validation right now; they prove functionality, not long-term learner trust.
- Some mixed-language outputs still include English terms such as "business", "training", "proof", or "Meera" where product names or common terms are retained.
- Local persistence uses fallback profile JSON when certain Supabase tables are unavailable; production Supabase should be monitored after deployment.
- Voice was verified through API/TTS generation and demo recording, not through a low-end Android field-network test.

## 3. User Validation

### Current Verifiable Status

No independently documented rural-user interview notes were available in the repo for Codex to verify. Therefore, this report does not claim completed field validation with real rural learners unless the team adds those notes.

What is currently verified:

- Mentor/demo-ready product walkthrough video was generated.
- Representative persona testing was completed across job, study, vocational, informal work and small-business flows.
- Product QA incorporated feedback raised during review: repeated counselor questions, pathway drift, generic journey content, black UI blocks, proof/passport lock behavior, and admin CRM visibility.

### Rapid User Validation Protocol To Complete Before Submission

If time permits, run 3-5 short tests and add the answers below. Each test can take 10-15 minutes.

| Tester type | Suggested task | Questions to ask |
| --- | --- | --- |
| Rural/low-income learner or representative | Speak/type a goal into Meera and generate pathway | Did Meera's questions make sense? Was the language understandable? |
| Student/job seeker | Try Riya-style office-job flow | Did the pathway feel realistic? Was proof/passport clear? |
| Small-business aspirant | Try mushroom/poultry/tiffin flow | Did it explain cost, buyer, supplier and loan risk clearly? |
| Mentor/NGO/trainer | Review demo and admin CRM | Would this help a field worker follow up? What is unsafe/confusing? |
| Regional-language speaker | Test voice and language | Did text/audio feel natural enough to continue? |

### User Validation Notes Template

| Tester | Profile | Flow tested | What worked | What confused them | Product change or next action |
| --- | --- | --- | --- | --- | --- |
| To fill | To fill | To fill | To fill | To fill | To fill |
| To fill | To fill | To fill | To fill | To fill | To fill |
| To fill | To fill | To fill | To fill | To fill | To fill |

### Early Product Learnings From Review/QA

1. Learners should not see generic "AI answer" behavior. Meera must ask one question, remember context, and stop repeating.
2. Generic goals like "work skill" are not enough. The counselor must ask the exact skill before pathway generation.
3. Pathway pages must be simple: route, why Meera chose it, and what to check before acting.
4. Journey must be specific to the skill/business, with resources and proof inside weekly tasks.
5. Proof/passport should be locked until journey proof exists, otherwise it looks fake.
6. Admin CRM matters because real pilots need follow-up and missed-learner visibility.

## 4. Summary For Submission

VidyaSetu's AI evaluation is currently strong for an MVP: 25 automated scenario runs passed across counselor intake, vernacular pathway/journey generation, voice/TTS, progress persistence, proof/passport behavior and guardrails. The product demonstrates real AI behavior, not hardcoded UI output, because the counselor, pathway and journey layers respond to different learner profiles and languages.

The user-validation section should be strengthened with 3-5 real or representative user notes before final judging. Until those notes are added, the honest claim is: automated AI/model evaluation is complete; representative product QA and mentor/demo review are complete; formal field user validation is the remaining evidence gap.

