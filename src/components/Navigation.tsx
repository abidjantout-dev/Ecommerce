"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { navigateur } from "@/lib/supabase/client";

const ONGLETS = [
  ["/admin", "Commandes"],
  ["/admin/produits", "Produits"],
  ["/admin/depenses", "Dépenses"],
  ["/admin/marges", "Marges"],
];

export default function Navigation({ email }: { email: string }) {
  const chemin = usePathname();
  const router = useRouter();

  async function sortir() {
    await navigateur().auth.signOut();
    router.replace("/admin/connexion");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 -mx-4 mb-6 border-b border-bord bg-nuit/95 px-4 pb-3 pt-5 backdrop-blur">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display text-lg font-black">Moïva</span>
        <button onClick={sortir} className="text-xs text-texte-doux underline underline-offset-2">
          Déconnexion
        </button>
      </div>
      <p className="mt-0.5 truncate text-xs text-texte-doux">{email}</p>

      <nav className="mt-3 flex gap-1.5 overflow-x-auto">
        {ONGLETS.map(([href, libelle]) => {
          const actif = chemin === href;
          return (
            <Link key={href} href={href}
              className={
                "whitespace-nowrap rounded-full px-3.5 py-1.5 font-display text-sm font-bold transition " +
                (actif ? "bg-phare text-nuit" : "border border-bord text-texte-doux hover:text-texte")
              }>
              {libelle}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
