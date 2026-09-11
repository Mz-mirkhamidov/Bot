import { NextResponse } from "next/server";
import { getAdminUserId } from "@/lib/telegram-auth";
import { listSessions } from "@/lib/adminFlow";
import type { SessionStatus } from "@/types/session";

const VALID_STATUSES: SessionStatus[] = ["created", "in_progress", "completed", "abandoned"];

export async function GET(req: Request) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const statusFilter = VALID_STATUSES.find((s) => s === statusParam);

  const sessions = await listSessions(statusFilter);
  return NextResponse.json({ sessions });
}
