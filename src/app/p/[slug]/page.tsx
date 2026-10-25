import { notFound } from "next/navigation";
import { serveur } from "@/lib/supabase/server";
import { paliersValides } from "@/lib/validation";
import { fcfa } from "@/lib/format";
import type { Product } from "@/lib/types";
import AvisAlibaba from "@/components/AvisAlibaba";
import Carrousel from "@/components/Carrousel";
import FormulaireCommande from "@/components/FormulaireCommande";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await serveur();
  const { data, error } = await supabase
    .from("products").select("name, tagline").eq("slug", slug).maybeSingle();
  if (error) throw new Error("Catalogue indisponible");
  return { title: data?.name ?? "Moïva", description: data?.tagline ?? undefined };
}

const GARANTIES = [
  ["01", "Commandez simplement", "Choisissez votre quantité et indiquez votre adresse."],
  ["02", "On vous rappelle", "Nous confirmons avec vous les détails de la livraison."],
  ["03", "Vérifiez, puis payez", "Découvrez votre produit devant le livreur avant de payer."],
];

export default async function PageProduit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await serveur();
  const { data, error } = await supabase
    .from("products").select("*").eq("slug", slug).eq("active", true).maybeSingle();
  if (error) throw new Error("Catalogue indisponible");
  if (!data) notFound();
  const product = data as Product;
  if (!paliersValides(product.tiers)) notFound();
  const paliers = [...product.tiers].sort((a, b) => a.qty - b.qty);
  const depart = Math.min(...paliers.map(t => t.price));

  return (
    <div className="product-page">
      <div className="border-b border-white/5 bg-phare py-2.5 text-center text-[10px] font-bold uppercase tracking-[.16em] text-nuit sm:text-xs">
        À Abidjan · Livraison sous 24–48 h · Paiement à la livraison
      </div>
      <nav aria-label="Navigation boutique" className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <a href="/" aria-label="Moïva, accueil" className="font-display text-3xl font-black tracking-[-.07em]">moïva<span className="text-phare">.</span></a>
        <a href="#commander" className="flex items-center gap-2 text-xs font-semibold text-texte-doux transition hover:text-phare">Votre commande <span aria-hidden="true" className="text-phare">↗</span></a>
      </nav>
      <main className="mx-auto max-w-6xl px-5 pb-12 sm:px-8">
        <section className="grid items-start gap-8 pb-12 pt-3 md:grid-cols-2 md:gap-12 md:pb-20 md:pt-8 lg:gap-16" aria-labelledby="produit-titre">
          <div className="min-w-0 md:sticky md:top-8">
            <div className="product-gallery relative rounded-[24px] border border-white/10 bg-asphalte p-2 sm:p-3">
              <Carrousel images={product.images} />
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-texte-doux"><span aria-hidden="true" className="text-phare">◈</span> Vérifiez votre produit avant de payer</div>
          </div>
          <div>
            <p className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-phare"><span className="h-px w-6 bg-phare" /> La sélection Moïva</p>
            <p className="mb-3 text-xs text-texte-doux">{product.name}</p>
            <h1 id="produit-titre" className="text-balance font-display text-[clamp(32px,4.2vw,54px)] font-black leading-[1.08] tracking-[-.04em]">{product.tagline || product.name}</h1>
            {product.description && <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-texte-doux">{product.description}</p>}
            <div className="my-6 flex flex-wrap gap-x-5 gap-y-2 border-y border-white/10 py-4 text-xs text-texte-doux">
              <span><span aria-hidden="true" className="mr-1.5 text-phare">✓</span> Sans paiement en ligne</span>
              <span><span aria-hidden="true" className="mr-1.5 text-phare">✓</span> Livraison à Abidjan</span>
            </div>
            <section aria-label="Nos offres" className="grid gap-3 sm:grid-cols-2">
              {paliers.map((tier, i) => <div key={tier.qty} className={`relative rounded-2xl border p-4 ${i === 0 ? "border-phare/60 bg-phare/[.06]" : "border-white/10 bg-asphalte/60"}`}>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-texte-doux">{tier.qty === 1 ? "À l’unité" : `Pack de ${tier.qty}`}</p>
                <p className="mt-2 font-display text-[28px] font-black tracking-tight">{fcfa(tier.price)}</p>
                <p className={`mt-1 text-xs ${tier.free_delivery ? "text-phare" : "text-texte-doux"}`}>{tier.free_delivery ? "Livraison offerte" : `+ ${fcfa(product.delivery_fee)} de livraison`}</p>
              </div>)}
            </section>
            <a href="#commander" className="mt-6 flex items-center justify-between rounded-xl bg-phare px-5 py-4 font-display font-bold text-nuit transition hover:bg-[#ffdb4d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-phare">Commander maintenant <span aria-hidden="true">↗</span></a>
            <p className="mt-3 text-center text-xs text-texte-doux">Rien à avancer. Vous payez à la réception.</p>
          </div>
        </section>

        <section className="border-y border-white/10 py-9 sm:py-12" aria-labelledby="etapes-titre">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-phare">Simple, du début à la fin</p>
          <h2 id="etapes-titre" className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">Votre prochain achat, en toute tranquillité.</h2>
          <div className="mt-8 grid gap-7 sm:grid-cols-3 sm:gap-8">{GARANTIES.map(([numero, titre, texte]) => <div key={numero} className="flex gap-4 sm:block"><span className="font-display text-2xl font-bold text-phare/60">{numero}<span className="text-phare">.</span></span><div><h3 className="font-display text-sm font-bold sm:mt-3">{titre}</h3><p className="mt-2 max-w-xs text-sm leading-relaxed text-texte-doux">{texte}</p></div></div>)}</div>
        </section>

        {product.slug === "lunettes-anti-eblouissement" && <AvisAlibaba />}

        <section id="commander" className="grid scroll-mt-6 items-start gap-7 py-12 md:grid-cols-[.8fr_1fr] md:gap-16 md:py-20" aria-labelledby="commande-titre">
          <div className="md:pt-6">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-phare">À vous de jouer</p>
            <h2 id="commande-titre" className="mt-3 font-display text-3xl font-black leading-tight tracking-[-.03em] sm:text-4xl">Un petit formulaire.<br /><span className="text-texte-doux">Et on s’occupe du reste.</span></h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-texte-doux">Renseignez vos coordonnées pour être rappelé et organiser votre livraison à Abidjan.</p>
            <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/10 px-4 py-2.5 text-xs"><span aria-hidden="true" className="text-phare">✓</span> Aucun compte à créer</div>
            <p className="mt-6 text-xs text-texte-doux">À partir de <b className="text-texte">{fcfa(depart)}</b> {paliers.every(t => t.free_delivery) ? "· livraison offerte" : "hors frais de livraison éventuels"}</p>
          </div>
          <div className="product-order min-w-0"><FormulaireCommande key={product.id} product={product} /></div>
        </section>
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-texte-doux"><a href="/" className="font-display text-xl font-black tracking-tight text-texte">moïva<span className="text-phare">.</span></a><p>Depuis Abidjan, pour votre quotidien.</p><p>Paiement à la livraison</p></footer>
      </main>
    </div>
  );
}
