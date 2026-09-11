"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSuhbatSession } from "@/lib/useSuhbatSession";
import { useTelegramBackButton } from "@/lib/useTelegramBackButton";
import { useTelegramMainButton } from "@/lib/useTelegramMainButton";
import { hapticImpact } from "@/lib/haptic";
import { ProgressHeader } from "@/components/ProgressHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { AnswerInput } from "@/components/AnswerInput";
import { NavButtons } from "@/components/NavButtons";
import { BlockIntro } from "@/components/BlockIntro";
import { Toast, useToast } from "@/components/Toast";

function blockIntroKey(token: string, blockCode: string) {
  return `suhbat_block_intro_${token}_${blockCode}`;
}

export function QuestionScreen({ token, number }: { token: string; number: number }) {
  const router = useRouter();
  const { loading, notFound, data, flatQuestions, saveAnswer } = useSuhbatSession(token);
  const { message, show } = useToast();
  const [value, setValue] = useState("");
  const [showBlockIntro, setShowBlockIntro] = useState(false);

  const total = flatQuestions.length;
  const question = flatQuestions.find((q) => q.number === number) ?? null;
  const block = data?.blocks.find((b) => b.questions.some((q) => q.number === number)) ?? null;
  const isFirstInBlock = block ? block.questions[0]?.number === number : false;

  useEffect(() => {
    if (data?.session.status === "completed") {
      router.replace(`/s/${token}/done`);
    }
  }, [data?.session.status, router, token]);

  useEffect(() => {
    if (!question) return;
    const existing = data?.answers[number];
    setValue(existing?.skipped ? "" : existing?.text ?? "");

    if (isFirstInBlock && block) {
      const seen = typeof window !== "undefined" && sessionStorage.getItem(blockIntroKey(token, block.code));
      setShowBlockIntro(!seen);
    } else {
      setShowBlockIntro(false);
    }
  }, [number, question, data, isFirstInBlock, block, token]);

  const goToNumber = useCallback(
    (target: number) => {
      if (target > total) {
        router.push(`/s/${token}/review`);
        return;
      }
      if (target < 1) {
        router.push(`/s/${token}`);
        return;
      }
      router.push(`/s/${token}/q/${target}`);
    },
    [router, token, total]
  );

  const persist = useCallback(
    async (skipped: boolean) => {
      const ok = await saveAnswer(number, value, skipped);
      show(ok ? (skipped ? "O'tkazildi" : "Saqlandi") : "Saqlab bo'lmadi. Internetni tekshirib, qayta urining.");
      return ok;
    },
    [number, value, saveAnswer, show]
  );

  const handleNext = useCallback(async () => {
    hapticImpact("light");
    const ok = await persist(value.trim().length === 0);
    if (ok) goToNumber(number + 1);
  }, [persist, value, goToNumber, number]);

  const handleSkip = useCallback(async () => {
    hapticImpact("light");
    const ok = await persist(true);
    if (ok) goToNumber(number + 1);
  }, [persist, goToNumber, number]);

  const handleBack = useCallback(() => {
    goToNumber(number - 1);
  }, [goToNumber, number]);

  useTelegramBackButton(question ? handleBack : null);
  useTelegramMainButton({
    text: number === total ? "Ko'rib chiqish" : "Keyingi",
    visible: !!question && !showBlockIntro,
    onClick: handleNext,
  });

  if (loading) {
    return <CenteredMessage text="Yuklanmoqda..." />;
  }
  if (notFound || !data || !question || !block) {
    return <CenteredMessage text="Savol topilmadi." />;
  }

  if (showBlockIntro) {
    return (
      <BlockIntro
        code={block.code}
        title={block.title}
        description={block.description}
        questionCount={block.questions.length}
        onContinue={() => {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(blockIntroKey(token, block.code), "1");
          }
          setShowBlockIntro(false);
        }}
      />
    );
  }

  return (
    <div>
      <ProgressHeader
        current={number}
        total={total}
        blockCode={block.code}
        blockTitle={block.title}
      />
      <QuestionCard number={question.number} text={question.text} hint={question.hint} />
      <AnswerInput
        type={question.type}
        options={question.options}
        value={value}
        onChange={setValue}
        onBlur={() => {
          if (value.trim().length > 0) {
            saveAnswer(number, value, false);
          }
        }}
      />
      <NavButtons onSkip={handleSkip} onNext={handleNext} nextLabel={number === total ? "Ko'rib chiqish" : "Keyingi"} />
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
