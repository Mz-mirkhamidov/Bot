import { NextResponse } from "next/server";
import { z } from "zod";
import { readValidatedInitData } from "@/lib/telegram-auth";
import { getSessionByToken, completeSession } from "@/lib/sessionFlow";

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

  const session = await getSessionByToken(token);
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await completeSession(session);

  return NextResponse.json({ ok: true });
}
