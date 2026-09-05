-- =====================================================
-- DEMO USERS: create auth.users + profiles for each role
-- All passwords follow pattern: <username>123!
-- =====================================================

do $$
declare
  v_uid uuid;
  v_branch_id uuid;
  v_admin_exists boolean;
  v_owner_uid uuid;
begin
  select id into v_branch_id from public.branches where name = 'Main Branch' limit 1;

  -- SUPER_ADMIN: admin
  select user_id into v_admin_exists from public.profiles where username = 'admin' limit 1;
  if v_admin_exists is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      'admin@demo.restaurant', crypt('admin123!', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Super Admin"}'::jsonb, now(), now(),
      '', '', '', ''
    );
    insert into public.profiles (user_id, username, full_name, role, branch_id, is_active)
    values (v_uid, 'admin', 'Super Admin', 'SUPER_ADMIN', null, true);
  end if;

  -- OWNER
  v_uid := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
    'owner@demo.restaurant', crypt('owner123!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Budi Owner"}'::jsonb, now(), now(),
    '', '', '', ''
  );
  insert into public.profiles (user_id, username, full_name, role, branch_id, is_active)
  values (v_uid, 'owner', 'Budi Owner', 'OWNER', v_branch_id, true);

  -- MANAGER
  v_uid := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
    'manager@demo.restaurant', crypt('manager123!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Siti Manager"}'::jsonb, now(), now(),
    '', '', '', ''
  );
  insert into public.profiles (user_id, username, full_name, role, branch_id, is_active)
  values (v_uid, 'manager', 'Siti Manager', 'MANAGER', v_branch_id, true);

  -- CASHIER
  v_uid := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
    'cashier@demo.restaurant', crypt('cashier123!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Andi Cashier"}'::jsonb, now(), now(),
    '', '', '', ''
  );
  insert into public.profiles (user_id, username, full_name, role, branch_id, is_active)
  values (v_uid, 'cashier', 'Andi Cashier', 'CASHIER', v_branch_id, true);

  -- WAITER
  v_uid := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
    'waiter@demo.restaurant', crypt('waiter123!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Rina Waiter"}'::jsonb, now(), now(),
    '', '', '', ''
  );
  insert into public.profiles (user_id, username, full_name, role, branch_id, is_active)
  values (v_uid, 'waiter', 'Rina Waiter', 'WAITER', v_branch_id, true);

  -- KITCHEN
  v_uid := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
    'kitchen@demo.restaurant', crypt('kitchen123!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Joko Kitchen"}'::jsonb, now(), now(),
    '', '', '', ''
  );
  insert into public.profiles (user_id, username, full_name, role, branch_id, is_active)
  values (v_uid, 'kitchen', 'Joko Kitchen', 'KITCHEN', v_branch_id, true);

  -- INVENTORY
  v_uid := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
    'inventory@demo.restaurant', crypt('inventory123!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Devi Inventory"}'::jsonb, now(), now(),
    '', '', '', ''
  );
  insert into public.profiles (user_id, username, full_name, role, branch_id, is_active)
  values (v_uid, 'inventory', 'Devi Inventory', 'INVENTORY', v_branch_id, true);

  -- ACCOUNTING
  v_uid := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
    'accounting@demo.restaurant', crypt('accounting123!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Lina Accounting"}'::jsonb, now(), now(),
    '', '', '', ''
  );
  insert into public.profiles (user_id, username, full_name, role, branch_id, is_active)
  values (v_uid, 'accounting', 'Lina Accounting', 'ACCOUNTING', v_branch_id, true);
end $$;