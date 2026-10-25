"use client";
import { useEffect, useMemo, useState } from "react";
import { navigateur } from "@/lib/supabase/client";
import { fcfa, dateCourte, versWhatsapp } from "@/lib/format";
import { margeBrute } from "@/lib/pricing";
import { STATUS_LABEL, type Order, type OrderStatus, type Product } from "@/lib/types";
import Statistique from "./Statistique";

const COULEUR: Record<OrderStatus, string> = {
  nouvelle: "bg-phare text-nuit",
  confirmee: "bg-[#2B5EA8] text-white",
  livree: "bg-vert text-[#06240F]",
  annulee: "bg-bord text-texte-doux",
};

const FILTRES: (OrderStatus | "toutes")[] = ["toutes", "nouvelle", "confirmee", "livree", "annulee"];

export default function Commandes({
  initiales, produits,
}: { initiales: Order[]; produits: Product[] }) {
  const [commandes, setCommandes] = useState(initiales);
  const [filtre, setFiltre] = useState<OrderStatus | "toutes">("toutes");
  const supabase = useMemo(() => navigateur(), []);

  const parId = useMemo(
    () => Object.fromEntries(produits.map((p) => [p.id, p])) as Record<string, Product>,
    [produits]
  );

  // Les nouvelles commandes arrivent sans rafraîchir la page.
  useEffect(() => {
    const canal = supabase
      .channel("commandes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (charge) => {
        setCommandes((actuelles) => {
          if (charge.eventType === "INSERT") {
            const neuve = charge.new as Order;
            if (actuelles.some((o) => o.id === neuve.id)) return actuelles;
            return [neuve, ...actuelles];
          }
          if (charge.eventType === "UPDATE") {
            const maj = charge.new as Order;
            return actuelles.map((o) => (o.id === maj.id ? maj : o));
          }
          if (charge.eventType === "DELETE") {
            const vieille = charge.old as Order;
            return actuelles.filter((o) => o.id !== vieille.id);
          }
          return actuelles;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, [supabase]);

  async function changerStatut(o: Order, statut: OrderStatus) {
    const avant = commandes;
    setCommandes((l) => l.map((x) => (x.id === o.id ? { ...x, status: statut } : x)));

    const { error } = await supabase
      .from("orders")
      .update({
        status: statut,
        delivered_at: statut === "livree" ? new Date().toISOString() : null,
      })
      .eq("id", o.id);

    if (error) setCommandes(avant);
  }

  async function basculerRelance(o: Order) {
    const avant = commandes;
    setCommandes((l) => l.map((x) => (x.id === o.id ? { ...x, followed_up: !x.followed_up } : x)));
    const { error } = await supabase
      .from("orders").update({ followed_up: !o.followed_up }).eq("id", o.id);
    if (error) setCommandes(avant);
  }

  const visibles = filtre === "toutes" ? commandes : commandes.filter((o) => o.status === filtre);

  const livrees = commandes.filter((o) => o.status === "livree");
  const encaisse = livrees.reduce((s, o) => s + o.total, 0);
  const marge = livrees.reduce((s, o) => {
    const p = parId[o.product_id];
    return p ? s + margeBrute(p, o) : s;
  }, 0);
  const aTraiter = commandes.filter((o) => o.status === "nouvelle").length;
  const piecesVendues = livrees.reduce((s, o) => s + o.qty, 0);
  const stock = produits.reduce((s, p) => s + p.stock_initial, 0) - piecesVendues;

  return (
    <>
      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Statistique libelle="À traiter" valeur={String(aTraiter)}
          detail={aTraiter > 0 ? "en attente d'appel" : "tout est traité"}
          ton={aTraiter > 0 ? "alerte" : "neutre"} />
        <Statistique libelle="Encaissé" valeur={fcfa(encaisse)}
          detail={`${livrees.length} commande${livrees.length > 1 ? "s" : ""} livrée${livrees.length > 1 ? "s" : ""}`} />
        <Statistique libelle="Marge brute" valeur={fcfa(marge)}
          detail="hors dépenses pub" ton="bon" />
        <Statistique libelle="Stock restant" valeur={String(stock)}
          detail={`${piecesVendues} pièce${piecesVendues > 1 ? "s" : ""} vendue${piecesVendues > 1 ? "s" : ""}`}
          ton={stock <= 10 ? "alerte" : "neutre"} />
      </section>

      <div className="mt-6 flex gap-1.5 overflow-x-auto">
        {FILTRES.map((f) => (
          <button key={f} onClick={() => setFiltre(f)}
            className={
              "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition " +
              (filtre === f ? "bg-texte text-nuit" : "border border-bord text-texte-doux")
            }>
            {f === "toutes" ? "Toutes" : STATUS_LABEL[f]}
            {f !== "toutes" && (
              <span className="ml-1.5 opacity-60">
                {commandes.filter((o) => o.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="mt-10 text-center text-texte-doux">
          {commandes.length === 0
            ? "Aucune commande pour l'instant. Elles apparaîtront ici dès qu'un client valide le formulaire."
            : "Aucune commande dans ce filtre."}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2.5">
          {visibles.map((o) => {
            const p = parId[o.product_id];
            const wa = versWhatsapp(o.phone);
            const message = encodeURIComponent(
              `Bonjour ${o.customer_name}, je vous confirme votre commande ${o.ref} : ` +
              `${o.qty} ${o.qty > 1 ? "paires" : "paire"}, livraison à ${o.quartier} (${o.commune}), ` +
              `total ${fcfa(o.total)} à payer au livreur. Quelle heure vous arrange ?`
            );

            return (
              <li key={o.id} className="rounded-xl border border-bord bg-asphalte p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold">{o.customer_name}</p>
                    <p className="text-xs text-texte-doux">
                      {o.ref} · {dateCourte(o.created_at)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 font-display text-xs font-bold ${COULEUR[o.status]}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                  <Ligne t="Téléphone" v={o.phone + (o.phone2 ? ` · ${o.phone2}` : "")} />
                  <Ligne t="Livraison" v={`${o.quartier} (${o.commune})`} />
                  <Ligne t="Quantité" v={`${o.qty} ${o.qty > 1 ? "paires" : "paire"}`} />
                  <Ligne t="Total" v={`${fcfa(o.total)}${o.delivery_fee === 0 ? " · livraison offerte" : ""}`} />
                  {p && (
                    <Ligne t="Marge si livrée" v={fcfa(margeBrute(p, o))} />
                  )}
                  {o.note && <Ligne t="Précision" v={o.note} pleine />}
                </dl>

                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  <a href={`https://wa.me/${wa}?text=${message}`} target="_blank" rel="noopener"
                    className="rounded-lg bg-vert px-3 py-2 font-display text-sm font-bold text-[#06240F]">
                    WhatsApp
                  </a>
                  {(["nouvelle", "confirmee", "livree", "annulee"] as OrderStatus[])
                    .filter((s) => s !== o.status)
                    .map((s) => (
                      <button key={s} onClick={() => changerStatut(o, s)}
                        className="rounded-lg border border-bord px-3 py-2 text-sm font-semibold text-texte-doux transition hover:text-texte">
                        {STATUS_LABEL[s]}
                      </button>
                    ))}
                  <button onClick={() => basculerRelance(o)}
                    className={
                      "rounded-lg px-3 py-2 text-sm font-semibold transition " +
                      (o.followed_up
                        ? "border border-phare-sourd text-phare"
                        : "border border-bord text-texte-doux hover:text-texte")
                    }>
                    {o.followed_up ? "Relancé ✓" : "Marquer relancé"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Ligne({ t, v, pleine }: { t: string; v: string; pleine?: boolean }) {
  return (
    <div className={pleine ? "col-span-2" : ""}>
      <dt className="text-[11px] uppercase tracking-[.06em] text-texte-doux">{t}</dt>
      <dd className="text-texte">{v}</dd>
    </div>
  );
}
