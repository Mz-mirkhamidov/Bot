import { InlineKeyboard } from "grammy";
import { bot } from "@/lib/bot";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  keyboard?: InlineKeyboard
): Promise<void> {
  await bot.api
    .sendMessage(chatId, text, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    })
    .catch(() => {
      // Bildirishnoma yetkazilmasa ham asosiy oqim to'xtamasligi kerak.
    });
}

export async function notifyAdmins(text: string, keyboard?: InlineKeyboard): Promise<void> {
  const adminIds = (process.env.ADMIN_TELEGRAM_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  await Promise.all(adminIds.map((id) => sendTelegramMessage(id, text, keyboard)));
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

export function sessionDetailKeyboard(sessionId: string): InlineKeyboard {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return new InlineKeyboard().webApp("Ko'rish", `${appUrl}/admin/session/${sessionId}`);
}
