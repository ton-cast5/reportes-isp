export type UserRole = "client" | "tecnico" | "admin";
export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting_customer"
  | "resolved"
  | "closed";
export type TicketPriority = "low" | "medium" | "high" | "critical";
export type AttachmentKind = "image" | "video" | "other";

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  account_number: string | null;
  address: string | null;
  zone: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

export type Ticket = {
  id: string;
  ticket_number: number;
  reporter_id: string | null;
  assignee_id: string | null;
  category_id: string | null;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  service_address: string | null;
  zone: string | null;
  lat: number | null;
  lng: number | null;
  preferred_visit_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  ticket_categories?: Pick<TicketCategory, "name"> | null;
  reporter?: Pick<Profile, "full_name" | "phone"> | null;
  assignee?: Pick<Profile, "full_name"> | null;
};

export type TicketAttachment = {
  id: string;
  ticket_id: string;
  uploaded_by: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  kind: AttachmentKind;
  created_at: string;
};

export type TicketComment = {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "role"> | null;
};

export type TicketStatusHistory = {
  id: string;
  ticket_id: string;
  changed_by: string | null;
  from_status: TicketStatus | null;
  to_status: TicketStatus;
  note: string | null;
  created_at: string;
};

export function isTeamRole(role?: UserRole | null) {
  return role === "tecnico" || role === "admin";
}

export function isAdminRole(role?: UserRole | null) {
  return role === "admin";
}
