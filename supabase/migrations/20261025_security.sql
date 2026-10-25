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
