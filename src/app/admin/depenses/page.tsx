import { toutes } from "@/lib/supabase/all";
import { serveur } from "@/lib/supabase/server";
import Depenses from "@/components/Depenses";
import type { Expense, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PageDepenses() {
  const supabase = await serveur();
  const [depenses, produits] = await Promise.all([
    toutes<Expense>(supabase, "expenses"), toutes<Product>(supabase, "products"),
  ]);
  depenses.sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <main>
      <Depenses
        initiales={(depenses ?? []) as Expense[]}
        produits={(produits ?? []) as Product[]}
      />
    </main>
  );
}
