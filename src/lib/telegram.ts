// Telegram Bot API bilan minimal ishlash (grammy webhook'siz, oddiy fetch orqali).
// M3'da to'liq bot (grammy) qo'shilganda bu yerdagi yuborish funksiyasi saqlanib qoladi.

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendTelegramMessage(chatId: string | number, text: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  }).catch(() => {
    // Bildirishnoma yetkazilmasa ham asosiy oqim to'xtamasligi kerak.
  });
}

export async function notifyAdmins(text: string): Promise<void> {
  const adminIds = (process.env.ADMIN_TELEGRAM_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  await Promise.all(adminIds.map((id) => sendTelegramMessage(id, text)));
}

export function formatSessionCompletedMessage(params: {
  fullName: string;
  orgName: string | null;
  answeredCount: number;
  totalCount: number;
}): string {
  const { fullName, orgName, answeredCount, totalCount } = params;
  const org = orgName ? ` (${escapeHtml(orgName)})` : "";
  return `✅ <b>${escapeHtml(fullName)}</b>${org} so'rovnomani tugatdi — ${answeredCount}/${totalCount}`;
}
