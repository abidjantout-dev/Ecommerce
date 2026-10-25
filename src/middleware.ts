import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Rafraîchit la session et ferme /admin aux visiteurs non connectés. */
export async function middleware(request: NextRequest) {
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

  if (chemin.startsWith("/admin") && chemin !== "/admin/connexion" && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/connexion";
    return NextResponse.redirect(url);
  }

  if (chemin === "/admin/connexion" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
