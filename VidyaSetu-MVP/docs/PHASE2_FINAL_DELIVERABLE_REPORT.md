
## 1. Deliverable Status

| Phase 2 deliverable | Status | Evidence |
| --- | --- | --- |
| Functional MVP | Complete | Live web app deployed at `https://vidyasetu-mvp.vercel.app`; end-to-end flow covers voice/text intake, profile, pathway, journey, proof/passport and admin view. |
| Integrated AI component | Complete | Meera counselor, pathway generation and journey generation are model-backed. Live validation confirms Anthropic-backed counselor and Claude pathway/journey behavior. |
| Working demo | Complete | Polished walkthrough video exists at `docs/demo/VidyaSetu_MVP_hackathon_demo.mp4` and Downloads copy. |
| Code repository | Complete | Existing documented repo with README, setup scripts, API routes and test scripts. |
| Revised final presentation | Needs final export check | This report can feed the final deck. I did not find a deck artifact inside this repo path during this pass. |
| Evaluation results | Complete for AI/model evaluation; representative validation completed | Live production tests passed: counselor 9/9, vernacular pathway/journey/voice 5/5. Previous local suites passed Slice5 3/3 and Slice6 8/8. |
| Deployment and sustainability plan | Draft included below | Production deployed. Sustainability plan included in Section 7. |

## 2. What The MVP Does

VidyaSetu is a voice-first, vernacular AI bridge for first-generation, rural and low-income learners in India. The product avoids long forms. A learner speaks or types to Meera, Meera builds a profile from the conversation, then generates:

1. A goal-specific pathway.
2. A weekly learning journey.
3. Proof tasks.
4. A proof-gated Skill/Hunar Passport.
5. Admin visibility for central follow-up.

The core product promise is not "AI gives advice." The promise is: a learner who does not know how to search, write a resume, compare schemes, or judge fake opportunities can still move from voice intake to a safe, proof-based next step.


### Live Product Tested

Base URL: `https://vidyasetu-mvp.vercel.app`

### Validation Method

I tested the deployed app through its real production API flow using realistic learner messages. The validation focused on the exact points that matter for judges:

- Can Meera understand a normal conversation, not a form?
- Does Meera avoid repeating the same question?
- Does the profile keep the exact user goal?
- Does the pathway stay linked to the profile?
- Does the learning journey become specific to the goal?
- Does vernacular text work beyond English?
- Does Sarvam voice return audio for regional languages?
- Does the product avoid fake jobs, fake contacts or guaranteed outcomes?

### Live Validation Results

| Validation area | Live result |
| --- | --- |
| Counselor/profile extraction | 9/9 passed |
| Repeated-question regression | Passed in Riya and small-business "ab kya karna hai?" flows |
| Goal stability | Passed: Riya stayed computer typing/customer-service; mushroom stayed enterprise setup; mobile repair stayed mobile repair |
| Vernacular pathway + journey | 5/5 passed |
| Sarvam voice/TTS | 5/5 passed |
| Claude/Anthropic usage | Counselor provider shown as Anthropic in live vernacular runs |
| Safety guardrails | No fabricated guaranteed job or income claim in tested flows |

## 4. Representative User Scenarios Tested

| User scenario | Language | Task | Result | Observation |
| --- | --- | --- | --- | --- |
| Riya, Class 12, Varanasi, wants computer basics, typing and customer-service job | Hinglish | Build profile, ask what to do next, ask why video proof is needed | Passed | Meera kept the office-job goal and explained video proof as a small typing/customer-service proof, not as a random resume task. |
| Mobile repair learner, Basti, wants income soon | Hinglish | Build profile and ask next action | Passed | Meera kept mobile repair as the goal and told learner to press Mera Rasta / Rasta banao. |
| Mushroom learner, low schooling, Basti | Hindi | Generate enterprise pathway, learning journey and voice | Passed | Routes were mushroom-specific: first YouTube mushroom trial, KVK/Skill training, buyer-cost check. |
| Poultry learner, Balangir | Odia | Generate pathway, journey and voice | Passed | Routes covered small poultry trial, training check, buyer/cost check. |
| Plumbing learner, Tiruchirappalli | Tamil | Generate training/helper pathway, journey and voice | Passed | Routes covered local plumbing helper search, practice and proof. |
| Tiffin learner, Nadia | Bengali | Generate home-food business journey and voice | Passed | Journey focused on customers, sample tiffin, cost and hygiene. One route name repeated, which is acceptable for MVP but should be polished later. |
| Mobile repair learner, Nagpur | Marathi | Generate repair pathway, journey and voice | Passed | Journey focused on parts, tools, safety and repair proof. |

## 5. AI / Model Evaluation Summary

### Production Validation Commands Run

