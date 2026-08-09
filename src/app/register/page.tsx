"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/site-url";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        data: {
          full_name: fullName,
          phone,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!data.session) {
      setSuccess(
        "Cuenta creada. Revisa tu correo para confirmar el acceso e inicia sesión.",
      );
      return;
    }

    router.push("/tickets");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="display text-3xl font-semibold tracking-tight text-brand-dark">
          Crear cuenta
        </h1>
        <p className="mt-2 text-sm text-muted">
          Regístrate para reportar fallas y dar seguimiento.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-3xl border border-border bg-white/90 p-6 shadow-sm shadow-teal-900/5"
      >
        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-medium">Nombre completo</span>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface/50 px-4 py-3 outline-none ring-brand/30 transition focus:ring-2"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-medium">Teléfono</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface/50 px-4 py-3 outline-none ring-brand/30 transition focus:ring-2"
            placeholder="Opcional"
          />
        </label>

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

        {success ? (
          <p className="mb-4 rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? "Creando…" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
