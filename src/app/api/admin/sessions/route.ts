import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminUserId } from "@/lib/telegram-auth";
import type { AdminSessionListItem } from "@/types/admin";
import type { SessionStatus } from "@/types/session";

const VALID_STATUSES: SessionStatus[] = ["created", "in_progress", "completed", "abandoned"];

export async function GET(req: Request) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const statusFilter = VALID_STATUSES.find((s) => s === statusParam);

  let query = supabase
    .from("sessions")
    .select("id, token, mode, status, current_question, created_at, started_at, completed_at, respondent_id, questionnaire_id")
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: sessions } = await query;

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ sessions: [] });
  }

  const respondentIds = [...new Set(sessions.map((s) => s.respondent_id))];
  const questionnaireIds = [...new Set(sessions.map((s) => s.questionnaire_id))];

  const { data: respondents } = await supabase
    .from("respondents")
    .select("id, full_name, org_name, org_type, phone")
    .in("id", respondentIds);

  const { data: blocks } = await supabase
    .from("question_blocks")
    .select("id, questionnaire_id")
    .in("questionnaire_id", questionnaireIds);

  const blockIds = (blocks ?? []).map((b) => b.id);
  const { data: questions } = await supabase
    .from("questions")
    .select("id, block_id")
    .in("block_id", blockIds.length > 0 ? blockIds : ["00000000-0000-0000-0000-000000000000"]);

  const blockToQuestionnaire = new Map((blocks ?? []).map((b) => [b.id, b.questionnaire_id]));
  const totalByQuestionnaire = new Map<string, number>();
  for (const q of questions ?? []) {
    const qid = blockToQuestionnaire.get(q.block_id);
    if (!qid) continue;
    totalByQuestionnaire.set(qid, (totalByQuestionnaire.get(qid) ?? 0) + 1);
  }

  const sessionIds = sessions.map((s) => s.id);
  const { data: answers } = await supabase
    .from("answers")
    .select("session_id, skipped")
    .in("session_id", sessionIds)
    .eq("skipped", false);

  const answeredCountBySession = new Map<string, number>();
  for (const a of answers ?? []) {
    answeredCountBySession.set(a.session_id, (answeredCountBySession.get(a.session_id) ?? 0) + 1);
  }

  const respondentById = new Map((respondents ?? []).map((r) => [r.id, r]));

  const result: AdminSessionListItem[] = sessions.map((s) => {
    const respondent = respondentById.get(s.respondent_id);
    return {
      id: s.id,
      token: s.token,
      mode: s.mode,
      status: s.status,
      currentQuestion: s.current_question ?? 1,
      createdAt: s.created_at,
      startedAt: s.started_at,
      completedAt: s.completed_at,
      answeredCount: answeredCountBySession.get(s.id) ?? 0,
      totalCount: totalByQuestionnaire.get(s.questionnaire_id) ?? 45,
      respondent: {
        fullName: respondent?.full_name ?? "",
        orgName: respondent?.org_name ?? null,
        orgType: respondent?.org_type ?? "unknown",
        phone: respondent?.phone ?? null,
      },
    };
  });

  return NextResponse.json({ sessions: result });
}
