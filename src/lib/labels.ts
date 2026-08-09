import type { TicketPriority, TicketStatus, UserRole } from "./types";

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Abierto",
  in_progress: "En proceso",
  waiting_customer: "Esperando cliente",
  resolved: "Resuelto",
  closed: "Cerrado",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  client: "Cliente",
  staff: "Soporte",
  admin: "Admin",
};

export const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-sky-100 text-sky-800",
  in_progress: "bg-amber-100 text-amber-900",
  waiting_customer: "bg-violet-100 text-violet-800",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-slate-200 text-slate-700",
};

export const PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-teal-100 text-teal-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-rose-100 text-rose-800",
};

export function formatTicketNumber(n: number) {
  return `#${String(n).padStart(5, "0")}`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
