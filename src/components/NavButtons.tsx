type Props = {
  onSkip: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
};

export function NavButtons({ onSkip, onNext, nextLabel = "Keyingi", nextDisabled }: Props) {
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
      <button
        type="button"
        onClick={onSkip}
        style={{
          flex: 1,
          minHeight: 48,
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          background: "transparent",
          color: "var(--text-muted)",
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Tashlab ketish
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        style={{
          flex: 1,
          minHeight: 48,
          borderRadius: "var(--radius)",
          border: "none",
          background: "var(--button)",
          color: "var(--button-text)",
          fontSize: 16,
          fontWeight: 600,
          cursor: nextDisabled ? "not-allowed" : "pointer",
          opacity: nextDisabled ? 0.6 : 1,
        }}
      >
        {nextLabel}
      </button>
    </div>
  );
}
