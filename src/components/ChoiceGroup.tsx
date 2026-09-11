"use client";

type Props = {
  type: "yes_no" | "single_choice" | "multi_choice";
  options?: string[] | null;
  value: string;
  onChange: (value: string) => void;
};

const YES_NO_OPTIONS = ["Ha", "Yo'q"];

export function ChoiceGroup({ type, options, value, onChange }: Props) {
  const items = type === "yes_no" ? YES_NO_OPTIONS : options ?? [];
  const selected = type === "multi_choice" ? value.split(", ").filter(Boolean) : [value];

  function handleClick(item: string) {
    if (type === "multi_choice") {
      const next = selected.includes(item)
        ? selected.filter((s) => s !== item)
        : [...selected, item];
      onChange(next.join(", "));
      return;
    }
    onChange(item);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: type === "yes_no" ? "row" : "column",
        gap: 10,
      }}
    >
      {items.map((item) => {
        const isActive = selected.includes(item);
        return (
          <button
            key={item}
            type="button"
            onClick={() => handleClick(item)}
            style={{
              flex: type === "yes_no" ? 1 : undefined,
              minHeight: 48,
              padding: "12px 16px",
              borderRadius: "var(--radius)",
              border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
              background: isActive ? "var(--accent)" : "var(--bg-secondary)",
              color: isActive ? "var(--button-text)" : "var(--text)",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
