import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { getAdminUserId } from "@/lib/telegram-auth";
import { generateSessionSummary } from "@/lib/gemini";

const bodySchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(req: Request) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { sessionId } = parsed.data;

  const { data: session } = await supabase
    .from("sessions")
    .select("id, questionnaire_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: blocks } = await supabase
    .from("question_blocks")
    .select("id")
    .eq("questionnaire_id", session.questionnaire_id);
  const blockIds = (blocks ?? []).map((b) => b.id);

  const { data: questions } = await supabase
    .from("questions")
    .select("id, number, text")
    .in("block_id", blockIds.length > 0 ? blockIds : ["00000000-0000-0000-0000-000000000000"])
    .order("number");

  const { data: answers } = await supabase
    .from("answers")
    .select("question_id, text, skipped")
    .eq("session_id", sessionId);

  const answerByQuestionId = new Map((answers ?? []).map((a) => [a.question_id, a]));

  const qaPairs = (questions ?? [])
    .map((q) => {
      const a = answerByQuestionId.get(q.id);
      if (!a || a.skipped || !a.text) return null;
      return { number: q.number, text: q.text, answer: a.text };
    })
    .filter((v): v is { number: number; text: string; answer: string } => v !== null);

  if (qaPairs.length === 0) {
    return NextResponse.json({ error: "no_answers" }, { status: 422 });
  }

  const summary = await generateSessionSummary(qaPairs);
  if (!summary) {
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  const now = new Date().toISOString();
  await supabase
    .from("session_summaries")
    .upsert(
      { session_id: sessionId, ai_summary: summary, ai_generated_at: now },
      { onConflict: "session_id" }
    );

  return NextResponse.json({ ok: true, summary, generatedAt: now });
}
