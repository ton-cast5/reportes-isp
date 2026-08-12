import Link from "next/link";
import { assignTicket } from "@/app/(app)/actions";
import { StatusBadge } from "@/components/badges";
import {
  formatDate,
  formatTicketNumber,
  isDoneStatus,
} from "@/lib/labels";
import { ticketMapUrl, ticketWhatsAppUrl } from "@/lib/ticket-links";
import type { Profile, Ticket } from "@/lib/types";

type Vista = "nuevos" | "en-atencion" | "reparados";

export function AdminInbox({
  tickets,
  tecnicos,
  vista,
}: {
  tickets: Ticket[];
  tecnicos: Pick<Profile, "id" | "full_name">[];
  vista: Vista;
}) {
  const nuevos = tickets.filter((t) => !t.assignee_id && !isDoneStatus(t.status));
  const enAtencion = tickets.filter(
    (t) => t.assignee_id && !isDoneStatus(t.status),
  );
  const reparados = tickets.filter((t) => isDoneStatus(t.status));

  const filtered =
    vista === "nuevos"
      ? nuevos
      : vista === "en-atencion"
        ? enAtencion
        : reparados;

  const tabs: { id: Vista; label: string; count: number }[] = [
    { id: "nuevos", label: "Por asignar", count: nuevos.length },
    { id: "en-atencion", label: "En atención", count: enAtencion.length },
    { id: "reparados", label: "Reparados", count: reparados.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl font-semibold tracking-tight text-brand-dark">
          Panel admin
        </h1>
        <p className="mt-1 text-sm text-muted">
          Asigna cada reporte a un técnico. Ellos solo ven lo suyo y marcan cuando ya quedó.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Por asignar" value={nuevos.length} />
        <Stat label="En atención" value={enAtencion.length} />
        <Stat label="Reparados" value={reparados.length} />
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/tickets?vista=${tab.id}`}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              vista === tab.id
                ? "bg-brand text-white"
                : "bg-white text-muted ring-1 ring-border hover:text-brand"
            }`}
          >
            {tab.label} ({tab.count})
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-white/80 px-6 py-14 text-center">
          <p className="display text-xl font-medium text-brand-dark">
            Nada en esta vista
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((ticket) => (
            <AdminCard key={ticket.id} ticket={ticket} tecnicos={tecnicos} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminCard({
  ticket,
  tecnicos,
}: {
  ticket: Ticket;
  tecnicos: Pick<Profile, "id" | "full_name">[];
}) {
  const wa = ticketWhatsAppUrl(ticket);
  const map = ticketMapUrl(ticket);

  return (
    <li className="rounded-3xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link href={`/tickets/${ticket.id}`} className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {formatTicketNumber(ticket.ticket_number)}
            {ticket.ticket_categories?.name
              ? ` · ${ticket.ticket_categories.name}`
              : ""}
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {ticket.contact_name || "Sin titular"}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{ticket.description}</p>
          <p className="mt-2 text-xs text-muted">
            {ticket.assignee?.full_name
              ? `Técnico: ${ticket.assignee.full_name}`
              : "Sin asignar"}
            {" · "}
            {formatDate(ticket.created_at)}
          </p>
        </Link>
        <StatusBadge status={ticket.status} />
      </div>

      {!isDoneStatus(ticket.status) ? (
        <form action={assignTicket} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <select
            name="assigneeId"
            defaultValue={ticket.assignee_id || ""}
            className="flex-1 rounded-2xl border border-border bg-surface/40 px-3 py-2.5 text-sm outline-none ring-brand/30 focus:ring-2"
          >
            <option value="">Elegir técnico…</option>
            {tecnicos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name || "Técnico"}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Asignar
          </button>
        </form>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
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
            className="rounded-xl border border-border px-3 py-2 text-sm hover:border-brand/40"
          >
            Mapa
          </a>
        ) : null}
        <Link
          href={`/tickets/${ticket.id}`}
          className="rounded-xl border border-border px-3 py-2 text-sm hover:border-brand/40"
        >
          Detalle
        </Link>
      </div>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-border bg-white/90 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="display mt-1 text-2xl font-semibold text-brand-dark">{value}</p>
    </div>
  );
}
