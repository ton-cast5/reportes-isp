"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  assignTicket,
  claimTicket,
  updateTicketStatus,
} from "@/app/(app)/actions";
import { StatusBadge } from "@/components/badges";
import {
  ROLE_LABELS,
  STATUS_LABELS,
  formatDate,
  formatTicketNumber,
} from "@/lib/labels";
import { mapsSearchUrl, mapsUrl } from "@/lib/maps";
import { telUrl, whatsappUrl } from "@/lib/phone";
import { createClient } from "@/lib/supabase/client";
import {
  isTeamRole,
  type Profile,
  type Ticket,
  type TicketAttachment,
  type TicketComment,
  type TicketStatus,
  type TicketStatusHistory,
  type UserRole,
} from "@/lib/types";

type SignedAttachment = TicketAttachment & { url: string | null };

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [pending, startTransition] = useTransition();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [attachments, setAttachments] = useState<SignedAttachment[]>([]);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [history, setHistory] = useState<TicketStatusHistory[]>([]);
  const [tecnicos, setTecnicos] = useState<Pick<Profile, "id" | "full_name">[]>(
    [],
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("client");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<TicketStatus>("open");
  const [assigneeId, setAssigneeId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const team = isTeamRole(role);

  async function load() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const currentRole = (profile?.role as UserRole) || "client";
    setRole(currentRole);

    if (!isTeamRole(currentRole)) {
      setError("Solo el equipo técnico puede ver este panel.");
      setLoading(false);
      return;
    }

    const { data: ticketData, error: ticketError } = await supabase
      .from("tickets")
      .select(
        `
        *,
        ticket_categories(name),
        reporter:profiles!tickets_reporter_id_fkey(full_name, phone),
        assignee:profiles!tickets_assignee_id_fkey(full_name)
      `,
      )
      .eq("id", params.id)
      .single();

    if (ticketError || !ticketData) {
      setError(ticketError?.message || "Ticket no encontrado");
      setLoading(false);
      return;
    }

    const t = ticketData as Ticket;
    setTicket(t);
    setStatus(t.status);
    setAssigneeId(t.assignee_id || "");

    const [{ data: atts }, { data: cmts }, { data: hist }, { data: teamMembers }] =
      await Promise.all([
        supabase
          .from("ticket_attachments")
          .select("*")
          .eq("ticket_id", params.id)
          .order("created_at"),
        supabase
          .from("ticket_comments")
          .select("*, profiles(full_name, role)")
          .eq("ticket_id", params.id)
          .order("created_at"),
        supabase
          .from("ticket_status_history")
          .select("*")
          .eq("ticket_id", params.id)
          .order("created_at"),
        supabase
          .from("profiles")
          .select("id, full_name")
          .in("role", ["tecnico", "admin"])
          .order("full_name"),
      ]);

    setTecnicos(teamMembers ?? []);

    const withUrls: SignedAttachment[] = [];
    for (const att of (atts as TicketAttachment[]) ?? []) {
      const { data } = await supabase.storage
        .from("ticket-evidence")
        .createSignedUrl(att.storage_path, 3600);
      withUrls.push({ ...att, url: data?.signedUrl ?? null });
    }

    setAttachments(withUrls);
    setComments((cmts as TicketComment[]) ?? []);
    setHistory((hist as TicketStatusHistory[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function onComment(e: FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !ticket || !userId) return;
    setSaving(true);

    const { error: insertError } = await supabase.from("ticket_comments").insert({
      ticket_id: ticket.id,
      author_id: userId,
      body: comment.trim(),
      is_internal: false,
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setComment("");
    await load();
  }

  if (loading) {
    return <p className="text-sm text-muted">Cargando ticket…</p>;
  }

  if (!ticket) {
    return (
      <div className="space-y-3">
        <Link href="/tickets" className="text-sm text-brand hover:underline">
          ← Volver
        </Link>
        <p className="text-rose-700">{error || "Ticket no encontrado"}</p>
      </div>
    );
  }

  const canClaim = team && !ticket.assignee_id;
  const wa = ticket.contact_phone
    ? whatsappUrl(
        ticket.contact_phone,
        `Hola ${ticket.contact_name || ""}, somos soporte ISP. Sobre tu reporte ${formatTicketNumber(ticket.ticket_number)}.`,
      )
    : null;
  const call = ticket.contact_phone ? telUrl(ticket.contact_phone) : null;
  const map =
    ticket.lat != null && ticket.lng != null
      ? mapsUrl(ticket.lat, ticket.lng)
      : ticket.service_address
        ? mapsSearchUrl(
            [ticket.service_address, ticket.zone].filter(Boolean).join(", "),
          )
        : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/tickets" className="text-sm text-brand hover:underline">
          ← Bandeja
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
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
            <p className="mt-1 text-sm text-muted">{ticket.title}</p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            WhatsApp {ticket.contact_phone}
          </a>
        ) : null}
        {call ? (
          <a
            href={call}
            className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold hover:border-brand/40"
          >
            Llamar
          </a>
        ) : null}
        {map ? (
          <a
            href={map}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold hover:border-brand/40"
          >
            Abrir mapa
          </a>
        ) : null}
        {canClaim ? (
          <form
            action={(fd) => {
              startTransition(async () => {
                await claimTicket(fd);
                await load();
                router.refresh();
              });
            }}
          >
            <input type="hidden" name="ticketId" value={ticket.id} />
            <button
              type="submit"
              disabled={pending}
              className="rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              Tomar ticket
            </button>
          </form>
        ) : null}
      </div>

      <section className="rounded-3xl border border-border bg-white/90 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Problema
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-foreground">{ticket.description}</p>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Titular del servicio</dt>
            <dd className="font-medium">{ticket.contact_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Teléfono / WhatsApp</dt>
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

      <section className="space-y-4 rounded-3xl border border-brand/20 bg-surface/60 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-dark">
          Gestión rápida
        </h2>

        <form
          className="grid gap-3 sm:grid-cols-[1fr_auto]"
          action={(fd) => {
            startTransition(async () => {
              await assignTicket(fd);
              await load();
              router.refresh();
            });
          }}
        >
          <input type="hidden" name="ticketId" value={ticket.id} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Asignar técnico</span>
            <select
              name="assigneeId"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none ring-brand/30 focus:ring-2"
            >
              <option value="">Sin asignar</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name || t.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={pending}
            className="self-end rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold hover:border-brand/40 disabled:opacity-60"
          >
            Guardar
          </button>
        </form>

        <form
          className="grid gap-3 sm:grid-cols-[1fr_auto]"
          action={(fd) => {
            startTransition(async () => {
              await updateTicketStatus(fd);
              await load();
              router.refresh();
            });
          }}
        >
          <input type="hidden" name="ticketId" value={ticket.id} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Estado</span>
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TicketStatus)}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none ring-brand/30 focus:ring-2"
            >
              {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((key) => (
                <option key={key} value={key}>
                  {STATUS_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={pending}
            className="self-end rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            Actualizar
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-border bg-white/90 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Evidencias
        </h2>
        {attachments.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Sin archivos.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {attachments.map((att) => (
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
                <p className="truncate px-3 py-2 text-xs text-muted">{att.file_name}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-white/90 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Notas del equipo
        </h2>
        <ul className="mt-4 space-y-3">
          {comments.length === 0 ? (
            <li className="text-sm text-muted">Sin notas aún.</li>
          ) : (
            comments.map((c) => (
              <li key={c.id} className="rounded-2xl bg-surface/50 px-4 py-3">
                <p className="text-xs text-muted">
                  {c.profiles?.full_name || "Usuario"}
                  {c.profiles?.role ? ` · ${ROLE_LABELS[c.profiles.role]}` : ""}
                  {" · "}
                  {formatDate(c.created_at)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
              </li>
            ))
          )}
        </ul>

        <form onSubmit={onComment} className="mt-4 space-y-3">
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Nota interna o seguimiento…"
            className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
          />
          <button
            type="submit"
            disabled={saving || !comment.trim()}
            className="rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            Guardar nota
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-border bg-white/90 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Historial
        </h2>
        <ul className="mt-4 space-y-2 text-sm">
          {history.map((h) => (
            <li key={h.id} className="flex flex-wrap gap-2 text-muted">
              <span>{formatDate(h.created_at)}</span>
              <span>·</span>
              <span>
                {h.from_status ? STATUS_LABELS[h.from_status] : "Creado"} →{" "}
                {STATUS_LABELS[h.to_status]}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
