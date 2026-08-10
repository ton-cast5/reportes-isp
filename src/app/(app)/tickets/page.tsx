import Link from "next/link";
import { redirect } from "next/navigation";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { TechnicianInbox } from "@/components/technician-inbox";
import { formatDate, formatTicketNumber } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { isTeamRole, type Ticket, type UserRole } from "@/lib/types";

type Vista = "todos" | "sin-asignar" | "mios" | "abiertos";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const params = await searchParams;
  const vista = (params.vista as Vista) || "abiertos";

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

  const role = profile?.role as UserRole | undefined;
  const team = isTeamRole(role);

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(
      `
      *,
      ticket_categories(name),
      reporter:profiles!tickets_reporter_id_fkey(full_name, phone),
      assignee:profiles!tickets_assignee_id_fkey(full_name)
    `,
    )
    .order("created_at", { ascending: false });

  const list = (tickets ?? []) as Ticket[];

  if (team) {
    return (
      <>
        {error ? (
          <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            No se pudieron cargar los tickets: {error.message}
          </p>
        ) : null}
        <TechnicianInbox tickets={list} userId={user.id} vista={vista} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display text-3xl font-semibold tracking-tight text-brand-dark">
            Mis reportes
          </h1>
          <p className="mt-1 text-sm text-muted">
            Aquí ves solo tus tickets y su avance.
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
