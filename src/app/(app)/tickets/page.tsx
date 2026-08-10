import { redirect } from "next/navigation";
import { TechnicianInbox } from "@/components/technician-inbox";
import { createClient } from "@/lib/supabase/server";
import { isTeamRole, type Ticket, type UserRole } from "@/lib/types";

type Vista = "todos" | "sin-asignar" | "mios" | "abiertos";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const params = await searchParams;
  const vista = (params.vista as Vista) || "abiertos";

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
  if (!isTeamRole(role)) {
    redirect("/");
  }

  const { data: tickets, error } = await supabase
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

  const list = (tickets ?? []) as Ticket[];

  return (
    <>
      {error ? (
        <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          No se pudieron cargar los tickets: {error.message}
        </p>
      ) : null}
      <TechnicianInbox tickets={list} userId={user.id} vista={vista} />
    </>
  );
}
