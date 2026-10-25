import { redirect } from "next/navigation";
import { serveur } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** La racine mène au premier produit actif. */
export default async function Accueil() {
  const supabase = await serveur();
  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error("Catalogue indisponible");
  if (data?.slug) redirect(`/p/${data.slug}`);

  return (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-black">Boutique en préparation</h1>
      <p className="mt-3 text-texte-doux">
        Aucun produit n&apos;est encore en ligne. Ajoutez-en un depuis le tableau de bord.
      </p>
      <a href="/admin" className="mt-6 inline-block rounded-xl bg-phare px-5 py-3 font-display font-black text-nuit">
        Ouvrir le tableau de bord
      </a>
    </main>
  );
}
