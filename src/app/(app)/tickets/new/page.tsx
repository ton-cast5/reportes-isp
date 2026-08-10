import { redirect } from "next/navigation";

/** Los clientes reportan en / sin cuenta. */
export default function NewTicketRedirect() {
  redirect("/");
}
