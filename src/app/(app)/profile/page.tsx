"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/labels";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [address, setAddress] = useState("");
  const [zone, setZone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email || "");
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !data) {
        setError(profileError?.message || "No se pudo cargar el perfil");
        setLoading(false);
        return;
      }

      const p = data as Profile;
      setProfile(p);
      setFullName(p.full_name || "");
      setPhone(p.phone || "");
      setAccountNumber(p.account_number || "");
      setAddress(p.address || "");
      setZone(p.zone || "");
      setLoading(false);
    }

    void load();
  }, [router, supabase]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        account_number: accountNumber.trim() || null,
        address: address.trim() || null,
        zone: zone.trim() || null,
      })
      .eq("id", profile.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Perfil actualizado.");
  }

  if (loading) {
    return <p className="text-sm text-muted">Cargando perfil…</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="display text-3xl font-semibold tracking-tight text-brand-dark">
          Mi perfil
        </h1>
        <p className="mt-1 text-sm text-muted">
          {email}
          {profile ? ` · ${ROLE_LABELS[profile.role]}` : ""}
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-3xl border border-border bg-white/90 p-6"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Nombre</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Teléfono</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Número de cuenta</span>
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Dirección</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Zona</span>
          <input
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 outline-none ring-brand/30 focus:ring-2"
          />
        </label>

        {error ? (
          <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
