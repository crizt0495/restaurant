-- =====================================================
-- FIX: recmath_items was declared before inventory_items in init migration
-- so its CREATE TABLE failed on the forward FK reference.
-- Re-create it here (after inventory_items).
-- =====================================================

create table if not exists recipe_items (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  quantity numeric(14,2) not null default 1,
  unit text,
  created_at timestamptz default now()
);

create index if not exists idx_ri_recipe on recipe_items(recipe_id);
create index if not exists idx_ri_inv on recipe_items(inventory_item_id);

alter table recipe_items enable row level security;

create policy "ri_select_org"
  on recipe_items for select
  using (
    recipe_id in (select r.id from recipes r join products p on p.id = r.product_id where p.organization_id = (select b.organization_id from branches b where b.id = (select branch_id from profiles where user_id = auth.uid())))
    or (select role from profiles where user_id = auth.uid()) = 'SUPER_ADMIN'
  );

create policy "ri_insert_admin"
  on recipe_items for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

create policy "ri_update_admin"
  on recipe_items for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

create policy "ri_delete_admin"
  on recipe_items for delete
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));