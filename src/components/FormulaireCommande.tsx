"use client";
import { useMemo, useState } from "react";
import { navigateur } from "@/lib/supabase/client";
import { calcul } from "@/lib/pricing";
import { telephone } from "@/lib/validation";
import { fcfa } from "@/lib/format";
import { COMMUNES, type Product } from "@/lib/types";

type Champ = "nom" | "tel" | "commune" | "quartier";

export default function FormulaireCommande({ product }: { product: Product }) {
  const paliers = useMemo(
    () => [...product.tiers].sort((a, b) => a.qty - b.qty),
    [product.tiers]
  );

  const [qty, setQty] = useState(paliers.find((t) => t.qty === 2)?.qty ?? paliers[0]?.qty ?? 1);
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [tel2, setTel2] = useState("");
  const [commune, setCommune] = useState("");
  const [quartier, setQuartier] = useState("");
  const [note, setNote] = useState("");

  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [totalConfirme, setTotalConfirme] = useState<number | null>(null);
  const [ref, setRef] = useState<string | null>(null);

  const montant = calcul(product, qty);

  function premierManquant(): [Champ, string] | null {
    if (!nom.trim()) return ["nom", "Indiquez vos nom et prénoms."];
    if (!telephone(tel))
      return ["tel", "Indiquez un numéro WhatsApp valide pour qu'on vous joigne."];
    if (!commune) return ["commune", "Choisissez votre commune."];
    if (!quartier.trim()) return ["quartier", "Indiquez votre quartier et un repère pour le livreur."];
    return null;
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (envoi) return;
    if (tel2.trim() && !telephone(tel2)) { setErreur("Le second numéro est invalide."); return; }
    const manque = premierManquant();
    if (manque) {
      setErreur(manque[1]);
      document.getElementById(manque[0])?.focus();
      return;
    }

    setErreur(null);
    setEnvoi(true);

    try {
      const { data, error } = await navigateur().rpc("place_order", {
        p_product_id: product.id, p_qty: qty,
        p_customer_name: nom.trim(), p_phone: telephone(tel),
        p_phone2: tel2.trim() ? telephone(tel2) : null,
        p_commune: commune, p_quartier: quartier.trim(), p_note: note.trim() || null,
      });
      if (error || !data) throw new Error("Commande refusée");
      setTotalConfirme(data.total);
      setRef(data.ref);
    } catch {
      setErreur("La commande n'a pas pu être enregistrée. Réessayez ou contactez-nous sur WhatsApp.");
    } finally { setEnvoi(false); }
  }

  if (ref) {
    const numero = telephone(process.env.NEXT_PUBLIC_WHATSAPP ?? "");
    const message = encodeURIComponent(
      `Bonjour, je viens de passer la commande ${ref} (${qty} ${qty > 1 ? "paires" : "paire"}).`
    );
    return (
      <section className="mt-10 rounded-2xl border border-vert bg-asphalte p-6">
        <h2 className="font-display text-xl font-bold">Commande enregistrée</h2>
        <p className="mt-2 text-texte-doux">
          Votre numéro de commande est <b className="text-phare">{ref}</b>. Nous vous appelons
          dans la journée pour confirmer l&apos;heure de passage du livreur.
        </p>
        <p className="mt-2 text-texte-doux">
          Vous payez <b className="text-texte">{fcfa(totalConfirme ?? montant.total)}</b> au livreur, après avoir
          vu le produit.
        </p>
        {numero && (
          <a
            href={`https://wa.me/${numero}?text=${message}`}
            target="_blank"
            rel="noopener"
            className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl bg-vert px-4 py-4 font-display text-[17px] font-black text-[#06240F]"
          >
            Nous écrire sur WhatsApp
          </a>
        )}
      </section>
    );
  }

  return (
    <section className="mt-10 rounded-2xl border border-bord bg-asphalte p-5">
      <h2 className="font-display text-xl font-bold">Commander</h2>
      <p className="mb-5 mt-1 text-sm text-texte-doux">
        Remplissez le formulaire. Nous vous rappelons pour confirmer la livraison.
      </p>

      <form onSubmit={envoyer} noValidate>
        <Champ id="nom" label="Nom et prénoms">
          <input id="nom" value={nom} onChange={(e) => setNom(e.target.value)}
            autoComplete="name" placeholder="Ex. Koffi Adama" className={input} />
        </Champ>

        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          <Champ id="tel" label="Numéro WhatsApp">
            <input id="tel" value={tel} onChange={(e) => setTel(e.target.value)}
              type="tel" inputMode="tel" autoComplete="tel"
              placeholder="07 00 00 00 00" className={input} />
          </Champ>
          <Champ id="tel2" label="Second numéro" option="facultatif">
            <input id="tel2" value={tel2} onChange={(e) => setTel2(e.target.value)}
              type="tel" inputMode="tel" placeholder="Si le premier ne passe pas" className={input} />
          </Champ>
        </div>

        <Champ id="commune" label="Commune">
          <select id="commune" value={commune} onChange={(e) => setCommune(e.target.value)} className={input}>
            <option value="">Choisissez votre commune</option>
            {COMMUNES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Champ>

        <Champ id="quartier" label="Quartier et repère">
          <input id="quartier" value={quartier} onChange={(e) => setQuartier(e.target.value)}
            placeholder="Ex. Riviera 2, près de la pharmacie" className={input} />
        </Champ>

        <Champ id="qty" label="Quantité">
          <select id="qty" value={qty} onChange={(e) => setQty(Number(e.target.value))} className={input}>
            {paliers.map((t) => (
              <option key={t.qty} value={t.qty}>
                {t.qty === 1 ? "1 paire" : `${t.qty} paires`} — {fcfa(t.price)}
                {t.free_delivery ? ", livraison offerte" : ` + ${fcfa(product.delivery_fee)} de livraison`}
              </option>
            ))}
          </select>
        </Champ>

        <Champ id="note" label="Précision" option="facultatif">
          <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Heure de livraison souhaitée, autre indication…"
            className={input + " min-h-[62px] resize-y"} />
        </Champ>

        {erreur && <p role="alert" className="-mt-2 mb-4 text-sm text-rouge">{erreur}</p>}

        <div className="mb-4 flex items-baseline justify-between border-t border-bord pt-4">
          <span className="text-sm text-texte-doux">
            {montant.delivery_fee === 0 ? "Total, livraison offerte" : "Total, livraison comprise"}
          </span>
          <span className="font-display text-[28px] font-black tabular-nums">
            {fcfa(montant.total)}
          </span>
        </div>

        <button type="submit" disabled={envoi}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-vert px-4 py-4 font-display text-[17px] font-black text-[#06240F] transition hover:brightness-110 disabled:opacity-60">
          {envoi ? "Envoi en cours…" : "Valider ma commande"}
        </button>

        <p className="mt-3 text-center text-[13px] text-texte-doux">
          Vous regardez le produit devant le livreur et vous payez seulement si ça vous convient.
        </p>
      </form>
    </section>
  );
}

const input =
  "w-full rounded-[10px] border border-bord bg-nuit px-3.5 py-3 text-base text-texte " +
  "focus:border-phare focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-phare";

function Champ({ id, label, option, children }: {
  id: string; label: string; option?: string; children: React.ReactNode;
}) {
  return (
    <div className="mb-[18px] flex min-w-0 flex-col gap-[7px]">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}{" "}
        {option && <span className="text-xs font-normal text-texte-doux">{option}</span>}
      </label>
      {children}
    </div>
  );
}
