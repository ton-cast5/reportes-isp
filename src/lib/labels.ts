import type { TicketPriority, TicketStatus, UserRole } from "./types";

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Nuevo",
  in_progress: "En atención",
  waiting_customer: "Pendiente",
  resolved: "Reparado",
  closed: "Cerrado",
};

export const CLIENT_STATUS_COPY: Record<TicketStatus, string> = {
  open: "Recibido. Pronto te contactamos.",
  in_progress: "Un técnico ya lo está atendiendo.",
  waiting_customer: "Estamos esperando una respuesta tuya.",
  resolved: "¡Listo! Ya quedó reparado.",
  closed: "Este reporte ya se cerró.",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  client: "Cliente",
  tecnico: "Técnico",
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

export function isActiveStatus(status: TicketStatus) {
  return status === "open" || status === "in_progress" || status === "waiting_customer";
}

export function isDoneStatus(status: TicketStatus) {
  return status === "resolved" || status === "closed";
}
