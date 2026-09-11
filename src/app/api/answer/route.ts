import { NextResponse } from "next/server";
import { z } from "zod";
import { readValidatedInitData } from "@/lib/telegram-auth";
import { getSessionByToken, getQuestionByNumber, saveAnswerAndAdvance } from "@/lib/sessionFlow";

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

  const session = await getSessionByToken(token);
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (session.status === "completed") {
    return NextResponse.json({ error: "session_completed" }, { status: 409 });
  }

  const question = await getQuestionByNumber(number);
  if (!question) {
    return NextResponse.json({ error: "question_not_found" }, { status: 404 });
  }

  await saveAnswerAndAdvance(session, question, text ?? "", skipped);

  return NextResponse.json({ ok: true });
}
