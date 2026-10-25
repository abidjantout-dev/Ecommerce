import { notFound } from "next/navigation";
import { serveur } from "@/lib/supabase/server";
import { fcfa } from "@/lib/format";
import type { Product } from "@/lib/types";
import Carrousel from "@/components/Carrousel";
import FormulaireCommande from "@/components/FormulaireCommande";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = serveur();
  const { data } = await supabase
    .from("products").select("name, tagline").eq("slug", params.slug).maybeSingle();
  return { title: data?.name ?? "Moïva", description: data?.tagline ?? undefined };
}

const BADGES = [
  ["Payez à la livraison", "Rien à avancer"],
  ["Livré en 24–48 h", "Partout dans Abidjan"],
  ["Vérifiez avant de payer", "Devant le livreur"],
  ["En stock", "Expédié depuis Abidjan"],
];

export default async function PageProduit({ params }: { params: { slug: string } }) {
  const supabase = serveur();
  const { data } = await supabase
    .from("products").select("*").eq("slug", params.slug).eq("active", true).maybeSingle();

  if (!data) notFound();
  const product = data as Product;
  const paliers = [...product.tiers].sort((a, b) => a.qty - b.qty);
  const unite = paliers[0];
  const pack = paliers.find((t) => t.free_delivery) ?? paliers[1];

  return (
    <main className="mx-auto max-w-[560px] px-4 pb-12">
      <header className="flex flex-col gap-3.5 pt-7">
        <p className="font-display text-xs font-bold uppercase tracking-[.14em] text-phare">
          Livraison Abidjan
        </p>
        <h1 className="text-balance font-display text-[clamp(30px,8vw,42px)] font-black leading-[1.05] tracking-[-.02em]">
          {product.tagline ?? product.name}
        </h1>
        {product.description && (
          <p className="text-[17px] text-texte-doux">{product.description}</p>
        )}
        <Carrousel images={product.images} />
      </header>

      <section className="mt-5 grid grid-cols-2 gap-2" aria-label="Nos garanties">
        {BADGES.map(([titre, sous]) => (
          <span key={titre}
            className="flex flex-col gap-px rounded-[10px] border border-bord bg-asphalte px-3 py-2.5 text-xs leading-snug text-texte-doux">
            <b className="font-display text-[13px] font-bold text-texte">{titre}</b>
            {sous}
          </span>
        ))}
      </section>

      <section className="mt-5 grid grid-cols-2 gap-2.5" aria-label="Tarifs">
        {unite && (
          <div className="rounded-xl border border-bord bg-asphalte px-4 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-[.08em] text-texte-doux">
              {unite.qty === 1 ? "1 paire" : `${unite.qty} paires`}
            </p>
            <p className="mt-1 font-display text-[26px] font-black tabular-nums">{fcfa(unite.price)}</p>
            <p className="mt-0.5 text-xs text-texte-doux">
              {unite.free_delivery ? "Livraison offerte" : `+ ${fcfa(product.delivery_fee)} de livraison`}
            </p>
          </div>
        )}
        {pack && pack !== unite && (
          <div className="rounded-xl border border-phare-sourd bg-asphalte px-4 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-[.08em] text-texte-doux">
              Pack de {pack.qty}
            </p>
            <p className="mt-1 font-display text-[26px] font-black tabular-nums text-phare">
              {fcfa(pack.price)}
            </p>
            <p className="mt-0.5 text-xs text-texte-doux">
              Livraison offerte · vous économisez{" "}
              {fcfa(unite.price * pack.qty + product.delivery_fee - pack.price)}
            </p>
          </div>
        )}
      </section>

      <FormulaireCommande product={product} />

      <footer className="mt-9 flex flex-col gap-1.5 border-t border-bord pt-4.5 text-[13px] text-texte-doux">
        <p><b className="font-semibold text-texte">Moïva — Abidjan.</b> Livraison sous 24 à 48 h.</p>
      </footer>
    </main>
  );
}
