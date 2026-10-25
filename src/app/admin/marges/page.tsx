import { serveur } from "@/lib/supabase/server";
import { fcfa } from "@/lib/format";
import { margeBrute } from "@/lib/pricing";
import type { Expense, Order, Product } from "@/lib/types";
import Statistique from "@/components/Statistique";

export const dynamic = "force-dynamic";

export default async function PageMarges() {
  const supabase = serveur();
  const [{ data: o }, { data: p }, { data: e }] = await Promise.all([
    supabase.from("orders").select("*"),
    supabase.from("products").select("*"),
    supabase.from("expenses").select("*"),
  ]);

  const commandes = (o ?? []) as Order[];
  const produits = (p ?? []) as Product[];
  const depenses = (e ?? []) as Expense[];

  const livrees = commandes.filter((c) => c.status === "livree");
  const parId = Object.fromEntries(produits.map((x) => [x.id, x])) as Record<string, Product>;

  const encaisse = livrees.reduce((s, c) => s + c.total, 0);
  const coutPieces = livrees.reduce(
    (s, c) => s + (parId[c.product_id]?.cost_price ?? 0) * c.qty, 0);
  const coutLivraison = livrees.reduce(
    (s, c) => s + (parId[c.product_id]?.delivery_cost ?? 0), 0);
  const brute = encaisse - coutPieces - coutLivraison;

  const pub = depenses.filter((d) => d.kind === "pub").reduce((s, d) => s + d.amount, 0);
  const autres = depenses.filter((d) => d.kind !== "pub" && d.kind !== "stock")
    .reduce((s, d) => s + d.amount, 0);
  const nette = brute - pub - autres;

  const coutParCommande = livrees.length ? pub / livrees.length : 0;
  const annulees = commandes.filter((c) => c.status === "annulee").length;
  const tauxAnnulation = commandes.length ? (annulees / commandes.length) * 100 : 0;

  // Détail par produit
  const parProduit = produits.map((prod) => {
    const siennes = livrees.filter((c) => c.product_id === prod.id);
    const ca = siennes.reduce((s, c) => s + c.total, 0);
    const marge = siennes.reduce((s, c) => s + margeBrute(prod, c), 0);
    const pieces = siennes.reduce((s, c) => s + c.qty, 0);
    return { prod, ventes: siennes.length, pieces, ca, marge };
  }).filter((x) => x.ventes > 0);

  return (
    <main>
      <h1 className="mb-1 font-display text-2xl font-black">Marges</h1>
      <p className="mb-5 text-sm text-texte-doux">
        Calculé sur les commandes livrées uniquement. Les achats de stock sont exclus du
        résultat ci-dessous : ce sont vos pièces, déjà comptées dans le coût de revient.
      </p>

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Statistique libelle="Encaissé" valeur={fcfa(encaisse)}
          detail={`${livrees.length} livraison${livrees.length > 1 ? "s" : ""}`} />
        <Statistique libelle="Marge brute" valeur={fcfa(brute)}
          detail="après pièces et livreur" />
        <Statistique libelle="Dépenses pub" valeur={fcfa(pub)} />
        <Statistique libelle="Résultat net" valeur={fcfa(nette)}
          detail="après publicité" ton={nette >= 0 ? "bon" : "alerte"} />
      </section>

      <section className="mt-6 grid grid-cols-2 gap-2.5">
        <Statistique libelle="Coût d'acquisition" valeur={fcfa(coutParCommande)}
          detail="pub ÷ commandes livrées"
          ton={coutParCommande > 2500 ? "alerte" : "neutre"} />
        <Statistique libelle="Taux d'annulation"
          valeur={tauxAnnulation.toFixed(0) + " %"}
          detail={`${annulees} annulée${annulees > 1 ? "s" : ""} sur ${commandes.length}`}
          ton={tauxAnnulation > 25 ? "alerte" : "neutre"} />
      </section>

      {parProduit.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-bold">Par produit</h2>
          <div className="overflow-x-auto rounded-xl border border-bord">
            <table className="w-full min-w-[460px] text-sm">
              <thead className="bg-asphalte text-left text-xs uppercase tracking-[.06em] text-texte-doux">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Produit</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Ventes</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Pièces</th>
                  <th className="px-4 py-2.5 text-right font-semibold">CA</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Marge brute</th>
                </tr>
              </thead>
              <tbody>
                {parProduit.map((x) => (
                  <tr key={x.prod.id} className="border-t border-bord">
                    <td className="px-4 py-3">{x.prod.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{x.ventes}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{x.pieces}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fcfa(x.ca)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-vert">
                      {fcfa(x.marge)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {livrees.length === 0 && (
        <p className="mt-10 text-center text-texte-doux">
          Aucune commande livrée pour l&apos;instant. Les marges apparaîtront ici dès la
          première livraison.
        </p>
      )}
    </main>
  );
}
