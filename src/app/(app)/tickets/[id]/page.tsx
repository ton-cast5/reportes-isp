import Link from "next/link";
import { redirect } from "next/navigation";
import { addAdminNote, assignTicket } from "@/app/(app)/actions";
import { StatusBadge } from "@/components/badges";
import { MarkRepairedButton } from "@/components/mark-repaired-button";
import { TechnicianNotes } from "@/components/technician-inbox";
import { formatDate, formatTicketNumber, isDoneStatus } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { ticketMapUrl, ticketWhatsAppUrl } from "@/lib/ticket-links";
import {
  isAdminRole,
  isTeamRole,
  type Profile,
  type Ticket,
  type TicketAttachment,
  type TicketComment,
  type UserRole,
} from "@/lib/types";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
  if (!isTeamRole(role)) redirect("/");

  const admin = isAdminRole(role);

  const { data: ticketData } = await supabase
    .from("tickets")
    .select(
      `
      *,
      ticket_categories(name),
      reporter:profiles!tickets_reporter_id_fkey(full_name, phone),
      assignee:profiles!tickets_assignee_id_fkey(full_name)
    `,
    )
    .eq("id", id)
    .single();

  if (!ticketData) {
    return (
      <div>
        <Link href="/tickets" className="text-sm text-brand hover:underline">
          ← Volver
        </Link>
        <p className="mt-4 text-rose-700">Ticket no encontrado.</p>
      </div>
    );
  }

  const ticket = ticketData as Ticket;

  if (!admin && ticket.assignee_id !== user.id) {
    redirect("/tickets");
  }

  const [{ data: atts }, { data: cmts }] = await Promise.all([
    supabase
      .from("ticket_attachments")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at"),
    supabase
      .from("ticket_comments")
      .select("*, profiles(full_name, role)")
      .eq("ticket_id", id)
      .order("created_at"),
  ]);

  const attachments = (atts ?? []) as TicketAttachment[];
  const comments = (cmts ?? []) as TicketComment[];

  let tecnicos: Pick<Profile, "id" | "full_name">[] = [];
  if (admin) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "tecnico")
      .order("full_name");
    tecnicos = data ?? [];
  }

  const signed = [];
  for (const att of attachments) {
    const { data } = await supabase.storage
      .from("ticket-evidence")
      .createSignedUrl(att.storage_path, 3600);
    signed.push({ ...att, url: data?.signedUrl ?? null });
  }

  const wa = ticketWhatsAppUrl(ticket);
  const map = ticketMapUrl(ticket);
  const done = isDoneStatus(ticket.status);

  return (
    <div className="space-y-5">
      <Link href="/tickets" className="text-sm text-brand hover:underline">
        ← Volver
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {formatTicketNumber(ticket.ticket_number)}
            {ticket.ticket_categories?.name
              ? ` · ${ticket.ticket_categories.name}`
              : ""}
          </p>
          <h1 className="display mt-1 text-3xl font-semibold tracking-tight text-brand-dark">
            {ticket.contact_name || "Sin titular"}
          </h1>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            WhatsApp {ticket.contact_phone}
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
        {!done ? <MarkRepairedButton ticket={ticket} /> : null}
      </div>

      <section className="rounded-3xl border border-border bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Problema
        </h2>
        <p className="mt-3 whitespace-pre-wrap">{ticket.description}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Titular</dt>
            <dd className="font-medium">{ticket.contact_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">WhatsApp</dt>
            <dd className="font-medium">{ticket.contact_phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Dirección</dt>
            <dd>{ticket.service_address || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Zona</dt>
            <dd>{ticket.zone || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">GPS</dt>
            <dd>
              {ticket.lat != null && ticket.lng != null
                ? `${ticket.lat.toFixed(5)}, ${ticket.lng.toFixed(5)}`
                : "No compartida"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Técnico</dt>
            <dd>{ticket.assignee?.full_name || "Sin asignar"}</dd>
          </div>
        </dl>
      </section>

      {admin ? (
        <section className="space-y-4 rounded-3xl border border-brand/20 bg-surface/70 p-5">
          <h2 className="text-sm font-semibold text-brand-dark">Asignar y orientar</h2>
          <form action={assignTicket} className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <select
              name="assigneeId"
              defaultValue={ticket.assignee_id || ""}
              className="flex-1 rounded-2xl border border-border bg-white px-3 py-3 text-sm outline-none ring-brand/30 focus:ring-2"
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
              className="rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Asignar
            </button>
          </form>

          <form action={addAdminNote} className="space-y-2">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <textarea
              name="body"
              required
              rows={3}
              placeholder="Indicación para el técnico asignado…"
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none ring-brand/30 focus:ring-2"
            />
            <button
              type="submit"
              className="rounded-2xl border border-border bg-white px-4 py-2.5 text-sm font-semibold hover:border-brand/40"
            >
              Enviar indicación
            </button>
          </form>
        </section>
      ) : (
        <TechnicianNotes comments={comments} />
      )}

      {admin && comments.length > 0 ? (
        <section className="rounded-3xl border border-border bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Indicaciones enviadas
          </h2>
          <ul className="mt-3 space-y-3 text-sm">
            {comments.map((c) => (
              <li key={c.id} className="rounded-2xl bg-surface/50 px-4 py-3">
                <p className="whitespace-pre-wrap">{c.body}</p>
                <p className="mt-1 text-xs text-muted">{formatDate(c.created_at)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {signed.length > 0 ? (
        <section className="rounded-3xl border border-border bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Evidencias
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {signed.map((att) => (
              <div
                key={att.id}
                className="overflow-hidden rounded-2xl border border-border bg-surface/40"
              >
                {att.kind === "image" && att.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={att.url}
                    alt={att.file_name}
                    className="h-48 w-full object-cover"
                  />
                ) : att.kind === "video" && att.url ? (
                  <video src={att.url} controls className="h-48 w-full object-cover" />
                ) : (
                  <div className="flex h-48 items-center justify-center text-sm text-muted">
                    {att.file_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
