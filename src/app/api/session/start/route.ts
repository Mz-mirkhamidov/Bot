import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { readValidatedInitData } from "@/lib/telegram-auth";
import type { SessionBlockData, SessionStartResponse } from "@/types/session";

const bodySchema = z.object({
  token: z.string().min(8).max(64),
});

export async function POST(req: Request) {
  if (readValidatedInitData(req) === "invalid") {
    return NextResponse.json({ error: "invalid_init_data" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { token } = parsed.data;

  const { data: session } = await supabase
    .from("sessions")
    .select("id, status, current_question, started_at, completed_at, questionnaire_id, respondent_id")
    .eq("token", token)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const isFirstOpen = session.status === "created";
  const status = isFirstOpen ? "in_progress" : session.status;
  const startedAt = isFirstOpen ? new Date().toISOString() : session.started_at;

  // Bir-biriga bog'liq bo'lmagan so'rovlarni parallel yuborish — ketma-ket
  // bajarilganda har bir so'rov tarmoq kechikishini qo'shib boraveradi.
  const [{ data: respondent }, { data: questionnaire }, { data: blocks }, { data: answers }] = await Promise.all([
    supabase.from("respondents").select("full_name, org_name").eq("id", session.respondent_id).single(),
    supabase.from("questionnaires").select("title").eq("id", session.questionnaire_id).single(),
    supabase
      .from("question_blocks")
      .select("id, code, title, description, order_index")
      .eq("questionnaire_id", session.questionnaire_id)
      .order("order_index"),
    supabase.from("answers").select("question_id, text, skipped, is_edited").eq("session_id", session.id),
    ...(isFirstOpen
      ? [
          supabase.from("sessions").update({ status, started_at: startedAt }).eq("id", session.id),
          supabase.from("events").insert({ session_id: session.id, type: "session_opened" }),
        ]
      : []),
  ]);

  const blockIds = (blocks ?? []).map((b) => b.id);

  const { data: questions } = await supabase
    .from("questions")
    .select("id, block_id, number, order_index, text, hint, type, options, allow_voice, is_key")
    .in("block_id", blockIds.length > 0 ? blockIds : ["00000000-0000-0000-0000-000000000000"])
    .order("order_index");

  const questionNumberById = new Map<string, number>();
  for (const q of questions ?? []) {
    questionNumberById.set(q.id, q.number);
  }

  const answersByNumber: SessionStartResponse["answers"] = {};
  for (const a of answers ?? []) {
    const number = questionNumberById.get(a.question_id);
    if (number === undefined) continue;
    answersByNumber[number] = {
      text: a.text,
      skipped: a.skipped,
      isEdited: a.is_edited,
    };
  }

  const responseBlocks: SessionBlockData[] = (blocks ?? []).map((b) => ({
    code: b.code,
    title: b.title,
    description: b.description,
    questions: (questions ?? [])
      .filter((q) => q.block_id === b.id)
      .map((q) => ({
        id: q.id,
        number: q.number,
        text: q.text,
        hint: q.hint,
        type: q.type,
        options: (q.options as string[] | null) ?? null,
        allowVoice: q.allow_voice,
        isKey: q.is_key,
      })),
  }));

  const response: SessionStartResponse = {
    session: {
      status,
      currentQuestion: session.current_question ?? 1,
      startedAt,
      completedAt: session.completed_at,
    },
    respondent: {
      fullName: respondent?.full_name ?? "",
      orgName: respondent?.org_name ?? null,
    },
    questionnaire: {
      title: questionnaire?.title ?? "",
    },
    blocks: responseBlocks,
    answers: answersByNumber,
  };

  return NextResponse.json(response);
}
