"use client";

import { useCallback, useEffect, useState } from "react";
import { retrieveRawInitData } from "@telegram-apps/sdk-react";
import type { SessionQuestion, SessionStartResponse } from "@/types/session";

// Telegramdan tashqarida (oddiy brauzerda) ochilganda retrieveRawInitData xato
// tashlaydi — buni faqat clientda, effekt ichida xavfsiz o'qiymiz.
function useSafeRawInitData(): string | undefined {
  const [raw, setRaw] = useState<string | undefined>(undefined);
  useEffect(() => {
    try {
      setRaw(retrieveRawInitData());
    } catch {
      setRaw(undefined);
    }
  }, []);
  return raw;
}

type State = {
  loading: boolean;
  notFound: boolean;
  data: SessionStartResponse | null;
};

async function callApi<T>(
  path: string,
  initDataRaw: string | undefined,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; json: T | null }> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(initDataRaw ? { "X-Telegram-Init-Data": initDataRaw } : {}),
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as T | null;
    return { ok: res.ok, status: res.status, json };
  } catch {
    // Internet uzilgan yoki so'rov yetib bormagan — chaqiruvchi xatoni qayta urinish uchun ishlatadi.
    return { ok: false, status: 0, json: null };
  }
}

export function useSuhbatSession(token: string) {
  const initDataRaw = useSafeRawInitData();
  const [state, setState] = useState<State>({ loading: true, notFound: false, data: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const { ok, status, json } = await callApi<SessionStartResponse>(
      "/api/session/start",
      initDataRaw,
      { token }
    );
    if (!ok || !json) {
      setState({ loading: false, notFound: status === 404, data: null });
      return;
    }
    setState({ loading: false, notFound: false, data: json });
  }, [token, initDataRaw]);

  useEffect(() => {
    load();
  }, [load]);

  const saveAnswer = useCallback(
    async (number: number, text: string, skipped: boolean) => {
      const { ok } = await callApi("/api/answer", initDataRaw, { token, number, text, skipped });
      if (!ok) return false;
      setState((s) => {
        if (!s.data) return s;
        return {
          ...s,
          data: {
            ...s.data,
            answers: {
              ...s.data.answers,
              [number]: { text: skipped ? null : text, skipped, isEdited: false },
            },
          },
        };
      });
      return true;
    },
    [token, initDataRaw]
  );

  const complete = useCallback(async () => {
    const { ok } = await callApi("/api/session/complete", initDataRaw, { token });
    return ok;
  }, [token, initDataRaw]);

  const flatQuestions: SessionQuestion[] =
    state.data?.blocks.flatMap((b) => b.questions) ?? [];

  return {
    ...state,
    flatQuestions,
    saveAnswer,
    complete,
    reload: load,
  };
}
