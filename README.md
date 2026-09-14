# Bog'cha so'rovnomasi — o'rnatish

Hech qanday build yo'q — Vercel'ga tashlaysiz va kerakli o'zgaruvchilarni qo'shasiz.
So'rovnoma sayti + bot + admin panel, uchtasi ham shu bitta loyihada.

```
index.html                  ← butun sayt (CSS va JS ichida, tashqi fayl yo'q)
admin/index.html             ← admin panel (parol bilan kirish, javoblar ro'yxati)
api/submit.js                ← javobni bazaga saqlaydi + Telegramga qisqa xabar yuboradi
api/telegram-webhook.js      ← bot /start bosilganda saytga tugma yuboradi
api/admin/login.js           ← admin parolni tekshiradi, sessiya cookie qo'yadi
api/admin/logout.js          ← sessiyani tugatadi
api/admin/list.js            ← barcha so'rovnomalar ro'yxati
api/admin/submission.js      ← bitta so'rovnomaning to'liq tafsiloti
api/admin/export.js          ← bitta so'rovnomani qisqa .txt fayl qilib yuklab beradi
lib/                         ← Supabase va admin autentifikatsiya uchun yordamchi kod
package.json                 ← faqat "type": "module" uchun
```

---

## 1. Telegram bot yarating (2 daqiqa)

1. Telegramda **@BotFather** ga kiring → `/newbot`
2. Nom va username bering
3. U sizga **token** beradi — shunga o'xshash:
   `8123456789:AAH_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
4. Tokenni saqlab qo'ying, hech kimga bermang

## 2. O'z chat ID'ingizni oling (1 daqiqa)

1. Telegramda **@userinfobot** ga `/start` yuboring
2. U sizga `Id: 123456789` deb qaytaradi — bu sizning chat ID'ingiz
3. Endi **o'zingiz yaratgan botga** kirib `/start` bosing
   (bot sizga xabar yubora olishi uchun shu qadam **majburiy**)

## 3. Vercel'ga chiqaring (2 daqiqa)

**Variant A — terminal orqali:**
```bash
cd suhbat-site
npx vercel --prod
```

**Variant B — vercel.com orqali:** papkani GitHub'ga qo'yib, Vercel'da "Import Project".

Framework so'rasa — **Other** yoki **No framework** tanlang. Build command bo'sh qolsin.

## 4. Ikkita o'zgaruvchini qo'shing (1 daqiqa)

Vercel → loyihangiz → **Settings → Environment Variables**:

| Nomi | Qiymati |
|---|---|
| `TELEGRAM_BOT_TOKEN` | BotFather bergan token |
| `TELEGRAM_CHAT_ID` | @userinfobot bergan raqam |

Qo'shgandan keyin **Deployments → oxirgisi → Redeploy** bosing.
O'zgaruvchilar faqat qayta deploy qilingandan keyin ishlaydi.

## 5. Sinab ko'ring

Saytni oching, bir-ikkita savolga javob yozib **Yuborish** bosing.
Telegramda xabar kelishi kerak: bog'cha ma'lumoti + barcha javoblar + JSON fayl.

## 6. Bot /start bosilganda saytga tugma chiqishi uchun (1 daqiqa)

Bot deploy qilingandan keyin, Telegramga "menga shu webhook manzilga xabar yubor" deb
bir marta aytish kerak. Terminalda (yoki brauzerda) shuni oching, `<TOKEN>` o'rniga
o'z tokeningizni qo'ying:

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://suhbat-omega.vercel.app/api/telegram-webhook
```

`{"ok":true,"result":true,...}` chiqsa — tayyor. Endi botga `/start` bosilganda
**"📝 So'rovnomani boshlash"** tugmasi chiqadi va bosilganda saytga o'tadi.

