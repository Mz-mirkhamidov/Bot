"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSafeRawInitData } from "@/lib/useTelegramInitData";
import { useTelegramBackButton } from "@/lib/useTelegramBackButton";
import { callApi } from "@/lib/apiClient";
import type { CompareResponse } from "@/types/admin";

export function CompareScreen({ ids }: { ids: string }) {
  const router = useRouter();
  const { raw: initDataRaw, ready } = useSafeRawInitData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CompareResponse | null>(null);
  const [onlyKey, setOnlyKey] = useState(false);

  useTelegramBackButton(() => router.push("/admin"));

  useEffect(() => {
    if (!ready) return;
    (async () => {
      setLoading(true);
      const { ok, json } = await callApi<CompareResponse>(`/api/admin/compare?ids=${ids}`, initDataRaw, "GET");
      setLoading(false);
      if (!ok || !json) {
        setError("Solishtirish uchun kamida 2, ko'pi bilan 4 ta sessiya kerak.");
        return;
      }
      setData(json);
    })();
  }, [ready, ids, initDataRaw]);

  if (loading) return <CenteredMessage text="Yuklanmoqda..." />;
  if (error || !data) return <CenteredMessage text={error ?? "Xato"} />;

  const rows = onlyKey ? data.rows.filter((r) => r.isKey) : data.rows;

  return (
    <div style={{ paddingBottom: 32 }}>
      <button type="button" onClick={() => router.push("/admin")} style={backLinkStyle}>
        ← Orqaga
      </button>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Solishtirish</div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 16 }}>
        <input type="checkbox" checked={onlyKey} onChange={(e) => setOnlyKey(e.target.checked)} />
        Faqat kalit savollar
      </label>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...cellStyle, textAlign: "left", minWidth: 160 }}>Savol</th>
              {data.respondents.map((r) => (
                <th key={r.sessionId} style={{ ...cellStyle, textAlign: "left", minWidth: 160 }}>
                  <div style={{ fontWeight: 700 }}>{r.fullName}</div>
                  {r.orgName && <div style={{ fontWeight: 400, color: "var(--text-muted)" }}>{r.orgName}</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.number}>
                <td style={{ ...cellStyle, color: "var(--text-muted)" }}>
                  {row.isKey && "⭐ "}
                  {row.number}. {row.text}
                </td>
                {data.respondents.map((r) => (
                  <td key={r.sessionId} style={cellStyle}>
                    {row.answers[r.sessionId] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 15 }}>{text}</div>
  );
}

const cellStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  padding: "8px 10px",
  verticalAlign: "top",
};

const backLinkStyle: React.CSSProperties = {
  border: "none",
  background: "none",
  color: "var(--link)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  padding: 0,
  marginBottom: 16,
  display: "block",
};
