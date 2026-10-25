/** 9000 -> "9 000 F" (espace insécable fine, comme on l'écrit à Abidjan) */
export function fcfa(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " F";
}

export function dateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

/** Numéro ivoirien -> format wa.me (225XXXXXXXXXX) */
export function versWhatsapp(tel: string): string {
  const n = tel.replace(/\D/g, "");
  if (n.startsWith("225")) return n;
  return "225" + n.replace(/^0+/, "");
}
