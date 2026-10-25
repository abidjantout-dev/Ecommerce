export type Tier = { qty: number; price: number; free_delivery: boolean };
export type ProductImage = { url: string; caption?: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  cost_price: number;
  delivery_fee: number;
  delivery_cost: number;
  stock_initial: number;
  images: ProductImage[];
  tiers: Tier[];
  active: boolean;
  created_at: string;
};

export type OrderStatus = "nouvelle" | "confirmee" | "livree" | "annulee";

export type Order = {
  id: string;
  ref: string;
  product_id: string;
  customer_name: string;
  phone: string;
  phone2: string | null;
  commune: string;
  quartier: string;
  note: string | null;
  qty: number;
  goods_total: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  followed_up: boolean;
  source: string | null;
  created_at: string;
  delivered_at: string | null;
  cancel_reason: string | null;
};

export type ExpenseKind = "pub" | "stock" | "livraison" | "autre";

export type Expense = {
  id: string;
  spent_on: string;
  kind: ExpenseKind;
  label: string;
  amount: number;
  product_id: string | null;
  created_at: string;
};

export const COMMUNES = [
  "Abobo", "Adjamé", "Anyama", "Attécoubé", "Bingerville", "Cocody",
  "Koumassi", "Marcory", "Plateau", "Port-Bouët", "Songon",
  "Treichville", "Yopougon", "Autre / hors Abidjan",
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  nouvelle: "Nouvelle",
  confirmee: "Confirmée",
  livree: "Livrée",
  annulee: "Annulée",
};
