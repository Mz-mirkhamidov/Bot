import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserId } from "@/lib/telegram-auth";
import { createSession } from "@/lib/adminFlow";

const bodySchema = z.object({
  fullName: z.string().min(1).max(200),
  orgName: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  orgType: z.enum(["subsidized", "non_subsidized", "unknown", "other"]).optional(),
  childrenCount: z.number().int().min(0).max(10000).optional(),
  notes: z.string().max(2000).optional(),
  mode: z.enum(["self", "interviewer"]),
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

  const session = await createSession(parsed.data);
  if (!session) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return NextResponse.json({
    id: session.id,
    token: session.token,
    link: `${appUrl}/s/${session.token}`,
  });
}
