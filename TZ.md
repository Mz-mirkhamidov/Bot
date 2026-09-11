# Texnik topshiriq (TZ) — "Suhbat" intervyu yig'ish tizimi

**Loyiha kod nomi:** `suhbat`
**Versiya:** 1.0
**Sana:** 2026-09-11
**Buyurtmachi:** Muzaffar
**Ijrochi:** Claude Code

---

## 0. Bu hujjatdan qanday foydalanish

Bu hujjat Claude Code uchun yagona haqiqat manbai (single source of truth). Kod yozishdan oldin to'liq o'qilishi shart.

**Qoidalar:**
1. Bu hujjatda yozilmagan arxitektura qarorini o'zboshimchalik bilan qabul qilma — avval so'ra.
2. Ma'lumotlar bazasi sxemasini o'zgartirma. 5-bo'limdagi SQL aynan shundayligicha qo'llaniladi.
3. Har bir bosqich (11-bo'lim) oxirida 12-bo'limdagi qabul mezonlari tekshiriladi. O'tmasa — keyingi bosqichga o'tilmaydi.
4. Kutubxona qo'shishdan oldin: shu TZ'da ko'rsatilgan kutubxonalar ro'yxatidan tashqari hech narsa qo'shilmaydi, agar zarurat bo'lsa sabab bilan so'raladi.
5. Barcha kod izohlar va identifikatorlar **inglizcha**, foydalanuvchi ko'radigan barcha matn **o'zbekcha** (Lotin).

---

## 1. Loyiha maqsadi va kontekst

### 1.1 Muammo

Muzaffar bog'chalar uchun SaaS mahsulot qurishdan oldin bozorni tekshirmoqda. Buning uchun bog'cha rahbarlari bilan 8-10 ta chuqur suhbat o'tkazishi kerak. Hozirgi usul — PDF so'rovnoma yuborish — quyidagi muammolarga ega:

- Respondent PDF'ni o'qib, javoblarni alohida yozishi kerak → ko'pchilik tashlab ketadi
- Javoblar Telegram yozishmalarida tarqoq qoladi
- 10 ta respondentning javoblarini bir-biri bilan solishtirish qo'lda qiyin
- Suhbat vaqtida yozib olish e'tiborni bo'ladi
- Uzun javobni yozish zerikarli — odamlar qisqa yozadi va eng qimmatli ma'lumot yo'qoladi

### 1.2 Yechim

Telegram Mini App — respondentga havola yuboriladi, u Telegramdan chiqmasdan savollarga ketma-ket javob beradi. Javobni **yozishi yoki ovozli aytishi** mumkin (ovoz AI orqali matnga o'giriladi). Barcha javoblar bitta bazaga yig'iladi, admin panelda solishtiriladi va AI xulosa chiqaradi.

### 1.3 Muvaffaqiyat mezonlari

Loyiha muvaffaqiyatli deb hisoblanadi, agar:

| Mezon | Maqsad |
|---|---|
| Boshlagan respondentlardan tugatganlar ulushi | ≥ 70% |
| O'rtacha to'ldirish vaqti | ≤ 25 daqiqa |
| Ovozli javob ulushi (uzun savollarda) | ≥ 40% |
| Ovozni matnga o'girish aniqligi (o'zbek tili) | tushunarli darajada, qo'lda tuzatish imkoni bilan |
| Muzaffar uchun 2 ta respondentni solishtirish | ≤ 1 daqiqa |

### 1.4 Doiradan tashqarida (MVP'ga kirmaydi)

Quyidagilar **qilinmaydi** — keyingi versiyalarga qoldiriladi:

- Ko'p tilli interfeys (faqat o'zbekcha)
- To'lov tizimi
- Boshqa foydalanuvchilar uchun ro'yxatdan o'tish (faqat Muzaffar admin)
- Mobil ilova (faqat Telegram Mini App + brauzer)
- Murakkab analitika dashboard
- Savollarni vizual muharrirdan tahrirlash (savollar seed fayl orqali kiritiladi)

---

## 2. Foydalanuvchi rollari

| Rol | Kim | Nima qiladi |
|---|---|---|
| **Admin** | Faqat Muzaffar | Sessiya yaratadi, havola yuboradi, javoblarni ko'radi, solishtiradi, eksport qiladi |
| **Respondent** | Bog'cha rahbari | Havola orqali kiradi, savollarga javob beradi |
| **Interviewer** | Muzaffar (suhbat vaqtida) | O'zi savollarni o'qiydi, respondent javobini yozib boradi, belgi qo'yadi |

Admin aniqlanishi: `ADMIN_TELEGRAM_IDS` muhit o'zgaruvchisidagi Telegram user ID ro'yxati bo'yicha. Boshqa hech qanday autentifikatsiya yo'q.

---

## 3. Foydalanuvchi ssenariylari

### 3.1 Ssenariy A — Respondent o'zi to'ldiradi

