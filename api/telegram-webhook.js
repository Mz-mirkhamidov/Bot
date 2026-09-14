// Vercel serverless function — Telegram bot webhook.
// /start bosilganda saytga o'tuvchi tugma yuboradi.
//
// Kerakli muhit o'zgaruvchilari (Vercel > Settings > Environment Variables):
//   TELEGRAM_BOT_TOKEN     — @BotFather bergan token
//   SITE_URL               — so'rovnoma sayti manzili (masalan https://suhbat-omega.vercel.app)
//   TELEGRAM_WEBHOOK_SECRET — ixtiyoriy, webhookni himoyalash uchun (pastga qarang)

const TG = "https://api.telegram.org/bot";
const DEFAULT_SITE_URL = "https://suhbat-omega.vercel.app";

async function sendMessage(token, chatId, text, replyMarkup) {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (replyMarkup) body.reply_markup = replyMarkup;

  const r = await fetch(TG + token + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error("telegram " + r.status + " " + t.slice(0, 300));
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers["x-telegram-bot-api-secret-token"] !== secret) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    res.status(200).json({ ok: false, error: "not_configured" });
    return;
  }

  const siteUrl = process.env.SITE_URL || DEFAULT_SITE_URL;

  let update = req.body;
  if (typeof update === "string") {
    try { update = JSON.parse(update); } catch { update = null; }
  }

  const msg = update && update.message;
  const chatId = msg && msg.chat && msg.chat.id;
  const text = (msg && msg.text) || "";

  if (!chatId) {
    res.status(200).json({ ok: true });
    return;
  }

  try {
    if (text.startsWith("/start")) {
      await sendMessage(
        token,
        chatId,
        "👋 Assalomu alaykum!\n\nBog'cha faoliyati bo'yicha qisqa so'rovnomaga taklif qilamiz — atigi 15 daqiqa vaqtingizni oladi.",
        {
          inline_keyboard: [
            [{ text: "📝 So'rovnomani boshlash", url: siteUrl }],
          ],
        }
      );
    } else {
      await sendMessage(
        token,
        chatId,
        "So'rovnomani boshlash uchun /start buyrug'ini yuboring.",
        {
          inline_keyboard: [
            [{ text: "📝 So'rovnomani boshlash", url: siteUrl }],
          ],
        }
      );
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: false, error: "send_failed" });
  }
}
