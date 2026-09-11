import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminUserId } from "@/lib/telegram-auth";
import type { AdminSessionBlock, AdminSessionDetail } from "@/types/admin";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const { data: session } = await supabase
    .from("sessions")
    .select("id, token, mode, status, created_at, started_at, completed_at, respondent_id, questionnaire_id")
    .eq("id", id)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: respondent } = await supabase
    .from("respondents")
    .select("full_name, org_name, phone, org_type, children_count, notes")
    .eq("id", session.respondent_id)
    .single();

  const { data: blocks } = await supabase
    .from("question_blocks")
    .select("id, code, title, order_index")
    .eq("questionnaire_id", session.questionnaire_id)
    .order("order_index");

  const blockIds = (blocks ?? []).map((b) => b.id);
  const { data: questions } = await supabase
    .from("questions")
    .select("id, block_id, number, order_index, text, hint, type, is_key")
    .in("block_id", blockIds.length > 0 ? blockIds : ["00000000-0000-0000-0000-000000000000"])
    .order("order_index");

  const { data: answers } = await supabase
    .from("answers")
    .select("question_id, text, skipped, audio_path, transcript, is_edited, flag")
    .eq("session_id", session.id);

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

  const response: AdminSessionDetail = {
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
  };

  return NextResponse.json(response);
}
