import type { SessionAnswerData, SessionBlockData } from "@/types/session";

type Props = {
  blocks: SessionBlockData[];
  answers: Record<number, SessionAnswerData>;
  onEdit: (number: number) => void;
};

export function ReviewList({ blocks, answers, onEdit }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {blocks.map((block) => (
        <div key={block.code}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-muted)",
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
          >
            {block.code} · {block.title}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {block.questions.map((q) => {
              const answer = answers[q.number];
              const isAnswered = answer && !answer.skipped && answer.text;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onEdit(q.number)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    background: "var(--bg-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  {!isAnswered && <span aria-hidden>🟡</span>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 2 }}>
                      {q.number}. {q.text}
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        color: isAnswered ? "var(--text)" : "var(--text-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isAnswered ? answer!.text : "Javob berilmagan"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
