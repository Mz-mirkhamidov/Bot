"use client";

import { useState } from "react";
import { useSafeRawInitData } from "@/lib/useTelegramInitData";
import { callApi } from "@/lib/apiClient";

type Props = {
  sessionId: string;
  number: number;
  onRetranscribed: (transcript: string) => void;
};

export function AudioAnswerControls({ sessionId, number, onRetranscribed }: Props) {
  const { raw: initDataRaw } = useSafeRawInitData();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleListen() {
    setLoadingUrl(true);
    const { ok, json } = await callApi<{ url: string }>(
      `/api/admin/voice-url?sessionId=${sessionId}&number=${number}`,
      initDataRaw,
      "GET"
    );
    setLoadingUrl(false);
    if (ok && json) {
      setAudioUrl(json.url);
    } else {
      setMessage("Ovoz faylini yuklab bo'lmadi.");
    }
  }

  async function handleRetranscribe() {
    setRetrying(true);
    setMessage(null);
    const { ok, json } = await callApi<{ transcript: string }>(
      `/api/admin/session/${sessionId}/retranscribe`,
      initDataRaw,
      "POST",
      { number }
    );
    setRetrying(false);
    if (ok && json) {
      onRetranscribed(json.transcript);
      setMessage("Matnga o'girildi");
    } else {
      setMessage("Matnga o'girib bo'lmadi.");
    }
  }

  return (
    <div style={{ marginTop: 6 }}>
      {audioUrl ? (
        <audio src={audioUrl} controls style={{ width: "100%", marginBottom: 4 }} />
      ) : (
        <button type="button" onClick={handleListen} disabled={loadingUrl} style={linkButtonStyle}>
          {loadingUrl ? "Yuklanmoqda..." : "🎤 Ovozni tinglash"}
        </button>
      )}
      <button
        type="button"
        onClick={handleRetranscribe}
        disabled={retrying}
        style={{ ...linkButtonStyle, marginLeft: 12 }}
      >
        {retrying ? "..." : "Qayta transkripsiya qilish"}
      </button>
      {message && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{message}</div>
      )}
    </div>
  );
}

const linkButtonStyle: React.CSSProperties = {
  border: "none",
  background: "none",
  color: "var(--link)",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  padding: 0,
};
