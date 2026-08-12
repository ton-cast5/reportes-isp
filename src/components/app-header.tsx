import Link from "next/link";
import { signOut } from "@/app/(app)/actions";
import { ROLE_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole, type UserRole } from "@/lib/types";

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

  const role = profile?.role as UserRole | undefined;
  const admin = isAdminRole(role);

  return (
    <header className="border-b border-border/80 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/tickets" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-sm font-semibold text-white shadow-sm shadow-brand/30">
            RI
          </span>
          <div>
            <p className="display text-lg font-semibold tracking-tight text-brand-dark">
              Reportes ISP
            </p>
            <p className="text-xs text-muted">
              {admin ? "Panel admin" : "Tus visitas"}
            </p>
          </div>
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">
                {profile?.full_name || user.email}
              </p>
              <p className="text-xs text-muted">
                {role ? ROLE_LABELS[role] : "—"}
              </p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700"
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
