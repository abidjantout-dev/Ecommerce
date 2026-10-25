import { serveur } from "@/lib/supabase/server";
import Commandes from "@/components/Commandes";
import type { Order, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PageCommandes() {
  const supabase = serveur();

  const [{ data: commandes }, { data: produits }] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("products").select("*"),
  ]);

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
