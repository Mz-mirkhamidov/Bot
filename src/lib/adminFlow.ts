import { randomBytes } from "crypto";
import { supabase } from "@/lib/supabase";
import { TOTAL_QUESTIONS } from "@/lib/sessionFlow";
import type { AdminSessionBlock, AdminSessionDetail, AdminSessionListItem } from "@/types/admin";
import type { SessionStatus } from "@/types/session";

export async function listSessions(statusFilter?: SessionStatus): Promise<AdminSessionListItem[]> {
  let query = supabase
    .from("sessions")
    .select("id, token, mode, status, current_question, created_at, started_at, completed_at, respondent_id, questionnaire_id")
    .order("created_at", { ascending: false });

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data: sessions } = await query;
  if (!sessions || sessions.length === 0) return [];

  const respondentIds = [...new Set(sessions.map((s) => s.respondent_id))];
  const sessionIds = sessions.map((s) => s.id);

  const [{ data: respondents }, { data: answers }] = await Promise.all([
    supabase.from("respondents").select("id, full_name, org_name, org_type, phone").in("id", respondentIds),
    supabase.from("answers").select("session_id, skipped").in("session_id", sessionIds).eq("skipped", false),
  ]);

  const answeredCountBySession = new Map<string, number>();
  for (const a of answers ?? []) {
    answeredCountBySession.set(a.session_id, (answeredCountBySession.get(a.session_id) ?? 0) + 1);
  }
  const respondentById = new Map((respondents ?? []).map((r) => [r.id, r]));

  return sessions.map((s) => {
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
      totalCount: TOTAL_QUESTIONS,
      respondent: {
        fullName: respondent?.full_name ?? "",
        orgName: respondent?.org_name ?? null,
        orgType: respondent?.org_type ?? "unknown",
        phone: respondent?.phone ?? null,
      },
    };
  });
}

export async function getSessionDetail(id: string): Promise<AdminSessionDetail | null> {
  const { data: session } = await supabase
    .from("sessions")
    .select("id, token, mode, status, created_at, started_at, completed_at, respondent_id, questionnaire_id")
    .eq("id", id)
    .maybeSingle();

  if (!session) return null;

  const [{ data: respondent }, { data: blocks }, { data: answers }, { data: summaryRow }] = await Promise.all([
    supabase
      .from("respondents")
      .select("full_name, org_name, phone, org_type, children_count, notes")
      .eq("id", session.respondent_id)
      .single(),
    supabase
      .from("question_blocks")
      .select("id, code, title, order_index")
      .eq("questionnaire_id", session.questionnaire_id)
      .order("order_index"),
    supabase
      .from("answers")
      .select("question_id, text, skipped, audio_path, transcript, is_edited, flag")
      .eq("session_id", session.id),
    supabase.from("session_summaries").select("*").eq("session_id", session.id).maybeSingle(),
  ]);

  const blockIds = (blocks ?? []).map((b) => b.id);
  const { data: questions } = await supabase
    .from("questions")
    .select("id, block_id, number, order_index, text, hint, type, is_key")
    .in("block_id", blockIds.length > 0 ? blockIds : ["00000000-0000-0000-0000-000000000000"])
    .order("order_index");

  const answerByQuestionId = new Map((answers ?? []).map((a) => [a.question_id, a]));

  const responseBlocks: AdminSessionBlock[] = (blocks ?? []).map((b) => ({
    code: b.code,
    title: b.title,
    questions: (questions ?? [])
      .filter((q) => q.block_id === b.id)
      .map((q) => {
        const a = answerByQuestionId.get(q.id);
        return {
          number: q.number,
          text: q.text,
          hint: q.hint,
          type: q.type,
          isKey: q.is_key,
          answerText: a?.text ?? null,
          skipped: a?.skipped ?? true,
          audioPath: a?.audio_path ?? null,
          transcript: a?.transcript ?? null,
          isEdited: a?.is_edited ?? false,
          flag: a?.flag ?? null,
        };
      }),
  }));

  return {
    session: {
      id: session.id,
      token: session.token,
      mode: session.mode,
      status: session.status,
      createdAt: session.created_at,
      startedAt: session.started_at,
      completedAt: session.completed_at,
    },
    respondent: {
      fullName: respondent?.full_name ?? "",
      orgName: respondent?.org_name ?? null,
      phone: respondent?.phone ?? null,
      orgType: respondent?.org_type ?? "unknown",
      childrenCount: respondent?.children_count ?? null,
      notes: respondent?.notes ?? null,
    },
    blocks: responseBlocks,
    summary: {
      aiSummary: (summaryRow?.ai_summary as AdminSessionDetail["summary"]["aiSummary"]) ?? null,
      aiGeneratedAt: summaryRow?.ai_generated_at ?? null,
      manual: {
        biggestPain: summaryRow?.biggest_pain ?? null,
        hoursPerMonth: summaryRow?.hours_per_month ?? null,
        moneyLost12m: summaryRow?.money_lost_12m ?? null,
        currentSolution: summaryRow?.current_solution ?? null,
        paidBefore: summaryRow?.paid_before ?? null,
        paidBeforeAmount: summaryRow?.paid_before_amount ?? null,
        hypothesisConfirmed: summaryRow?.hypothesis_confirmed ?? null,
        referralOk: summaryRow?.referral_ok ?? null,
        telegramGroup: summaryRow?.telegram_group ?? null,
        surprise: summaryRow?.surprise ?? null,
      },
    },
  };
}

export type NewSessionDraft = {
  fullName: string;
  orgName?: string;
  phone?: string;
  orgType?: "subsidized" | "non_subsidized" | "unknown" | "other";
  childrenCount?: number;
  notes?: string;
  mode: "self" | "interviewer";
};

export async function createSession(
  input: NewSessionDraft
): Promise<{ id: string; token: string } | null> {
  const { data: questionnaire } = await supabase
    .from("questionnaires")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (!questionnaire) return null;

  const { data: respondent, error: respondentError } = await supabase
    .from("respondents")
    .insert({
      full_name: input.fullName,
      org_name: input.orgName ?? null,
      phone: input.phone ?? null,
      org_type: input.orgType ?? "unknown",
      children_count: input.childrenCount ?? null,
      notes: input.notes ?? null,
    })
    .select("id")
    .single();
  if (respondentError || !respondent) return null;

  const token = randomBytes(16).toString("hex");
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      questionnaire_id: questionnaire.id,
      respondent_id: respondent.id,
      token,
      mode: input.mode,
      status: "created",
    })
    .select("id, token")
    .single();
  if (sessionError || !session) return null;

  return { id: session.id, token: session.token };
}
