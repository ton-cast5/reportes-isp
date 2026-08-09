"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import {
  STATUS_LABELS,
  formatDate,
  formatTicketNumber,
} from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";
import type {
  Ticket,
  TicketAttachment,
  TicketComment,
  TicketStatus,
  TicketStatusHistory,
  UserRole,
} from "@/lib/types";

type SignedAttachment = TicketAttachment & { url: string | null };

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [attachments, setAttachments] = useState<SignedAttachment[]>([]);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [history, setHistory] = useState<TicketStatusHistory[]>([]);
  const [role, setRole] = useState<UserRole>("client");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<TicketStatus>("open");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isStaff = role === "staff" || role === "admin";

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role) setRole(profile.role as UserRole);

    const { data: ticketData, error: ticketError } = await supabase
      .from("tickets")
      .select("*, ticket_categories(name)")
      .eq("id", params.id)
      .single();

    if (ticketError || !ticketData) {
      setError(ticketError?.message || "Ticket no encontrado");
      setLoading(false);
      return;
    }

    setTicket(ticketData as Ticket);
    setStatus((ticketData as Ticket).status);

    const [{ data: atts }, { data: cmts }, { data: hist }] = await Promise.all([
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
    ]);

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
    if (!comment.trim() || !ticket) return;
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: insertError } = await supabase.from("ticket_comments").insert({
      ticket_id: ticket.id,
      author_id: user.id,
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

  async function onStatusUpdate(e: FormEvent) {
    e.preventDefault();
    if (!ticket || !isStaff) return;
    setSaving(true);

    const { error: updateError } = await supabase
      .from("tickets")
      .update({ status })
      .eq("id", ticket.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/tickets" className="text-sm text-brand hover:underline">
          ← Volver
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
              {ticket.title}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <section className="rounded-3xl border border-border bg-white/90 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Detalle
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-foreground">{ticket.description}</p>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Contacto</dt>
            <dd>{ticket.contact_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Teléfono</dt>
            <dd>{ticket.contact_phone || "—"}</dd>
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
            <dt className="text-muted">Creado</dt>
            <dd>{formatDate(ticket.created_at)}</dd>
          </div>
          <div>
            <dt className="text-muted">Actualizado</dt>
            <dd>{formatDate(ticket.updated_at)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-3xl border border-border bg-white/90 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Evidencias
        </h2>
        {attachments.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Sin archivos adjuntos.</p>
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

      {isStaff ? (
        <form
          onSubmit={onStatusUpdate}
          className="flex flex-col gap-3 rounded-3xl border border-border bg-white/90 p-6 sm:flex-row sm:items-end"
        >
          <label className="block flex-1">
            <span className="mb-1.5 block text-sm font-medium">Cambiar estado</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TicketStatus)}
              className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
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
            disabled={saving}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            Guardar estado
          </button>
        </form>
      ) : null}

      <section className="rounded-3xl border border-border bg-white/90 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Comentarios
        </h2>
        <ul className="mt-4 space-y-3">
          {comments.length === 0 ? (
            <li className="text-sm text-muted">Aún no hay comentarios.</li>
          ) : (
            comments.map((c) => (
              <li key={c.id} className="rounded-2xl bg-surface/50 px-4 py-3">
                <p className="text-xs text-muted">
                  {c.profiles?.full_name || "Usuario"} · {formatDate(c.created_at)}
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
            placeholder="Escribe una actualización o pregunta…"
            className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
          />
          <button
            type="submit"
            disabled={saving || !comment.trim()}
            className="rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            Publicar comentario
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-border bg-white/90 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Historial de estados
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
