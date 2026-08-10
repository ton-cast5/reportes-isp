import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute =
    path.startsWith("/login") || path.startsWith("/register");
  const isTeamRoute =
    path.startsWith("/tickets") || path.startsWith("/profile");

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = profile?.role ?? null;
  }

  const isTeam = role === "tecnico" || role === "admin";

  if (!user && isTeamRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Cuenta sin rol técnico intentando entrar al panel
  if (user && isTeamRoute && !isTeam) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "no-team");
    return NextResponse.redirect(url);
  }

  // Solo redirigir login → bandeja si YA eres técnico
  if (user && isAuthRoute && isTeam) {
    const url = request.nextUrl.clone();
    url.pathname = "/tickets";
    return NextResponse.redirect(url);
  }

  // Técnico en la home pública → bandeja
  if (user && path === "/" && isTeam) {
    const url = request.nextUrl.clone();
    url.pathname = "/tickets";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
