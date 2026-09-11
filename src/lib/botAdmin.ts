import { Bot, InlineKeyboard, InputFile, Context } from "grammy";
import { isAdminUserId } from "@/lib/telegram-auth";
import { escapeHtml } from "@/lib/htmlEscape";
import { supabase } from "@/lib/supabase";
import { listSessions, getSessionDetail, createSession, type NewSessionDraft } from "@/lib/adminFlow";
import { generateSessionSummary } from "@/lib/gemini";
import type { SessionStatus } from "@/types/session";
import type { AdminSessionDetail } from "@/types/admin";

const STATUS_LABEL: Record<SessionStatus, string> = {
  created: "Yaratilgan",
  in_progress: "Jarayonda",
  completed: "Tugallangan",
  abandoned: "Tashlab ketilgan",
};
const STATUS_EMOJI: Record<SessionStatus, string> = {
  created: "🆕",
  in_progress: "🔵",
  completed: "✅",
  abandoned: "⚪",
};
const ORG_TYPE_LABEL: Record<string, string> = {
  subsidized: "Subsidiyali",
  non_subsidized: "Subsidiyasiz",
  unknown: "Noma'lum",
  other: "Boshqa",
};

// ============ Sessiyalar ro'yxati va tafsiloti ============

function adminMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text("📋 Sessiyalar", "adm:list").row().text("+ Yangi sessiya", "adm:new");
}

async function sendAdminMenu(ctx: Context) {
  await ctx.reply("🗂 Admin panel", { reply_markup: adminMenuKeyboard() });
}

async function sendSessionList(ctx: Context) {
  const sessions = await listSessions();
  const recent = sessions.slice(0, 15);
  if (recent.length === 0) {
    await ctx.reply("Sessiyalar topilmadi.", { reply_markup: new InlineKeyboard().text("◀️ Orqaga", "adm:menu") });
    return;
  }
  const kb = new InlineKeyboard();
  for (const s of recent) {
    const label = `${STATUS_EMOJI[s.status]} ${s.respondent.fullName} (${s.answeredCount}/${s.totalCount})`;
    kb.text(label.slice(0, 64), `adm:view:${s.id}`).row();
  }
  kb.text("+ Yangi sessiya", "adm:new");
  const note = sessions.length > 15 ? `\n\n(oxirgi 15 ta, jami ${sessions.length})` : "";
  await ctx.reply(`📋 Sessiyalar${note}`, { reply_markup: kb });
}

function sessionSummaryText(detail: AdminSessionDetail): string {
  const allQuestions = detail.blocks.flatMap((b) => b.questions);
  const answered = allQuestions.filter((q) => !q.skipped && q.answerText).length;
  const flagged = allQuestions.filter((q) => q.flag);
  const flagEmoji: Record<string, string> = { green: "🟢", red: "🔴", star: "⭐" };

  let text = `<b>${escapeHtml(detail.respondent.fullName)}</b>`;
  if (detail.respondent.orgName) text += ` (${escapeHtml(detail.respondent.orgName)})`;
  text += `\n${STATUS_LABEL[detail.session.status]} · ${answered}/${allQuestions.length}`;
  if (detail.respondent.phone) text += `\n📞 ${escapeHtml(detail.respondent.phone)}`;

  if (flagged.length > 0) {
    text += `\n\n<b>Belgilangan javoblar:</b>`;
    for (const q of flagged) {
      text += `\n${flagEmoji[q.flag ?? ""] ?? ""} ${q.number}. ${escapeHtml(q.answerText ?? "—")}`;
    }
  }
  return text;
}

async function sendSessionView(ctx: Context, sessionId: string) {
  const detail = await getSessionDetail(sessionId);
  if (!detail) {
    await ctx.reply("Sessiya topilmadi.");
    return;
  }
  const hasAudio = detail.blocks.some((b) => b.questions.some((q) => q.audioPath));
  const kb = new InlineKeyboard().text("📄 Barcha javoblar", `adm:full:${sessionId}`).row();
  kb.text("🧠 AI xulosa", `adm:sum:${sessionId}`);
  if (hasAudio) kb.text("🎧 Ovozlar", `adm:voice:${sessionId}`);
  kb.row().text("◀️ Ro'yxatga", "adm:list");
  await ctx.reply(sessionSummaryText(detail), { parse_mode: "HTML", reply_markup: kb });
}

