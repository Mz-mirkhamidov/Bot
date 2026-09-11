type Props = {
  number: number;
  text: string;
  hint?: string | null;
};

export function QuestionCard({ number, text, hint }: Props) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--accent)",
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {number}
      </div>
      <div style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.35 }}>{text}</div>
      {hint && (
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8 }}>{hint}</div>
      )}
    </div>
  );
}
