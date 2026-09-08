import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Verifica el JWT y refresca la sesión cuando corresponde.
  const {
    data: { claims },
  } = await supabase.auth.getClaims();

  const pathname = request.nextUrl.pathname;

  // Rutas que requieren autenticación.
  const protectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/perfil");

  // ----------------------------------------------------
  // 1. Usuario no autenticado
  // ----------------------------------------------------
  if (protectedRoute && !claims) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";

    return NextResponse.redirect(url);
  }

  // ----------------------------------------------------
  // 2. Usuario autenticado + 2FA activado
  //    pero todavía está en AAL1
  // ----------------------------------------------------
  if (protectedRoute && claims) {
    const {
      data: aalData,
      error: aalError,
    } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aalError) {
      console.error("Error comprobando MFA:", aalError.message);

      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "?error=mfa-check";

      return NextResponse.redirect(url);
    }

    const currentLevel = aalData?.currentLevel;
    const nextLevel = aalData?.nextLevel;

    // Tiene MFA configurado, pero todavía no
    // verificó el segundo factor en esta sesión.
    if (currentLevel === "aal1" && nextLevel === "aal2") {
      const url = request.nextUrl.clone();

      url.pathname = "/mfa";

      // Guardamos a dónde quería entrar.
      const destination =
        request.nextUrl.pathname + request.nextUrl.search;

      url.searchParams.set("next", destination);

      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}