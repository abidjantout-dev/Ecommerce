"use client";
import { useMemo, useState } from "react";
import { navigateur } from "@/lib/supabase/client";
import { fcfa } from "@/lib/format";
import type { Product, Tier, ProductImage } from "@/lib/types";

const VIDE = {
  slug: "", name: "", tagline: "", description: "",
  cost_price: 0, delivery_fee: 1000, delivery_cost: 1000, stock_initial: 0,
  tiers: [{ qty: 1, price: 0, free_delivery: false }] as Tier[],
  images: [] as ProductImage[],
};

export default function Produits({ initiaux }: { initiaux: Product[] }) {
  const [produits, setProduits] = useState(initiaux);
  const [ouvert, setOuvert] = useState<string | "nouveau" | null>(null);
  const supabase = useMemo(() => navigateur(), []);

  async function recharger() {
    const { data } = await supabase.from("products").select("*").order("created_at");
    if (data) setProduits(data as Product[]);
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-black">Produits</h1>
        <button onClick={() => setOuvert(ouvert === "nouveau" ? null : "nouveau")}
          className="rounded-lg bg-phare px-3.5 py-2 font-display text-sm font-black text-nuit">
          {ouvert === "nouveau" ? "Annuler" : "Ajouter"}
        </button>
      </div>

      {ouvert === "nouveau" && (
        <Editeur base={VIDE} onFini={() => { setOuvert(null); recharger(); }} />
      )}

      <ul className="mt-4 flex flex-col gap-2.5">
        {produits.map((p) => (
          <li key={p.id} className="rounded-xl border border-bord bg-asphalte p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display text-base font-bold">{p.name}</p>
                <p className="text-xs text-texte-doux">/p/{p.slug}</p>
              </div>
              <button onClick={() => setOuvert(ouvert === p.id ? null : p.id)}
                className="rounded-lg border border-bord px-3 py-1.5 text-sm text-texte-doux">
                {ouvert === p.id ? "Fermer" : "Modifier"}
              </button>
            </div>

            <p className="mt-2 text-sm text-texte-doux">
              Coût {fcfa(p.cost_price)} · stock initial {p.stock_initial} ·{" "}
              {p.tiers.length} palier{p.tiers.length > 1 ? "s" : ""} ·{" "}
              {p.images.length} photo{p.images.length > 1 ? "s" : ""}
            </p>

            {ouvert === p.id && (
              <div className="mt-4 border-t border-bord pt-4">
                <Editeur base={p} id={p.id} onFini={() => { setOuvert(null); recharger(); }} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

function Editeur({ base, id, onFini }: {
  base: typeof VIDE | Product; id?: string; onFini: () => void;
}) {
  const [f, setF] = useState({
    slug: base.slug, name: base.name,
    tagline: base.tagline ?? "", description: base.description ?? "",
    cost_price: base.cost_price, delivery_fee: base.delivery_fee,
    delivery_cost: base.delivery_cost, stock_initial: base.stock_initial,
  });
  const [tiers, setTiers] = useState<Tier[]>(base.tiers);
  const [images, setImages] = useState<ProductImage[]>(base.images);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function enregistrer() {
    if (!f.slug.trim() || !f.name.trim()) {
      setErreur("Le nom et l'adresse de la page sont obligatoires.");
      return;
    }
    setEnvoi(true);
    setErreur(null);

    const supabase = navigateur();
    const corps = {
      ...f,
      slug: f.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      tiers: tiers.filter((t) => t.qty > 0),
      images: images.filter((i) => i.url.trim()),
    };

    const { error } = id
      ? await supabase.from("products").update(corps).eq("id", id)
      : await supabase.from("products").insert(corps);

    setEnvoi(false);
    if (error) { setErreur(error.message); return; }
    onFini();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Texte l="Nom du produit" v={f.name} on={(v) => setF({ ...f, name: v })} />
        <Texte l="Adresse de la page" v={f.slug} on={(v) => setF({ ...f, slug: v })}
          aide="Ex. lunettes-anti-eblouissement" />
      </div>
      <Texte l="Accroche" v={f.tagline} on={(v) => setF({ ...f, tagline: v })} />
      <Texte l="Description" v={f.description} on={(v) => setF({ ...f, description: v })} zone />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Nombre l="Coût par pièce" v={f.cost_price} on={(v) => setF({ ...f, cost_price: v })} />
        <Nombre l="Livraison facturée" v={f.delivery_fee} on={(v) => setF({ ...f, delivery_fee: v })} />
        <Nombre l="Livraison réelle" v={f.delivery_cost} on={(v) => setF({ ...f, delivery_cost: v })} />
        <Nombre l="Stock initial" v={f.stock_initial} on={(v) => setF({ ...f, stock_initial: v })} />
      </div>

      <Section titre="Paliers de prix"
        action={() => setTiers([...tiers, { qty: tiers.length + 1, price: 0, free_delivery: true }])}>
        {tiers.map((t, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2">
            <Nombre l="Quantité" v={t.qty} petit
              on={(v) => setTiers(tiers.map((x, j) => (j === i ? { ...x, qty: v } : x)))} />
            <Nombre l="Prix total" v={t.price} petit
              on={(v) => setTiers(tiers.map((x, j) => (j === i ? { ...x, price: v } : x)))} />
            <label className="flex items-center gap-2 pb-3 text-sm text-texte-doux">
              <input type="checkbox" checked={t.free_delivery}
                onChange={(e) => setTiers(tiers.map((x, j) =>
                  j === i ? { ...x, free_delivery: e.target.checked } : x))} />
              Livraison offerte
            </label>
            <button onClick={() => setTiers(tiers.filter((_, j) => j !== i))}
              className="pb-3 text-sm text-rouge">Retirer</button>
          </div>
        ))}
      </Section>

      <Section titre="Photos"
        action={() => setImages([...images, { url: "", caption: "" }])}>
        {images.map((img, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2">
            <div className="min-w-[200px] flex-1">
              <Texte l="Adresse de l'image" v={img.url}
                on={(v) => setImages(images.map((x, j) => (j === i ? { ...x, url: v } : x)))} />
            </div>
            <div className="min-w-[140px] flex-1">
              <Texte l="Légende" v={img.caption ?? ""}
                on={(v) => setImages(images.map((x, j) => (j === i ? { ...x, caption: v } : x)))} />
            </div>
            <button onClick={() => setImages(images.filter((_, j) => j !== i))}
              className="pb-3 text-sm text-rouge">Retirer</button>
          </div>
        ))}
      </Section>

      {erreur && <p className="text-sm text-rouge">{erreur}</p>}

      <button onClick={enregistrer} disabled={envoi}
        className="mt-1 self-start rounded-xl bg-phare px-5 py-3 font-display font-black text-nuit disabled:opacity-60">
        {envoi ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}

function Section({ titre, action, children }: {
  titre: string; action: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-bord p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold">{titre}</h3>
        <button onClick={action} className="text-sm text-phare">+ Ajouter</button>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

const champ =
  "w-full rounded-[10px] border border-bord bg-nuit px-3 py-2.5 text-base text-texte " +
  "focus:border-phare focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-phare";

function Texte({ l, v, on, aide, zone }: {
  l: string; v: string; on: (v: string) => void; aide?: string; zone?: boolean;
}) {
  return (
    <div className="mb-1 flex min-w-0 flex-col gap-1.5">
      <label className="text-sm font-semibold">{l}</label>
      {zone
        ? <textarea value={v} onChange={(e) => on(e.target.value)} className={champ + " min-h-[70px] resize-y"} />
        : <input value={v} onChange={(e) => on(e.target.value)} className={champ} />}
      {aide && <span className="text-xs text-texte-doux">{aide}</span>}
    </div>
  );
}

function Nombre({ l, v, on, petit }: {
  l: string; v: number; on: (v: number) => void; petit?: boolean;
}) {
  return (
    <div className={"mb-1 flex flex-col gap-1.5 " + (petit ? "w-28" : "")}>
      <label className="text-sm font-semibold">{l}</label>
      <input type="number" inputMode="numeric" value={v}
        onChange={(e) => on(Number(e.target.value) || 0)} className={champ} />
    </div>
  );
}
