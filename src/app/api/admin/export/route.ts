import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminUserId } from "@/lib/telegram-auth";

type ExportSession = {
  id: string;
  token: string;
  mode: string;
  status: string;
  createdAt: string;
  respondent: { fullName: string; orgName: string | null; phone: string | null; orgType: string };
  answers: { number: number; text: string; answer: string | null; skipped: boolean }[];
};

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function toCsv(sessions: ExportSession[]): string {
  const allNumbers = Array.from(new Set(sessions.flatMap((s) => s.answers.map((a) => a.number)))).sort(
    (a, b) => a - b
  );
  const header = ["Ism", "Bog'cha", "Telefon", "Holat", "Sana", ...allNumbers.map((n) => `Savol ${n}`)];
  const lines = [header.map(csvEscape).join(",")];

  for (const s of sessions) {
    const answerByNumber = new Map(s.answers.map((a) => [a.number, a]));
    const row = [
      s.respondent.fullName,
      s.respondent.orgName ?? "",
      s.respondent.phone ?? "",
      s.status,
      s.createdAt,
      ...allNumbers.map((n) => answerByNumber.get(n)?.answer ?? ""),
    ];
    lines.push(row.map((v) => csvEscape(String(v))).join(","));
  }
  return lines.join("\n");
}

function toMarkdown(sessions: ExportSession[]): string {
  return sessions
    .map((s) => {
      const lines = [
        `# ${s.respondent.fullName}${s.respondent.orgName ? ` (${s.respondent.orgName})` : ""}`,
        "",
        `- Holat: ${s.status}`,
        `- Rejim: ${s.mode}`,
        `- Sana: ${s.createdAt}`,
        "",
        "## Savol-javoblar",
        "",
      ];
      for (const a of s.answers) {
        lines.push(`**${a.number}. ${a.text}**`);
        lines.push(a.skipped || !a.answer ? "_Javob berilmagan_" : a.answer);
        lines.push("");
      }
      return lines.join("\n");
    })
    .join("\n---\n\n");
}

export async function GET(req: Request) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "json";
  const idsParam = url.searchParams.get("ids");
  const sessionIds = idsParam
    ? idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  let sessionQuery = supabase
    .from("sessions")
    .select("id, token, mode, status, created_at, respondent_id, questionnaire_id");
  if (sessionIds) sessionQuery = sessionQuery.in("id", sessionIds);
  const { data: sessionRows } = await sessionQuery;

  if (!sessionRows || sessionRows.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const respondentIds = Array.from(new Set(sessionRows.map((s) => s.respondent_id)));
  const { data: respondents } = await supabase
    .from("respondents")
    .select("id, full_name, org_name, phone, org_type")
    .in("id", respondentIds);
  const respondentById = new Map((respondents ?? []).map((r) => [r.id, r]));

  const questionnaireIds = Array.from(new Set(sessionRows.map((s) => s.questionnaire_id)));
  const { data: blocks } = await supabase
    .from("question_blocks")
    .select("id, questionnaire_id")
    .in("questionnaire_id", questionnaireIds);
  const blockIds = (blocks ?? []).map((b) => b.id);

  const { data: questions } = await supabase
    .from("questions")
    .select("id, number, text")
    .in("block_id", blockIds.length > 0 ? blockIds : ["00000000-0000-0000-0000-000000000000"])
    .order("number");
  const questionById = new Map((questions ?? []).map((q) => [q.id, q]));

  const { data: answers } = await supabase
    .from("answers")
    .select("session_id, question_id, text, skipped")
    .in(
      "session_id",
      sessionRows.map((s) => s.id)
    );
  const answersBySession = new Map<string, typeof answers>();
  for (const a of answers ?? []) {
    const list = answersBySession.get(a.session_id) ?? [];
    list.push(a);
    answersBySession.set(a.session_id, list);
  }

  const exportSessions: ExportSession[] = sessionRows.map((s) => {
    const respondent = respondentById.get(s.respondent_id);
    const sessionAnswers = (answersBySession.get(s.id) ?? [])
      .map((a) => {
        const q = questionById.get(a.question_id);
        if (!q) return null;
        return { number: q.number, text: q.text, answer: a.text, skipped: a.skipped };
      })
      .filter((v): v is ExportSession["answers"][number] => v !== null)
      .sort((a, b) => a.number - b.number);

    return {
      id: s.id,
      token: s.token,
      mode: s.mode,
      status: s.status,
      createdAt: s.created_at,
      respondent: {
        fullName: respondent?.full_name ?? "",
        orgName: respondent?.org_name ?? null,
        phone: respondent?.phone ?? null,
        orgType: respondent?.org_type ?? "unknown",
      },
      answers: sessionAnswers,
    };
  });

  if (format === "csv") {
    return new NextResponse(toCsv(exportSessions), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="suhbat-export.csv"`,
      },
    });
  }

  if (format === "md") {
    return new NextResponse(toMarkdown(exportSessions), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="suhbat-export.md"`,
      },
    });
  }

  return NextResponse.json(exportSessions);
}
