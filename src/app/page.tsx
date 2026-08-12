import Link from "next/link";
import { PublicReportForm } from "@/components/public-report-form";

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-lg font-semibold text-white shadow-lg shadow-brand/25">
          RI
        </div>
        <h1 className="display text-3xl font-semibold tracking-tight text-brand-dark sm:text-4xl">
          Reportes ISP
        </h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          ¿Sin internet? Repórtalo aquí. Sin cuenta, sin contraseña.
        </p>
      </header>

      <PublicReportForm />

      <Link
        href="/consultar"
        className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-brand px-4 py-3.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-brand-dark"
      >
        ¿Ya reportaste? Consulta el estado
      </Link>

      <p className="mt-10 text-center text-[11px] text-muted/70">
        <Link href="/login" className="hover:text-muted">
          Equipo
        </Link>
      </p>
    </div>
  );
}
