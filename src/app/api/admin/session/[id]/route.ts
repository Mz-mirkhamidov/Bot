import { NextResponse } from "next/server";
import { getAdminUserId } from "@/lib/telegram-auth";
import { getSessionDetail } from "@/lib/adminFlow";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const detail = await getSessionDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
