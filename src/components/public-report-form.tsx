"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AttachmentKind, TicketCategory } from "@/lib/types";
import { formatTicketNumber } from "@/lib/labels";

const MAX_FILES = 4;
const MAX_SIZE = 50 * 1024 * 1024;

function kindFromMime(mime: string): AttachmentKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "other";
}

type Created = { id: string; ticket_number: number };

export function PublicReportForm() {
  const supabase = useMemo(() => createClient(), []);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [holderName, setHolderName] = useState("");
  const [phone, setPhone] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [zone, setZone] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);

  useEffect(() => {
    void supabase
      .from("ticket_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        const list = (data as TicketCategory[]) ?? [];
        setCategories(list);
        if (list[0]) setCategoryId(list[0].id);
      });
  }, [supabase]);

  function shareLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("Tu navegador no soporta ubicación.");
      return;
    }
    setGeoStatus("Obteniendo ubicación…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGeoStatus("Ubicación lista ✓");
      },
      () => setGeoStatus("No se pudo obtener ubicación. Escribe la dirección."),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!address.trim() && (lat == null || lng == null)) {
      setError("Comparte tu ubicación o escribe la dirección del servicio.");
      setLoading(false);
      return;
    }

    const { data, error: rpcError } = await supabase.rpc("submit_public_report", {
      p_service_holder_name: holderName.trim(),
      p_phone: phone.trim(),
      p_description: description.trim(),
      p_category_id: categoryId || null,
      p_service_address: address.trim() || null,
      p_zone: zone.trim() || null,
      p_lat: lat,
      p_lng: lng,
    });

    if (rpcError || !data?.[0]) {
      setError(rpcError?.message || "No se pudo enviar el reporte.");
      setLoading(false);
      return;
    }

    const row = data[0] as Created;

    for (const file of files) {
      const path = `public-reports/${row.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("ticket-evidence")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        setError(
          `Reporte creado, pero falló un archivo: ${uploadError.message}. Guarda tu número de ticket.`,
        );
        setCreated(row);
        setLoading(false);
        return;
      }

      await supabase.rpc("add_public_attachment", {
        p_ticket_id: row.id,
        p_storage_path: path,
        p_file_name: file.name,
        p_mime_type: file.type || "application/octet-stream",
        p_file_size: file.size,
        p_kind: kindFromMime(file.type),
      });
    }

    setCreated(row);
    setLoading(false);
  }

  if (created) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
          Reporte enviado
        </p>
        <p className="display mt-2 text-4xl font-semibold text-brand-dark">
          {formatTicketNumber(created.ticket_number)}
        </p>
        <p className="mt-3 text-sm text-muted">
          Guarda este número. Un técnico te contactará por WhatsApp o llamada.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/consultar?n=${created.ticket_number}`}
            className="rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Consultar estado
          </Link>
          <button
            type="button"
            onClick={() => {
              setCreated(null);
              setDescription("");
              setFiles([]);
              setLat(null);
              setLng(null);
              setGeoStatus(null);
            }}
            className="rounded-2xl border border-border px-4 py-3 text-sm font-semibold hover:border-brand/40"
          >
            Enviar otro reporte
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-3xl border border-border bg-white/95 p-5 shadow-sm sm:p-6"
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">
          Nombre a quien está el servicio
        </span>
        <input
          required
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
          placeholder="Como aparece en tu contrato / factura"
          autoComplete="name"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">
          WhatsApp / teléfono
        </span>
        <input
          required
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
          placeholder="Ej. 5512345678"
          autoComplete="tel"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Tipo de problema</span>
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
        <span className="mb-1.5 block text-sm font-medium">¿Qué está pasando?</span>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
          placeholder="Sin internet, luces del modem, desde cuándo…"
        />
      </label>

      <div className="rounded-2xl border border-dashed border-border bg-surface/30 p-4">
        <p className="text-sm font-medium">Ubicación del servicio</p>
        <p className="mt-1 text-xs text-muted">
          Comparte GPS o escribe la dirección. Con una de las dos basta.
        </p>
        <button
          type="button"
          onClick={shareLocation}
          className="mt-3 w-full rounded-2xl bg-brand/10 px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-brand/15"
        >
          {lat != null ? "Ubicación lista ✓ (tocar para actualizar)" : "Usar mi ubicación GPS"}
        </button>
        {geoStatus ? (
          <p className="mt-2 text-xs text-muted">{geoStatus}</p>
        ) : null}

        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm font-medium">Dirección</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none ring-brand/30 focus:ring-2"
            placeholder="Calle, número, referencias"
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm font-medium">Colonia / zona</span>
          <input
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none ring-brand/30 focus:ring-2"
            placeholder="Opcional"
          />
        </label>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium">
          Foto o video (opcional)
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          multiple
          onChange={(e) => {
            const next = [...files, ...Array.from(e.target.files || [])].slice(
              0,
              MAX_FILES,
            );
            if (next.some((f) => f.size > MAX_SIZE)) {
              setError("Algún archivo supera 50 MB.");
              return;
            }
            setError(null);
            setFiles(next);
          }}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-surface file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-dark"
        />
        {files.length > 0 ? (
          <ul className="mt-2 space-y-1 text-xs text-muted">
            {files.map((f) => (
              <li key={`${f.name}-${f.size}`}>{f.name}</li>
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
        className="w-full rounded-2xl bg-brand px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? "Enviando…" : "Enviar reporte"}
      </button>
    </form>
  );
}
