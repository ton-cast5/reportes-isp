"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isTeamRole, type TicketStatus, type UserRole } from "@/lib/types";

async function requireTeamUser() {
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

  if (!isTeamRole(profile?.role as UserRole | undefined)) {
    throw new Error("Solo técnicos o admin pueden hacer esto.");
  }

  return { supabase, user, role: profile!.role as UserRole };
}

export async function claimTicket(formData: FormData) {
  const ticketId = String(formData.get("ticketId") || "");
  if (!ticketId) return;

  const { supabase, user } = await requireTeamUser();

  await supabase
    .from("tickets")
    .update({
      assignee_id: user.id,
      status: "in_progress",
    })
    .eq("id", ticketId)
    .is("assignee_id", null);

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function assignTicket(formData: FormData) {
  const ticketId = String(formData.get("ticketId") || "");
  const assigneeId = String(formData.get("assigneeId") || "");
  if (!ticketId) return;

  const { supabase } = await requireTeamUser();

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

export async function updateTicketStatus(formData: FormData) {
  const ticketId = String(formData.get("ticketId") || "");
  const status = String(formData.get("status") || "") as TicketStatus;
  if (!ticketId || !status) return;

  const { supabase } = await requireTeamUser();

  await supabase.from("tickets").update({ status }).eq("id", ticketId);

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
