import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { readValidatedInitData } from "@/lib/telegram-auth";

const bodySchema = z.object({
  token: z.string().min(8).max(64),
  number: z.number().int().min(1).max(45),
  text: z.string().max(10000).optional(),
  skipped: z.boolean().optional().default(false),
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
  const { token, number, text, skipped } = parsed.data;

  const { data: session } = await supabase
    .from("sessions")
    .select("id, status")
    .eq("token", token)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (session.status === "completed") {
    return NextResponse.json({ error: "session_completed" }, { status: 409 });
  }

  const { data: question } = await supabase
    .from("questions")
    .select("id")
    .eq("number", number)
    .maybeSingle();

  if (!question) {
    return NextResponse.json({ error: "question_not_found" }, { status: 404 });
  }

  const trimmedText = text?.trim() ?? "";
  const isSkipped = skipped || trimmedText.length === 0;

  const { data: existing } = await supabase
    .from("answers")
    .select("transcript")
    .eq("session_id", session.id)
    .eq("question_id", question.id)
    .maybeSingle();

  // Transkriptdan olingan javob qo'lda o'zgartirilsa is_edited=true bo'ladi (TZ 8.3).
  const isEdited = !!existing?.transcript && trimmedText !== existing.transcript;

  const { error: upsertError } = await supabase.from("answers").upsert(
    {
      session_id: session.id,
      question_id: question.id,
      text: trimmedText.length > 0 ? trimmedText : null,
      skipped: isSkipped,
      is_edited: isEdited,
    },
    { onConflict: "session_id,question_id" }
  );

  if (upsertError) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  await supabase
    .from("sessions")
    .update({
      current_question: Math.min(number + 1, 46),
      status: session.status === "created" ? "in_progress" : session.status,
    })
    .eq("id", session.id);

  await supabase.from("events").insert({
    session_id: session.id,
    type: "answer_saved",
    payload: { number, skipped: isSkipped },
  });

  return NextResponse.json({ ok: true });
}
