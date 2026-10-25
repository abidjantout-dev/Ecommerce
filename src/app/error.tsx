"use client";
export default function Erreur({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-md px-4 py-20"><h1 className="text-2xl font-bold">Service temporairement indisponible</h1><p className="my-4">Impossible de charger les données. Vérifiez la configuration et la connexion.</p><button onClick={reset} className="rounded bg-phare p-3 text-nuit">Réessayer</button></main>;
}
