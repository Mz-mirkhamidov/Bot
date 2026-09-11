"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hapticImpact, hapticNotify } from "@/lib/haptic";

type Phase = "idle" | "recording" | "recorded" | "uploading" | "transcribing" | "done" | "error";

type Props = {
  token: string;
  number: number;
  hasSavedAudio: boolean;
  onTranscribed: (text: string) => void;
};

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mp4;codecs=mp4a.40.2",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function VoiceRecorder({ token, number, hasSavedAudio, onTranscribed }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeTypeRef = useRef<string>("");

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      mimeTypeRef.current = mimeType;
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        setPhase("recorded");
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setPhase("recording");
      hapticImpact("medium");
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setErrorMessage("Mikrofon ruxsati berilmadi. Matn bilan davom etishingiz mumkin.");
      setPhase("error");
    }
  }, []);

  const stopRecording = useCallback(() => {
    stopTimer();
    mediaRecorderRef.current?.stop();
  }, []);

  const cancelRecording = useCallback(() => {
    stopTimer();
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    chunksRef.current = [];
    setPhase("idle");
  }, []);

  const reRecord = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setPhase("idle");
  }, [audioUrl]);

  const uploadAndTranscribe = useCallback(async () => {
    if (chunksRef.current.length === 0) return;
    const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || "audio/webm" });

    setPhase("uploading");
    const form = new FormData();
    form.append("token", token);
    form.append("number", String(number));
    const ext = mimeTypeRef.current.includes("mp4") ? "mp4" : "webm";
    form.append("audio", blob, `voice.${ext}`);

    const uploadRes = await fetch("/api/voice/upload", { method: "POST", body: form }).catch(
      () => null
    );
    if (!uploadRes || !uploadRes.ok) {
      setErrorMessage("Yuklab bo'lmadi. Internetni tekshirib, qayta urining.");
      setPhase("error");
      return;
    }

    setPhase("transcribing");
    const transcribeRes = await fetch("/api/voice/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, number }),
    }).catch(() => null);

    if (!transcribeRes || !transcribeRes.ok) {
      setErrorMessage("Matnga o'girib bo'lmadi, keyinroq urinib ko'ramiz. Ovozingiz saqlandi.");
      setPhase("error");
      return;
    }

    const json = await transcribeRes.json();
    hapticNotify("success");
    setPhase("done");
    if (json.text) {
      onTranscribed(json.text);
    }
  }, [token, number, onTranscribed]);

  if (phase === "idle") {
    return (
      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={startRecording} style={micButtonStyle}>
          🎤 {hasSavedAudio ? "Qayta yozib olish" : "Ovozli javob"}
        </button>
      </div>
    );
  }

  if (phase === "recording") {
    return (
      <div style={recordingBoxStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={pulseDotStyle} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>{formatSeconds(seconds)}</span>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button type="button" onClick={cancelRecording} style={secondaryStyle}>
            ✕ Bekor qilish
          </button>
          <button type="button" onClick={stopRecording} style={primaryStyle}>
            ⏹ To&apos;xtatish
          </button>
        </div>
      </div>
    );
  }

  if (phase === "recorded") {
    return (
      <div style={recordingBoxStyle}>
        {audioUrl && <audio src={audioUrl} controls style={{ width: "100%" }} />}
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button type="button" onClick={reRecord} style={secondaryStyle}>
            Qayta yozish
          </button>
          <button type="button" onClick={uploadAndTranscribe} style={primaryStyle}>
            Saqlash
          </button>
        </div>
      </div>
    );
  }

  if (phase === "uploading" || phase === "transcribing") {
    return (
      <div style={recordingBoxStyle}>
        <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
          {phase === "uploading" ? "Yuklanmoqda..." : "⏳ Matnga o'girilmoqda..."}
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div style={recordingBoxStyle}>
        {audioUrl && <audio src={audioUrl} controls style={{ width: "100%", marginBottom: 10 }} />}
        <div style={{ color: "var(--danger)", fontSize: 14 }}>{errorMessage}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button type="button" onClick={reRecord} style={secondaryStyle}>
            Qayta yozish
          </button>
          {audioUrl && (
            <button type="button" onClick={uploadAndTranscribe} style={primaryStyle}>
              Qayta urinish
            </button>
          )}
        </div>
      </div>
    );
  }

  // phase === "done"
  return (
    <div style={{ marginTop: 12 }}>
      {audioUrl && <audio src={audioUrl} controls style={{ width: "100%", marginBottom: 8 }} />}
      <button type="button" onClick={reRecord} style={{ ...secondaryStyle, width: "100%" }}>
        🎤 Qayta yozib olish
      </button>
    </div>
  );
}

const recordingBoxStyle: React.CSSProperties = {
  marginTop: 12,
  padding: 16,
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  background: "var(--bg-secondary)",
  textAlign: "center",
};

const micButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 48,
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  background: "var(--bg-secondary)",
  color: "var(--text)",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
};

const primaryStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 44,
  borderRadius: "var(--radius)",
  border: "none",
  background: "var(--button)",
  color: "var(--button-text)",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 44,
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text)",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

const pulseDotStyle: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: "50%",
  background: "var(--danger)",
  animation: "suhbat-pulse 1.2s infinite",
};
