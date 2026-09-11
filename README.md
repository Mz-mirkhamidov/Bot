# Suhbat

Bog'cha rahbarlari bilan intervyu yig'ish uchun Telegram Mini App. To'liq spetsifikatsiya — `TZ.md`.

## Texnologiyalar

Next.js 15 (App Router) · TypeScript · Tailwind 4 · Supabase (Postgres + Storage) ·
`@telegram-apps/sdk-react` · `grammy` (Telegram bot) · `@google/genai` (Gemini) · `zod`

## Ishga tushirish

```bash
npm install
cp .env.local.example .env.local   # va qiymatlarni to'ldiring
npm run seed                        # savollarni bazaga yozadi
npm run dev
```

## Muhit o'zgaruvchilari

`.env.local.example` faylida ro'yxat bor. Eng muhimlari:

- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase Dashboard > Project Settings > API
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`, `ADMIN_TELEGRAM_IDS`
- `GEMINI_API_KEY`, `GEMINI_MODEL`

## Ma'lumotlar bazasi

Sxema `supabase/migrations/001_init.sql` faylida. Supabase loyihasida bir marta qo'llaniladi
(SQL Editor yoki Supabase CLI orqali).

## Savollar

`src/data/questions.ts` — 45 ta savol, 9 blok (A—I), TZ 6-bo'limiga muvofiq. `npm run seed`
shu fayldagi ma'lumotni bazaga (`questionnaires`, `question_blocks`, `questions`) yozadi.