async function sendFullAnswers(ctx: Context, sessionId: string) {
  const detail = await getSessionDetail(sessionId);
  if (!detail) return;
  for (const block of detail.blocks) {
    let text = `<b>${escapeHtml(block.code)}. ${escapeHtml(block.title)}</b>\n\n`;
    for (const q of block.questions) {
      const answer = q.skipped || !q.answerText ? "—" : escapeHtml(q.answerText);
      const line = `<b>${q.number}.</b> ${escapeHtml(q.text)}\n${answer}\n\n`;
      if ((text + line).length > 3800) {
        await ctx.reply(text, { parse_mode: "HTML" });
        text = "";
      }
      text += line;
    }
    if (text.trim()) await ctx.reply(text, { parse_mode: "HTML" });
  }
}

async function sendAiSummary(ctx: Context, sessionId: string) {
  const detail = await getSessionDetail(sessionId);
  if (!detail) return;

  let summary = detail.summary.aiSummary;
  if (!summary) {
    await ctx.reply("🧠 Xulosa tayyorlanmoqda, biroz kuting...");
    const qaPairs = detail.blocks
      .flatMap((b) => b.questions)
      .filter((q) => !q.skipped && q.answerText)
      .map((q) => ({ number: q.number, text: q.text, answer: q.answerText as string }));
    if (qaPairs.length === 0) {
      await ctx.reply("Javoblar yo'q — xulosa chiqarib bo'lmaydi.");
      return;
    }
    summary = await generateSessionSummary(qaPairs);
    if (!summary) {
      await ctx.reply("Xulosa chiqmadi. Birozdan keyin qayta urinib ko'ring.");
      return;
    }
    await supabase
      .from("session_summaries")
      .upsert(
        { session_id: sessionId, ai_summary: summary, ai_generated_at: new Date().toISOString() },
        { onConflict: "session_id" }
      );
  }

  let text = `<b>🧠 AI xulosa</b>\n\n<b>Eng katta muammo:</b>\n${escapeHtml(summary.biggest_pain || "—")}`;
  if (summary.money_at_risk) text += `\n\n💰 <b>Xavf ostidagi pul:</b> ${escapeHtml(summary.money_at_risk)}`;
  if (summary.green_flags?.length) text += `\n\n🟢 ${summary.green_flags.map(escapeHtml).join("\n🟢 ")}`;
  if (summary.red_flags?.length) text += `\n\n🔴 ${summary.red_flags.map(escapeHtml).join("\n🔴 ")}`;
  if (summary.missing_info?.length) {
    text += `\n\n<b>Aniqlanmagan:</b>\n${summary.missing_info.map(escapeHtml).join("\n")}`;
  }
  await ctx.reply(text, { parse_mode: "HTML" });
}

async function sendVoiceList(ctx: Context, sessionId: string) {
  const detail = await getSessionDetail(sessionId);
  if (!detail) return;
  const withAudio = detail.blocks.flatMap((b) => b.questions).filter((q) => q.audioPath);
  if (withAudio.length === 0) {
    await ctx.reply("Ovoz yozuvlari yo'q.");
    return;
  }
  const kb = new InlineKeyboard();
  for (const q of withAudio) kb.text(`🎧 ${q.number}-savol`, `adm:pv:${sessionId}:${q.number}`).row();
  await ctx.reply("Qaysi javobni tinglaysiz?", { reply_markup: kb });
}

