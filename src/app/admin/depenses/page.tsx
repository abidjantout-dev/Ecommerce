import { serveur } from "@/lib/supabase/server";
import Depenses from "@/components/Depenses";
import type { Expense, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PageDepenses() {
  const supabase = serveur();
  const [{ data: depenses }, { data: produits }] = await Promise.all([
    supabase.from("expenses").select("*").order("spent_on", { ascending: false }),
    supabase.from("products").select("*"),
  ]);

  return (
    <main>
      <Depenses
        initiales={(depenses ?? []) as Expense[]}
        produits={(produits ?? []) as Product[]}
      />
    </main>
  );
}
