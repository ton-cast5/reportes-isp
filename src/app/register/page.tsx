import { redirect } from "next/navigation";

/** Alta de técnicos: por ahora solo vía admin/SQL. */
export default function RegisterRedirect() {
  redirect("/login");
}
