import { Bot, InlineKeyboard } from "grammy";
import { isAdminUserId } from "@/lib/telegram-auth";
import { escapeHtml } from "@/lib/telegram";
import { supabase } from "@/lib/supabase";
import { transcribeAndSaveAnswer } from "@/lib/voiceTranscription";
import {
  TOTAL_QUESTIONS,
  getSessionByToken,
  getSessionByChatId,
  getQuestionByNumber,
  getBlockForQuestion,
  saveAnswerAndAdvance,
  completeSession,
  type QuestionRow,
} from "@/lib/sessionFlow";

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

function buildQuestionKeyboard(question: QuestionRow): InlineKeyboard {
  if (question.type === "multi_choice") {
    return buildMultiChoiceKeyboard(question, []);
  }
  const kb = new InlineKeyboard();
  if (question.type === "yes_no") {
    kb.text("Ha", `sc|${question.number}|0`).text("Yo'q", `sc|${question.number}|1`).row();
  } else if (question.type === "single_choice") {
    const options = (question.options as string[] | null) ?? [];
    options.forEach((opt, i) => kb.text(opt, `sc|${question.number}|${i}`).row());
  }
  kb.text("⏭ O'tkazib yuborish", `sk|${question.number}`);
  return kb;
}

function buildMultiChoiceKeyboard(question: QuestionRow, selected: number[]): InlineKeyboard {
  const options = (question.options as string[] | null) ?? [];
  const selectedSet = new Set(selected);
  const csv = selected.join(",");
  const kb = new InlineKeyboard();
  options.forEach((opt, i) => {
    const mark = selectedSet.has(i) ? "✅ " : "";
    kb.text(`${mark}${opt}`, `mc|${question.number}|${csv}|${i}`).row();
  });
  kb.text("✔️ Tayyor", `mc|${question.number}|${csv}|done`).row();
  kb.text("⏭ O'tkazib yuborish", `sk|${question.number}`);
  return kb;
}

async function sendCurrentQuestion(chatId: number, sessionId: string): Promise<void> {
  const { data: session } = await supabase.from("sessions").select("*").eq("id", sessionId).maybeSingle();
  if (!session || session.status === "completed") return;

  const number = session.current_question && session.current_question >= 1 ? session.current_question : 1;
  if (number > TOTAL_QUESTIONS) {
    await completeSession(session);
    await bot.api.sendMessage(chatId, "✅ Barcha savollarga javob berdingiz! Rahmat.");
    return;
  }

  const question = await getQuestionByNumber(number);
  if (!question) return;

  const block = await getBlockForQuestion(question);
  if (block?.isFirstInBlock) {
    const desc = block.description ? `\n${escapeHtml(block.description)}` : "";
    await bot.api.sendMessage(chatId, `<b>${escapeHtml(block.code)}. ${escapeHtml(block.title)}</b>${desc}`, {
      parse_mode: "HTML",
    });
  }

  let text = `<b>${question.number}. ${escapeHtml(question.text)}</b>`;
  if (question.hint) text += `\n<i>${escapeHtml(question.hint)}</i>`;
  if (question.allow_voice) text += `\n\n🎙 Ovozli xabar yuborsangiz ham bo'ladi.`;

  await bot.api.sendMessage(chatId, text, {
    parse_mode: "HTML",
    reply_markup: buildQuestionKeyboard(question),
  });
}

async function finishOrContinue(
  chatId: number,
  sessionId: string,
  result: { nextNumber: number; completed: boolean }
): Promise<void> {
  if (!result.completed) {
    await sendCurrentQuestion(chatId, sessionId);
    return;
  }
  const { data: session } = await supabase.from("sessions").select("*").eq("id", sessionId).maybeSingle();
  if (session) await completeSession(session);
  await bot.api.sendMessage(
    chatId,
    "✅ Barcha savollarga javob berdingiz! Rahmat.\n\nJavoblaringizni ko'rib chiqish yoki tahrirlash uchun Mini App'ni ochishingiz mumkin."
  );
}

