// Vercel serverless function — so'rovnoma javoblarini Supabase'ga saqlaydi
// va Telegramga qisqa xabar yuboradi.
//
// Kerakli muhit o'zgaruvchilari (Vercel > Settings > Environment Variables):
//   TELEGRAM_BOT_TOKEN         — @BotFather bergan token
//   TELEGRAM_CHAT_ID           — qisqa xabar tushadigan chat
//   SUPABASE_URL               — Supabase loyiha manzili
//   SUPABASE_SERVICE_ROLE_KEY  — Supabase service_role (maxfiy) kaliti
//   SITE_URL                   — admin panel havolasi uchun (ixtiyoriy)

import { sbInsert, supabaseConfigured } from "../lib/supabase.js";

const TG = "https://api.telegram.org/bot";
const MAX = 3800; // Telegram chegarasi 4096 — zaxira bilan
const DEFAULT_SITE_URL = "https://suhbat-omega.vercel.app";

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function chunk(text, size) {
  const out = [];
  let cur = "";
  for (const line of text.split("\n")) {
    if (cur.length + line.length + 1 > size) {
      if (cur) out.push(cur);
      cur = line.length > size ? line.slice(0, size) : line;
    } else {
      cur = cur ? cur + "\n" + line : line;
    }
  }
  if (cur) out.push(cur);
  return out.length ? out : ["(bo'sh)"];
}

async function send(token, chatId, html) {
  const r = await fetch(TG + token + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: html,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error("telegram " + r.status + " " + body.slice(0, 300));
  }
}

async function sendJson(token, chatId, name, obj) {
  try {
    const fd = new FormData();
    fd.append("chat_id", String(chatId));
    fd.append(
      "document",
      new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }),
      name
    );
    await fetch(TG + token + "/sendDocument", { method: "POST", body: fd });
  } catch (e) {
    // Fayl ketmasa ham matn ketgan — xato deb hisoblamaymiz.
  }
}

// Supabase sozlanmagan yoki yozib bo'lmagan hollar uchun zaxira yo'l:
// eski uslubda to'liq matnni Telegramga yuboradi, ma'lumot yo'qolmasin.
async function sendFullFallback(token, chatId, org, answers, answered, data) {
  const head =
    "🏫 <b>YANGI SO'ROVNOMA</b>\n\n" +
    "<b>Bog'cha:</b> " + esc(org.name || "—") + "\n" +
    "<b>Turi:</b> " + esc(org.type || "—") + "\n" +
    "<b>Manzil:</b> " + esc(org.addr || "—") + "\n" +
    "<b>Telefon:</b> " + esc(org.phone || "—") + "\n" +
    "<b>Rahbar:</b> " + esc(org.boss || "—") + "\n" +
    "<b>To'ldirilgan:</b> " + answered + " / " + answers.length;

  let body = "";
  for (const a of answers) {
    const q = esc(String(a.q || "").slice(0, 300));
    const ans = String(a.a || "").trim();
    body +=
      "\n<b>" + (a.n || "?") + ". " + q + "</b>\n" +
      (ans ? esc(ans.slice(0, 3000)) : "<i>— javob berilmagan —</i>") +
      "\n";
  }

  await send(token, chatId, head);
  for (const part of chunk(body, MAX)) await send(token, chatId, part);
  const safeName = String(org.name || "sorovnoma").replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 40) || "sorovnoma";
  await sendJson(token, chatId, safeName + ".json", data);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  let data = req.body;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch { data = null; }
  }
  if (!data || typeof data !== "object" || !Array.isArray(data.answers)) {
    res.status(400).json({ ok: false, error: "bad_payload" });
    return;
  }

  const org = data.org && typeof data.org === "object" ? data.org : {};
  const answers = data.answers.slice(0, 40);
  const answered = answers.filter((a) => a && String(a.a || "").trim()).length;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const siteUrl = process.env.SITE_URL || DEFAULT_SITE_URL;

  let savedToDb = false;
  if (supabaseConfigured()) {
    try {
      await sbInsert("bogcha_submissions", {
        org_name: org.name || null,
        org_type: org.type || null,
        org_addr: org.addr || null,
        org_phone: org.phone || null,
        org_boss: org.boss || null,
        answers,
        answered_count: answered,
        total_count: answers.length,
        meta: data.meta || null,
      });
      savedToDb = true;
    } catch (e) {
      savedToDb = false;
    }
  }

  if (!token || !chatId) {
    // Telegram sozlanmagan bo'lsa ham, bazaga yozilgan bo'lsa yetarli.
    res.status(200).json({ ok: savedToDb, error: savedToDb ? undefined : "not_configured" });
    return;
  }

  try {
    if (savedToDb) {
      const short =
        "🏫 <b>Yangi so'rovnoma</b>\n" +
        esc(org.name || "—") + " · " + esc(org.phone || "—") + "\n" +
        "To'ldirilgan: " + answered + " / " + answers.length + "\n\n" +
        "To'liq: " + esc(siteUrl) + "/admin/";
      await send(token, chatId, short);
    } else {
      await sendFullFallback(token, chatId, org, answers, answered, data);
    }
    res.status(200).json({ ok: true, savedToDb });
  } catch (e) {
    res.status(200).json({ ok: savedToDb, error: savedToDb ? undefined : "send_failed" });
  }
}
