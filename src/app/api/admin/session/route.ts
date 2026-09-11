import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { supabase } from "@/lib/supabase";
import { getAdminUserId } from "@/lib/telegram-auth";

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
  const { fullName, orgName, phone, orgType, childrenCount, notes, mode } = parsed.data;

  const { data: questionnaire } = await supabase
    .from("questionnaires")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!questionnaire) {
    return NextResponse.json({ error: "no_active_questionnaire" }, { status: 500 });
  }

  const { data: respondent, error: respondentError } = await supabase
    .from("respondents")
    .insert({
      full_name: fullName,
      org_name: orgName ?? null,
      phone: phone ?? null,
      org_type: orgType ?? "unknown",
      children_count: childrenCount ?? null,
      notes: notes ?? null,
    })
    .select("id")
    .single();

  if (respondentError || !respondent) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const token = randomBytes(16).toString("hex");

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      questionnaire_id: questionnaire.id,
      respondent_id: respondent.id,
      token,
      mode,
      status: "created",
    })
    .select("id, token")
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return NextResponse.json({
    id: session.id,
    token: session.token,
    link: `${appUrl}/s/${session.token}`,
  });
}
