export default function Statistique({
  libelle, valeur, detail, ton = "neutre",
}: {
  libelle: string; valeur: string; detail?: string;
  ton?: "neutre" | "bon" | "alerte";
}) {
  const couleur =
    ton === "bon" ? "text-vert" : ton === "alerte" ? "text-rouge" : "text-texte";
  return (
    <div className="rounded-xl border border-bord bg-asphalte px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-texte-doux">
        {libelle}
      </p>
      <p className={`mt-1 font-display text-xl font-black tabular-nums ${couleur}`}>{valeur}</p>
      {detail && <p className="mt-0.5 text-xs text-texte-doux">{detail}</p>}
    </div>
  );
}