| Test | Command | Result |
| --- | --- | --- |
| Live counselor/profile validation | `TEST_BASE_URL=https://vidyasetu-mvp.vercel.app node scripts/codex-counselor-profile-check.mjs` | 9/9 passed |
| Live vernacular pathway/journey/voice validation | `TEST_BASE_URL=https://vidyasetu-mvp.vercel.app node scripts/codex-vernacular-persona-check.mjs` | 5/5 passed |

### Previous Local Regression Suites

| Test suite | Result |
| --- | --- |
| Slice5 journey/progress/passport benchmark | 3/3 cases passed, 69/69 checks |
| Slice6 final smoke suite | 8/8 cases passed, 87/87 checks |

### Model Behavior Proven

| Capability | Evidence |
| --- | --- |
| Profile extraction from chat | 9 live counselor personas passed |
| Goal-specific routing | Riya, mushroom, poultry, plumbing, tiffin, mobile repair all generated different routes |
| Vernacular delivery | Hindi, Odia, Tamil, Bengali and Marathi passed content checks |
| Voice-first readiness | Sarvam TTS returned audio in 5/5 live vernacular scenarios |
| Responsible AI | Tested flows avoided guaranteed job/income promises and used proof/source checks |
| Persistence/proof/passport logic | Covered by Slice5/Slice6 regression suites |

## 6. User Validation Data To Collect From Humans

Use this table if mentors ask, "What exactly did you collect from users?" The first set is required; the second set is optional but useful.

### Required Data

| Data field | Why it matters | Example |
| --- | --- | --- |
| Tester type | Shows whether user matches target segment | Class 12 job seeker, rural learner, small-business aspirant, mentor/NGO worker |
| Language used | Proves vernacular access | Hindi, Hinglish, Odia, Tamil, Bengali, Marathi |
| Device/network | Proves low-resource readiness | Shared Android, mobile data, slow network |
| Starting goal spoken by user | Shows whether Meera handles natural speech | "Mujhe mushroom business karna hai" |
| Task completion | Main usability metric | Completed profile, generated pathway, created journey |
| Time to complete | Shows friction | 5-8 minutes for intake to pathway |
| Comprehension score | Shows whether rural user understood | 1-5 score: "Did you understand the next step?" |
| Trust/safety score | Shows responsible AI | 1-5 score: "Would you follow this advice?" |
| Confusing words | Direct product improvement | "Proof", "passport", "source verify" |
| Quote from user | Human evidence for judges | "Meera ne ek-ek karke poocha, form nahi bharna pada" |
| Consent for using feedback | Ethical submission practice | Yes/no |

### Optional Data

| Data field | Why it helps |
| --- | --- |
| Audio worked? | Confirms voice-first promise |
| Did user need help reading? | Measures accessibility |
| Did pathway match real life? | Tests usefulness beyond UI |
| Would they return tomorrow? | Tests retention/adoption |
| Did admin/worker know whom to follow up with? | Tests pilot readiness |


## 7. Deployment And Sustainability Plan

### Deployment

- Production app: `https://vidyasetu-mvp.vercel.app`
- Hosting: Vercel
- Persistence: Supabase production project
- AI: Anthropic/Claude for counselor, pathway and journey
- Voice: Sarvam STT/TTS where available
- Admin: CRM-style central visibility for learner follow-up

### Operating Model

1. Pilot with one district or one partner organization.
2. Onboard 20-50 learners through field worker/mentor-assisted voice intake.
3. Track profile completion, pathway generation, journey starts, proof saved and inactive learners.
4. Use admin CRM to follow up with learners who stop after profile or pathway.
5. Add WhatsApp daily reminders for today's task once gateway credentials and consent flow are finalized.

### Cost Drivers

| Cost item | What affects it |
| --- | --- |
| Claude calls | Counselor turns, pathway generation, journey generation |
| Sarvam voice | STT/TTS minutes |
| Supabase | Stored profiles, progress, messages and admin reads |
| Vercel | Serverless execution and bandwidth |
| WhatsApp/IVR | Reminder/call volume through gateway |

### Maintenance Plan

- Keep regression suites as release gates.
- Review failed counselor conversations weekly.
- Add district-specific verified centres only from trusted sources.
- Do not fabricate jobs, employers, contacts or scheme approval.
- Monitor model latency and increase timeout only where user waits behind a clear loading screen.

## 10. Final Submission Claim

Safe claim:

VidyaSetu is a deployed, voice-first vernacular MVP that lets a learner create a profile through conversation, generate a personalized pathway, start a proof-based learning journey and give admins visibility for follow-up. The AI is real and model-backed, with live validation passing 9/9 counselor personas and 5/5 vernacular pathway/journey/voice personas on the production URL. The system is strongest on AI functionality, vernacular access and responsible proof-gated guidance. The main remaining gap is independently documented field validation with real rural learners, which should be added through 3-5 short user tests using the template above.

