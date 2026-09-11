"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminSessions } from "@/lib/useAdmin";
import { formatDate, modeLabel, statusColor, statusLabel } from "@/lib/format";
import type { SessionStatus } from "@/types/session";

const FILTERS: { value: SessionStatus | "all"; label: string }[] = [
  { value: "all", label: "Hammasi" },
  { value: "created", label: "Yaratilgan" },
  { value: "in_progress", label: "Jarayonda" },
  { value: "completed", label: "Tugallangan" },
  { value: "abandoned", label: "Tashlab ketilgan" },
];

export function AdminSessionsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<SessionStatus | "all">("all");
  const { loading, forbidden, sessions } = useAdminSessions(filter);

  if (forbidden) {
    return <CenteredMessage text="Ruxsat yo'q." />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Sessiyalar</div>
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

      {loading && <CenteredMessage text="Yuklanmoqda..." />}

      {!loading && sessions && sessions.length === 0 && (
        <CenteredMessage text="Sessiyalar topilmadi." />
      )}

      {!loading && sessions && sessions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => router.push(`/admin/session/${s.id}`)}
              style={{
                textAlign: "left",
                padding: 14,
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--bg-secondary)",
                cursor: "pointer",
              }}
            >
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
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                <span>{modeLabel(s.mode)}</span>
                <span>{s.answeredCount}/{s.totalCount}</span>
                <span>{formatDate(s.createdAt)}</span>
              </div>
            </button>
          ))}
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
