import Navigation from "@/components/Navigation";
import { serveur } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await serveur().auth.getUser();

  // La page de connexion s'affiche seule, sans navigation.
  if (!user) return <>{children}</>;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <Navigation email={user.email ?? ""} />
      {children}
    </div>
  );
}
