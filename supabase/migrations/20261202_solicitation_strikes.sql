-- =====================================================================
-- Three-strike anti-solicitation (public text: profile bio and details, Moments captions).
--
-- Detection is in the app (lib/moderation/solicitationFilter.ts). This file holds the state and the one atomic step:
--
--   profiles.solicitation_strikes   how many times the member has posted transactional / bill-paying / payment-rail text
--   profiles.visibility_status      'active' | 'held' | 'banned'
--   profiles.edit_locked_until      strike 2 locks bio and Moment editing until this time (24 hours)
--
--   record_solicitation_strike(p_user_id)   service role only. One more strike, in one locked row update:
--       strike 1: reputation_score - 15, nothing else (the save was refused before it was written);
--       strike 2: reputation_score - 35 more (50 in all), visibility 'held', edit_locked_until = now + 24 hours;
--       strike 3: reputation_score 0, visibility 'banned'. The app then bans the sign-in (auth) and ends the session.
--     A 'held' profile is hidden from Discover and Moments only while edit_locked_until is in the future, so the hold
--     lifts by itself after 24 hours. 'banned' is permanent.
--
-- Members cannot write any of the three columns (a guard trigger puts the old values back), exactly like the Plus
-- status columns. The numbers above are mirrored in lib/moderation/solicitationFilter.ts (nextStrike) and tested.
--
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- =====================================================================

begin;

alter table public.profiles add column if not exists solicitation_strikes integer not null default 0;
alter table public.profiles add column if not exists visibility_status text not null default 'active';
alter table public.profiles add column if not exists edit_locked_until timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_visibility_status_check') then
    alter table public.profiles add constraint profiles_visibility_status_check
      check (visibility_status in ('active', 'held', 'banned'));
  end if;
end;
$$;

-- Members cannot change their own strike state ------------------------------------------------
create or replace function public.guard_profile_strike_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  cols text[] := array['solicitation_strikes', 'visibility_status', 'edit_locked_until'];
  new_j jsonb := to_jsonb(NEW);
  old_j jsonb;
  col text;
begin
  -- Trusted contexts: no end-user JWT, or the service role.
  if auth.uid() is null or coalesce(auth.role(), '') = 'service_role' then
    return NEW;
  end if;

  if TG_OP = 'UPDATE' then
    old_j := to_jsonb(OLD);
    foreach col in array cols loop
      if new_j ? col then
        new_j := jsonb_set(new_j, array[col], coalesce(old_j -> col, 'null'::jsonb));
      end if;
    end loop;
  else
    -- INSERT by a member: a clean record.
    foreach col in array cols loop
      if new_j ? col then
        new_j := jsonb_set(
          new_j, array[col],
          case col when 'solicitation_strikes' then '0'::jsonb when 'visibility_status' then '"active"'::jsonb else 'null'::jsonb end
        );
      end if;
    end loop;
  end if;

  NEW := jsonb_populate_record(NEW, new_j);
  return NEW;
end;
$$;

drop trigger if exists trg_guard_profile_strikes on public.profiles;
create trigger trg_guard_profile_strikes
  before insert or update on public.profiles
  for each row execute function public.guard_profile_strike_columns();

-- One more strike ----------------------------------------------------------------------------------
create or replace function public.record_solicitation_strike(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_strikes integer;
  v_rep integer;
  v_status text := 'active';
  v_lock timestamptz := null;
begin
  select coalesce(solicitation_strikes, 0) + 1, coalesce(reputation_score, 100)
    into v_strikes, v_rep
    from public.profiles
   where id = p_user_id
   for update;

  if not found then
    return null;
  end if;

  if v_strikes >= 3 then
    v_rep := 0;
    v_status := 'banned';
  elsif v_strikes = 2 then
    v_rep := greatest(0, v_rep - 35);
    v_status := 'held';
    v_lock := now() + interval '24 hours';
  else
    v_rep := greatest(0, v_rep - 15);
  end if;

  update public.profiles
     set solicitation_strikes = v_strikes,
         reputation_score = v_rep,
         visibility_status = v_status,
         edit_locked_until = case when v_status = 'banned' then null else coalesce(v_lock, edit_locked_until) end
   where id = p_user_id;

  return jsonb_build_object(
    'strikes', v_strikes,
    'reputation', v_rep,
    'visibility', v_status,
    'edit_locked_until', v_lock
  );
end;
$$;

revoke all on function public.record_solicitation_strike(uuid) from public, anon, authenticated;
grant execute on function public.record_solicitation_strike(uuid) to service_role;

commit;

notify pgrst, 'reload schema';

-- Rollback (manual):
--   drop function if exists public.record_solicitation_strike(uuid);
--   drop trigger if exists trg_guard_profile_strikes on public.profiles;
--   drop function if exists public.guard_profile_strike_columns();
--   alter table public.profiles drop constraint if exists profiles_visibility_status_check;
--   alter table public.profiles drop column if exists edit_locked_until;
--   alter table public.profiles drop column if exists visibility_status;
--   alter table public.profiles drop column if exists solicitation_strikes;
