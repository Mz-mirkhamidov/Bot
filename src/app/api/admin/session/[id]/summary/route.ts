import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { getAdminUserId } from "@/lib/telegram-auth";

const bodySchema = z.object({
  biggestPain: z.string().max(2000).optional().nullable(),
  hoursPerMonth: z.number().min(0).max(1000).optional().nullable(),
  moneyLost12m: z.number().min(0).optional().nullable(),
  currentSolution: z.string().max(2000).optional().nullable(),
  paidBefore: z.boolean().optional().nullable(),
  paidBeforeAmount: z.number().min(0).optional().nullable(),
  hypothesisConfirmed: z.enum(["subsidy", "documents", "occupancy", "none"]).optional().nullable(),
  referralOk: z.boolean().optional().nullable(),
  telegramGroup: z.string().max(200).optional().nullable(),
  surprise: z.string().max(2000).optional().nullable(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const f = parsed.data;

  const { data: session } = await supabase.from("sessions").select("id").eq("id", id).maybeSingle();
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { error } = await supabase.from("session_summaries").upsert(
    {
      session_id: id,
      biggest_pain: f.biggestPain ?? null,
      hours_per_month: f.hoursPerMonth ?? null,
      money_lost_12m: f.moneyLost12m ?? null,
      current_solution: f.currentSolution ?? null,
      paid_before: f.paidBefore ?? null,
      paid_before_amount: f.paidBeforeAmount ?? null,
      hypothesis_confirmed: f.hypothesisConfirmed ?? null,
      referral_ok: f.referralOk ?? null,
      telegram_group: f.telegramGroup ?? null,
      surprise: f.surprise ?? null,
    },
    { onConflict: "session_id" }
  );

  if (error) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
