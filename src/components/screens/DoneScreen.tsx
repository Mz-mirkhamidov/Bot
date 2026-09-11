"use client";

import { miniApp } from "@telegram-apps/sdk-react";

export function DoneScreen() {
  function handleClose() {
    try {
      if (miniApp.close.isAvailable()) {
        miniApp.close();
      }
    } catch {
      // Telegramdan tashqarida — e'tiborsiz qoldiramiz.
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 40 }}>🎉</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Katta rahmat!</div>
      <div style={{ fontSize: 15, color: "var(--text-muted)", maxWidth: 320 }}>
        Javoblaringiz qabul qilindi. Savollaringiz bo&apos;lsa istalgan vaqtda yozing.
      </div>
      <button
        type="button"
        onClick={handleClose}
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
        Telegram&apos;ga qaytish
      </button>
    </div>
  );
}
