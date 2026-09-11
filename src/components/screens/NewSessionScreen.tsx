"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { shareURL } from "@telegram-apps/sdk-react";
import { useCreateSession } from "@/lib/useAdmin";
import { useToast, Toast } from "@/components/Toast";
import type { NewSessionInput } from "@/types/admin";

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 16,
  padding: "10px 12px",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  background: "var(--bg-secondary)",
  color: "var(--text)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-muted)",
  marginBottom: 4,
  display: "block",
};

export function NewSessionScreen() {
  const router = useRouter();
  const createSession = useCreateSession();
  const { message, show } = useToast();

  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [phone, setPhone] = useState("");
  const [orgType, setOrgType] = useState<NewSessionInput["orgType"]>("unknown");
  const [childrenCount, setChildrenCount] = useState("");
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<NewSessionInput["mode"]>("self");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ link: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSubmitting(true);
    const res = await createSession({
      fullName: fullName.trim(),
      orgName: orgName.trim() || undefined,
      phone: phone.trim() || undefined,
      orgType,
      childrenCount: childrenCount ? Number(childrenCount) : undefined,
      notes: notes.trim() || undefined,
      mode,
    });
    setSubmitting(false);
    if (!res) {
      show("Sessiya yaratilmadi. Qayta urining.");
      return;
    }
    setResult({ link: res.link });
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.link);
      show("Nusxalandi");
    } catch {
      show("Nusxalab bo'lmadi");
    }
  }

  function handleShareTelegram() {
    if (!result) return;
    try {
      if (shareURL.isAvailable()) {
        shareURL(result.link, "Bog'cha faoliyati bo'yicha so'rovnoma");
      }
    } catch {
      // Telegramdan tashqarida — e'tiborsiz qoldiramiz.
    }
  }

  if (result) {
    return (
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Sessiya yaratildi</div>
        <div
          style={{
            padding: 12,
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            fontSize: 14,
            wordBreak: "break-all",
            marginBottom: 16,
          }}
        >
          {result.link}
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <button type="button" onClick={handleCopy} style={secondaryButtonStyle}>
            Nusxalash
          </button>
          <button type="button" onClick={handleShareTelegram} style={primaryButtonStyle}>
            Telegramda yuborish
          </button>
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          style={{ ...secondaryButtonStyle, width: "100%" }}
        >
          Sessiyalar ro&apos;yxatiga qaytish
        </button>
        <Toast message={message} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Yangi sessiya</div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Ism *</label>
          <input style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div>
          <label style={labelStyle}>Bog&apos;cha nomi</label>
          <input style={inputStyle} value={orgName} onChange={(e) => setOrgName(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Telefon</label>
          <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Tur</label>
          <select
            style={inputStyle}
            value={orgType}
            onChange={(e) => setOrgType(e.target.value as NewSessionInput["orgType"])}
          >
            <option value="unknown">Noma&apos;lum</option>
            <option value="subsidized">Subsidiyali</option>
            <option value="non_subsidized">Subsidiyasiz</option>
            <option value="other">Boshqa</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Bolalar soni</label>
          <input
            style={inputStyle}
            type="text"
            inputMode="numeric"
            value={childrenCount}
            onChange={(e) => setChildrenCount(e.target.value.replace(/[^\d]/g, ""))}
          />
        </div>
        <div>
          <label style={labelStyle}>Eslatma</label>
          <textarea
            style={{ ...inputStyle, resize: "vertical" }}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Rejim</label>
          <div style={{ display: "flex", gap: 10 }}>
            {(["self", "interviewer"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: "var(--radius)",
                  border: `1px solid ${mode === m ? "var(--accent)" : "var(--border)"}`,
                  background: mode === m ? "var(--accent)" : "var(--bg-secondary)",
                  color: mode === m ? "var(--button-text)" : "var(--text)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {m === "self" ? "O'zi to'ldiradi" : "Suhbat rejimi"}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !fullName.trim()}
          style={{
            ...primaryButtonStyle,
            marginTop: 8,
            opacity: submitting || !fullName.trim() ? 0.6 : 1,
            cursor: submitting || !fullName.trim() ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Yaratilmoqda..." : "Sessiya yaratish"}
        </button>
      </form>
      <Toast message={message} />
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 48,
  borderRadius: "var(--radius)",
  border: "none",
  background: "var(--button)",
  color: "var(--button-text)",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 48,
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text)",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
};
