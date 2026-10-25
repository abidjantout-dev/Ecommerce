"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { navigateur } from "@/lib/supabase/client";

export default function Connexion() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function entrer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);

    const { error } = await navigateur().auth.signInWithPassword({
      email: email.trim(),
      password: motDePasse,
    });

    setEnvoi(false);
    if (error) {
      setErreur("Email ou mot de passe incorrect.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="font-display text-2xl font-black">Tableau de bord</h1>
      <p className="mb-6 mt-1 text-sm text-texte-doux">Réservé à l&apos;équipe Moïva.</p>

      <form onSubmit={entrer} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-semibold">Email</label>
          <input id="email" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={input} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mdp" className="text-sm font-semibold">Mot de passe</label>
          <input id="mdp" type="password" autoComplete="current-password" value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)} className={input} />
        </div>

        {erreur && <p className="text-sm text-rouge">{erreur}</p>}

        <button type="submit" disabled={envoi}
          className="mt-1 rounded-xl bg-phare px-4 py-3.5 font-display font-black text-nuit disabled:opacity-60">
          {envoi ? "Connexion…" : "Entrer"}
        </button>
      </form>
    </main>
  );
}

const input =
  "w-full rounded-[10px] border border-bord bg-asphalte px-3.5 py-3 text-base text-texte " +
  "focus:border-phare focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-phare";
