// Foydalanish: npm run set-webhook
// Bot webhook'ini Telegram'ga ro'yxatdan o'tkazadi. Haqiqiy internet aloqasi
// kerak — buni deploy qilingandan keyin o'zingizning kompyuteringizda
// ishga tushiring (bu buyruq sandbox ichida ishlamaydi).

import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!botToken || !appUrl || !secret) {
    console.error(
      "Xato: TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_APP_URL, TELEGRAM_WEBHOOK_SECRET .env.local'da to'ldirilishi kerak."
    );
    process.exit(1);
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message", "callback_query"],
    }),
  });

  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));

  if (!json.ok) {
    console.error("Webhook o'rnatilmadi.");
    process.exit(1);
  }

  console.log(`Webhook o'rnatildi: ${webhookUrl}`);
}

main();
