"use client";

import { useCallback, useEffect, useState } from "react";
import { useSafeRawInitData } from "@/lib/useTelegramInitData";
import { callApi } from "@/lib/apiClient";
import type { AdminSessionDetail, AdminSessionListItem, NewSessionInput } from "@/types/admin";
import type { SessionStatus } from "@/types/session";

export function useAdminSessions(statusFilter: SessionStatus | "all") {
  const { raw: initDataRaw, ready } = useSafeRawInitData();
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [sessions, setSessions] = useState<AdminSessionListItem[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = statusFilter !== "all" ? `?status=${statusFilter}` : "";
    const { ok, status, json } = await callApi<{ sessions: AdminSessionListItem[] }>(
      `/api/admin/sessions${qs}`,
      initDataRaw,
      "GET"
    );
    if (!ok || !json) {
      setForbidden(status === 403);
      setSessions(null);
      setLoading(false);
      return;
    }
    setForbidden(false);
    setSessions(json.sessions);
    setLoading(false);
  }, [statusFilter, initDataRaw]);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  return { loading, forbidden, sessions, reload: load };
}

export function useAdminSessionDetail(id: string) {
  const { raw: initDataRaw, ready } = useSafeRawInitData();
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [detail, setDetail] = useState<AdminSessionDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { ok, status, json } = await callApi<AdminSessionDetail>(
      `/api/admin/session/${id}`,
      initDataRaw,
      "GET"
    );
    if (!ok || !json) {
      setForbidden(status === 403);
      setNotFound(status === 404);
      setDetail(null);
      setLoading(false);
      return;
    }
    setForbidden(false);
    setNotFound(false);
    setDetail(json);
    setLoading(false);
  }, [id, initDataRaw]);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  return { loading, forbidden, notFound, detail, reload: load };
}

export function useCreateSession() {
  const { raw: initDataRaw } = useSafeRawInitData();

  return useCallback(
    async (input: NewSessionInput) => {
      const { ok, json } = await callApi<{ id: string; token: string; link: string }>(
        "/api/admin/session",
        initDataRaw,
        "POST",
        input
      );
      if (!ok || !json) return null;
      return json;
    },
    [initDataRaw]
  );
}
