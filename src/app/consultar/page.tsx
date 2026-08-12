"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CLIENT_STATUS_COPY,
  formatDate,
  formatTicketNumber,
} from "@/lib/labels";
import type { TicketStatus } from "@/lib/types";
import { Suspense } from "react";

type LookupRow = {
  ticket_number: number;
  title: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  category_name: string | null;
};

function ConsultarForm() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [ticketNumber, setTicketNumber] = useState(searchParams.get("n") || "");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<LookupRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const { data, error: rpcError } = await supabase.rpc("lookup_public_ticket", {
      p_ticket_number: Number(ticketNumber),
      p_phone: phone.trim(),
    });

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const row = (data as LookupRow[] | null)?.[0];
    if (!row) {
      setError("No encontramos ese reporte. Revisa el número y el teléfono.");
      return;
    }

    setResult(row);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-10">
      <Link href="/" className="mb-6 text-sm text-brand hover:underline">
        ← Nuevo reporte
      </Link>
      <h1 className="display text-3xl font-semibold tracking-tight text-brand-dark">
        ¿Cómo va mi reporte?
      </h1>
      <p className="mt-2 text-sm text-muted">
        Pon el número que te dimos y el mismo teléfono del reporte.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 space-y-4 rounded-3xl border border-border bg-white/95 p-6"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Número de ticket</span>
          <input
            required
            inputMode="numeric"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
            placeholder="00001"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Teléfono</span>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
          />
        </label>
        {error ? (
          <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? "Buscando…" : "Ver estado"}
        </button>
      </form>

      {result ? (
        <div className="mt-4 rounded-3xl border border-border bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-muted">
            {formatTicketNumber(result.ticket_number)}
            {result.category_name ? ` · ${result.category_name}` : ""}
          </p>
          <p className="mt-1 text-lg font-semibold">{result.title}</p>
          <p className="mt-3 text-base font-semibold text-brand-dark">
            {CLIENT_STATUS_COPY[result.status]}
          </p>
          <p className="mt-1 text-xs text-muted">
            Actualizado {formatDate(result.updated_at)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function ConsultarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
          Cargando…
        </div>
      }
    >
      <ConsultarForm />
    </Suspense>
  );
}
