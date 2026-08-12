import { mapsSearchUrl, mapsUrl } from "@/lib/maps";
import { whatsappUrl } from "@/lib/phone";
import { formatTicketNumber } from "@/lib/labels";
import type { Ticket } from "@/lib/types";

const BRAND = "INTERNET SP";

export function ticketMapUrl(ticket: Ticket) {
  if (ticket.lat != null && ticket.lng != null) {
    return mapsUrl(ticket.lat, ticket.lng);
  }
  if (ticket.service_address) {
    return mapsSearchUrl(
      [ticket.service_address, ticket.zone].filter(Boolean).join(", "),
    );
  }
  return null;
}

export function ticketWhatsAppUrl(ticket: Ticket) {
  if (!ticket.contact_phone) return null;

  const name = (ticket.contact_name || "cliente").trim();
  const number = formatTicketNumber(ticket.ticket_number);
  const subject = (ticket.title || ticket.description || "reporte de servicio")
    .trim()
    .replace(/\s+/g, " ");

  const message = [
    `Buen día, ${name}.`,
    "",
    `Le contactamos del área de soporte técnico de ${BRAND} respecto a su reporte de servicio ${number}, con asunto: ${subject}.`,
    "",
    "Quedamos atentos para apoyar en la revisión y restablecimiento de su conexión.",
    "",
    "Saludos cordiales.",
  ].join("\n");

  return whatsappUrl(ticket.contact_phone, message);
}
