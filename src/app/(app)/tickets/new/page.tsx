"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AttachmentKind, TicketCategory, TicketPriority } from "@/lib/types";
import { PRIORITY_LABELS } from "@/lib/labels";

const MAX_FILES = 5;
const MAX_SIZE = 50 * 1024 * 1024;

function kindFromMime(mime: string): AttachmentKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "other";
}

export default function NewTicketPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [zone, setZone] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const [{ data: cats }, { data: profile }] = await Promise.all([
        supabase
          .from("ticket_categories")
          .select("*")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("profiles")
          .select("full_name, phone, address, zone")
          .eq("id", user.id)
          .single(),
      ]);

      setCategories((cats as TicketCategory[]) ?? []);
      if (cats?.[0]) setCategoryId(cats[0].id);
      if (profile) {
        setContactName(profile.full_name || "");
        setContactPhone(profile.phone || "");
        setServiceAddress(profile.address || "");
        setZone(profile.zone || "");
      }
    }

    void load();
  }, [router, supabase]);

  function onFilesChange(selected: FileList | null) {
    if (!selected) return;
    const next = [...files, ...Array.from(selected)].slice(0, MAX_FILES);
    const invalid = next.find((f) => f.size > MAX_SIZE);
    if (invalid) {
      setError(`El archivo ${invalid.name} supera 50 MB.`);
      return;
    }
    setError(null);
    setFiles(next);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sesión expirada.");
      setLoading(false);
      return;
    }

    const { data: ticket, error: insertError } = await supabase
      .from("tickets")
      .insert({
        reporter_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId || null,
        priority,
        contact_name: contactName.trim() || null,
        contact_phone: contactPhone.trim() || null,
        contact_email: user.email,
        service_address: serviceAddress.trim() || null,
        zone: zone.trim() || null,
      })
      .select("id")
      .single();

    if (insertError || !ticket) {
      setError(insertError?.message || "No se pudo crear el ticket.");
      setLoading(false);
      return;
    }

    for (const file of files) {
      const path = `${user.id}/${ticket.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("ticket-evidence")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        setError(`Ticket creado, pero falló un archivo: ${uploadError.message}`);
        setLoading(false);
        router.push(`/tickets/${ticket.id}`);
        return;
      }

      await supabase.from("ticket_attachments").insert({
        ticket_id: ticket.id,
        uploaded_by: user.id,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        file_size: file.size,
        kind: kindFromMime(file.type),
      });
    }

    setLoading(false);
    router.push(`/tickets/${ticket.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/tickets" className="text-sm text-brand hover:underline">
          ← Volver
        </Link>
        <h1 className="display mt-3 text-3xl font-semibold tracking-tight text-brand-dark">
          Nuevo reporte
        </h1>
        <p className="mt-1 text-sm text-muted">
          Describe el problema y adjunta fotos o videos si los tienes.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-3xl border border-border bg-white/90 p-6 shadow-sm"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Título</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
            placeholder="Ej. Sin internet desde esta mañana"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Descripción</span>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
            placeholder="Qué ocurre, desde cuándo, luces del equipo, reinicios intentados…"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Categoría</span>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Prioridad</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
            >
              {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((key) => (
                <option key={key} value={key}>
                  {PRIORITY_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Contacto</span>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Teléfono</span>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Dirección del servicio</span>
          <input
            value={serviceAddress}
            onChange={(e) => setServiceAddress(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Zona / colonia</span>
          <input
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-medium">
            Evidencias (fotos o videos, máx. {MAX_FILES})
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            multiple
            onChange={(e) => onFilesChange(e.target.files)}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-surface file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-dark"
          />
          {files.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {files.map((f) => (
                <li key={`${f.name}-${f.size}`}>
                  {f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? "Enviando…" : "Enviar reporte"}
        </button>
      </form>
    </div>
  );
}
