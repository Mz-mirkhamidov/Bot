-- ============ EXTENSIONS ============
create extension if not exists "pgcrypto";

-- ============ QUESTIONNAIRES ============
create table questionnaires (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,           -- 'bogcha-v1'
  title       text not null,
  description text,
  version     int  not null default 1,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============ BLOCKS ============
create table question_blocks (
  id               uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references questionnaires(id) on delete cascade,
  code             text not null,             -- 'A', 'B', 'C' ...
  title            text not null,
  description      text,
  order_index      int  not null,
  unique (questionnaire_id, code)
);

-- ============ QUESTIONS ============
create type question_type as enum (
  'text_short',    -- bir qatorli matn
  'text_long',     -- uzun matn (ovoz ruxsat etiladi)
  'number',        -- son
  'money',         -- summa (so'm)
  'yes_no',        -- ha/yo'q
  'single_choice', -- bitta variant
  'multi_choice'   -- bir nechta variant
);

create table questions (
  id           uuid primary key default gen_random_uuid(),
  block_id     uuid not null references question_blocks(id) on delete cascade,
  number       int  not null,                 -- 1..45, respondentga ko'rinadi
  order_index  int  not null,
  text         text not null,
  hint         text,                          -- kichik kulrang izoh
  type         question_type not null,
  options      jsonb,                          -- choice turlari uchun: ["variant1","variant2"]
  is_required  boolean not null default false, -- MVP'da hammasi false (tashlab ketish mumkin)
  allow_voice  boolean not null default true,
  probes       jsonb,                          -- interviewer rejimi uchun: ["savol1","savol2"]
  is_key       boolean not null default false, -- eng muhim savollar (xulosada ustuvor)
  unique (block_id, order_index)
);

-- ============ RESPONDENTS ============
create type org_type as enum ('subsidized', 'non_subsidized', 'unknown', 'other');

create table respondents (
  id               uuid primary key default gen_random_uuid(),
  full_name        text not null,
  org_name         text,
  phone            text,
  telegram_user_id bigint,
  org_type         org_type not null default 'unknown',
  children_count   int,
  notes            text,
  created_at       timestamptz not null default now()
);

-- ============ SESSIONS ============
create type session_mode   as enum ('self', 'interviewer');
create type session_status as enum ('created', 'in_progress', 'completed', 'abandoned');

create table sessions (
  id               uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references questionnaires(id),
  respondent_id    uuid not null references respondents(id) on delete cascade,
  token            text not null unique,      -- URL uchun, 32 belgi
  mode             session_mode   not null default 'self',
  status           session_status not null default 'created',
  current_question int,                        -- qaysi savolda qolgan
  started_at       timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz not null default now()
);

create index on sessions (token);
create index on sessions (status);

-- ============ ANSWERS ============
create table answers (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references sessions(id) on delete cascade,
  question_id   uuid not null references questions(id) on delete cascade,
  text          text,                          -- yakuniy javob matni
  audio_path    text,                          -- Supabase Storage yo'li
  transcript    text,                          -- Gemini chiqargan xom matn
  is_edited     boolean not null default false,-- transkript qo'lda tuzatilganmi
  flag          text,                          -- 'green' | 'red' | 'star' | null
  skipped       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (session_id, question_id)
);

create index on answers (session_id);

-- ============ SESSION SUMMARY ============
create table session_summaries (
  session_id            uuid primary key references sessions(id) on delete cascade,
  ai_summary            jsonb,                 -- Gemini chiqargan tuzilgan xulosa
  ai_generated_at       timestamptz,
  -- qo'lda to'ldiriladigan maydonlar (yo'riqnomadagi xulosa varaqasi)
  biggest_pain          text,
  hours_per_month       numeric,
  money_lost_12m        numeric,
  current_solution      text,
  paid_before           boolean,
  paid_before_amount    numeric,
  hypothesis_confirmed  text,                  -- 'subsidy' | 'documents' | 'occupancy' | 'none'
  referral_ok           boolean,
  telegram_group        text,
  surprise              text,
  updated_at            timestamptz not null default now()
);

-- ============ EVENTS (analitika) ============
create table events (
  id          bigserial primary key,
  session_id  uuid references sessions(id) on delete cascade,
  type        text not null,   -- 'session_opened','question_viewed','answer_saved',
                               -- 'voice_recorded','transcribed','completed','abandoned'
  payload     jsonb,
  created_at  timestamptz not null default now()
);

create index on events (session_id, created_at);

-- ============ RLS ============
-- Barcha jadvalga RLS yoqiladi va HECH KIMGA to'g'ridan-to'g'ri ruxsat berilmaydi.
-- Bazaga faqat server tomonidan service_role kaliti bilan murojaat qilinadi.
alter table questionnaires   enable row level security;
alter table question_blocks  enable row level security;
alter table questions        enable row level security;
alter table respondents      enable row level security;
alter table sessions         enable row level security;
alter table answers          enable row level security;
alter table session_summaries enable row level security;
alter table events           enable row level security;

-- ============ updated_at trigger ============
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger answers_updated_at before update on answers
  for each row execute function set_updated_at();
create trigger summaries_updated_at before update on session_summaries
  for each row execute function set_updated_at();

-- ============ STORAGE BUCKET ============
insert into storage.buckets (id, name, public, file_size_limit)
values ('voice', 'voice', false, 20971520)
on conflict (id) do nothing;