bot.command("start", async (ctx) => {
  const param = ctx.match?.toString().trim();

  if (param) {
    const session = await getSessionByToken(param);
    if (session && session.status !== "completed" && ctx.chat) {
      await supabase.from("sessions").update({ telegram_chat_id: ctx.chat.id }).eq("id", session.id);
      if (ctx.from) {
        await supabase
          .from("respondents")
          .update({ telegram_user_id: ctx.from.id })
          .eq("id", session.respondent_id);
      }
    }

    const keyboard = new InlineKeyboard().webApp("Boshlash", `${appUrl}/s/${param}`);
    await ctx.reply(
      "Assalomu alaykum! Sizga so'rovnoma havolasi yuborildi.\n\n" +
        "Pastdagi tugma orqali to'liq shaklda to'ldirishingiz mumkin, " +
        "YOKI shu yerda — chatda — javob yozib/aytib boraverishingiz mumkin. Hozir birinchi savolni yuboraman.",
      { reply_markup: keyboard }
    );

    if (session && session.status !== "completed" && ctx.chat) {
      await sendCurrentQuestion(ctx.chat.id, session.id);
    }
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

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();
  if (text.startsWith("/") || !ctx.chat) return;

  const session = await getSessionByChatId(ctx.chat.id);
  if (!session) return;

  const number = session.current_question ?? 1;
  if (number > TOTAL_QUESTIONS) return;
  const question = await getQuestionByNumber(number);
  if (!question) return;

  let answerText = text;
  if (question.type === "yes_no") {
    const normalized = text.toLowerCase();
    if (["ha", "+", "ya"].includes(normalized)) answerText = "Ha";
    else if (["yo'q", "yoq", "-", "yuq"].includes(normalized)) answerText = "Yo'q";
  }

  const result = await saveAnswerAndAdvance(session, question, answerText, false);
  await finishOrContinue(ctx.chat.id, session.id, result);
});

bot.on("message:voice", async (ctx) => {
  if (!ctx.chat) return;
  const session = await getSessionByChatId(ctx.chat.id);
  if (!session) return;

  const number = session.current_question ?? 1;
  if (number > TOTAL_QUESTIONS) return;
  const question = await getQuestionByNumber(number);
  if (!question) return;
  if (!question.allow_voice) {
    await ctx.reply("Bu savol uchun ovozli javob mumkin emas — matn bilan yozing.");
    return;
  }

  const file = await ctx.getFile();
  const fileRes = await fetch(`https://api.telegram.org/file/bot${token}/${file.file_path}`);
  const buffer = Buffer.from(await fileRes.arrayBuffer());

  const path = `${session.id}/${question.id}.ogg`;
  const { error: uploadError } = await supabase.storage
    .from("voice")
    .upload(path, buffer, { contentType: "audio/ogg", upsert: true });
  if (uploadError) {
    await ctx.reply("Ovozni saqlab bo'lmadi. Qayta urinib ko'ring.");
    return;
  }

  await supabase.from("answers").upsert(
    {
      session_id: session.id,
      question_id: question.id,
      audio_path: path,
      transcript: null,
      text: null,
      is_edited: false,
      skipped: false,
    },
    { onConflict: "session_id,question_id" }
  );
  await supabase.from("events").insert({ session_id: session.id, type: "voice_recorded", payload: { number } });

  const waitMsg = await ctx.reply("🎙 Ovoz qabul qilindi, matnga o'girilmoqda...");
  const result = await transcribeAndSaveAnswer(session.id, question.id);
  if (ctx.chat) await bot.api.deleteMessage(ctx.chat.id, waitMsg.message_id).catch(() => {});

  if (!result.ok) {
    await ctx.reply(
      "Matnga o'girib bo'lmadi, keyinroq urinib ko'ramiz. Ovozingiz saqlandi. Xohlasangiz matn bilan yozing."
    );
    return;
  }

  await supabase.from("events").insert({ session_id: session.id, type: "transcribed", payload: { number } });
  await ctx.reply(`📝 <b>Tanildi:</b> ${escapeHtml(result.transcript)}`, { parse_mode: "HTML" });

  const advance = await saveAnswerAndAdvance(session, question, result.transcript, false);
  await finishOrContinue(ctx.chat.id, session.id, advance);
});

bot.on("callback_query:data", async (ctx) => {
  const chatId = ctx.chat?.id;
  const data = ctx.callbackQuery.data;
  if (!chatId) {
    await ctx.answerCallbackQuery();
    return;
  }

  const session = await getSessionByChatId(chatId);
  if (!session) {
    await ctx.answerCallbackQuery({ text: "Sessiya topilmadi." });
    return;
  }

  const [kind, numberStr, ...rest] = data.split("|");
  const number = Number(numberStr);
  if (session.current_question !== number) {
    await ctx.answerCallbackQuery({ text: "Bu savol allaqachon o'tkazilgan." });
    return;
  }

  const question = await getQuestionByNumber(number);
  if (!question) {
    await ctx.answerCallbackQuery();
    return;
  }

  if (kind === "sk") {
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup().catch(() => {});
    const result = await saveAnswerAndAdvance(session, question, "", true);
    await finishOrContinue(chatId, session.id, result);
    return;
  }

  if (kind === "sc") {
    const optionIndex = Number(rest[0]);
    const options = question.type === "yes_no" ? ["Ha", "Yo'q"] : ((question.options as string[] | null) ?? []);
    const label = options[optionIndex];
    if (label === undefined) {
      await ctx.answerCallbackQuery();
      return;
    }
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup().catch(() => {});
    const result = await saveAnswerAndAdvance(session, question, label, false);
    await finishOrContinue(chatId, session.id, result);
    return;
  }

  if (kind === "mc") {
    const selectedCsv = rest[0] ?? "";
    const action = rest[1];
    const options = (question.options as string[] | null) ?? [];
    const selected = new Set(
      selectedCsv
        .split(",")
        .filter(Boolean)
        .map((n) => Number(n))
    );

    if (action === "done") {
      await ctx.answerCallbackQuery();
      await ctx.editMessageReplyMarkup().catch(() => {});
      const labels = [...selected]
        .sort((a, b) => a - b)
        .map((i) => options[i])
        .filter((v): v is string => !!v);
      const result = await saveAnswerAndAdvance(session, question, labels.join(", "), labels.length === 0);
      await finishOrContinue(chatId, session.id, result);
      return;
    }

    const toggleIndex = Number(action);
    if (selected.has(toggleIndex)) selected.delete(toggleIndex);
    else selected.add(toggleIndex);
    await ctx.answerCallbackQuery();
    await ctx
      .editMessageReplyMarkup({ reply_markup: buildMultiChoiceKeyboard(question, [...selected]) })
      .catch(() => {});
    return;
  }

  await ctx.answerCallbackQuery();
});
