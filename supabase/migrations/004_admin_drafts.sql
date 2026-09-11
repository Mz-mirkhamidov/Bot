-- Admin botda yangi sessiya yaratish uchun bosqichma-bosqich forma holati.
-- Vercel serverless funksiyalari xotirada saqlay olmagani uchun har bir
-- admin chatining joriy bosqichi va shu paytgacha to'ldirilgan maydonlari
-- shu jadvalda saqlanadi. Forma yakunlanganda yoki bekor qilinganda qator
-- o'chiriladi.

create table admin_drafts (
  chat_id bigint primary key,
  step text not null,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table admin_drafts enable row level security;
