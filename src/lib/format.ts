import type { SessionMode, SessionStatus } from "@/types/session";

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_LABELS: Record<SessionStatus, string> = {
  created: "Yaratilgan",
  in_progress: "Jarayonda",
  completed: "Tugallangan",
  abandoned: "Tashlab ketilgan",
};

export function statusLabel(status: SessionStatus): string {
  return STATUS_LABELS[status];
}

const STATUS_COLORS: Record<SessionStatus, string> = {
  created: "var(--text-muted)",
  in_progress: "var(--warning)",
  completed: "var(--success)",
  abandoned: "var(--danger)",
};

export function statusColor(status: SessionStatus): string {
  return STATUS_COLORS[status];
}

const MODE_LABELS: Record<SessionMode, string> = {
  self: "O'zi to'ldiradi",
  interviewer: "Suhbat rejimi",
};

export function modeLabel(mode: SessionMode): string {
  return MODE_LABELS[mode];
}
