import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminUserId } from "@/lib/telegram-auth";
import type { CompareResponse } from "@/types/admin";

export async function GET(req: Request) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const idsParam = url.searchParams.get("ids") ?? "";
  const sessionIds = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (sessionIds.length < 2 || sessionIds.length > 4) {
    return NextResponse.json({ error: "invalid_ids" }, { status: 400 });
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, respondent_id, questionnaire_id")
    .in("id", sessionIds);

  if (!sessions || sessions.length !== sessionIds.length) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  // Berilgan tartibni saqlab qolish (frontend tanlagan ketma-ketlik).
  const orderedSessions = sessionIds.map((id) => sessions.find((s) => s.id === id)!);

  const respondentIds = orderedSessions.map((s) => s.respondent_id);
  const { data: respondents } = await supabase
    .from("respondents")
    .select("id, full_name, org_name")
    .in("id", respondentIds);
  const respondentById = new Map((respondents ?? []).map((r) => [r.id, r]));

  const questionnaireId = orderedSessions[0].questionnaire_id;
  const { data: blocks } = await supabase
    .from("question_blocks")
    .select("id")
    .eq("questionnaire_id", questionnaireId);
  const blockIds = (blocks ?? []).map((b) => b.id);

  const { data: questions } = await supabase
    .from("questions")
    .select("id, number, text, is_key")
    .in("block_id", blockIds.length > 0 ? blockIds : ["00000000-0000-0000-0000-000000000000"])
    .order("number");

  const { data: answers } = await supabase
    .from("answers")
    .select("session_id, question_id, text, skipped")
    .in("session_id", sessionIds);

  const answerByKey = new Map((answers ?? []).map((a) => [`${a.session_id}|${a.question_id}`, a]));

  const response: CompareResponse = {
    respondents: orderedSessions.map((s) => ({
      sessionId: s.id,
      fullName: respondentById.get(s.respondent_id)?.full_name ?? "",
      orgName: respondentById.get(s.respondent_id)?.org_name ?? null,
    })),
    rows: (questions ?? []).map((q) => ({
      number: q.number,
      text: q.text,
      isKey: q.is_key,
      answers: Object.fromEntries(
        orderedSessions.map((s) => {
          const a = answerByKey.get(`${s.id}|${q.id}`);
          return [s.id, a && !a.skipped ? a.text : null];
        })
      ),
    })),
  };

  return NextResponse.json(response);
}
