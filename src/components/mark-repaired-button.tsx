"use client";

import { useTransition } from "react";
import { markRepaired } from "@/app/(app)/actions";
import { ticketRepairedWhatsAppUrl } from "@/lib/ticket-links";
import type { Ticket } from "@/lib/types";

export function MarkRepairedButton({ ticket }: { ticket: Ticket }) {
  const [pending, startTransition] = useTransition();
  const wa = ticketRepairedWhatsAppUrl(ticket);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const fd = new FormData();
        fd.set("ticketId", ticket.id);
        startTransition(async () => {
          await markRepaired(fd);
          if (wa) window.open(wa, "_blank", "noopener,noreferrer");
        });
      }}
      className="w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Guardando…" : "Ya lo reparé"}
    </button>
  );
}
