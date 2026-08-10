"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/tickets");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-lg font-semibold text-white shadow-lg shadow-brand/25">
          RI
        </div>
        <h1 className="display text-3xl font-semibold tracking-tight text-brand-dark">
          Acceso técnicos
        </h1>
        <p className="mt-2 text-sm text-muted">
          Solo personal del ISP. Los clientes reportan sin cuenta en la inicio.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-3xl border border-border bg-white/90 p-6 shadow-sm shadow-teal-900/5"
      >
        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-medium">Correo</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface/50 px-4 py-3 outline-none ring-brand/30 transition focus:ring-2"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-medium">Contraseña</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface/50 px-4 py-3 outline-none ring-brand/30 transition focus:ring-2"
          />
        </label>

        {error ? (
          <p className="mb-4 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/" className="font-medium text-brand hover:underline">
          ← Volver al reporte de clientes
        </Link>
      </p>
    </div>
  );
}
