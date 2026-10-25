import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Rafraîchit la session et ferme /admin aux visiteurs non connectés. */
export async function middleware(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return new NextResponse("Configuration Supabase manquante. Consultez .env.example.", { status: 503 });
  }
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (liste) => {
          liste.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          liste.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const chemin = request.nextUrl.pathname;
  const { data: admin } = user ? await supabase.rpc("is_admin") : { data: false };
  if (user && !admin && chemin !== "/admin/connexion") {
    return new NextResponse("Accès réservé aux administrateurs.", { status: 403 });
  }

  if (chemin.startsWith("/admin") && chemin !== "/admin/connexion" && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/connexion";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach(c => redirect.cookies.set(c));
    return redirect;
  }

  if (chemin === "/admin/connexion" && user && admin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach(c => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
