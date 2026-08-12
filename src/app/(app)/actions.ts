"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole, isTeamRole, type UserRole } from "@/lib/types";

async function requireUser() {
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
    throw new Error("Sin permiso.");
  }

  return { supabase, user, role: role! };
}

export async function assignTicket(formData: FormData) {
  const ticketId = String(formData.get("ticketId") || "");
  const assigneeId = String(formData.get("assigneeId") || "");
  if (!ticketId) return;

  const { supabase, role } = await requireUser();
  if (!isAdminRole(role)) {
    throw new Error("Solo el admin asigna tickets.");
  }

  await supabase
    .from("tickets")
    .update({
      assignee_id: assigneeId || null,
      status: assigneeId ? "in_progress" : "open",
    })
    .eq("id", ticketId);

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function addAdminNote(formData: FormData) {
  const ticketId = String(formData.get("ticketId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!ticketId || !body) return;

  const { supabase, user, role } = await requireUser();
  if (!isAdminRole(role)) {
    throw new Error("Solo el admin deja indicaciones.");
  }

  await supabase.from("ticket_comments").insert({
    ticket_id: ticketId,
    author_id: user.id,
    body,
    is_internal: true,
  });

  revalidatePath(`/tickets/${ticketId}`);
}

export async function markRepaired(formData: FormData) {
  const ticketId = String(formData.get("ticketId") || "");
  if (!ticketId) return;

  const { supabase, user, role } = await requireUser();

  if (isAdminRole(role)) {
    await supabase
      .from("tickets")
      .update({ status: "resolved" })
      .eq("id", ticketId);
  } else {
    await supabase
      .from("tickets")
      .update({ status: "resolved" })
      .eq("id", ticketId)
      .eq("assignee_id", user.id);
  }

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
