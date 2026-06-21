# Complete End-To-End User Flow

## Target User

**Riya** is a Class 12 pass learner from near Varanasi. She has a shared Android phone, is comfortable with WhatsApp voice notes, can practise for about one hour daily, and wants a safe day-shift computer basics, typing, or customer-service job near home.

This user flow is intentionally focused on one realistic learner instead of showing every feature. It demonstrates the complete product loop from onboarding to learning progress, proof, reminders, and guarded opportunity discovery.

## Flow Summary

Riya opens VidyaSetu on her phone, chooses her language, logs in with her mobile number, speaks with Meera, builds her profile, gets AI-generated pathway options, locks one route, receives a structured learning journey, gets daily WhatsApp reminders, saves proof, unlocks a Skill Passport, and then moves toward verified opportunity steps only with consent.

## Step-By-Step Flow

### 1. Language-First Login

Riya opens the web app and selects her preferred language before anything else. VidyaSetu does not assume Hindi by default. She enters her mobile number, and the app creates or restores her learner profile.

If she returns later from the same phone, VidyaSetu restores her saved profile, conversation memory, selected pathway, learning journey, progress, and reminders.

### 2. Voice Intake With Meera

Meera starts the conversation:

> Namaste, main VidyaSetu ki Meera hoon. Hum ek-ek baat poochhkar aapki jankari banayenge, lamba form nahi. Pehle batao, Meera aapko kis naam se bulaye?

Riya can speak or type. Meera asks one question at a time and silently builds the backend profile.

Example learner input:

> Mera naam Riya hai. Main Class 12 pass hoon, Varanasi ke paas rehti hoon. Mujhe computer basics, typing aur customer service job chahiye. Phone shared hai but WhatsApp voice note chal jata hai. Roz 1 hour practice kar sakti hoon. Ghar ke paas safe day shift chahiye.

Meera extracts:

```text
Name: Riya
Education: Class 12
Location: near Varanasi
Goal: computer basics / typing / customer-service job
Device: shared Android phone
Access: WhatsApp voice note works
Daily time: 1 hour
Safety: nearby safe day shift
```

If anything important is missing, Meera asks the next one question, such as commute range, exact role, proof available, or education. She does not force a long form.

### 3. Profile Ready State

Once the profile is complete enough for pathway generation, Meera tells Riya to open the pathway section. Riya can still ask Meera questions in context.

The profile is saved in Supabase, so it can be restored on the next login.

### 4. AI Pathway Generation

Riya opens **Mera Rasta**. Claude receives the structured learner profile and generates three practical pathway options.

The options are short, understandable, and specific to her goal. For example:

```text
Option 1: Typing speed se pehla data kaam
Option 2: Excel seekhke office operator bano
Option 3: Safe local office source check
```

Each option has a one-to-two line explanation. Meera can speak the selected pathway in the learner language using the voice layer.

### 5. Pathway Lock

Riya can open and compare pathway cards. Merely opening a card does not lock anything.

The pathway is locked only when she clicks:

```text
Is raste ko lock karke meri journey banao
```

After this, VidyaSetu creates the learning journey for that selected pathway. This prevents the learner from accidentally jumping between pathways before completing the current journey.

### 6. Learner Journey Creation

Riya opens **Seekhne ki Yatra**. She sees a practical week-by-week journey. Each week includes:

- one clear weekly goal
- short lessons
- daily micro-tasks
- one free or official resource
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
Sunday: week ka review karo
Proof: typing screenshot or short typing video
```

The journey is not just content consumption. Riya must complete small actions and save proof.

### 7. Daily WhatsApp Reminder

When the pathway is locked and the journey is created, VidyaSetu enables WATI WhatsApp reminders for that learner.

Riya receives the first reminder immediately after journey creation. After that, the Vercel cron runs daily and sends her current task and resource.

Example reminder:

```text
Namaste Riya, aaj ka VidyaSetu kaam: 15 minute typing practice karo.
Resource: Typing practice resource
Kaise karna hai: ek chhota part karo, speed note karo, proof save karo.
Ho jaye to VidyaSetu kholkar Done tap karein aur ek chhota proof note/photo save karein.
```

This keeps the journey useful even for learners who do not open the platform every day.

### 8. Progress And Proof

Riya taps tasks as done and saves proof notes, screenshots, photos, or short video/voice proof.

The next week unlocks only after the required proof is saved. This makes the pathway measurable and prevents empty progress.

### 9. Skill Passport

After enough journey proof is completed, VidyaSetu builds Riya's **Hunar Passport**.

The Skill Passport is consent-controlled. It can include:

```text
Education
Target role
Skills learned
Practice proof
Scores or screenshots
Worker-reviewed readiness
```

Nothing is shared with employers, workers, or partners without the learner's consent.

### 10. Opportunity Discovery

Riya then opens **Mauke**. VidyaSetu shows only source-backed and safe next steps. It does not invent jobs, employers, contacts, salaries, or promises.

If an opportunity is not verified, the platform says so and blocks outreach. It may ask Riya or a worker to verify:

```text
source
location
shift
fee
commute
contact
consent
```

Only after proof and consent are ready can VidyaSetu help prepare outreach.

### 11. Admin CRM

An admin can log in to the CRM and see:

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

This supports field workers, NGO partners, and pilot administrators.

## Success Criteria For This Flow

Riya can complete the main task end to end:

1. log in on a phone
2. speak/type with Meera
3. build a saved learner profile
4. generate personalized pathways
5. lock one pathway
6. receive a practical learning journey
7. get daily WhatsApp task reminders
8. save proof
9. unlock a consent-controlled Skill Passport
10. move toward verified opportunities without fabricated data

## Why This Is Different From A Generic Chatbot

VidyaSetu is not just an AI reply box. It converts the conversation into a persistent learner record, uses that record to generate a pathway, locks the selected route, turns it into daily tasks, sends reminders, requires proof, preserves consent, and only then moves toward verified opportunities. The product workflow is designed around rural learner constraints: voice, local language, low data, shared phones, commute safety, proof, and field-worker support.
