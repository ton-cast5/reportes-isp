import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminInbox } from "@/components/admin-inbox";
import { TechnicianInbox } from "@/components/technician-inbox";
import { createClient } from "@/lib/supabase/server";
import {
  isAdminRole,
  isTeamRole,
  type Profile,
  type Ticket,
  type UserRole,
} from "@/lib/types";

type Vista = "nuevos" | "en-atencion" | "reparados";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const params = await searchParams;
  const vista = (params.vista as Vista) || "nuevos";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as UserRole | undefined;
  if (!isTeamRole(role)) redirect("/");

  const admin = isAdminRole(role);

  let query = supabase
    .from("tickets")
    .select(
      `
      *,
      ticket_categories(name),
      reporter:profiles!tickets_reporter_id_fkey(full_name, phone),
      assignee:profiles!tickets_assignee_id_fkey(full_name)
    `,
    )
    .order("created_at", { ascending: false });

  if (!admin) {
    query = query.eq("assignee_id", user.id);
  }

  const { data: tickets, error } = await query;
  const list = (tickets ?? []) as Ticket[];

  let tecnicos: Pick<Profile, "id" | "full_name">[] = [];
  if (admin) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "tecnico")
      .order("full_name");
    tecnicos = data ?? [];
  }

  return (
    <>
      {error ? (
        <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          No se pudieron cargar los tickets: {error.message}
        </p>
      ) : null}
      {admin ? (
        <AdminInbox tickets={list} tecnicos={tecnicos} vista={vista} />
      ) : (
        <TechnicianInbox tickets={list} />
      )}
    </>
  );
}
