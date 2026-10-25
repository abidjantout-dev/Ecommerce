"use client";
import { useMemo, useState } from "react";
import { navigateur } from "@/lib/supabase/client";
import { fcfa } from "@/lib/format";
import type { Expense, ExpenseKind, Product } from "@/lib/types";
import Statistique from "./Statistique";

const GENRES: { valeur: ExpenseKind; libelle: string }[] = [
  { valeur: "pub", libelle: "Publicité" },
  { valeur: "stock", libelle: "Achat de stock" },
  { valeur: "livraison", libelle: "Livraison" },
  { valeur: "autre", libelle: "Autre" },
];

export default function Depenses({
  initiales, produits,
}: { initiales: Expense[]; produits: Product[] }) {
  const [depenses, setDepenses] = useState(initiales);
  const [kind, setKind] = useState<ExpenseKind>("pub");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState(0);
  const [spentOn, setSpentOn] = useState(new Date().toISOString().slice(0, 10));
  const [productId, setProductId] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const supabase = useMemo(() => navigateur(), []);

  const total = depenses.reduce((s, d) => s + d.amount, 0);
  const pub = depenses.filter((d) => d.kind === "pub").reduce((s, d) => s + d.amount, 0);
  const stock = depenses.filter((d) => d.kind === "stock").reduce((s, d) => s + d.amount, 0);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (envoi) return;
    if (!label.trim() || !Number.isSafeInteger(amount) || amount <= 0 || !spentOn) {
      setErreur("Indiquez un libellé et un montant.");
      return;
    }
    setEnvoi(true);
    setErreur(null);

    try {
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        kind, label: label.trim(), amount,
        spent_on: spentOn, product_id: productId || null,
      })
      .select("*")
      .single();

    setEnvoi(false);
    if (error) { setErreur(error.message); return; }

    setDepenses(l => [data as Expense, ...l]);
    setLabel(""); setAmount(0);
    } catch { setErreur("Ajout impossible. Réessayez."); }
    finally { setEnvoi(false); }
  }

  async function supprimer(d: Expense) {
    if (!window.confirm("Supprimer cette dépense ?")) return;
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", d.id);
      if (error) throw error;
      setDepenses(l => l.filter(x => x.id !== d.id));
    } catch { setErreur("Suppression impossible. Réessayez."); }
  }

  return (
    <>
      <h1 className="mb-4 font-display text-2xl font-black">Dépenses</h1>

      <section className="grid grid-cols-3 gap-2.5">
        <Statistique libelle="Total dépensé" valeur={fcfa(total)} />
        <Statistique libelle="Publicité" valeur={fcfa(pub)} />
        <Statistique libelle="Stock" valeur={fcfa(stock)} />
      </section>

      <form onSubmit={ajouter}
        className="mt-6 flex flex-col gap-3 rounded-xl border border-bord bg-asphalte p-4">
        <h2 className="font-display text-base font-bold">Ajouter une dépense</h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="kind" className="text-sm font-semibold">Type</label>
            <select id="kind" value={kind} onChange={(e) => setKind(e.target.value as ExpenseKind)} className={champ}>
              {GENRES.map((g) => <option key={g.valeur} value={g.valeur}>{g.libelle}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="date" className="text-sm font-semibold">Date</label>
            <input id="date" type="date" value={spentOn}
              onChange={(e) => setSpentOn(e.target.value)} className={champ} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="label" className="text-sm font-semibold">Libellé</label>
          <input id="label" value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex. Campagne Facebook — angle chauffeurs" className={champ} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="amount" className="text-sm font-semibold">Montant (F CFA)</label>
            <input id="amount" type="number" inputMode="numeric" value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)} className={champ} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="produit" className="text-sm font-semibold">
              Produit <span className="font-normal text-texte-doux">facultatif</span>
            </label>
            <select id="produit" value={productId}
              onChange={(e) => setProductId(e.target.value)} className={champ}>
              <option value="">Tous les produits</option>
              {produits.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {erreur && <p className="text-sm text-rouge">{erreur}</p>}

        <button type="submit" disabled={envoi}
          className="self-start rounded-xl bg-phare px-5 py-3 font-display font-black text-nuit disabled:opacity-60">
          {envoi ? "Ajout…" : "Ajouter"}
        </button>
      </form>

      {depenses.length === 0 ? (
        <p className="mt-10 text-center text-texte-doux">
          Aucune dépense enregistrée. Notez-y vos budgets pub pour suivre votre marge réelle.
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-2">
          {depenses.map((d) => (
            <li key={d.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-bord bg-asphalte px-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold">{d.label}</p>
                <p className="text-xs text-texte-doux">
                  {GENRES.find((g) => g.valeur === d.kind)?.libelle} ·{" "}
                  {new Date(d.spent_on).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display font-black tabular-nums">{fcfa(d.amount)}</span>
                <button onClick={() => supprimer(d)} className="text-sm text-rouge">Retirer</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const champ =
  "w-full rounded-[10px] border border-bord bg-nuit px-3 py-2.5 text-base text-texte " +
  "focus:border-phare focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-phare";
