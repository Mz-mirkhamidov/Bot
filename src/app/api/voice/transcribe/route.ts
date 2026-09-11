import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { readValidatedInitData } from "@/lib/telegram-auth";
import { transcribeAndSaveAnswer } from "@/lib/voiceTranscription";

const bodySchema = z.object({
  token: z.string().min(8).max(64),
  number: z.number().int().min(1).max(45),
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
  const { token, number } = parsed.data;

  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("token", token)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: question } = await supabase
    .from("questions")
    .select("id")
    .eq("number", number)
    .maybeSingle();

  if (!question) {
    return NextResponse.json({ error: "question_not_found" }, { status: 404 });
  }

  const result = await transcribeAndSaveAnswer(session.id, question.id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  await supabase.from("events").insert({
    session_id: session.id,
    type: "transcribed",
    payload: { number },
  });

  return NextResponse.json({ ok: true, transcript: result.transcript, text: result.text });
}
