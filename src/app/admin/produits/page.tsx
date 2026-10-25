import { serveur } from "@/lib/supabase/server";
import Produits from "@/components/Produits";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PageProduits() {
  const { data, error } = await (await serveur()).from("products").select("*").order("created_at");
  if (error) throw new Error("Catalogue indisponible");
  return <main><Produits initiaux={(data ?? []) as Product[]} /></main>;
}
