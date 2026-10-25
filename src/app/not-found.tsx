export default function Introuvable() {
  return (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-black">Page introuvable</h1>
      <p className="mt-3 text-texte-doux">
        Ce produit n&apos;existe pas ou n&apos;est plus en ligne.
      </p>
      <a href="/" className="mt-6 inline-block rounded-xl bg-phare px-5 py-3 font-display font-black text-nuit">
        Retour à la boutique
      </a>
    </main>
  );
}
