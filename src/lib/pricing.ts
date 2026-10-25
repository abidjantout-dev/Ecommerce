import type { Product, Tier } from "./types";

/** Le palier correspondant à une quantité, ou le plus proche en dessous. */
export function palier(product: Product, qty: number): Tier {
  const tiers = [...product.tiers].sort((a, b) => a.qty - b.qty);
  const exact = tiers.find((t) => t.qty === qty);
  if (exact) return exact;
  const dessous = tiers.filter((t) => t.qty <= qty).pop();
  return dessous ?? tiers[0];
}

export function calcul(product: Product, qty: number) {
  const t = palier(product, qty);
  const livraison = t.free_delivery ? 0 : product.delivery_fee;
  return {
    tier: t,
    goods_total: t.price,
    delivery_fee: livraison,
    total: t.price + livraison,
  };
}

/**
 * Marge d'une commande livrée, avant répartition de la publicité.
 * = ce que le client paie − le coût des pièces − ce que coûte le livreur
 */
export function margeBrute(product: Product, o: { qty: number; total: number }) {
  return o.total - product.cost_price * o.qty - product.delivery_cost;
}
