-- ============================================================
-- Moïva — schéma de la boutique
-- À coller dans Supabase > SQL Editor > New query > Run
-- ============================================================

-- ---------- PRODUITS ----------
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  tagline       text,
  description   text,
  cost_price    integer not null default 0,   -- coût de revient par pièce (FCFA)
  delivery_fee  integer not null default 1000,-- livraison facturée au client
  delivery_cost integer not null default 1000,-- ce que te coûte le livreur
  stock_initial integer not null default 0,
  images        jsonb  not null default '[]'::jsonb, -- [{url, caption}]
  tiers         jsonb  not null default '[]'::jsonb, -- [{qty, price, free_delivery}]
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------- COMMANDES ----------
do $$ begin
  create type order_status as enum ('nouvelle','confirmee','livree','annulee');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  ref           text unique not null default
                  'C' || to_char(now(),'YYMMDD') || '-' || upper(substr(md5(random()::text),1,4)),
  product_id    uuid not null references public.products(id) on delete restrict,
  customer_name text not null,
  phone         text not null,
  phone2        text,
  commune       text not null,
  quartier      text not null,
  note          text,
  qty           integer not null check (qty > 0),
  goods_total   integer not null,   -- prix du palier, hors livraison
  delivery_fee  integer not null,   -- facturé au client (0 si offerte)
  total         integer not null,   -- ce que le client paie
  status        order_status not null default 'nouvelle',
  followed_up   boolean not null default false,
  source        text,               -- facebook, whatsapp, bouche-à-oreille…
  created_at    timestamptz not null default now(),
  delivered_at  timestamptz,
  cancel_reason text
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx  on public.orders (status);

-- ---------- DÉPENSES ----------
do $$ begin
  create type expense_kind as enum ('pub','stock','livraison','autre');
exception when duplicate_object then null; end $$;

create table if not exists public.expenses (
  id         uuid primary key default gen_random_uuid(),
  spent_on   date not null default current_date,
  kind       expense_kind not null default 'pub',
  label      text not null,
  amount     integer not null check (amount >= 0),
  product_id uuid references public.products(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists expenses_date_idx on public.expenses (spent_on desc);

-- ============================================================
-- SÉCURITÉ (RLS)
-- Le public peut UNIQUEMENT créer une commande.
-- Tout le reste exige d'être connecté.
-- ============================================================
alter table public.products enable row level security;
alter table public.orders   enable row level security;
alter table public.expenses enable row level security;

-- Produits : lisibles par tous (la page de vente en a besoin)
drop policy if exists "produits visibles" on public.products;
create policy "produits visibles" on public.products
  for select using (active = true);

drop policy if exists "produits admin" on public.products;
create policy "produits admin" on public.products
  for all to authenticated using (true) with check (true);

-- Commandes : création ouverte, lecture et modification réservées
drop policy if exists "commande publique" on public.orders;
create policy "commande publique" on public.orders
  for insert to anon, authenticated with check (true);

drop policy if exists "commandes admin" on public.orders;
create policy "commandes admin" on public.orders
  for select to authenticated using (true);

drop policy if exists "commandes maj" on public.orders;
create policy "commandes maj" on public.orders
  for update to authenticated using (true) with check (true);

drop policy if exists "commandes suppr" on public.orders;
create policy "commandes suppr" on public.orders
  for delete to authenticated using (true);

-- Dépenses : strictement privées
drop policy if exists "depenses admin" on public.expenses;
create policy "depenses admin" on public.expenses
  for all to authenticated using (true) with check (true);

-- ============================================================
-- PRODUIT DE DÉPART — adapte les prix si besoin
-- ============================================================
insert into public.products (slug, name, tagline, description,
  cost_price, delivery_fee, delivery_cost, stock_initial, tiers)
values (
  'lunettes-anti-eblouissement',
  'Lunettes de conduite anti-éblouissement',
  'Les phares d''en face ne vous aveuglent plus',
  'Verres jaunes qui filtrent l''éblouissement des phares et des lampadaires. Se portent par-dessus vos lunettes de vue. Protection UV400 le jour.',
  465, 1000, 1000, 100,
  '[{"qty":1,"price":5000,"free_delivery":false},
    {"qty":2,"price":9000,"free_delivery":true},
    {"qty":3,"price":13000,"free_delivery":true},
    {"qty":5,"price":20000,"free_delivery":true}]'::jsonb
)
on conflict (slug) do nothing;
