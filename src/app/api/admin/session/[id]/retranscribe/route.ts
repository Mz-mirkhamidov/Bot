import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { getAdminUserId } from "@/lib/telegram-auth";
import { transcribeAndSaveAnswer } from "@/lib/voiceTranscription";

const bodySchema = z.object({
  number: z.number().int().min(1).max(45),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id: sessionId } = await params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { data: question } = await supabase
    .from("questions")
    .select("id")
    .eq("number", parsed.data.number)
    .maybeSingle();
  if (!question) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const result = await transcribeAndSaveAnswer(sessionId, question.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ ok: true, transcript: result.transcript });
}
