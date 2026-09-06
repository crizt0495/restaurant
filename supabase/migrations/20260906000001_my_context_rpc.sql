-- =====================================================
-- PERFORMANCE: get_my_context() RPC
-- Replaces 4 network/DB round-trips in getCurrentUser():
--   getUser() (auth network) + profiles (DB) + role_permissions (DB)
-- with a single SECURITY DEFINER DB call using auth.uid().
-- =====================================================

create or replace function public.get_my_context()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_branch_id uuid;
  v_org uuid;
  v_permissions text[];
  v_result jsonb;
begin
  select p.role, p.branch_id, b.organization_id
    into v_role, v_branch_id, v_org
    from profiles p
    left join branches b on b.id = p.branch_id
    where p.user_id = auth.uid()
      and p.is_active = true
      and p.deleted_at is null
    limit 1;

  if v_role is null then
    return null;
  end if;

  if v_role = 'SUPER_ADMIN' then
    v_permissions := array['*'];
  else
    select coalesce(array_agg(per.key order by per.key), array[]::text[])
      into v_permissions
    from role_permissions rp
    join permissions per on per.id = rp.permission_id
    where rp.role = v_role;
  end if;

  select jsonb_build_object(
    'id', p.id,
    'user_id', p.user_id,
    'username', p.username,
    'full_name', p.full_name,
    'role', p.role,
    'branch_id', p.branch_id,
    'is_super_admin', (p.role = 'SUPER_ADMIN'),
    'organization_id', v_org,
    'permissions', v_permissions
  ) into v_result
  from profiles p
  where p.user_id = auth.uid()
    and p.is_active = true
    and p.deleted_at is null
  limit 1;

  return v_result;
end;
$$;

revoke all on function public.get_my_context() from anon;
revoke all on function public.get_my_context() from public;
grant execute on function public.get_my_context() to authenticated;
