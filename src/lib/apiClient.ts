export async function callApi<T>(
  path: string,
  initDataRaw: string | undefined,
  method: "GET" | "POST",
  body?: Record<string, unknown>
): Promise<{ ok: boolean; status: number; json: T | null }> {
  try {
    const res = await fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(initDataRaw ? { "X-Telegram-Init-Data": initDataRaw } : {}),
      },
      ...(method === "POST" ? { body: JSON.stringify(body ?? {}) } : {}),
    });
    const json = (await res.json().catch(() => null)) as T | null;
    return { ok: res.ok, status: res.status, json };
  } catch {
    // Internet uzilgan yoki so'rov yetib bormagan — chaqiruvchi xatoni qayta urinish uchun ishlatadi.
    return { ok: false, status: 0, json: null };
  }
}
