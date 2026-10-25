import type { Product, Tier } from "./types";

/** Chaque palier est un pack à prix total : aucune quantité intermédiaire. */
export function palier(product: Product, qty: number): Tier {
  const tier = product.tiers.find(t => t.qty === qty);
  if (!tier || !Number.isSafeInteger(qty) || qty <= 0) throw new Error("Quantité indisponible");
  return tier;
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
