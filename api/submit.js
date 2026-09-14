// Vercel serverless function — so'rovnoma javoblarini Telegramga yuboradi.
// Kerakli muhit o'zgaruvchilari (Vercel > Settings > Environment Variables):
//   TELEGRAM_BOT_TOKEN  — @BotFather bergan token
//   TELEGRAM_CHAT_ID    — javoblar tushadigan chat (sizning Telegram ID'ingiz)

const TG = "https://api.telegram.org/bot";
const MAX = 3800; // Telegram chegarasi 4096 — zaxira bilan

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    res.status(200).json({ ok: false, error: "not_configured" });
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

  try {
    await send(token, chatId, head);
    const parts = chunk(body, MAX);
    for (let i = 0; i < parts.length; i++) {
      await send(token, chatId, parts[i]);
    }
    const safeName =
      String(org.name || "sorovnoma").replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 40) ||
      "sorovnoma";
    await sendJson(token, chatId, safeName + ".json", data);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: false, error: "send_failed" });
  }
}
