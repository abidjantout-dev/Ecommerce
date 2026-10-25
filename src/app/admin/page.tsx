import { toutes } from "@/lib/supabase/all";
import { serveur } from "@/lib/supabase/server";
import Commandes from "@/components/Commandes";
import type { Order, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PageCommandes() {
  const supabase = await serveur();

  const [commandes, produits] = await Promise.all([
    toutes<Order>(supabase, "orders"), toutes<Product>(supabase, "products"),
  ]);
  commandes.sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <main>
      <h1 className="mb-4 font-display text-2xl font-black">Commandes</h1>
      <Commandes
        initiales={(commandes ?? []) as Order[]}
        produits={(produits ?? []) as Product[]}
      />
    </main>
  );
}
