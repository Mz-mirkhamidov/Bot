import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { getAdminUserId } from "@/lib/telegram-auth";

const querySchema = z.object({
  sessionId: z.string().uuid(),
  number: z.coerce.number().int().min(1).max(45),
});

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 soat (TZ 5.1)

export async function GET(req: Request) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    sessionId: searchParams.get("sessionId"),
    number: searchParams.get("number"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { sessionId, number } = parsed.data;

  const { data: question } = await supabase
    .from("questions")
    .select("id")
    .eq("number", number)
    .maybeSingle();
  if (!question) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: answer } = await supabase
    .from("answers")
    .select("audio_path")
    .eq("session_id", sessionId)
    .eq("question_id", question.id)
    .maybeSingle();

  if (!answer?.audio_path) {
    return NextResponse.json({ error: "no_audio" }, { status: 404 });
  }

  const { data: signed, error } = await supabase.storage
    .from("voice")
    .createSignedUrl(answer.audio_path, SIGNED_URL_TTL_SECONDS);

  if (error || !signed) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
