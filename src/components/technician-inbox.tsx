import Link from "next/link";
import { StatusBadge } from "@/components/badges";
import { MarkRepairedButton } from "@/components/mark-repaired-button";
import { formatDate, formatTicketNumber, isDoneStatus } from "@/lib/labels";
import { ticketMapUrl, ticketWhatsAppUrl } from "@/lib/ticket-links";
import type { Ticket, TicketComment } from "@/lib/types";

export function TechnicianInbox({
  tickets,
}: {
  tickets: Ticket[];
}) {
  const active = tickets.filter((t) => !isDoneStatus(t.status));
  const done = tickets.filter((t) => isDoneStatus(t.status)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl font-semibold tracking-tight text-brand-dark">
          Tus visitas
        </h1>
        <p className="mt-1 text-sm text-muted">
          El admin te asigna el reporte. Tú solo contactas y marcas cuando ya quedó.
        </p>
      </div>

      {active.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-white/80 px-6 py-16 text-center">
          <p className="display text-xl font-medium text-brand-dark">
            Sin reportes por ahora
          </p>
          <p className="mt-2 text-sm text-muted">
            Cuando te asignen uno, aparece aquí. Un tap a WhatsApp y otro a “Ya lo reparé”.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {active.map((ticket) => (
            <TechCard key={ticket.id} ticket={ticket} />
          ))}
        </ul>
      )}

      {done.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Recién reparados
          </p>
          <ul className="space-y-2">
            {done.map((ticket) => (
              <li
                key={ticket.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm"
              >
                <span>
                  {formatTicketNumber(ticket.ticket_number)} ·{" "}
                  {ticket.contact_name}
                </span>
                <StatusBadge status={ticket.status} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function TechCard({ ticket }: { ticket: Ticket }) {
  const wa = ticketWhatsAppUrl(ticket);
  const map = ticketMapUrl(ticket);

  return (
    <li className="rounded-3xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {formatTicketNumber(ticket.ticket_number)}
            {ticket.ticket_categories?.name
              ? ` · ${ticket.ticket_categories.name}`
              : ""}
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            {ticket.contact_name || "Sin titular"}
          </h2>
          <p className="mt-1 line-clamp-3 text-sm text-muted">{ticket.description}</p>
          <p className="mt-2 text-xs text-muted">
            {ticket.service_address || (ticket.lat != null ? "Con GPS" : "Sin dirección")}
            {ticket.zone ? ` · ${ticket.zone}` : ""}
            {" · "}
            {formatDate(ticket.created_at)}
          </p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            WhatsApp
          </a>
        ) : null}
        {map ? (
          <a
            href={map}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold hover:border-brand/40"
          >
            Mapa
          </a>
        ) : null}
        <Link
          href={`/tickets/${ticket.id}`}
          className="inline-flex items-center justify-center rounded-2xl border border-border px-4 py-3 text-sm hover:border-brand/40"
        >
          Ver detalle
        </Link>
      </div>

      <div className="mt-3">
        <MarkRepairedButton ticket={ticket} />
      </div>
    </li>
  );
}

export function TechnicianNotes({ comments }: { comments: TicketComment[] }) {
  if (comments.length === 0) return null;
  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5">
      <h2 className="text-sm font-semibold text-amber-950">Indicaciones del admin</h2>
      <ul className="mt-3 space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="text-sm text-amber-950/90">
            <p className="whitespace-pre-wrap">{c.body}</p>
            <p className="mt-1 text-xs text-amber-800/70">{formatDate(c.created_at)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
