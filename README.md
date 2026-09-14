# Bog'cha so'rovnomasi — o'rnatish

Uch fayl, hech qanday build yo'q. Vercel'ga tashlaysiz va ikkita o'zgaruvchi qo'shasiz — tamom.

```
index.html                  ← butun sayt (CSS va JS ichida, tashqi fayl yo'q)
api/submit.js               ← javoblarni Telegramga yuboradi
api/telegram-webhook.js     ← bot /start bosilganda saytga tugma yuboradi
package.json                ← faqat "type": "module" uchun
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

---

## Nima qanday ishlaydi

**Javoblar yo'qolmaydi.** Har bir harf yozilganda javob brauzer xotirasiga
saqlanadi. Respondent sahifani yopib ketsa ham, qaytganda "Davom etish (7/20)"
deb turadi va javoblari joyida bo'ladi.

**Internet uzilsa.** Yuborish paytida xato chiqsa — javoblar o'chmaydi.
"Qayta yuborish" tugmasi chiqadi, hamda "Javoblarni nusxalash" tugmasi
(hammasini matn qilib nusxalaydi, Telegram orqali qo'lda yuborsa bo'ladi).

**Telegram cheklovi.** Bitta xabar 4096 belgidan oshmaydi, shuning uchun javoblar
bir necha xabarga bo'lib yuboriladi. Oxirida to'liq JSON fayl ham keladi —
keyinchalik tahlil qilish uchun shu qulay.

**Hech qanday baza yo'q.** Ataylab. Buziladigan joy kam bo'lsin dedik.
Agar keyin javoblarni bazaga yig'ish kerak bo'lsa — `TZ.md` dagi to'liq variantga
o'tasiz.

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
