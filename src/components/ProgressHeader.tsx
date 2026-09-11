type Props = {
  current: number;
  total: number;
  blockCode: string;
  blockTitle: string;
};

export function ProgressHeader({ current, total, blockCode, blockTitle }: Props) {
  const percent = Math.round((current / total) * 100);

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: "var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            background: "var(--accent)",
            transition: "width 300ms ease",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          fontSize: 13,
          fontWeight: 500,
          color: "var(--text-muted)",
        }}
      >
        <span>
          {blockCode} · {blockTitle}
        </span>
        <span>
          {current}/{total}
        </span>
      </div>
    </div>
  );
}
