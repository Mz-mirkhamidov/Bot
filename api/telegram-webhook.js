// Vercel serverless function — Telegram bot webhook.
// - Oddiy foydalanuvchiga: /start bosilganda saytga o'tuvchi tugma.
// - Adminga (ADMIN_CHAT_ID): /admin bosilganda barcha so'rovnomalar ro'yxati,
//   tugma bosilsa tafsilot + qisqa .txt fayl — hammasi Telegramning o'zida.
//
// Kerakli muhit o'zgaruvchilari (Vercel > Settings > Environment Variables):
//   TELEGRAM_BOT_TOKEN         — @BotFather bergan token
//   SITE_URL                   — so'rovnoma sayti manzili
//   TELEGRAM_WEBHOOK_SECRET    — ixtiyoriy, webhookni himoyalash uchun
//   ADMIN_CHAT_ID              — admin panelga kira oladigan Telegram chat ID
//                                 (bo'lmasa TELEGRAM_CHAT_ID ishlatiladi)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — so'rovnomalar saqlangan baza

import { sbSelect } from "../lib/supabase.js";
import { formatSubmissionText, safeFileName } from "../lib/formatSubmission.js";

const TG = "https://api.telegram.org/bot";
const DEFAULT_SITE_URL = "https://suhbat-omega.vercel.app";
const PAGE_SIZE = 8;

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isAdmin(chatId) {
  const adminId = process.env.ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
  return !!adminId && String(chatId) === String(adminId);
}

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

async function sendDocumentText(token, chatId, filename, text) {
  const fd = new FormData();
  fd.append("chat_id", String(chatId));
  fd.append("document", new Blob([text], { type: "text/plain; charset=utf-8" }), filename);
  const r = await fetch(TG + token + "/sendDocument", { method: "POST", body: fd });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error("telegram_doc " + r.status + " " + t.slice(0, 300));
  }
}

async function answerCallbackQuery(token, callbackQueryId, text) {
  await fetch(TG + token + "/answerCallbackQuery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  }).catch(() => {});
}

/* ---------- admin: ro'yxat ---------- */

async function sendAdminList(token, chatId, offset) {
  const rows = await sbSelect("bogcha_submissions", {
    select: "id,created_at,org_name,org_phone,answered_count,total_count",
    order: "created_at.desc",
    limit: PAGE_SIZE + 1,
    offset,
  });

  if (!rows.length && offset === 0) {
    await sendMessage(token, chatId, "📋 Hali hech kim so'rovnomani to'ldirmagan.");
    return;
  }
  if (!rows.length) {
    await sendMessage(token, chatId, "Boshqa yozuv yo'q.");
    return;
  }

  const hasMore = rows.length > PAGE_SIZE;
  const page = rows.slice(0, PAGE_SIZE);

  const buttons = page.map((r) => {
    const d = new Date(r.created_at).toLocaleDateString("uz-UZ");
    const label = `🏫 ${(r.org_name || "—").slice(0, 28)} · ${d} (${r.answered_count}/${r.total_count})`;
    return [{ text: label, callback_data: "adm:sub:" + r.id }];
  });
  if (hasMore) {
    buttons.push([{ text: "➡️ Yana ko'rsatish", callback_data: "adm:list:" + (offset + PAGE_SIZE) }]);
  }

  await sendMessage(
    token,
    chatId,
    `📋 <b>So'rovnomalar</b> (${offset + 1}–${offset + page.length})`,
    { inline_keyboard: buttons }
  );
}

async function sendAdminDetail(token, chatId, id) {
  const rows = await sbSelect("bogcha_submissions", {
    select: "*",
    filter: { id: "eq." + id },
    limit: 1,
  });
  if (!rows.length) {
    await sendMessage(token, chatId, "Bu yozuv topilmadi (o'chirilgan bo'lishi mumkin).");
    return;
  }
  const row = rows[0];

  const summary =
    "🏫 <b>" + esc(row.org_name || "—") + "</b>\n" +
    "Turi: " + esc(row.org_type || "—") + "\n" +
    "Manzil: " + esc(row.org_addr || "—") + "\n" +
    "Telefon: " + esc(row.org_phone || "—") + "\n" +
    "Rahbar: " + esc(row.org_boss || "—") + "\n" +
    "Sana: " + esc(new Date(row.created_at).toLocaleString("uz-UZ")) + "\n" +
    "To'ldirilgan: " + row.answered_count + " / " + row.total_count +
    "\n\n📄 To'liq javoblar — pastdagi faylda:";

  await sendMessage(token, chatId, summary, {
    inline_keyboard: [[{ text: "🔙 Ro'yxatga qaytish", callback_data: "adm:list:0" }]],
  });

  const text = formatSubmissionText(row);
  await sendDocumentText(token, chatId, safeFileName(row.org_name) + ".txt", text);
}

/* ---------- asosiy handler ---------- */

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

  try {
    const cq = update && update.callback_query;
    if (cq) {
      const chatId = cq.message && cq.message.chat && cq.message.chat.id;
      const data = cq.data || "";
      await answerCallbackQuery(token, cq.id);

      if (chatId && isAdmin(chatId)) {
        if (data.startsWith("adm:list:")) {
          await sendAdminList(token, chatId, Number(data.slice("adm:list:".length)) || 0);
        } else if (data.startsWith("adm:sub:")) {
          await sendAdminDetail(token, chatId, data.slice("adm:sub:".length));
        }
      }
      res.status(200).json({ ok: true });
      return;
    }

    const msg = update && update.message;
    const chatId = msg && msg.chat && msg.chat.id;
    const text = (msg && msg.text) || "";

    if (!chatId) {
      res.status(200).json({ ok: true });
      return;
    }

    if (text.startsWith("/admin")) {
      if (isAdmin(chatId)) {
        await sendAdminList(token, chatId, 0);
      } else {
        await sendMessage(token, chatId, "Bu buyruq faqat admin uchun.");
      }
    } else if (text.startsWith("/start")) {
      await sendMessage(
        token,
        chatId,
        "👋 Assalomu alaykum!\n\nBog'cha faoliyati bo'yicha qisqa so'rovnomaga taklif qilamiz — atigi 15 daqiqa vaqtingizni oladi.",
        { inline_keyboard: [[{ text: "📝 So'rovnomani boshlash", url: siteUrl }]] }
      );
    } else {
      await sendMessage(
        token,
        chatId,
        "So'rovnomani boshlash uchun /start buyrug'ini yuboring.",
        { inline_keyboard: [[{ text: "📝 So'rovnomani boshlash", url: siteUrl }]] }
      );
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: false, error: "send_failed" });
  }
}
