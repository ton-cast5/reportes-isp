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
          ¿Sin internet o falla de servicio? Repórtalo aquí en menos de 1 minuto.
          No necesitas crear cuenta.
        </p>
      </header>

      <PublicReportForm />

      <div className="mt-6 space-y-3 text-center text-sm">
        <p className="text-muted">
          ¿Ya reportaste?{" "}
          <Link href="/consultar" className="font-medium text-brand hover:underline">
            Consulta el estado
          </Link>
        </p>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-2xl border border-border bg-white px-4 py-3 font-semibold text-brand-dark transition hover:border-brand/40"
        >
          Acceso técnicos →
        </Link>
      </div>
    </div>
  );
}
