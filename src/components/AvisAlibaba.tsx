/** Transcription des captures fournies par le propriétaire, sans vérification indépendante. */
const AVIS = [
  { auteur: "M***s", pays: "États-Unis", date: "2026-05-07", note: 5, texte: "Réponse à temps, communication professionnelle, Le colis est sympa et l'expédition est très rapide. merci!" },
  { auteur: "S***o", pays: "Zimbabwe", date: "2026-04-06", note: 5, texte: "Le produit est bon. Possède un cadre standard qui s'adapte à de nombreuses personnes. c'est un excellent produit." },
  { auteur: "S***o", pays: "Zimbabwe", date: "2026-03-02", note: 5, texte: "Excellent produit. Mes clients sont satisfaits du produit. On dit que cela répond aux attentes. Produit de bonne qualité." },
  { auteur: "K***h", pays: "Ghana", date: "2026-07-31", note: 5, texte: "Ce produit est très utile pour la conduite de nuit" },
  { auteur: "C***i", pays: "Burkina Faso", date: "2026-05-04", note: 4, texte: "La marchandise est arrivée à bon port" },
  { auteur: "D***e", pays: "Gabon", date: "2026-05-06", note: 5, texte: "je vous le recommande" },
  { auteur: "M***e", pays: "Allemagne", date: "2026-08-22", note: 5, texte: "Excellent produit" },
  { auteur: "E***n", pays: "Togo", date: "2026-07-19", note: 5, texte: "c’est bien" },
  { auteur: "G***g", pays: "États-Unis", date: "2026-06-02", note: 5, texte: "Haute bonne qualité" },
  { auteur: "K***h", pays: "Ghana", date: "2026-08-02", note: 5, texte: "excellent produit" },
  { auteur: "K***h", pays: "Ghana", date: "2026-10-22", note: 4, texte: "bonne qualité" },
];
const SOURCE = "https://french.alibaba.com/product-detail/subject-1601620235103.html";

function Carte({ avis }: { avis: typeof AVIS[number] }) {
  return <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-asphalte/60 p-5">
    <div role="img" aria-label={`${avis.note} étoiles sur 5`} className="text-lg tracking-[.12em]">
      <span aria-hidden="true" className="text-phare">{"★".repeat(avis.note)}</span><span aria-hidden="true" className="text-texte-doux">{"☆".repeat(5 - avis.note)}</span>
    </div>
    <blockquote className="mb-5 mt-3 flex-1 text-sm leading-relaxed text-texte">{avis.texte}</blockquote>
    <div className="flex items-center gap-3 border-t border-white/5 pt-4">
      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-phare/10 font-bold text-phare">{avis.auteur[0]}</span>
      <div className="min-w-0 text-xs"><p className="font-semibold">{avis.auteur} <span className="font-normal text-texte-doux">· {avis.pays}</span></p><time dateTime={avis.date} className="mt-1 block text-texte-doux">{new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(avis.date))}</time></div>
    </div>
    <p className="mt-3 text-[10px] uppercase tracking-wider text-texte-doux">Source : Alibaba</p>
  </article>;
}

export default function AvisAlibaba() {
  return <section aria-labelledby="avis-titre" className="border-b border-white/10 py-10 sm:py-14">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-phare">Retours d’acheteurs sur Alibaba</p><h2 id="avis-titre" className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">Leurs impressions sur le produit.</h2></div>
      <a href={SOURCE} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-4 py-2 text-xs text-texte-doux transition hover:border-phare hover:text-phare">Voir la fiche Alibaba ↗</a>
    </div>
    <p className="mb-7 mt-4 max-w-3xl text-sm leading-relaxed text-texte-doux">Avis provenant d’Alibaba, et non de clients Moïva. Transcription des textes en français affichés dans les captures fournies. Ces expériences concernent le produit et le fournisseur sur Alibaba, pas notre service de livraison.</p>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{AVIS.slice(0, 3).map(avis => <Carte key={avis.auteur + avis.date} avis={avis} />)}</div>
    <details className="group mt-5">
      <summary className="w-fit cursor-pointer rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-phare focus-visible:outline focus-visible:outline-2 focus-visible:outline-phare">Voir les {AVIS.length - 3} autres avis transcrits</summary>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{AVIS.slice(3).map(avis => <Carte key={avis.auteur + avis.date} avis={avis} />)}</div>
    </details>
    <p className="mt-4 text-xs text-texte-doux">{AVIS.length} avis transcrits sur les 13 annoncés dans les captures. Aucun calcul de note globale sur l’ensemble des avis.</p>
    <div className="mt-8 rounded-2xl border border-white/10 p-5">
      <h3 className="font-display text-sm font-bold">Photos partagées avec les avis Alibaba</h3>
      <p className="mb-4 mt-2 text-xs leading-relaxed text-texte-doux">Photos transmises par le propriétaire de la boutique, présentées séparément : leur association à un avis précis n’a pas été confirmée. Cliquez sur une photo pour l’ouvrir.</p>
      <div className="flex flex-wrap gap-3">{[1, 2, 3].map(n => <a key={n} href={`/reviews/alibaba-0${n}.avif`} target="_blank" rel="noopener noreferrer" aria-label={`Ouvrir la photo ${n} des avis Alibaba dans un nouvel onglet`} className="overflow-hidden rounded-xl border border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-phare">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/reviews/alibaba-0${n}.avif`} alt={`Photo du produit fournie avec les avis Alibaba, ${n} sur 3`} width={160} height={160} loading="lazy" className="h-28 w-28 bg-asphalte object-contain transition hover:scale-105 sm:h-40 sm:w-40" />
      </a>)}</div>
    </div>
  </section>;
}