Agar sayt boshqa manzilda bo'lsa — Vercel'da `SITE_URL` o'zgaruvchisini shunga mos qo'ying
(qo'shmasangiz, yuqoridagi standart manzil ishlatiladi).

**Xavfsizlik uchun (ixtiyoriy):** `TELEGRAM_WEBHOOK_SECRET` degan o'zgaruvchiga
o'zingiz tanlagan tasodifiy matn yozib, `setWebhook` so'roviga
`&secret_token=<xuddi shu matn>` qo'shib yuborsangiz, faqat Telegram'dan kelgan
so'rovlar qabul qilinadi.

## 7. Admin panel (`/admin`) — barcha javoblarni ko'rish

Har bir to'ldirilgan so'rovnoma endi bazaga (Supabase) saqlanadi va `/admin`
sahifasida ro'yxat + har birining to'liq tafsiloti ko'rinadi. Har bir yozuvni
bitta tugma bilan qisqa `.txt` fayl qilib yuklab olish mumkin — uzun matn
o'qishga to'g'ri kelmaydi.

**Kerakli o'zgaruvchilar** (Vercel → Settings → Environment Variables):

| Nomi | Qiymati |
|---|---|
| `SUPABASE_URL` | Supabase loyihangiz manzili (masalan `https://xxxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → **service_role** (maxfiy) kalit |
| `ADMIN_PASSWORD` | `/admin` sahifasiga kirish uchun o'zingiz tanlagan parol |

`ADMIN_PASSWORD` — bu **admin kim ekanini bildiruvchi yagona narsa**: uni
biladigan odam `/admin`ga kira oladi. Agar buni Telegram chat ID orqali emas,
alohida odam/qurilma uchun boshqacha qilib xohlasangiz (masalan bir nechta
admin, har biriga alohida parol) — ayting, shuni ham qo'shib beraman.

Qo'shgandan keyin qayta deploy qiling, so'ng `https://suhbat-omega.vercel.app/admin`
sahifasini oching va parolni kiriting.

---

## Nima qanday ishlaydi

**Javoblar yo'qolmaydi.** Har bir harf yozilganda javob brauzer xotirasiga
saqlanadi. Respondent sahifani yopib ketsa ham, qaytganda "Davom etish (7/20)"
deb turadi va javoblari joyida bo'ladi.

**Internet uzilsa.** Yuborish paytida xato chiqsa — javoblar o'chmaydi.
"Qayta yuborish" tugmasi chiqadi, hamda "Javoblarni nusxalash" tugmasi
(hammasini matn qilib nusxalaydi, Telegram orqali qo'lda yuborsa bo'ladi).

**Telegram — endi qisqa xabar.** Yangi so'rovnoma kelganda Telegramga
bog'cha nomi, telefon va to'ldirilgan savollar soni bilan bitta qisqa xabar
keladi (to'liq javoblar endi `/admin` panelida). Agar bironsababdan baza
yozib bo'lmasa — eski uslubda to'liq matn + JSON fayl zaxira sifatida
yuboriladi, hech qanday javob yo'qolmaydi.

**Baza — Supabase.** Har bir javob `bogcha_submissions` jadvaliga saqlanadi.
Jadvalda RLS yoqilgan va hech qanday ochiq policy yo'q — faqat server
tomonidan (`SUPABASE_SERVICE_ROLE_KEY` bilan) yozish/o'qish mumkin, brauzerdan
to'g'ridan-to'g'ri kirib bo'lmaydi.

---

## O'zgartirish kerak bo'lsa

**Savol matnini o'zgartirish:** `index.html` ichida `var QS = [` dan boshlanadigan
ro'yxat. Har bir savol: `{t:"savol matni", h:"kichik izoh"}`.
`key:true` — savol "MUHIM" deb belgilanadi.

**Savol qo'shish/olib tashlash:** shu ro'yxatga qo'shasiz yoki o'chirasiz.
Sanoq (1/20) avtomatik moslashadi, boshqa joyni tegishning hojati yo'q.

**Kirish ekranidagi maydonlar:** `<section id="s-intro">` ichida.

---

## Sinovdan o'tgan

Quyidagilar avtomatik brauzer testida tekshirilgan:

- Bo'sh forma bilan "Boshlash" → ikkala majburiy maydon qizarardi
- 20 ta savolni ketma-ket bosib o'tish, sanoq to'g'ri ishlaydi
- Ko'rib chiqish ekranida javobsizlar sariq rangda ko'rinadi
- Javobga bosib tahrirlashga qaytish
- Sahifani yangilash → javoblar tiklanadi
- Yuborish → rahmat ekrani
- Qorong'i rejim
- JS xatolari: yo'q