async function playVoice(ctx: Context, sessionId: string, number: number) {
  const detail = await getSessionDetail(sessionId);
  const question = detail?.blocks.flatMap((b) => b.questions).find((q) => q.number === number);
  if (!question?.audioPath) {
    await ctx.reply("Ovoz topilmadi.");
    return;
  }
  const { data, error } = await supabase.storage.from("voice").download(question.audioPath);
  if (error || !data) {
    await ctx.reply("Ovozni yuklab bo'lmadi.");
    return;
  }
  const buffer = Buffer.from(await data.arrayBuffer());
  const ext = question.audioPath.split(".").pop() ?? "ogg";
  await ctx.replyWithAudio(new InputFile(buffer, `savol-${number}.${ext}`), {
    caption: `${number}-savolga javob${question.transcript ? `\n\n${question.transcript}` : ""}`,
  });
}

// ============ Yangi sessiya — bosqichma-bosqich forma ============

type DraftStep = "fullName" | "orgName" | "phone" | "childrenCount" | "notes" | "orgType" | "mode";
type DraftData = Partial<NewSessionDraft>;

async function getDraft(chatId: number): Promise<{ step: DraftStep; data: DraftData } | null> {
  const { data } = await supabase.from("admin_drafts").select("step, data").eq("chat_id", chatId).maybeSingle();
  if (!data) return null;
  return { step: data.step as DraftStep, data: (data.data as DraftData) ?? {} };
}

async function setDraft(chatId: number, step: DraftStep, data: DraftData): Promise<void> {
  await supabase.from("admin_drafts").upsert({ chat_id: chatId, step, data, updated_at: new Date().toISOString() });
}

async function clearDraft(chatId: number): Promise<void> {
  await supabase.from("admin_drafts").delete().eq("chat_id", chatId);
}

const cancelKeyboard = () => new InlineKeyboard().text("❌ Bekor qilish", "adm:cancel");
const skipCancelKeyboard = () =>
  new InlineKeyboard().text("⏭ O'tkazib yuborish", "adm:skip").row().text("❌ Bekor qilish", "adm:cancel");

async function startNewSessionDraft(ctx: Context) {
  if (!ctx.chat) return;
  await setDraft(ctx.chat.id, "fullName", {});
  await ctx.reply("🆕 Yangi sessiya\n\nRespondentning ismi? (majburiy)", { reply_markup: cancelKeyboard() });
}

async function sendOrgTypeButtons(ctx: Context) {
  const kb = new InlineKeyboard();
  for (const [value, label] of Object.entries(ORG_TYPE_LABEL)) {
    kb.text(label, `adm:orgtype:${value}`).row();
  }
  kb.text("❌ Bekor qilish", "adm:cancel");
  await ctx.reply("Bog'cha turi?", { reply_markup: kb });
}

async function sendModeButtons(ctx: Context) {
  const kb = new InlineKeyboard()
    .text("O'zi to'ldiradi", "adm:mode:self")
    .row()
    .text("Suhbat rejimi", "adm:mode:interviewer")
    .row()
    .text("❌ Bekor qilish", "adm:cancel");
  await ctx.reply("Rejim?", { reply_markup: kb });
}

