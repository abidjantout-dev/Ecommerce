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
-- À appliquer AUSSI aux bases existantes. Aucun administrateur n'est ajouté automatiquement.
begin;
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on public.admin_users from anon, authenticated;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "produits admin" on public.products;
create policy "produits admin" on public.products for all to authenticated
using (public.is_admin()) with check (public.is_admin());
drop policy if exists "commande publique" on public.orders;
drop policy if exists "commandes admin" on public.orders;
drop policy if exists "commandes maj" on public.orders;
drop policy if exists "commandes suppr" on public.orders;
create policy "commandes admin" on public.orders for all to authenticated
using (public.is_admin()) with check (public.is_admin());
drop policy if exists "depenses admin" on public.expenses;
create policy "depenses admin" on public.expenses for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Pas de SELECT sur les commandes publiques, ni de prix/statut fournis par le client.
create or replace function public.place_order(
  p_product_id uuid, p_qty integer, p_customer_name text, p_phone text,
  p_commune text, p_quartier text, p_phone2 text default null, p_note text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  prod public.products;
  tier jsonb;
  reference text;
  prix integer;
  livraison integer;
begin
  if p_customer_name is null or length(trim(p_customer_name)) not between 1 and 150
    or p_phone is null or p_phone !~ '^2250[157][0-9]{8}$'
    or (p_phone2 is not null and p_phone2 !~ '^2250[157][0-9]{8}$')
    or p_quartier is null or length(trim(p_quartier)) not between 1 and 500
    or p_commune is null or p_commune not in ('Abobo','Adjamé','Anyama','Attécoubé','Bingerville','Cocody','Koumassi','Marcory','Plateau','Port-Bouët','Songon','Treichville','Yopougon','Autre / hors Abidjan')
    or length(coalesce(p_note,'')) > 2000 then
    raise exception 'Coordonnées invalides';
  end if;
  select * into prod from public.products where id = p_product_id and active = true;
  if not found then raise exception 'Produit indisponible'; end if;
  select t into tier from jsonb_array_elements(prod.tiers) t where (t->>'qty')::integer = p_qty;
  if tier is null or p_qty is null or p_qty <= 0 then raise exception 'Quantité indisponible'; end if;
  prix := (tier->>'price')::integer;
  livraison := case when (tier->>'free_delivery')::boolean then 0 else prod.delivery_fee end;
  reference := 'C' || to_char(now() at time zone 'UTC','YYMMDD') || '-' || upper(replace(gen_random_uuid()::text,'-',''));
  insert into public.orders(ref,product_id,customer_name,phone,phone2,commune,quartier,note,qty,goods_total,delivery_fee,total)
  values(reference,prod.id,trim(p_customer_name),p_phone,p_phone2,p_commune,trim(p_quartier),p_note,p_qty,prix,livraison,prix+livraison);
  return jsonb_build_object('ref',reference,'total',prix+livraison);
end;
$$;
revoke all on function public.place_order(uuid,integer,text,text,text,text,text,text) from public;
grant execute on function public.place_order(uuid,integer,text,text,text,text,text,text) to anon, authenticated;
commit;
