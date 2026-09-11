import { Bot, InlineKeyboard } from "grammy";
import { isAdminUserId } from "@/lib/telegram-auth";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN muhit o'zgaruvchisi to'ldirilmagan");
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

// botInfo aniq berilgan — shunda grammy ishga tushganda Telegram'ga getMe
// so'rovini yubormaydi (har bir serverless cold start uchun qo'shimcha
// tarmoq so'rovidan qochish uchun tavsiya etiladi).
export const bot = new Bot(token, {
  botInfo: {
    id: Number(token.split(":")[0]),
    is_bot: true,
    first_name: "Suhbat",
    username: process.env.TELEGRAM_BOT_USERNAME ?? "",
    can_join_groups: true,
    can_read_all_group_messages: false,
    supports_inline_queries: false,
    can_connect_to_business: false,
    has_main_web_app: true,
    has_topics_enabled: false,
    allows_users_to_create_topics: false,
    can_manage_bots: false,
    supports_join_request_queries: false,
  },
});

bot.command("start", async (ctx) => {
  const param = ctx.match?.toString().trim();

  if (param) {
    const keyboard = new InlineKeyboard().webApp("Boshlash", `${appUrl}/s/${param}`);
    await ctx.reply(
      "Assalomu alaykum! Sizga so'rovnoma havolasi yuborildi — pastdagi tugmani bosing.",
      { reply_markup: keyboard }
    );
    return;
  }

  const keyboard = new InlineKeyboard().webApp("Ochish", appUrl);
  await ctx.reply(
    "Assalomu alaykum! Bu — bog'cha faoliyati bo'yicha so'rovnoma boti.",
    { reply_markup: keyboard }
  );
});

bot.command("admin", async (ctx) => {
  if (!isAdminUserId(ctx.from?.id)) return;
  const keyboard = new InlineKeyboard().webApp("Admin panel", `${appUrl}/admin`);
  await ctx.reply("Admin panel:", { reply_markup: keyboard });
});
