import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function serveur() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (liste) => {
          try {
            liste.forEach(({ name, value, options }) => jar.set(name, value, options));
          } catch {
            // appelé depuis un Server Component : le middleware rafraîchit déjà la session
          }
        },
      },
    }
  );
}
