import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(app)/actions";

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <header className="border-b border-border/80 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/tickets" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-sm font-semibold text-white shadow-sm shadow-brand/30">
            RI
          </span>
          <div>
            <p className="display text-lg font-semibold tracking-tight text-brand-dark">
              Reportes ISP
            </p>
            <p className="text-xs text-muted">Soporte y seguimiento</p>
          </div>
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground">
                {profile?.full_name || user.email}
              </p>
              <p className="text-xs capitalize text-muted">{profile?.role}</p>
            </div>
            <Link
              href="/profile"
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground transition hover:border-brand/40 hover:text-brand"
            >
              Perfil
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-700"
              >
                Salir
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
