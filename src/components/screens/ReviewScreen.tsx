"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSuhbatSession } from "@/lib/useSuhbatSession";
import { useTelegramBackButton } from "@/lib/useTelegramBackButton";
import { useTelegramMainButton } from "@/lib/useTelegramMainButton";
import { hapticNotify } from "@/lib/haptic";
import { ReviewList } from "@/components/ReviewList";
import { Toast, useToast } from "@/components/Toast";

export function ReviewScreen({ token }: { token: string }) {
  const router = useRouter();
  const { loading, notFound, data, complete } = useSuhbatSession(token);
  const [submitting, setSubmitting] = useState(false);
  const { message, show } = useToast();

  const handleBack = useCallback(() => {
    router.push(`/s/${token}`);
  }, [router, token]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    const ok = await complete();
    setSubmitting(false);
    if (ok) {
      hapticNotify("success");
      router.push(`/s/${token}/done`);
    } else {
      show("Yuborib bo'lmadi. Internetni tekshirib, qayta urining.");
    }
  }, [complete, router, token, show]);

  useTelegramBackButton(handleBack);
  useTelegramMainButton({
    text: "Yuborish",
    visible: !loading && !!data,
    enabled: !submitting,
    onClick: handleSubmit,
  });

  if (loading) {
    return <CenteredMessage text="Yuklanmoqda..." />;
  }
  if (notFound || !data) {
    return <CenteredMessage text="Havola topilmadi." />;
  }

  return (
    <div style={{ paddingBottom: 96 }}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Ko&apos;rib chiqish</div>
      <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}>
        Javoblaringizni tekshiring, kerak bo&apos;lsa bosib tahrirlang.
      </div>

      <ReviewList
        blocks={data.blocks}
        answers={data.answers}
        onEdit={(number) => router.push(`/s/${token}/q/${number}`)}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          position: "sticky",
          bottom: 16,
          width: "100%",
          marginTop: 24,
          minHeight: 48,
          borderRadius: "var(--radius)",
          border: "none",
          background: "var(--button)",
          color: "var(--button-text)",
          fontSize: 16,
          fontWeight: 600,
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? "Yuborilmoqda..." : "Yuborish"}
      </button>
      <Toast message={message} />
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
