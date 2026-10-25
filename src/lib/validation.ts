import type { Tier } from "./types";
export function telephone(tel: string): string | null {
  let n = tel.replace(/[\s().+-]/g, "");
  if (n.startsWith("00225")) n = n.slice(5);
  else if (n.startsWith("225")) n = n.slice(3);
  return /^0[157]\d{8}$/.test(n) ? `225${n}` : null;
}
export function paliersValides(tiers: Tier[]): boolean {
  return tiers.length > 0 && new Set(tiers.map(t => t.qty)).size === tiers.length &&
    tiers.every(t => Number.isSafeInteger(t.qty) && t.qty > 0 && Number.isSafeInteger(t.price) && t.price >= 0 && typeof t.free_delivery === "boolean");
}
