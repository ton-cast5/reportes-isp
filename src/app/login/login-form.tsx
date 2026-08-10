"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() => {
    if (searchParams.get("error") === "no-team") {
      return "Esa cuenta no es de técnico. Usa la cuenta del equipo (ej. tony).";
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Por si quedó otra sesión pegada
    await supabase.auth.signOut();

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(
        signInError.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : signInError.message,
      );
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      setError("No se pudo iniciar sesión.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.role !== "tecnico" && profile?.role !== "admin") {
      await supabase.auth.signOut();
      setLoading(false);
      setError(
        "Esta cuenta no tiene rol de técnico. Pide al admin que te active el acceso.",
      );
      return;
    }

    setLoading(false);
    router.replace("/tickets");
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
          Entra con tu correo de técnico. Los clientes no usan esta pantalla.
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
            placeholder="tecnico@tuisp.com"
            autoComplete="email"
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
            autoComplete="current-password"
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
          {loading ? "Entrando…" : "Entrar a la bandeja"}
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
