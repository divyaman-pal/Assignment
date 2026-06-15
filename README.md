# VidyaSetu Hackathon MVP

This repository contains the source code for **VidyaSetu**, a voice-first AI career bridge for rural, low-income, first-generation, and other disadvantaged learners.

## Source Code

The complete MVP source is in:

```text
VidyaSetu-MVP/
```

Start here:

- `VidyaSetu-MVP/README.md` - full architecture, product flow, API map, setup, environment variables, benchmarks, and limitations.
- `VidyaSetu-MVP/src/` - React frontend.
- `VidyaSetu-MVP/api/` - Vercel serverless API layer.
- `VidyaSetu-MVP/scripts/` - local server and benchmark/persona tests.
- `VidyaSetu-MVP/supabase_schema.sql` - database schema.

## Live Deployment

```text
https://vidyasetu-mvp.vercel.app
```

## What VidyaSetu Proves

1. A learner can speak or type naturally and Meera, the AI counselor, builds the right learner profile.
2. The system creates personalized pathways and learning journeys instead of hardcoded cards.
3. The platform respects language, location, safety, consent, and saved progress.
4. Opportunity discovery is guarded: it does not invent jobs, contacts, or offline options without context.

## High-Level Architecture

```text
React/Vite UI
  -> Vercel API functions
    -> AI counselor and structured profile extraction
    -> pathway generation
    -> learning journey and progress
    -> Skill Passport and consent layer
    -> live opportunity engine
    -> Supabase persistence
    -> OpenAI/Claude/Fireworks/Sarvam/Firecrawl service wrappers
```

See `VidyaSetu-MVP/README.md` for the detailed architecture.
