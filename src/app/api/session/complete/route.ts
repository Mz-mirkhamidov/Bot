import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { readValidatedInitData } from "@/lib/telegram-auth";
import { notifyAdmins, formatSessionCompletedMessage, sessionDetailKeyboard } from "@/lib/telegram";

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

  const { data: session } = await supabase
    .from("sessions")
    .select("id, status, respondent_id, questionnaire_id")
    .eq("token", token)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (session.status === "completed") {
    return NextResponse.json({ ok: true });
  }

  await supabase
    .from("sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", session.id);

  await supabase.from("events").insert({ session_id: session.id, type: "completed" });

  const { data: blocks } = await supabase
    .from("question_blocks")
    .select("id")
    .eq("questionnaire_id", session.questionnaire_id);
  const blockIds = blocks?.map((b) => b.id) ?? [];

  const [{ data: respondent }, { count: totalCount }, { count: answeredCount }] = await Promise.all([
    supabase.from("respondents").select("full_name, org_name").eq("id", session.respondent_id).single(),
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .in("block_id", blockIds.length > 0 ? blockIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("answers")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id)
      .eq("skipped", false),
  ]);

  if (respondent) {
    await notifyAdmins(
      formatSessionCompletedMessage({
        fullName: respondent.full_name,
        orgName: respondent.org_name,
        answeredCount: answeredCount ?? 0,
        totalCount: totalCount ?? 45,
      }),
      sessionDetailKeyboard(session.id)
    );
  }

  return NextResponse.json({ ok: true });
}
