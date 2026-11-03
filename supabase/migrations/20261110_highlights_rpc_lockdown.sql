-- =====================================================================
-- 20261110_highlights_rpc_lockdown.sql        (asiansin.love)
--
-- 1. Lifestyle columns (idempotent re-assert of 20261109) + languages defaults to '{}'.
-- 2. update_user_highlights can no longer be called from the browser (anon / authenticated):
--    highlight stories are saved only through POST /api/profile/highlights, which screens them
--    (contact masking, solicitation block, reputation penalties) first.
--    The route calls server_update_user_highlights(p_user_id, p_highlights) with the service role;
--    it runs the existing update_user_highlights as that member (auth.uid() = p_user_id) so the
--    original function's logic is reused unchanged.
-- Run AFTER deploying the code that uses server_update_user_highlights (the route falls back to
-- the old call until this exists). Safe to re-run.
-- =====================================================================

begin;

-- 1. Lifestyle columns ----------------------------------------------------------------------
alter table public.profiles add column if not exists height_cm integer;
alter table public.profiles add column if not exists body_type text;
alter table public.profiles add column if not exists tattoos text;
alter table public.profiles add column if not exists piercings text;
alter table public.profiles add column if not exists drinking text;
alter table public.profiles add column if not exists smoking text;
alter table public.profiles add column if not exists fitness_rhythm text;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'profiles' and column_name = 'languages'
  ) then
    alter table public.profiles add column languages text[] default '{}'::text[];
  elsif exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'profiles'
       and column_name = 'languages' and data_type = 'ARRAY'
  ) then
    alter table public.profiles alter column languages set default '{}'::text[];
  else
    raise notice 'profiles.languages is still text: run 20261109_lifestyle_attributes.sql first.';
  end if;
end;
$$;

-- 2. Server-only highlights writer -------------------------------------------------------------
create or replace function public.server_update_user_highlights(p_user_id uuid, p_highlights jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;
  -- Make auth.uid() resolve to the member for this transaction only, then reuse the existing
  -- function (both claim formats auth.uid() reads).
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id::text, 'role', 'authenticated')::text, true);
  perform public.update_user_highlights(p_highlights);
end;
$$;

revoke all on function public.server_update_user_highlights(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.server_update_user_highlights(uuid, jsonb) to service_role;

-- No more direct calls from the browser (dev-console bypass of moderation).
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'update_user_highlights'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end;
$$;

commit;
