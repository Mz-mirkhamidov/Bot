"use client";

import { useAdminSessionDetail } from "@/lib/useAdmin";
import { formatDate, modeLabel, statusColor, statusLabel } from "@/lib/format";
import { AudioAnswerControls } from "@/components/AudioAnswerControls";

const FLAG_EMOJI: Record<string, string> = { green: "🟢", red: "🔴", star: "⭐" };

export function AdminSessionDetailScreen({ id }: { id: string }) {
  const { loading, forbidden, notFound, detail, reloadSilently } = useAdminSessionDetail(id);

  if (loading) return <CenteredMessage text="Yuklanmoqda..." />;
  if (forbidden) return <CenteredMessage text="Ruxsat yo'q." />;
  if (notFound || !detail) return <CenteredMessage text="Sessiya topilmadi." />;

  const allQuestions = detail.blocks.flatMap((b) => b.questions);
  const answeredCount = allQuestions.filter((q) => !q.skipped && q.answerText).length;
  const flagged = allQuestions.filter((q) => q.flag);

  return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{detail.respondent.fullName}</div>
        {detail.respondent.orgName && (
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>{detail.respondent.orgName}</div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 13, flexWrap: "wrap" }}>
          <span style={{ color: statusColor(detail.session.status), fontWeight: 600 }}>
            {statusLabel(detail.session.status)}
          </span>
          <span style={{ color: "var(--text-muted)" }}>{modeLabel(detail.session.mode)}</span>
          <span style={{ color: "var(--text-muted)" }}>
            {answeredCount}/{allQuestions.length}
          </span>
          <span style={{ color: "var(--text-muted)" }}>{formatDate(detail.session.createdAt)}</span>
        </div>
        {detail.respondent.phone && (
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            📞 {detail.respondent.phone}
          </div>
        )}
        {detail.respondent.notes && (
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            {detail.respondent.notes}
          </div>
        )}
      </div>

      {flagged.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10 }}>
            BELGILANGAN JAVOBLAR
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {flagged.map((q) => (
              <div
                key={q.number}
                style={{
                  padding: 12,
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                }}
              >
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {FLAG_EMOJI[q.flag ?? ""] ?? ""} {q.number}. {q.text}
                </div>
                <div style={{ fontSize: 15, marginTop: 2 }}>{q.answerText ?? "—"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {detail.blocks.map((block) => (
          <div key={block.code}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: 10,
                textTransform: "uppercase",
              }}
            >
              {block.code} · {block.title}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {block.questions.map((q) => (
                <div
                  key={q.number}
                  style={{
                    padding: 12,
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    background: q.isKey ? "var(--bg-secondary)" : "transparent",
                  }}
                >
                  <div style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", gap: 4 }}>
                    {q.isKey && <span>⭐</span>}
                    <span>
                      {q.number}. {q.text}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      marginTop: 4,
                      color: q.answerText ? "var(--text)" : "var(--text-muted)",
                    }}
                  >
                    {q.answerText ?? (q.skipped ? "Javob berilmagan" : "—")}
                    {q.isEdited && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}> (tahrirlangan)</span>
                    )}
                  </div>
                  {q.audioPath && (
                    <AudioAnswerControls
                      sessionId={id}
                      number={q.number}
                      onRetranscribed={() => reloadSilently()}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 15 }}>
      {text}
    </div>
  );
}
