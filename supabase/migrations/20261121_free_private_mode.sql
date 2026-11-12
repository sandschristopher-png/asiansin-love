-- =====================================================================
-- 20261121_free_private_mode.sql        (meetin.asia)
--
-- Private Mode (profiles.hide_profile, "Pause Profile") is free for every member, men and women,
-- Free and Plus. 20261107_launch_patch.sql added a guard that silently put hide_profile back to its
-- old value when a man without Plus turned it on, so removing the Plus check in the app alone would
-- show "saved" while the database kept the profile visible.
--
-- This replaces guard_profile_member_flags with the same function minus the hide_profile rule, and
-- narrows the trigger to the one flag it still protects:
--   onboarding_completed   only POST /api/onboarding (service role, after the VPN / proxy gate)
--                          can mark onboarding done.
-- Ghost Mode (profiles.ghost_mode) stays a Plus feature, enforced where it matters: /api/profile/view
-- skips the profile_views insert only for an active Plus member.
-- Safe to re-run.
-- =====================================================================

begin;

create or replace function public.guard_profile_member_flags()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Trusted contexts: no end-user JWT, or the service role.
  if auth.uid() is null or coalesce(auth.role(), '') = 'service_role' then
    return NEW;
  end if;

  if TG_OP = 'INSERT' then
    NEW.onboarding_completed := false;
  elsif NEW.onboarding_completed is distinct from OLD.onboarding_completed then
    NEW.onboarding_completed := OLD.onboarding_completed;
  end if;

  return NEW;
end;
$$;

revoke all on function public.guard_profile_member_flags() from public, anon, authenticated;
grant execute on function public.guard_profile_member_flags() to service_role;

drop trigger if exists trg_guard_profile_member_flags on public.profiles;
create trigger trg_guard_profile_member_flags
  before insert or update of onboarding_completed on public.profiles
  for each row execute function public.guard_profile_member_flags();

commit;

-- Check afterwards (read-only): the function body should no longer mention hide_profile.
--   select position('hide_profile' in pg_get_functiondef('public.guard_profile_member_flags()'::regprocedure)) as should_be_0;
