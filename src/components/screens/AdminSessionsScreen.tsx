"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminSessions } from "@/lib/useAdmin";
import { useSafeRawInitData } from "@/lib/useTelegramInitData";
import { downloadFile } from "@/lib/apiClient";
import { formatDate, modeLabel, statusColor, statusLabel } from "@/lib/format";
import type { SessionStatus } from "@/types/session";

const EXPORT_FORMATS = [
  { value: "csv", label: "CSV", filename: "suhbat-export.csv" },
  { value: "json", label: "JSON", filename: "suhbat-export.json" },
  { value: "md", label: "Markdown", filename: "suhbat-export.md" },
] as const;

const FILTERS: { value: SessionStatus | "all"; label: string }[] = [
  { value: "all", label: "Hammasi" },
  { value: "created", label: "Yaratilgan" },
  { value: "in_progress", label: "Jarayonda" },
  { value: "completed", label: "Tugallangan" },
  { value: "abandoned", label: "Tashlab ketilgan" },
];

export function AdminSessionsScreen() {
  const router = useRouter();
  const { raw: initDataRaw } = useSafeRawInitData();
  const [filter, setFilter] = useState<SessionStatus | "all">("all");
  const { loading, forbidden, sessions } = useAdminSessions(filter);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [exporting, setExporting] = useState<string | null>(null);

  async function handleExport(format: (typeof EXPORT_FORMATS)[number]) {
    setExporting(format.value);
    await downloadFile(`/api/admin/export?format=${format.value}`, initDataRaw, format.filename);
    setExporting(null);
  }

  if (forbidden) {
    return <CenteredMessage text="Ruxsat yo'q." />;
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  function exitCompareMode() {
    setCompareMode(false);
    setSelected([]);
  }

  return (
    <div style={{ paddingBottom: compareMode ? 72 : 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Sessiyalar</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => (compareMode ? exitCompareMode() : setCompareMode(true))}
            style={{
              minHeight: 40,
              padding: "0 14px",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              background: compareMode ? "var(--accent)" : "transparent",
              color: compareMode ? "var(--button-text)" : "var(--text)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {compareMode ? "Bekor qilish" : "Solishtirish"}
          </button>
          {!compareMode && (
            <button
              type="button"
              onClick={() => router.push("/admin/new")}
              style={{
                minHeight: 40,
                padding: "0 16px",
                borderRadius: "var(--radius)",
                border: "none",
                background: "var(--button)",
                color: "var(--button-text)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Yangi sessiya
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            style={{
              whiteSpace: "nowrap",
              padding: "6px 12px",
              borderRadius: 999,
              border: `1px solid ${filter === f.value ? "var(--accent)" : "var(--border)"}`,
              background: filter === f.value ? "var(--accent)" : "transparent",
              color: filter === f.value ? "var(--button-text)" : "var(--text-muted)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {compareMode && (
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
          Solishtirish uchun 2-4 ta sessiya tanlang ({selected.length}/4)
        </div>
      )}

      {!compareMode && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Eksport:</span>
          {EXPORT_FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => handleExport(f)}
              disabled={exporting !== null}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--link)",
                fontSize: 12,
                fontWeight: 600,
                cursor: exporting !== null ? "not-allowed" : "pointer",
                opacity: exporting !== null ? 0.6 : 1,
              }}
            >
              {exporting === f.value ? "..." : f.label}
            </button>
          ))}
        </div>
      )}

      {loading && <CenteredMessage text="Yuklanmoqda..." />}

      {!loading && sessions && sessions.length === 0 && (
        <CenteredMessage text="Sessiyalar topilmadi." />
      )}

      {!loading && sessions && sessions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sessions.map((s) => {
            const isSelected = selected.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => (compareMode ? toggleSelected(s.id) : router.push(`/admin/session/${s.id}`))}
                style={{
                  textAlign: "left",
                  padding: 14,
                  borderRadius: "var(--radius)",
                  border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                  background: "var(--bg-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                {compareMode && (
                  <input type="checkbox" checked={isSelected} readOnly style={{ marginTop: 4 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{s.respondent.fullName}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: statusColor(s.status) }}>
                      {statusLabel(s.status)}
                    </div>
                  </div>
                  {s.respondent.orgName && (
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                      {s.respondent.orgName}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 8,
                      fontSize: 12,
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>{modeLabel(s.mode)}</span>
                    <span>
                      {s.answeredCount}/{s.totalCount}
                    </span>
                    <span>{formatDate(s.createdAt)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {compareMode && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            padding: 16,
            background: "var(--bg)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            disabled={selected.length < 2}
            onClick={() => router.push(`/admin/compare?ids=${selected.join(",")}`)}
            style={{
              width: "100%",
              maxWidth: 640,
              margin: "0 auto",
              display: "block",
              minHeight: 48,
              borderRadius: "var(--radius)",
              border: "none",
              background: "var(--button)",
              color: "var(--button-text)",
              fontSize: 15,
              fontWeight: 600,
              cursor: selected.length < 2 ? "not-allowed" : "pointer",
              opacity: selected.length < 2 ? 0.5 : 1,
            }}
          >
            Solishtirish ({selected.length})
          </button>
        </div>
      )}
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
