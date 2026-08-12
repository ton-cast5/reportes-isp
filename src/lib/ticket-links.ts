import { mapsSearchUrl, mapsUrl } from "@/lib/maps";
import { whatsappUrl } from "@/lib/phone";
import { formatTicketNumber } from "@/lib/labels";
import type { Ticket } from "@/lib/types";

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
  return whatsappUrl(
    ticket.contact_phone,
    `Hola ${ticket.contact_name || ""}, somos soporte ISP. Te escribimos por tu reporte ${formatTicketNumber(ticket.ticket_number)}.`,
  );
}

export function ticketRepairedWhatsAppUrl(ticket: Ticket) {
  if (!ticket.contact_phone) return null;
  return whatsappUrl(
    ticket.contact_phone,
    `Hola ${ticket.contact_name || ""}, tu servicio ya quedó reparado. Ticket ${formatTicketNumber(ticket.ticket_number)}. ¡Gracias!`,
  );
}
