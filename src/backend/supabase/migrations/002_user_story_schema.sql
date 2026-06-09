-- Enums

create type public.story_fact_source as enum (
  'onboarding',     -- set during the 10-step questionnaire
  'ai_chat',        -- discovered or inferred by AI during conversation
  'course_signal',  -- inferred because user started a course that seemed off-profile
  'nudge_response', -- user answered an AI push notification question
  'user_edit'       -- user manually edited their profile
);

create type public.story_fact_category as enum (
  'life_stage',
  'housing',
  'career',
  'finances',
  'goals',
  'events',
  'confidence',
  'behaviour',
  'family',
  'preferences'
);

create type public.nudge_status as enum (
  'sent',
  'delivered',
  'answered',
  'dismissed',
  'expired'
);

-- user_profiles: structured onboarding data, 1:1 with auth.users
-- This is the authoritative user-stated data. AI never writes here directly.

create table public.user_profiles (
  user_id               uuid        primary key references auth.users(id) on delete cascade,
  first_name            text        not null,
  email                 text        not null,
  company_name          text        not null default 'your employer',
  life_stage            text        not null,
  employment_type       text        not null,
  six_month_goal        text        not null,
  upcoming_events       text[]      not null default '{}',
  living_situation      text,
  planning_to_move      text,
  salary                text,
  student_loan          text,
  has_debt              text,
  interested_topics     text[],
  motivation            text,
  usage_frequency       text,
  confidence_tax        smallint    not null default 3 check (confidence_tax between 1 and 5),
  confidence_pensions   smallint    not null default 3 check (confidence_pensions between 1 and 5),
  confidence_budgeting  smallint    not null default 3 check (confidence_budgeting between 1 and 5),
  confidence_investing  smallint    not null default 3 check (confidence_investing between 1 and 5),
  confidence_contracts  smallint    not null default 3 check (confidence_contracts between 1 and 5),
  onboarding_completed_at timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "user_profiles_select" on public.user_profiles
  for select using (auth.uid() = user_id);
create policy "user_profiles_insert" on public.user_profiles
  for insert with check (auth.uid() = user_id);
create policy "user_profiles_update" on public.user_profiles
  for update using (auth.uid() = user_id);


-- user_story_facts: AI-updatable fact graph with provenance
-- Each fact has source, confidence, and versioning via is_active/superseded_by.
-- Confidence history is embedded: old facts remain as rows with is_active = false.

create table public.user_story_facts (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  category        public.story_fact_category not null,
  key             text        not null,
  value           text        not null,
  value_json      jsonb,
  source          public.story_fact_source not null,
  source_detail   text,
  set_by_ai       boolean     not null default false,
  confidence      numeric(3,2) not null default 1.0 check (confidence between 0.0 and 1.0),
  is_active       boolean     not null default true,
  superseded_by   uuid        references public.user_story_facts(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_story_facts_user_active   on public.user_story_facts(user_id, is_active);
create index idx_story_facts_user_category on public.user_story_facts(user_id, category);
create index idx_story_facts_key           on public.user_story_facts(user_id, key, is_active);

alter table public.user_story_facts enable row level security;

create policy "user_story_facts_select" on public.user_story_facts
  for select using (auth.uid() = user_id);
create policy "user_story_facts_insert" on public.user_story_facts
  for insert with check (auth.uid() = user_id);
create policy "user_story_facts_update" on public.user_story_facts
  for update using (auth.uid() = user_id);


-- user_timeline_items: persistent timeline
-- Seeded from generateTimeline() at onboarding completion. AI can add/modify rows.

create table public.user_timeline_items (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  item_key     text        not null,
  status       text        not null default 'pending'
               check (status in ('active', 'pending', 'done')),
  spine_group  text        not null
               check (spine_group in ('this-week', 'coming-up', 'later')),
  title        text        not null,
  tag          text        not null,
  when_label   text        not null,
  due_year     integer     not null check (due_year between 2000 and 2100),
  due_month    smallint    not null check (due_month between 1 and 12),
  due_day      smallint    check (due_day between 1 and 31),
  lesson_path  text,
  source       text        not null default 'onboarding_seed'
               check (source in ('onboarding_seed', 'ai_generated', 'ai_modified', 'user_added')),
  sort_order   smallint    not null default 0,
  is_dismissed boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_timeline_user_group on public.user_timeline_items(user_id, spine_group, due_year, due_month, due_day);

alter table public.user_timeline_items enable row level security;

create policy "user_timeline_items_all" on public.user_timeline_items
  for all using (auth.uid() = user_id);


-- ai_nudges: push notification question sessions
-- Tracks the full lifecycle of an AI-initiated question: trigger → send → response → outcomes.
-- The facts that result from the answer are written to user_story_facts; this table is the session envelope.

create table public.ai_nudges (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  trigger_type     text        not null
    check (trigger_type in (
      'course_start_off_profile',
      'profile_gap',
      'milestone_approaching',
      'ai_proactive'
    )),
  trigger_detail   text,
  course_id        text,
  question_text    text        not null,
  question_context text,
  status           public.nudge_status not null default 'sent',
  user_response    text,
  responded_at     timestamptz,
  facts_updated    uuid[],
  timeline_updated uuid[],
  confidence_delta jsonb,
  sent_at          timestamptz not null default now(),
  expires_at       timestamptz not null default (now() + interval '7 days')
);

create index idx_nudges_user_status on public.ai_nudges(user_id, status);

alter table public.ai_nudges enable row level security;

create policy "ai_nudges_select" on public.ai_nudges
  for select using (auth.uid() = user_id);
create policy "ai_nudges_update" on public.ai_nudges
  for update using (auth.uid() = user_id);
