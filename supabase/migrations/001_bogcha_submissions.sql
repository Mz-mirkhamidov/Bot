create table public.bogcha_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  org_name text not null,
  org_type text,
  org_addr text,
  org_phone text,
  org_boss text,
  answers jsonb not null default '[]'::jsonb,
  answered_count integer not null default 0,
  total_count integer not null default 0,
  meta jsonb
);

create index bogcha_submissions_created_at_idx on public.bogcha_submissions (created_at desc);

alter table public.bogcha_submissions enable row level security;
-- Faqat service_role kaliti (server tomonidan) o'qiy/yoza oladi.
-- Hech qanday policy qo'shilmagan, shuning uchun anon/authenticated uchun barcha amallar taqiqlangan.
