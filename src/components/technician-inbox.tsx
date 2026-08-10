import Link from "next/link";
import { claimTicket } from "@/app/(app)/actions";
import { StatusBadge } from "@/components/badges";
import {
  formatDate,
  formatTicketNumber,
} from "@/lib/labels";
import { mapsSearchUrl, mapsUrl } from "@/lib/maps";
import { whatsappUrl } from "@/lib/phone";
import type { Ticket } from "@/lib/types";

type Vista = "todos" | "sin-asignar" | "mios" | "abiertos";

const VISTAS: { id: Vista; label: string }[] = [
  { id: "abiertos", label: "Activos" },
  { id: "sin-asignar", label: "Sin asignar" },
  { id: "mios", label: "Míos" },
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
          Reportes de clientes sin cuenta. Toma, escribe por WhatsApp y resuelve.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Activos" value={openCount} />
        <Stat label="Libres" value={unassignedCount} />
        <Stat label="Míos" value={mineCount} />
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
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((ticket) => {
            const canClaim = !ticket.assignee_id && ticket.status === "open";
            const phone = ticket.contact_phone;
            const wa = phone
              ? whatsappUrl(
                  phone,
                  `Hola ${ticket.contact_name || ""}, somos soporte ISP. Sobre tu reporte ${formatTicketNumber(ticket.ticket_number)}: ${ticket.title}`,
                )
              : null;
            const map =
              ticket.lat != null && ticket.lng != null
                ? mapsUrl(ticket.lat, ticket.lng)
                : ticket.service_address
                  ? mapsSearchUrl(
                      [ticket.service_address, ticket.zone].filter(Boolean).join(", "),
                    )
                  : null;

            return (
              <li
                key={ticket.id}
                className="rounded-3xl border border-border bg-white/90 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link href={`/tickets/${ticket.id}`} className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {formatTicketNumber(ticket.ticket_number)}
                      {ticket.ticket_categories?.name
                        ? ` · ${ticket.ticket_categories.name}`
                        : ""}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-foreground">
                      {ticket.contact_name || "Sin titular"}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {ticket.description}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      {ticket.service_address ||
                        (ticket.lat != null ? "Con GPS" : "Sin dirección")}
                      {ticket.zone ? ` · ${ticket.zone}` : ""}
                      {" · "}
                      {formatDate(ticket.created_at)}
                      {ticket.assignee
                        ? ` · ${ticket.assignee.full_name}`
                        : " · Libre"}
                    </p>
                  </Link>
                  <StatusBadge status={ticket.status} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      WhatsApp
                    </a>
                  ) : null}
                  {map ? (
                    <a
                      href={map}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold hover:border-brand/40"
                    >
                      Mapa
                    </a>
                  ) : null}
                  {canClaim ? (
                    <form action={claimTicket}>
                      <input type="hidden" name="ticketId" value={ticket.id} />
                      <button
                        type="submit"
                        className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                      >
                        Tomar
                      </button>
                    </form>
                  ) : (
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="rounded-xl border border-border px-3 py-2 text-sm hover:border-brand/40"
                    >
                      Abrir
                    </Link>
                  )}
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
    <div className="rounded-3xl border border-border bg-white/90 px-4 py-3 sm:px-5 sm:py-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted sm:text-xs">
        {label}
      </p>
      <p className="display mt-1 text-2xl font-semibold text-brand-dark sm:text-3xl">
        {value}
      </p>
    </div>
  );
}
