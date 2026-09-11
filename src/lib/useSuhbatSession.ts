"use client";

import { useCallback, useEffect, useState } from "react";
import { useSafeRawInitData } from "@/lib/useTelegramInitData";
import { callApi } from "@/lib/apiClient";
import type { SessionQuestion, SessionStartResponse } from "@/types/session";

type State = {
  loading: boolean;
  notFound: boolean;
  data: SessionStartResponse | null;
};

export function useSuhbatSession(token: string) {
  const { raw: initDataRaw, ready } = useSafeRawInitData();
  const [state, setState] = useState<State>({ loading: true, notFound: false, data: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const { ok, status, json } = await callApi<SessionStartResponse>(
      "/api/session/start",
      initDataRaw,
      "POST",
      { token }
    );
    if (!ok || !json) {
      setState({ loading: false, notFound: status === 404, data: null });
      return;
    }
    setState({ loading: false, notFound: false, data: json });
  }, [token, initDataRaw]);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  const saveAnswer = useCallback(
    async (number: number, text: string, skipped: boolean) => {
      const { ok } = await callApi("/api/answer", initDataRaw, "POST", { token, number, text, skipped });
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
    const { ok } = await callApi("/api/session/complete", initDataRaw, "POST", { token });
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
