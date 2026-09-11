import { supabase } from "@/lib/supabase";
import { transcribeAudio } from "@/lib/gemini";

function mimeTypeFromPath(path: string): string {
  if (path.endsWith(".webm")) return "audio/webm";
  if (path.endsWith(".mp4") || path.endsWith(".m4a")) return "audio/mp4";
  if (path.endsWith(".ogg")) return "audio/ogg";
  return "audio/webm";
}

export type TranscribeResult =
  | { ok: true; transcript: string; text: string }
  | { ok: false; error: "no_audio" | "download_failed" | "transcribe_failed" };

// Berilgan javobning ovoz faylini Gemini orqali matnga o'giradi va saqlaydi.
// Respondent tomonidan qo'lda tahrirlangan (is_edited) javob mavjud bo'lsa,
// `text`ni qayta yozib yubormaydi — faqat xom `transcript`ni yangilaydi.
export async function transcribeAndSaveAnswer(
  sessionId: string,
  questionId: string
): Promise<TranscribeResult> {
  const { data: answer } = await supabase
    .from("answers")
    .select("audio_path, is_edited")
    .eq("session_id", sessionId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (!answer?.audio_path) {
    return { ok: false, error: "no_audio" };
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from("voice")
    .download(answer.audio_path);

  if (downloadError || !file) {
    return { ok: false, error: "download_failed" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const transcript = await transcribeAudio(buffer, mimeTypeFromPath(answer.audio_path));

  if (transcript === null) {
    return { ok: false, error: "transcribe_failed" };
  }

  const update: { transcript: string; text?: string } = { transcript };
  if (!answer.is_edited) {
    update.text = transcript;
  }

  await supabase
    .from("answers")
    .update(update)
    .eq("session_id", sessionId)
    .eq("question_id", questionId);

  return { ok: true, transcript, text: answer.is_edited ? "" : transcript };
}
