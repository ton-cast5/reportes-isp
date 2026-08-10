import Link from "next/link";
import { claimTicket } from "@/app/(app)/actions";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import {
  formatDate,
  formatTicketNumber,
} from "@/lib/labels";
import type { Ticket } from "@/lib/types";

type Vista = "todos" | "sin-asignar" | "mios" | "abiertos";

const VISTAS: { id: Vista; label: string }[] = [
  { id: "abiertos", label: "Activos" },
  { id: "sin-asignar", label: "Sin asignar" },
  { id: "mios", label: "Mis tickets" },
  { id: "todos", label: "Todos" },
];

export function TechnicianInbox({
  tickets,
  userId,
  vista,
}: {
  tickets: Ticket[];
  userId: string;
  vista: Vista;
}) {
  const openCount = tickets.filter((t) =>
    ["open", "in_progress", "waiting_customer"].includes(t.status),
  ).length;
  const unassignedCount = tickets.filter(
    (t) => !t.assignee_id && t.status !== "closed" && t.status !== "resolved",
  ).length;
  const mineCount = tickets.filter((t) => t.assignee_id === userId).length;

  const filtered = tickets.filter((t) => {
    if (vista === "sin-asignar") return !t.assignee_id;
    if (vista === "mios") return t.assignee_id === userId;
    if (vista === "abiertos") {
      return ["open", "in_progress", "waiting_customer"].includes(t.status);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl font-semibold tracking-tight text-brand-dark">
          Bandeja técnica
        </h1>
        <p className="mt-1 text-sm text-muted">
          Los 4 técnicos ven la misma bandeja. Toma un ticket para trabajarlo.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Activos" value={openCount} />
        <Stat label="Sin asignar" value={unassignedCount} />
        <Stat label="Asignados a ti" value={mineCount} />
      </div>

      <div className="flex flex-wrap gap-2">
        {VISTAS.map((v) => (
          <Link
            key={v.id}
            href={`/tickets?vista=${v.id}`}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              vista === v.id
                ? "bg-brand text-white"
                : "bg-white text-muted ring-1 ring-border hover:text-brand"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-white/70 px-6 py-14 text-center">
          <p className="display text-xl font-medium text-brand-dark">
            No hay tickets en esta vista
          </p>
          <p className="mt-2 text-sm text-muted">
            Cuando un cliente reporte, aparecerá aquí para todo el equipo.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((ticket) => {
            const canClaim = !ticket.assignee_id && ticket.status === "open";
            return (
              <li
                key={ticket.id}
                className="rounded-3xl border border-border bg-white/90 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link href={`/tickets/${ticket.id}`} className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {formatTicketNumber(ticket.ticket_number)}
                      {ticket.ticket_categories?.name
                        ? ` · ${ticket.ticket_categories.name}`
                        : ""}
                      {ticket.zone ? ` · ${ticket.zone}` : ""}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-foreground">
                      {ticket.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {ticket.description}
                    </p>
                    <p className="mt-3 text-xs text-muted">
                      Cliente: {ticket.reporter?.full_name || "—"}
                      {ticket.assignee
                        ? ` · Técnico: ${ticket.assignee.full_name}`
                        : " · Sin asignar"}
                      {" · "}
                      {formatDate(ticket.created_at)}
                    </p>
                  </Link>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex flex-wrap justify-end gap-2">
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    {canClaim ? (
                      <form action={claimTicket}>
                        <input type="hidden" name="ticketId" value={ticket.id} />
                        <button
                          type="submit"
                          className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                        >
                          Tomar ticket
                        </button>
                      </form>
                    ) : (
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="rounded-xl border border-border px-3 py-2 text-sm hover:border-brand/40 hover:text-brand"
                      >
                        Abrir
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-border bg-white/90 px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="display mt-1 text-3xl font-semibold text-brand-dark">{value}</p>
    </div>
  );
}
