-- VidyaSetu Phase 2 MVP schema.
-- Run this once in the Supabase SQL editor before using live persistence.

create extension if not exists vector;

create table if not exists learners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone_hash text,
  language text,
  location text,
  profile_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists learners_phone_hash_unique
  on learners (phone_hash)
  where phone_hash is not null;

create table if not exists kb_documents (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  title text not null,
  scheme_type text,
  content text not null,
  embedding vector(384),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pathways (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references learners(id) on delete set null,
  routes_json jsonb not null default '[]'::jsonb,
  confidence numeric not null default 0,
  callback_flag boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists learning_journeys (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references learners(id) on delete set null,
  route_json jsonb not null default '{}'::jsonb,
  journey_json jsonb not null default '{}'::jsonb,
  modules_json jsonb not null default '[]'::jsonb,
  progress_json jsonb not null default '{}'::jsonb,
  readiness_score numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists skill_passport (
  learner_id uuid primary key references learners(id) on delete cascade,
  certs jsonb not null default '[]'::jsonb,
  informal jsonb not null default '[]'::jsonb,
  ncrf_credits int not null default 0,
  consent_json jsonb not null default '{}'::jsonb,
  qr_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  source_url text,
  employer text not null,
  title text not null,
  wage text,
  lat numeric,
  lng numeric,
  constraints jsonb not null default '[]'::jsonb,
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references learners(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  score numeric not null,
  reasons jsonb not null default '[]'::jsonb,
  status text not null default 'matched',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists outreach (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete set null,
  channel text not null default 'agentmail_placeholder',
  sent_at timestamptz,
  reply_text text,
  reply_class jsonb,
  followup_at timestamptz,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists adews_scores (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references learners(id) on delete set null,
  risk numeric not null,
  top_features_json jsonb not null default '[]'::jsonb,
  fired_at timestamptz,
  worker_ack boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references learners(id) on delete set null,
  phone_hash text,
  messages jsonb not null default '[]'::jsonb,
  profile_json jsonb not null default '{}'::jsonb,
  last_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
