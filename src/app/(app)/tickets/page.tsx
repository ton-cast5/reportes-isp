import Link from "next/link";
import { redirect } from "next/navigation";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { formatDate, formatTicketNumber } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import type { Ticket } from "@/lib/types";

export default async function TicketsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("*, ticket_categories(name)")
    .order("created_at", { ascending: false });

  const list = (tickets ?? []) as Ticket[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display text-3xl font-semibold tracking-tight text-brand-dark">
            {profile?.role === "client" ? "Mis reportes" : "Bandeja de tickets"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Crea un reporte, adjunta evidencias y sigue el estado del servicio.
          </p>
        </div>
        <Link
          href="/tickets/new"
          className="inline-flex items-center justify-center rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Nuevo reporte
        </Link>
      </div>

      {error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          No se pudieron cargar los tickets: {error.message}
        </p>
      ) : null}

      {list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-white/70 px-6 py-16 text-center">
          <p className="display text-xl font-medium text-brand-dark">
            Aún no hay reportes
          </p>
          <p className="mt-2 text-sm text-muted">
            Cuando haya una falla, crea un ticket con fotos o video.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((ticket) => (
            <li key={ticket.id}>
              <Link
                href={`/tickets/${ticket.id}`}
                className="block rounded-3xl border border-border bg-white/90 p-5 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md hover:shadow-teal-900/5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {formatTicketNumber(ticket.ticket_number)}
                      {ticket.ticket_categories?.name
                        ? ` · ${ticket.ticket_categories.name}`
                        : ""}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-foreground">
                      {ticket.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {ticket.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted">
                  Actualizado {formatDate(ticket.updated_at)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
