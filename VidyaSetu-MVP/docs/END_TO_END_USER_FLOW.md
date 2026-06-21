# Complete End-To-End User Flow

## Target User

Riya is a Class 12 pass learner from near Varanasi. She has a shared Android phone, is comfortable with WhatsApp voice notes, can practise for about one hour daily, and wants a safe day-shift computer basics, typing or customer-service job near home.

This flow is the primary judge-facing MVP flow. It shows one complete realistic learner journey instead of trying to show every feature at once.

## Flow Summary

Riya opens VidyaSetu, chooses her language, logs in with her phone number, speaks with Meera, builds her saved profile, gets AI-generated pathway options, locks one route, receives a structured learning journey, gets daily WhatsApp reminders, saves proof, unlocks a Skill Passport, and then moves toward verified opportunity steps only with consent.

## Step-By-Step Flow

### 1. Language-First Login

Riya opens the web app and selects her preferred language before phone login. VidyaSetu does not assume Hindi by default.

She enters her mobile number. If she has used the app before, VidyaSetu restores her saved learner profile, conversation memory, selected pathway, learning journey, progress and reminders.

### 2. Voice Intake With Meera

Meera starts with one simple question:

```text
Namaste, main VidyaSetu ki Meera hoon. Hum ek-ek baat poochhkar aapki jankari banayenge, lamba form nahi. Pehle batao, Meera aapko kis naam se bulaye?
```

Riya can speak or type naturally:

```text
Mera naam Riya hai. Main Class 12 pass hoon, Varanasi ke paas rehti hoon. Mujhe computer basics, typing aur customer service job chahiye. Phone shared hai but WhatsApp voice note chal jata hai. Roz 1 hour practice kar sakti hoon. Ghar ke paas safe day shift chahiye.
```

Meera extracts:

```text
Name: Riya
Education: Class 12
Location: near Varanasi
Goal: computer basics, typing, customer-service work
Device: shared Android phone
Access: WhatsApp voice note works
Daily time: 1 hour
Safety: nearby safe day shift
```

If something important is missing, Meera asks only the next best question, such as commute distance, proof available, or exact job preference. She does not force a long form.

### 3. Profile Ready State

Once the profile is complete enough, Meera tells Riya to open the pathway section. Riya can still ask Meera questions in context.

The profile and conversation memory are saved, so the same learner can return later and continue from the same point.

### 4. AI Pathway Generation

Riya opens **Mera Rasta**. Claude receives the structured learner profile and generates three practical pathway options.

Example pathway options:

```text
Option 1: Typing speed test aur data entry proof
Option 2: Class 12 exam revision aur computer basics
Option 3: Free video se call center interview tayyari
```

Each option has a short one-to-two line explanation. The selected route can also be spoken by Meera in the learner language.

### 5. Pathway Lock

Riya can open and compare pathway cards freely. Opening a card does not lock it.

The pathway is locked only when she clicks:

```text
Is raste ko lock karke meri journey banao
```

After this, VidyaSetu creates the learning journey for that selected pathway. This prevents accidental switching before the current journey proof is completed.

### 6. Learner Journey Creation

Riya opens **Seekhne ki Yatra**. She sees a practical week-by-week journey. Each week includes:

- one clear weekly goal
- daily micro-tasks
- free or low-cost resources
- low-data alternative
- one proof task
- unlock condition for the next week

Example Week 1:

```text
Goal: Typing aur basic computer proof banana
Day 1: 15 minute typing practice karo
Day 2: apna typing speed note karo
Day 3: ek simple form bharne ki practice karo
Day 4: 20-30 second ka typing proof video/photo banao
Day 5: proof save karo
Proof: typing screenshot or short typing video
```

The journey is action-based, not passive video watching. Riya must complete tasks and save proof.

### 7. Daily WhatsApp Reminder

When the pathway is locked and journey is created, VidyaSetu can send the first WATI WhatsApp task reminder. A Vercel cron can then continue the daily reminder loop.

Example reminder:

```text
Namaste Riya, aaj ka VidyaSetu kaam: 15 minute typing practice karo.
Resource: Typing practice resource
Kaise karna hai: ek chhota part karo, speed note karo, proof save karo.
Ho jaye to VidyaSetu kholkar Done tap karein aur ek chhota proof note/photo save karein.
```

This keeps the journey alive even if the learner does not open the platform every day.

### 8. Progress And Proof

Riya marks tasks as done and saves proof notes, screenshots, photos, videos or voice proof.

The next week unlocks only after the required proof is saved. This makes progress measurable instead of empty.

### 9. Skill Passport

After enough journey proof is completed, VidyaSetu unlocks Riya's **Hunar Passport**.

The Skill Passport is consent-controlled. It can include:

```text
education
target role
skills learned
practice proof
scores or screenshots
worker-reviewed readiness
```

Nothing is shared with an employer, worker or partner without the learner's consent.

### 10. Opportunity Discovery

Riya opens **Mauke**. VidyaSetu shows only source-backed and safe next steps.

It does not invent jobs, employers, contacts, salaries or promises. If an opportunity is not verified, the platform says so and blocks outreach until source, shift, fee, contact, commute, proof and consent are checked.

### 11. Admin CRM

An admin can log in and see:

```text
learner profile
language
goal
journey status
proof progress
Skill Passport readiness
WhatsApp reminder state
ADEWS risk status
next action
```

This supports field workers, NGO partners and pilot administrators.

## Success Criteria

Riya can complete the main MVP task end to end:

1. log in on a phone
2. speak or type with Meera
3. build a saved learner profile
4. generate personalized pathways
5. lock one pathway
6. receive a practical learning journey
7. get daily WhatsApp task reminders
8. save proof
9. unlock a consent-controlled Skill Passport
10. move toward verified opportunities without fabricated data

## Why This Is Different From A Generic Chatbot

VidyaSetu is not just an AI reply box. It converts the conversation into a persistent learner record, uses that record to generate a pathway, locks the selected route, turns it into daily work, sends reminders, requires proof, preserves consent, and only then moves toward verified opportunities. The workflow is designed around rural learner constraints: voice, local language, low data, shared phones, commute safety, proof and field-worker support.
