type Props = {
  code: string;
  title: string;
  description?: string | null;
  questionCount: number;
  onContinue: () => void;
};

export function BlockIntro({ code, title, description, questionCount, onContinue }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--accent)",
          color: "var(--button-text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        {code}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{title}</div>
      {description && (
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>{description}</div>
      )}
      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{questionCount} ta savol</div>
      <button
        type="button"
        onClick={onContinue}
        style={{
          marginTop: 8,
          minHeight: 48,
          padding: "0 32px",
          borderRadius: "var(--radius)",
          border: "none",
          background: "var(--button)",
          color: "var(--button-text)",
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Davom etish
      </button>
    </div>
  );
}
