import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { readValidatedInitData } from "@/lib/telegram-auth";

const MAX_SIZE_BYTES = 20 * 1024 * 1024;

const fieldsSchema = z.object({
  token: z.string().min(8).max(64),
  number: z.coerce.number().int().min(1).max(45),
});

function extensionFromMimeType(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("m4a")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

export async function POST(req: Request) {
  if (readValidatedInitData(req) === "invalid") {
    return NextResponse.json({ error: "invalid_init_data" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const parsed = fieldsSchema.safeParse({
    token: formData.get("token"),
    number: formData.get("number"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { token, number } = parsed.data;

  const audio = formData.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: "no_audio" }, { status: 400 });
  }
  if (audio.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

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

  const ext = extensionFromMimeType(audio.type || "audio/webm");
  const path = `${session.id}/${question.id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("voice")
    .upload(path, audio, { contentType: audio.type || "audio/webm", upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
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

  await supabase.from("events").insert({
    session_id: session.id,
    type: "voice_recorded",
    payload: { number },
  });

  return NextResponse.json({ ok: true, audioPath: path });
}