1. Muzaffar admin panelda "Yangi sessiya" tugmasini bosadi
2. Respondent ma'lumotlarini kiritadi: ism, bog'cha nomi, telefon (ixtiyoriy), tur (subsidiyali / subsidiyasiz / noma'lum)
3. Tizim noyob havola yaratadi: `https://t.me/<bot>/app?startapp=<token>`
4. Muzaffar havolani Telegram orqali respondentga yuboradi
5. Respondent bosadi → Mini App ochiladi → kirish ekrani (kim so'rayapti, nega, qancha vaqt oladi)
6. "Boshlash" → savollar birin-ketin chiqadi
7. Har bir savolda: matn yozish **yoki** mikrofon tugmasini bosib ovozli aytish
8. Har bir javob darhol saqlanadi (autosave)
9. Chiqib ketsa — qayta kirganda qoldirgan joyidan davom etadi
10. Oxirida barcha javoblarni ko'rib chiqish ekrani → tahrirlash mumkin
11. "Yuborish" → rahmat ekrani
12. Muzaffarga botdan bildirishnoma keladi

### 3.2 Ssenariy B — Muzaffar suhbat vaqtida yozib boradi

1. Admin panelda sessiya yaratishda rejim: **"Suhbat rejimi"** tanlanadi
2. Muzaffar o'zi Mini App'ni ochadi
3. Har bir savol ekranida qo'shimcha ko'rinadi:
   - Chuqurlashtiruvchi savollar (probe) ro'yxati
   - Tez belgilar: 🟢 yashil bayroq / 🔴 qizil bayroq / ⭐ muhim
   - O'z ovozini yozib qo'yish (keyinroq matnga o'girish uchun)
4. Suhbat tugagach — "Xulosa varaqasi" ekrani ochiladi (qo'lda to'ldiriladigan maydonlar)

### 3.3 Ssenariy C — Natijalarni tahlil qilish

1. Admin panel → sessiyalar ro'yxati (holat, progress, sana)
2. Sessiyaga kirish → barcha savol-javob, ovoz yozuvlari, transkriptlar
3. "AI xulosa" tugmasi → Gemini barcha javoblarni o'qib, tuzilgan xulosa chiqaradi
4. "Solishtirish" → 2+ respondentni savol bo'yicha yonma-yon ko'rish
5. Eksport: CSV, JSON yoki Markdown

---

## 4. Texnologiya steki

| Qatlam | Texnologiya | Versiya | Sabab |
|---|---|---|---|
| Framework | Next.js (App Router) | 15.x | Muzaffarga tanish, Vercel bilan ideal |
| Til | TypeScript | 5.x | Tip xavfsizligi, Claude Code uchun aniqlik |
| UI | React | 19.x | Next.js 15 bilan keladi |
| Stil | Tailwind CSS | 4.x | Tez, Telegram temasi bilan moslashtirish oson |
| Komponentlar | Qo'lda yozilgan | — | shadcn/ui kerak emas, ekranlar oz |
| Baza | Supabase (Postgres) | — | Ulangan, RLS bor, Storage bor |
| Fayl saqlash | Supabase Storage | — | Ovoz fayllari uchun |
| Hosting | Vercel | — | Ulangan |
| Telegram Mini App | `@telegram-apps/sdk-react` | oxirgi | Rasmiy SDK |
| Telegram bot | `grammy` | oxirgi | TypeScript, webhook rejimida Next.js route ichida |
| AI | Google Gemini API (`@google/genai`) | oxirgi | Ovoz→matn va xulosa. O'zbek tilini yaxshi biladi |
| Validatsiya | `zod` | oxirgi | API kirish ma'lumotlarini tekshirish |

**Boshqa kutubxona qo'shilmaydi.** State management kutubxonasi (Redux, Zustand) kerak emas — React state va server actions yetarli.

### 4.1 Gemini modeli haqida muhim eslatma

Model nomlari tez o'zgaradi. Kod yozishdan oldin joriy model nomini tekshir va `GEMINI_MODEL` muhit o'zgaruvchisi orqali sozlanadigan qil — kodga qattiq yozib qo'yma.

- Ovozni matnga o'girish uchun: tez va arzon flash modeli
- Xulosa chiqarish uchun: xuddi shu model, structured output (JSON schema) bilan

---

## 5. Ma'lumotlar bazasi sxemasi

Supabase SQL Editor'da shu migratsiya bajariladi. **Sxema o'zgartirilmaydi.**

```sql
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
```

### 5.1 Storage bucket

```
Bucket nomi: voice
Public: NO (private)
Fayl yo'li: {session_id}/{question_id}.{ext}
Maksimal hajm: 20 MB
```

Ovozni tinglash uchun server tomonida **signed URL** (1 soatlik) yaratiladi. Bucket hech qachon public qilinmaydi.

---

## 6. Savollar ma'lumoti (seed)

Savollar `src/data/questions.ts` faylida TypeScript konstantasi sifatida saqlanadi va seed skript orqali bazaga yoziladi (`npm run seed`).

Savollar matni — allaqachon tayyorlangan 45 ta savol (9 blok). To'liq ro'yxat `Bogcha-sorovnoma.pdf` faylida. Har bir savol uchun quyidagi struktura:

```ts
export type SeedQuestion = {
  number: number
  text: string
  hint?: string
  type: 'text_short'|'text_long'|'number'|'money'|'yes_no'|'single_choice'|'multi_choice'
  options?: string[]
  allowVoice?: boolean   // default true
  isKey?: boolean        // eng muhim savol
  probes?: string[]      // interviewer rejimi uchun
}

export type SeedBlock = {
  code: string
  title: string
  description?: string
  questions: SeedQuestion[]
}
```

**Bloklar:**

| Kod | Nomi | Savollar |
|---|---|---|
| A | Bog'cha haqida umumiy ma'lumot | 1-6 |
| B | Davlat subsidiyasi | 7-15 |
| C | Hujjatlar va hisobotlar | 16-21 |
| D | Pul, to'lov va hisob-kitob | 22-26 |
| E | Bolalar jalb qilish va ketishi | 27-31 |
| F | Ota-onalar bilan aloqa | 32-34 |
| G | Xodimlar | 35-37 |
| H | Hozirgi vositalar | 38-41 |
| I | Yakuniy savollar | 42-45 |

**Kalit savollar** (`isKey: true`) — AI xulosada ustuvor: **12, 13, 14, 18, 26, 29, 39, 42, 43**

**Tur bo'yicha taqsimot:**
- `yes_no`: 7, 8 (birinchi qismi), 15, 28 (birinchi qismi), 40
- `money`: 6
- `number`: 2, 3 (qisman), 29
- `text_long` (ovoz ruxsat): 10, 11, 12, 13, 14, 16, 17, 18, 20, 21, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 36, 38, 39, 41, 42, 43, 44, 45
- Qolganlari: `text_short`

**Probe savollari** — `Suhbat-yoriqnomasi.pdf` faylidagi chuqurlashtiruvchi savollar tegishli savollarga biriktiriladi. Kamida quyidagilar:

```
Universal probes (barcha text_long savollarga):
  - "Oxirgi marta qachon shunday bo'ldi?"
  - "O'shanda aniq nima qildingiz?"
  - "Qancha vaqt ketdi? Qancha pulga tushdi?"
  - "Hozir buni qanday hal qilyapsiz?"

12-savol (subsidiya kam kelgani):
  - "Pul kelmagan oyda maoshni qayerdan topdingiz?"
  - "Kim bilan gaplashdingiz? Qancha kun ketdi?"
  - "Agar bugun tizim yana xato qilsa — buni qachon sezasiz?"

18-savol (hujjatlar vaqti):
  - "Buni kechqurun uydami yoki ish vaqtidami qilasiz?"
  - "Qaysi hujjat eng ko'p vaqt oladi?"

29-savol (bo'sh o'rin):
  - "Bitta bo'sh o'rin sizga oyiga qancha zarar keltiradi?"
```

---

## 7. Ekranlar va interfeys

### 7.1 Umumiy tamoyillar

- **Mobile-first.** Asosiy kenglik 360-430px. Desktop — markazlashtirilgan 480px konteyner.
- **Bir ekranda bitta savol.** Ro'yxat shaklida emas.
- **Telegram temasiga moslashish.** Foydalanuvchi Telegramda qorong'i rejimda bo'lsa — app ham qorong'i.
- **Minimal shrift 16px** kiritish maydonlarida (iOS'da avtomatik zoom bo'lmasligi uchun).
- **Tegish maydoni minimal 44×44px.**
- **Har bir harakatda haptic feedback** (Telegram SDK orqali).

### 7.2 Respondent ekranlari

#### E1. Kirish ekrani (`/s/[token]`)
```
┌─────────────────────────────┐
│  [Logo/ikonka]              │
│                             │
│  Bog'cha faoliyati bo'yicha │
│  so'rovnoma                 │
│                             │
│  Assalomu alaykum, {ism}!   │
│                             │
│  Men bog'cha rahbarlari     │
│  uchun tizim ustida         │
│  ishlayapman. Sizning real  │
│  tajribangiz menga eng      │
│  kerakli narsa.             │
│                             │
│  ⏱  ~25 daqiqa             │
│  🎤 Ovozli javob berish     │
│     mumkin                  │
│  💾 Javoblar avtomatik      │
│     saqlanadi — chiqib      │
│     ketsangiz ham yo'qolmaydi│
│                             │
│  ℹ️ Chiroyli javob emas,    │
│     rost javob kerak.       │
│                             │
│  [   Boshlash   ]           │
└─────────────────────────────┘
```

Agar sessiya allaqachon boshlangan bo'lsa — tugma matni **"Davom etish (12/45)"**.

#### E2. Blok kirish ekrani
Har bir yangi blok boshlanishida qisqa ekran: blok harfi, nomi, nechta savol borligi, "Davom etish" tugmasi. Tez o'tkazib yuborish mumkin.

#### E3. Savol ekrani (asosiy)
```
┌─────────────────────────────┐
│ ▬▬▬▬▬▬▬░░░░░░░  12/45       │  ← progress
│ B · Davlat subsidiyasi      │  ← blok
│                             │
│  12                         │  ← raqam (katta, rangli)
│  Subsidiya kutilganidan kam │
│  kelgan yoki umuman         │
│  kelmagan holat bo'lganmi?  │
│                             │
│  Bo'lgan bo'lsa: qachon,    │  ← hint (kulrang, kichik)
│  qancha summa, sababi nima  │
│  bo'ldi va qanday hal       │
│  qildingiz?                 │
│                             │
│  ┌───────────────────────┐  │
│  │ Javobingizni yozing... │  │  ← textarea, auto-grow
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  🎤  Ovozli javob      │  │  ← katta tugma
│  └───────────────────────┘  │
│                             │
│  [Tashlab ketish]  [Keyingi]│
└─────────────────────────────┘
```

**Xatti-harakatlar:**
- Matn kiritilganda "Keyingi" tugmasi faollashadi (lekin bo'sh bo'lsa ham o'tish mumkin — `skipped: true` yoziladi)
- Javob **blur** paytida va **Keyingi** bosilganda saqlanadi
- Orqaga qaytish: yuqoridagi ← tugmasi yoki Telegram BackButton
- `yes_no` turida — ikkita katta tugma
- `single_choice` / `multi_choice` — tugma-kartochkalar

#### E4. Ovoz yozish rejimi
```
┌─────────────────────────────┐
│                             │
│         ●  0:24             │  ← yozilmoqda, pulsatsiya
│    ▁▃▅▇▅▃▁▃▅▇▅▃▁            │  ← to'lqin animatsiyasi
│                             │
│  [ ⏹ To'xtatish ]           │
│  [ ✕ Bekor qilish ]         │
└─────────────────────────────┘

To'xtatilgandan keyin:
┌─────────────────────────────┐
│  ▶ 0:24  [qayta tinglash]   │
│                             │
│  ⏳ Matnga o'girilmoqda...  │
│                             │
│  yoki tayyor bo'lganda:     │
│  ┌───────────────────────┐  │
│  │ (transkript matni)     │  │  ← tahrirlash mumkin
│  └───────────────────────┘  │
│  ✎ Matnni tuzatishingiz     │
│    mumkin                   │
│                             │
│  [Qayta yozish] [Saqlash]   │
└─────────────────────────────┘
```

**Muhim:** ovoz fayli **har doim saqlanadi**, transkript noto'g'ri chiqsa ham asl ovoz qoladi.

#### E5. Ko'rib chiqish ekrani
Barcha savol va javoblar ro'yxati, blok bo'yicha guruhlangan. Har biriga bosib tahrirlash mumkin. Javobsiz qolganlar sariq belgi bilan. Pastda "Yuborish" tugmasi.

#### E6. Rahmat ekrani
Qisqa minnatdorchilik + "Savollaringiz bo'lsa yozing" + Telegram'ga qaytish tugmasi.

### 7.3 Interviewer rejimi qo'shimchalari

Savol ekranida qo'shimcha:
- **Probe savollar** — savol ostida kulrang kartochkada, yig'iladigan (collapsible)
- **Tez belgilar** — 🟢 🔴 ⭐ tugmalari (bittasini tanlash, `answers.flag`ga yoziladi)
- **"Mening eslatmam"** — alohida matn maydoni

Oxirida **Xulosa varaqasi** ekrani — `session_summaries` jadvalidagi qo'lda to'ldiriladigan maydonlar formasi.

### 7.4 Admin ekranlari

#### A1. Sessiyalar ro'yxati (`/admin`)
Jadval: Respondent | Bog'cha | Rejim | Holat | Progress | Sana | Amallar
Yuqorida: "Yangi sessiya" tugmasi, holat bo'yicha filtr.

#### A2. Yangi sessiya (`/admin/new`)
Forma: ism*, bog'cha nomi, telefon, tur (select), bolalar soni, eslatma, rejim (self/interviewer).
Yaratilgandan keyin — havola va uni nusxalash tugmasi + "Telegramda yuborish" tugmasi.

#### A3. Sessiya tafsiloti (`/admin/session/[id]`)
- Yuqorida: respondent ma'lumoti, holat, progress, vaqt
- Barcha savol-javob ro'yxati; ovoz bo'lsa — pleyer + transkript
- Belgilangan javoblar (🟢🔴⭐) yuqorida alohida ko'rsatiladi
- "AI xulosa chiqarish" tugmasi
- "Xulosa varaqasi" tab — qo'lda to'ldiriladigan maydonlar

#### A4. Solishtirish (`/admin/compare?ids=...`)
Savol bo'yicha yonma-yon ustunlar (2-4 respondent). Faqat kalit savollar yoki barchasi — filtr bilan.

#### A5. Eksport
CSV (tekis jadval), JSON (to'liq), Markdown (o'qish uchun qulay hisobot).

### 7.5 Dizayn tizimi

**Ranglar** — Telegram tema o'zgaruvchilari asosiy, quyidagilar zaxira (fallback):

```css
:root {
  --bg:            var(--tg-theme-bg-color, #ffffff);
  --bg-secondary:  var(--tg-theme-secondary-bg-color, #f4f6f9);
  --text:          var(--tg-theme-text-color, #1a1d21);
  --text-muted:    var(--tg-theme-hint-color, #7c8899);
  --link:          var(--tg-theme-link-color, #1e5eb8);
  --button:        var(--tg-theme-button-color, #1e5eb8);
  --button-text:   var(--tg-theme-button-text-color, #ffffff);
  --border:        rgba(128,138,152,0.22);

  /* brend aksentlari (temadan qat'i nazar) */
  --accent:        #1e5eb8;
  --success:       #16a34a;
  --danger:        #dc2626;
  --warning:       #d97706;
  --star:          #ca8a04;

  --radius:        12px;
  --radius-lg:     16px;
}
```

**Tipografika:**
```
Shrift: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif
Savol matni:     19px / 600 / line-height 1.35
Hint:            14px / 400 / muted
Input:           16px  (MAJBURIY — kamroq bo'lsa iOS zoom qiladi)
Tugma:           16px / 600
Progress/meta:   13px / 500 / muted
Savol raqami:    28px / 700 / accent
```

**Bo'shliqlar:** 4px shkalasi — 4, 8, 12, 16, 20, 24, 32, 40
**Ekran chetlari:** 16px

**Animatsiyalar:**
- Savollar orasida: gorizontal slide, 220ms, `cubic-bezier(0.22, 1, 0.36, 1)`
- Progress bar: width transition 300ms
- Ovoz yozishda: pulsatsiya 1.2s infinite
- `prefers-reduced-motion` hurmat qilinadi

**Komponentlar ro'yxati** (`src/components/`):
```
ProgressHeader.tsx     — progress bar + blok nomi + orqaga
QuestionCard.tsx       — savol raqami, matni, hint
AnswerInput.tsx        — turga qarab kerakli kiritish
VoiceRecorder.tsx      — yozish, to'xtatish, tinglash, transkript
ChoiceGroup.tsx        — yes_no / single / multi
NavButtons.tsx         — tashlab ketish / keyingi
BlockIntro.tsx         — blok kirish ekrani
ReviewList.tsx         — ko'rib chiqish ro'yxati
FlagButtons.tsx        — 🟢🔴⭐ (interviewer)
ProbeList.tsx          — chuqurlashtiruvchi savollar (interviewer)
Toast.tsx              — saqlandi / xato bildirishnomasi
```

---

## 8. API va server mantiqi

Barcha ma'lumotlar bazasiga murojaat **faqat server tomonida** (Server Actions yoki Route Handlers). Klient hech qachon Supabase'ga to'g'ridan-to'g'ri ulanmaydi va `service_role` kaliti klientga chiqmaydi.

### 8.1 Route Handlers

| Metod | Yo'l | Vazifa |
|---|---|---|
| POST | `/api/session/start` | Token bo'yicha sessiyani boshlash, savollarni qaytarish |
| POST | `/api/answer` | Bitta javobni saqlash (upsert) |
| POST | `/api/voice/upload` | Ovoz faylini Storage'ga yuklash |
| POST | `/api/voice/transcribe` | Gemini orqali matnga o'girish |
| POST | `/api/session/complete` | Sessiyani yakunlash + adminga bildirishnoma |
| GET | `/api/admin/sessions` | Sessiyalar ro'yxati (admin) |
| POST | `/api/admin/session` | Yangi sessiya yaratish (admin) |
| POST | `/api/admin/summary` | AI xulosa generatsiya (admin) |
| GET | `/api/admin/export` | CSV/JSON/MD eksport (admin) |
| POST | `/api/telegram/webhook` | Bot webhook |

### 8.2 Autentifikatsiya

**Har bir so'rovda** klient Telegram `initData` satrini `X-Telegram-Init-Data` sarlavhasida yuboradi. Server:

1. `initData` HMAC imzosini bot tokeni bilan tekshiradi (standart Telegram algoritmi)
2. `auth_date` 24 soatdan eski bo'lsa — rad etadi
3. Admin endpointlar uchun: `user.id` `ADMIN_TELEGRAM_IDS` ro'yxatida borligini tekshiradi

**Brauzerda ochilgan holat** (Telegramdan tashqari): `initData` bo'lmaydi. Bu holda faqat `token` bilan ishlash mumkin — token o'zi maxfiy kalit vazifasini bajaradi. Admin panelga brauzerdan kirish MVP'da **yopiq**.

### 8.3 Ovozni matnga o'girish oqimi

```
1. Klient MediaRecorder orqali yozadi
   Format: audio/webm;codecs=opus (Android/Desktop)
           audio/mp4 (iOS Safari — webm qo'llab-quvvatlanmaydi!)
   Formatni MediaRecorder.isTypeSupported() orqali aniqla.

2. POST /api/voice/upload (multipart)
   → Supabase Storage: voice/{session_id}/{question_id}.{ext}
   → answers.audio_path yangilanadi
   → audio_path qaytariladi

3. POST /api/voice/transcribe { sessionId, questionId }
   → Storage'dan fayl olinadi
   → Gemini'ga yuboriladi:

   Prompt:
   "Bu audio o'zbek tilida yozilgan javob. Uni aynan
    eshitilganidek matnga o'gir. Hech narsa qo'shma,
    tushuntirma yozma, tarjima qilma. Faqat matn.
    Agar ba'zi joy tushunarsiz bo'lsa [?] deb belgila.
    Raqamlar va summalarni raqam bilan yoz."

   → answers.transcript va answers.text ga yoziladi
   → klientga qaytariladi, foydalanuvchi tahrirlashi mumkin

4. Foydalanuvchi tahrirlasa → answers.text yangilanadi,
   answers.is_edited = true (transcript o'zgarmaydi)
```

**Xatolarni boshqarish:**
- Gemini javob bermasa yoki xato bersa → ovoz saqlanib qoladi, foydalanuvchiga "Matnga o'girib bo'lmadi, keyinroq urinib ko'ramiz. Ovozingiz saqlandi." deb ko'rsatiladi
- Transkripsiyani admin panelda qayta ishga tushirish tugmasi bo'lishi kerak
- Timeout: 60 soniya

### 8.4 AI xulosa

`POST /api/admin/summary` — sessiyaning barcha savol-javoblarini Gemini'ga yuboradi va **structured JSON** qaytaradi:

```json
{
  "biggest_pain":        "string — respondentning o'z so'zlari bilan",
  "pain_evidence":       ["aniq iqtiboslar"],
  "numbers_mentioned":   [{"what":"...","value":"...","question":12}],
  "time_costs":          [{"activity":"...","hours_per_month":0}],
  "money_at_risk":       "string yoki null",
  "already_paid_for":    "string yoki null",
  "hypothesis_signals":  {"subsidy":"strong|weak|none",
                          "documents":"strong|weak|none",
                          "occupancy":"strong|weak|none"},
  "green_flags":         ["..."],
  "red_flags":           ["..."],
  "quotes_worth_keeping":["..."],
  "missing_info":        ["aniqlanmagan, qayta so'rash kerak bo'lgan narsalar"]
}
```

Prompt'da aniq ko'rsatma bo'lishi shart:

> Sen intervyu tahlilchisisan. Faqat respondent AYTGAN narsaga tayan.
> Hech narsa o'ylab topma yoki taxmin qilma. Ma'lumot yetishmasa
> "missing_info" ga yoz. Maqtov va umumiy gaplarni dalil deb hisoblama —
> faqat aniq sana, summa va hodisalar dalil bo'ladi.

### 8.5 Telegram bot

Bot minimal vazifa bajaradi:

| Buyruq/hodisa | Javob |
|---|---|
| `/start` | Salom + Mini App ochish tugmasi |
| `/start <token>` | To'g'ridan-to'g'ri sessiyani ochadi |
| `/admin` | Admin bo'lsa — admin panel tugmasi |
| Sessiya tugaganda | Adminga: "{ism} ({bog'cha}) so'rovnomani tugatdi — 45/45" + ko'rish tugmasi |

Webhook `/api/telegram/webhook` da, `grammy` `webhookCallback` orqali. Webhook `TELEGRAM_WEBHOOK_SECRET` bilan himoyalanadi.

---

## 9. Fayl strukturasi

```
suhbat/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # bo'sh / admin'ga yo'naltirish
│   │   ├── s/[token]/
│   │   │   ├── page.tsx                # kirish ekrani
│   │   │   ├── q/[number]/page.tsx     # savol ekrani
│   │   │   ├── review/page.tsx
│   │   │   └── done/page.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx                # sessiyalar ro'yxati
│   │   │   ├── new/page.tsx
│   │   │   ├── session/[id]/page.tsx
│   │   │   └── compare/page.tsx
│   │   └── api/
│   │       ├── session/start/route.ts
│   │       ├── session/complete/route.ts
│   │       ├── answer/route.ts
│   │       ├── voice/upload/route.ts
│   │       ├── voice/transcribe/route.ts
│   │       ├── admin/[...]/route.ts
│   │       └── telegram/webhook/route.ts
│   ├── components/                     # 7.5-bo'limdagi ro'yxat
│   ├── lib/
│   │   ├── supabase.ts                 # server klient (service_role)
│   │   ├── telegram-auth.ts            # initData validatsiya
│   │   ├── gemini.ts                   # transkripsiya + xulosa
│   │   ├── bot.ts                      # grammy bot
│   │   └── utils.ts
│   ├── data/
│   │   └── questions.ts                # 45 ta savol
│   └── types/
│       └── index.ts
├── scripts/
│   └── seed.ts                         # savollarni bazaga yozish
├── supabase/
│   └── migrations/
│       └── 001_init.sql                # 5-bo'limdagi SQL
├── .env.local.example
├── package.json
└── README.md
```

---

## 10. Muhit o'zgaruvchilari

```bash
# .env.local.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=          # FAQAT SERVER. Klientga chiqmaydi!

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=              # @siz
TELEGRAM_WEBHOOK_SECRET=            # tasodifiy satr
ADMIN_TELEGRAM_IDS=123456789        # vergul bilan ajratilgan

# Gemini
GEMINI_API_KEY=
GEMINI_MODEL=                       # joriy flash model nomi

# App
NEXT_PUBLIC_APP_URL=https://....vercel.app
```

**Xavfsizlik qoidasi:** `NEXT_PUBLIC_` prefiksi faqat maxfiy bo'lmagan qiymatlarda. `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `GEMINI_API_KEY` hech qachon klient kodiga tushmasligi kerak.

---

## 11. Bosqichlar

Har bir bosqich tugagach — ishlaydigan holat bo'lishi shart (deploy qilinadi va sinaladi).

### M0 — Tayyorgarlik
- [ ] Next.js 15 + TypeScript + Tailwind 4 loyihasi
- [ ] Supabase loyihasi, migratsiya bajarilgan, `voice` bucket yaratilgan
- [ ] Vercel'ga ulangan, birinchi deploy
- [ ] BotFather'da bot yaratilgan, Mini App URL sozlangan
- [ ] `.env.local` to'ldirilgan

### M1 — Ma'lumotlar
- [ ] `src/data/questions.ts` — 45 ta savol to'liq kiritilgan
- [ ] `npm run seed` ishlaydi, baza to'ladi
- [ ] TypeScript tiplari generatsiya qilingan

### M2 — Respondent oqimi (matn)
- [ ] `initData` validatsiyasi ishlaydi
- [ ] Kirish ekrani, savol ekranlari, ko'rib chiqish, rahmat ekrani
- [ ] Har bir javob darhol saqlanadi
- [ ] Chiqib qayta kirganda davom etadi
- [ ] Telegram BackButton va MainButton ishlaydi
- [ ] Qorong'i/yorug' tema ishlaydi

### M3 — Admin panel
- [ ] Sessiyalar ro'yxati, filtr
- [ ] Yangi sessiya yaratish + havola nusxalash
- [ ] Sessiya tafsiloti — barcha javoblar
- [ ] Bot orqali tugallanganlik bildirishnomasi

### M4 — Ovoz
- [ ] MediaRecorder (iOS uchun mp4 fallback bilan)
- [ ] Storage'ga yuklash
- [ ] Gemini transkripsiya
- [ ] Transkriptni qo'lda tuzatish
- [ ] Admin panelda ovozni tinglash (signed URL)
- [ ] Xato holatlari to'g'ri ishlanadi

### M5 — Tahlil
- [ ] AI xulosa (structured JSON)
- [ ] Xulosa varaqasi (qo'lda to'ldirish)
- [ ] Solishtirish ekrani
- [ ] Eksport: CSV, JSON, Markdown

### M6 — Interviewer rejimi va sayqal
- [ ] Probe savollar ko'rsatiladi
- [ ] Belgilar (🟢🔴⭐)
- [ ] Animatsiyalar, haptic
- [ ] Events jadvaliga yozish (qayerda tashlab ketilgani ko'rinishi uchun)
- [ ] Real qurilmada (iOS + Android) to'liq sinov

**Tavsiya:** M2 va M3 tugagach darhol birinchi qarindoshingizga yuboring — ovoz tayyor bo'lishini kutmang. Matnli versiya ham ish beradi va sizga real fikr keladi.

---

## 12. Qabul mezonlari (test ssenariylari)

| № | Ssenariy | Kutilgan natija |
|---|---|---|
| T1 | Telegramda havolani ochish | Mini App ochiladi, ism ko'rinadi |
| T2 | 5 ta savolga javob berib, appni yopish va qayta ochish | 6-savoldan davom etadi, javoblar joyida |
| T3 | Bo'sh javob bilan "Keyingi" | O'tadi, `skipped=true` yoziladi |
| T4 | iPhone'da ovoz yozish | Yoziladi (mp4), yuklanadi, transkript keladi |
| T5 | Android'da ovoz yozish | Yoziladi (webm), yuklanadi, transkript keladi |
| T6 | Transkriptni tuzatib saqlash | `text` yangilanadi, `transcript` o'zgarmaydi, `is_edited=true` |
| T7 | Internet uzilganda javob saqlash | Xato ko'rsatiladi, qayta urinish tugmasi, javob yo'qolmaydi |
| T8 | Qorong'i temada ochish | Barcha matn o'qilarli, kontrast yetarli |
| T9 | Admin bo'lmagan foydalanuvchi `/admin` ga kirishi | 403, hech qanday ma'lumot ko'rinmaydi |
| T10 | Noto'g'ri token bilan `/s/xxx` | "Havola topilmadi" ekrani |
| T11 | `initData` soxtalashtirilgan so'rov | 401 |
| T12 | Sessiyani tugatish | Admin botga bildirishnoma keladi |
| T13 | AI xulosa chiqarish | JSON to'g'ri strukturada, o'ylab topilgan ma'lumot yo'q |
| T14 | 2 ta sessiyani solishtirish | Savol bo'yicha yonma-yon ko'rinadi |
| T15 | CSV eksport | Excel'da ochiladi, kirill/lotin belgilar buzilmaydi (UTF-8 BOM) |

---

## 13. Xavflar va chegara holatlari

| Xavf | Ta'siri | Yechim |
|---|---|---|
| iOS Safari `audio/webm` ni qo'llab-quvvatlamaydi | Ovoz ishlamaydi | `MediaRecorder.isTypeSupported()` bilan format tanlash, mp4 fallback |
| Gemini o'zbekcha transkriptni noto'g'ri chiqaradi | Ma'lumot buziladi | Ovoz **doim** saqlanadi, qo'lda tuzatish majburiy imkoniyat |
| Mikrofon ruxsati berilmaydi | Ovoz tugmasi ishlamaydi | Aniq xabar + matn bilan davom etish taklifi |
| Respondent yarim yo'lda tashlab ketadi | Ma'lumot chala | Autosave + `events` jadvali orqali qaysi savolda tashlaganini ko'rish |
| Sekin internet | Ovoz yuklanmaydi | Yuklashda progress, qayta urinish, 20MB chegara |
| Token tarqalib ketadi | Boshqa odam to'ldiradi | Token uzun va tasodifiy; bitta sessiya bitta odamga |
| Savollar keyin o'zgaradi | Eski javoblar mos kelmaydi | `questionnaires.version` — yangi versiya yangi yozuv sifatida |
| Gemini API limiti | Transkripsiya to'xtaydi | Xato ushlanadi, navbatga qo'yiladi, admin panelda qayta ishga tushirish |

---

## 14. Claude Code uchun ishga tushirish ko'rsatmasi

**1-qadam.** Bu faylni loyiha ildiziga `TZ.md` nomi bilan joylashtiring.

**2-qadam.** Birinchi prompt:

> `TZ.md` faylini to'liq o'qi. Bu loyihaning yagona spetsifikatsiyasi.
> Hozir faqat **M0 va M1** bosqichlarini bajar: loyihani sozlash,
> Supabase migratsiyasi, 45 ta savolni `src/data/questions.ts` ga
> kiritish va seed skriptini yozish.
> Savollar matnini `Bogcha-sorovnoma.pdf` dan aynan ko'chir.
> M2 ga o'tma — men tekshirib, ruxsat beraman.

**3-qadam.** Har bir bosqich uchun alohida prompt bering. Bir vaqtda hammasini qilishga ruxsat bermang — xato topish qiyinlashadi.

**4-qadam.** Har bosqichdan keyin:
> 12-bo'limdagi tegishli test ssenariylarini bajar va natijani ko'rsat.

**Claude Code'ga aytilishi kerak bo'lgan muhim cheklovlar:**

- Sxemani o'zgartirma, yangi jadval qo'shma
- `service_role` kalitini klient komponentga import qilma
- `'use client'` faqat kerak bo'lgan joyda (ovoz yozish, forma) — qolgani server komponent
- Savol matnlarini o'zgartirma yoki "yaxshilama" — ular ataylab shunday yozilgan
- Emoji faqat belgilar (🟢🔴⭐🎤) uchun — interfeys matnida ishlatilmaydi
- Har bir API route'da `zod` bilan kirish validatsiyasi

---

## 15. Keyingi versiyalar uchun g'oyalar (hozir qilinmaydi)

- Savollarni admin paneldan tahrirlash
- Bir nechta so'rovnoma shabloni (bog'cha, o'quv markaz, xususiy maktab)
- Respondentga natija bo'yicha qisqa hisobot yuborish (qiymat almashish — u sizga ma'lumot beradi, siz unga tahlil berasiz)
- Suhbat audiosini to'liq yozib olish va diarizatsiya
- Barcha sessiyalar bo'yicha umumiy AI tahlil ("10 ta suhbatdan qanday naqsh chiqdi?")
- Ommaviy havola (bitta havola — ko'p respondent), Telegram guruhlarga tarqatish uchun

---

**TZ oxiri.** Savol yoki noaniqlik bo'lsa — kod yozishdan oldin so'rang.