async function finishDraft(ctx: Context, chatId: number, data: DraftData) {
  if (!data.fullName || !data.mode) {
    await ctx.reply("Xato: ism yoki rejim yo'q. Qaytadan boshlang.");
    await clearDraft(chatId);
    return;
  }
  const session = await createSession(data as NewSessionDraft);
  await clearDraft(chatId);
  if (!session) {
    await ctx.reply("Sessiya yaratilmadi. Qaytadan urinib ko'ring.");
    return;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  await ctx.reply(
    `✅ Sessiya yaratildi!\n\nHavola (respondentga yuboring):\n${appUrl}/s/${session.token}`,
    { reply_markup: adminMenuKeyboard() }
  );
}

async function handleDraftText(ctx: Context, chatId: number, text: string, draft: { step: DraftStep; data: DraftData }) {
  const { step, data } = draft;

  if (step === "fullName") {
    if (!text) {
      await ctx.reply("Ism kiritilishi shart.", { reply_markup: cancelKeyboard() });
      return;
    }
    data.fullName = text;
    await setDraft(chatId, "orgName", data);
    await ctx.reply("Bog'cha nomi? (ixtiyoriy)", { reply_markup: skipCancelKeyboard() });
    return;
  }
  if (step === "orgName") {
    data.orgName = text;
    await setDraft(chatId, "phone", data);
    await ctx.reply("Telefon raqami? (ixtiyoriy)", { reply_markup: skipCancelKeyboard() });
    return;
  }
  if (step === "phone") {
    data.phone = text;
    await setDraft(chatId, "childrenCount", data);
    await ctx.reply("Bolalar soni? (ixtiyoriy)", { reply_markup: skipCancelKeyboard() });
    return;
  }
  if (step === "childrenCount") {
    const n = Number(text.replace(/[^\d]/g, ""));
    if (text && !Number.isNaN(n) && n > 0) data.childrenCount = n;
    await setDraft(chatId, "notes", data);
    await ctx.reply("Eslatma? (ixtiyoriy)", { reply_markup: skipCancelKeyboard() });
    return;
  }
  if (step === "notes") {
    data.notes = text;
    await setDraft(chatId, "orgType", data);
    await sendOrgTypeButtons(ctx);
    return;
  }
}

// ============ Ro'yxatdan o'tkazish ============

export function registerAdminHandlers(bot: Bot): void {
  bot.command("admin", async (ctx) => {
    if (!isAdminUserId(ctx.from?.id)) return;
    await sendAdminMenu(ctx);
  });

  bot.on("message:text", async (ctx, next) => {
    if (ctx.message.text.startsWith("/")) return next();
    if (!isAdminUserId(ctx.from?.id) || !ctx.chat) return next();

    const draft = await getDraft(ctx.chat.id);
    if (!draft) return next();

    await handleDraftText(ctx, ctx.chat.id, ctx.message.text.trim(), draft);
  });

  bot.on("callback_query:data", async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    if (!data.startsWith("adm:") || !ctx.chat) return next();
    if (!isAdminUserId(ctx.from?.id)) {
      await ctx.answerCallbackQuery({ text: "Ruxsat yo'q." });
      return;
    }

    const chatId = ctx.chat.id;
    const [, action, ...rest] = data.split(":");
    await ctx.answerCallbackQuery();

    if (action === "menu") {
      await sendAdminMenu(ctx);
      return;
    }
    if (action === "list") {
      await sendSessionList(ctx);
      return;
    }
    if (action === "view") {
      await sendSessionView(ctx, rest[0]);
      return;
    }
    if (action === "full") {
      await sendFullAnswers(ctx, rest[0]);
      return;
    }
    if (action === "sum") {
      await sendAiSummary(ctx, rest[0]);
      return;
    }
    if (action === "voice") {
      await sendVoiceList(ctx, rest[0]);
      return;
    }
    if (action === "pv") {
      await playVoice(ctx, rest[0], Number(rest[1]));
      return;
    }
    if (action === "new") {
      await startNewSessionDraft(ctx);
      return;
    }
    if (action === "cancel") {
      await clearDraft(chatId);
      await ctx.reply("Bekor qilindi.", { reply_markup: adminMenuKeyboard() });
      return;
    }
    if (action === "skip") {
      const draft = await getDraft(chatId);
      if (!draft) return;
      await handleDraftText(ctx, chatId, "", draft);
      return;
    }
    if (action === "orgtype") {
      const draft = await getDraft(chatId);
      if (!draft || draft.step !== "orgType") return;
      draft.data.orgType = rest[0] as NewSessionDraft["orgType"];
      await setDraft(chatId, "mode", draft.data);
      await sendModeButtons(ctx);
      return;
    }
    if (action === "mode") {
      const draft = await getDraft(chatId);
      if (!draft || draft.step !== "mode") return;
      draft.data.mode = rest[0] as NewSessionDraft["mode"];
      await finishDraft(ctx, chatId, draft.data);
      return;
    }
  });
}
