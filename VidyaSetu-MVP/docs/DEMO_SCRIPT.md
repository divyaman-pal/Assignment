# VidyaSetu MVP Demo Script

Use this as the live judge flow. Keep one backup phone number ready for a fresh profile and one returning phone number ready to show persistence.

## 0. Setup

Open: https://vidyasetu-mvp.vercel.app

If Vercel shows a Security Checkpoint, wait for it to clear. For a smoother demo, disable Attack Mode before presenting:

```powershell
npx vercel firewall attack-mode disable
```

## 1. Fresh Rural Learner

Login with a new phone number.

Paste or speak:

```text
Main Shabnam Jaipur se hoon. School chhod diya tha. Ghar par silai karti hoon par certificate nahi hai. Ghar ke paas kaam chahiye, 8 km tak ja sakti hoon, roz 1 hour de sakti hoon, shared phone hai, Hindi mein samjhana.
```

Show:

- Counselor extracts location, commute, informal skill, device constraint, time, language, and goal.
- It should not ask for a job-only route before proof/readiness.
- Profile card updates from the learner's actual response.

## 2. Build Pathway

Click `Build Pathway`.

Show:

- Route cards are specific to tailoring/informal skill validation.
- Recommendation trace explains why the route is suggested.
- Missing facts are shown when location or proof is absent.

## 3. Learning Journey

Select a route and open `Learning Journey`.

Show:

- Week 1 is active.
- Week 2 and Week 3 are locked until Week 1 progress/proof is done.
- Each lesson/task has a clear completion button.
- The top guidance explains what the learner must do next.

Mark Week 1 complete, add proof:

```text
I stitched one blouse sample and recorded a short explanation of measurements and finishing.
```

Click save.

Show:

- Completion percent increases.
- Proof saved.
- Week 2 unlocks.
- Skill Passport changes from draft to proof-ready learning proof.

## 4. Returning Learner

Open a fresh tab or refresh. Login with the same phone number.

Show:

- The learner returns to the same profile.
- Journey progress, proof note, and unlocked module are preserved.
- This feels like a professional app, not a temporary demo.

## 5. Switch Persona: School Or Exam

Use another fresh number.

Paste:

```text
Mera naam Rohit hai. Main Patna se Class 12 CBSE PCM student hoon. Physics aur Maths mein good marks chahiye. Roz 3 hours de sakta hoon, Android phone hai.
```

Show:

- The counselor switches into academic support.
- Pathway and journey are study-plan oriented, not job-outreach oriented.
- Replies stay in the learner's language.

Optional follow-up:

```text
But ab main JEE Advanced prep bhi karna chahta hoon.
```

Show that the system updates the goal instead of repeating the previous answer.

## 6. Job-Ready Learner

Use another fresh number.

Paste:

```text
Mera naam Deepak hai. Main Delhi se certified ITI electrician hoon, 2 saal ka experience hai. Sirf electrician job opportunities chahiye, 20 km commute kar sakta hoon, Android WhatsApp hai.
```

Show:

- This learner can enter opportunity/outreach flow.
- Study-only learners do not get pushed into job matching too early.
- The platform separates counseling, proof building, passport, and employer outreach.

## Closing Line

VidyaSetu starts with trust and understanding, then turns that into a pathway, weekly proof, a Skill Passport, and finally opportunity matching when the learner is ready.

