import { supabase } from "@/lib/supabase";
import { notifyAdmins, formatSessionCompletedMessage, sessionDetailKeyboard } from "@/lib/telegram";
import type { Database } from "@/types";

export type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
export type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];

export const TOTAL_QUESTIONS = 45;

export async function getSessionByToken(token: string): Promise<SessionRow | null> {
  const { data } = await supabase.from("sessions").select("*").eq("token", token).maybeSingle();
  return data ?? null;
}

export async function getSessionByChatId(chatId: number): Promise<SessionRow | null> {
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("telegram_chat_id", chatId)
    .neq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function getQuestionByNumber(number: number): Promise<QuestionRow | null> {
  const { data } = await supabase.from("questions").select("*").eq("number", number).maybeSingle();
  return data ?? null;
}

// Berilgan savol qaysi blokdan boshlanishini aniqlash uchun — blok kirish
// xabarini faqat blokning birinchi savolida ko'rsatish kerak.
export async function getBlockForQuestion(
  question: QuestionRow
): Promise<{ code: string; title: string; description: string | null; isFirstInBlock: boolean } | null> {
  const { data: block } = await supabase
    .from("question_blocks")
    .select("code, title, description")
    .eq("id", question.block_id)
    .maybeSingle();
  if (!block) return null;

  const { data: firstInBlock } = await supabase
    .from("questions")
    .select("id")
    .eq("block_id", question.block_id)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  return { ...block, isFirstInBlock: firstInBlock?.id === question.id };
}

export type SaveAnswerResult = {
  nextNumber: number;
  completed: boolean;
};

// `/api/answer` va bot-chat oqimi ikkalasi ham shu funksiyani ishlatadi —
// javobni saqlash, is_edited hisoblash va sessiyani oldinga surish bir joyda.
export async function saveAnswerAndAdvance(
  session: SessionRow,
  question: QuestionRow,
  text: string,
  skipped: boolean
): Promise<SaveAnswerResult> {
  const trimmedText = text.trim();
  const isSkipped = skipped || trimmedText.length === 0;

  const { data: existing } = await supabase
    .from("answers")
    .select("transcript")
    .eq("session_id", session.id)
    .eq("question_id", question.id)
    .maybeSingle();

  const isEdited = !!existing?.transcript && trimmedText !== existing.transcript;

  await supabase.from("answers").upsert(
    {
      session_id: session.id,
      question_id: question.id,
      text: trimmedText.length > 0 ? trimmedText : null,
      skipped: isSkipped,
      is_edited: isEdited,
    },
    { onConflict: "session_id,question_id" }
  );

  const nextNumber = Math.min(question.number + 1, TOTAL_QUESTIONS + 1);

  await supabase
    .from("sessions")
    .update({
      current_question: nextNumber,
      status: session.status === "created" ? "in_progress" : session.status,
    })
    .eq("id", session.id);

  await supabase.from("events").insert({
    session_id: session.id,
    type: "answer_saved",
    payload: { number: question.number, skipped: isSkipped },
  });

  return { nextNumber, completed: nextNumber > TOTAL_QUESTIONS };
}

// `/api/session/complete` va bot-chat oqimi ikkalasi ham shu funksiyani
// ishlatadi — sessiyani yakunlash va adminlarga xabar berish bir joyda.
export async function completeSession(session: SessionRow): Promise<void> {
  if (session.status === "completed") return;

  await supabase
    .from("sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", session.id);

  await supabase.from("events").insert({ session_id: session.id, type: "completed" });

  const { data: blocks } = await supabase
    .from("question_blocks")
    .select("id")
    .eq("questionnaire_id", session.questionnaire_id);
  const blockIds = blocks?.map((b) => b.id) ?? [];

  const [{ data: respondent }, { count: totalCount }, { count: answeredCount }] = await Promise.all([
    supabase.from("respondents").select("full_name, org_name").eq("id", session.respondent_id).single(),
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .in("block_id", blockIds.length > 0 ? blockIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("answers")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id)
      .eq("skipped", false),
  ]);

  if (respondent) {
    await notifyAdmins(
      formatSessionCompletedMessage({
        fullName: respondent.full_name,
        orgName: respondent.org_name,
        answeredCount: answeredCount ?? 0,
        totalCount: totalCount ?? TOTAL_QUESTIONS,
      }),
      sessionDetailKeyboard(session.id)
    );
  }
}
