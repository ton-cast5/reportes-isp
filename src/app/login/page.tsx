import { Suspense } from "react";
import LoginForm from "./login-form";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted">
          Cargando…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
