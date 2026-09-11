"use client";

import { useRouter } from "next/navigation";
import { useSuhbatSession } from "@/lib/useSuhbatSession";
import { hapticImpact } from "@/lib/haptic";

export function IntroScreen({ token }: { token: string }) {
  const router = useRouter();
  const { loading, notFound, data, flatQuestions } = useSuhbatSession(token);

  if (loading) {
    return <CenteredMessage text="Yuklanmoqda..." />;
  }

  if (notFound || !data) {
    return <CenteredMessage text="Havola topilmadi. Iltimos, havolani tekshiring." />;
  }

  const total = flatQuestions.length;
  const current = Math.min(data.session.currentQuestion, total);
  // Kamida bitta javob saqlangan bo'lsagina "davom etish" ko'rsatiladi.
  const started = current > 1;

  function handleStart() {
    hapticImpact("medium");
    const target = started ? current : 1;
    router.push(`/s/${token}/q/${target}`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{data.questionnaire.title}</div>

        <div style={{ fontSize: 16, lineHeight: 1.5 }}>
          Assalomu alaykum, {data.respondent.fullName}!
          <br />
          Men bog&apos;cha rahbarlari uchun tizim ustida ishlayapman. Sizning real
          tajribangiz menga eng kerakli narsa.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 15 }}>
          <div>⏱ ~25 daqiqa</div>
          <div>🎤 Ovozli javob berish mumkin</div>
          <div>💾 Javoblar avtomatik saqlanadi — chiqib ketsangiz ham yo&apos;qolmaydi</div>
        </div>

        <div
          style={{
            fontSize: 14,
            color: "var(--text-muted)",
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius)",
            padding: 12,
          }}
        >
          ℹ️ Chiroyli javob emas, rost javob kerak.
        </div>
      </div>

      <button
        type="button"
        onClick={handleStart}
        style={{
          minHeight: 48,
          borderRadius: "var(--radius)",
          border: "none",
          background: "var(--button)",
          color: "var(--button-text)",
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          marginTop: 24,
        }}
      >
        {started ? `Davom etish (${current - 1}/${total})` : "Boshlash"}
      </button>
    </div>
  );
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: 15,
      }}
    >
      {text}
    </div>
  );
}
