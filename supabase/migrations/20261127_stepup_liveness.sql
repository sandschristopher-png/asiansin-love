-- Step-up identity confirmation ("Turn left / right / up / down" video-selfie check).
--
-- It is not tied to voice calls. It runs when a member swaps their primary photo, when unusual activity
-- flags the account (burst messaging or sparking, repeated reports, a login from a new country), and
-- before a member released from a safety hold can message again.
--
-- Nothing here stores camera video. The check analyses the camera on the device; the server only keeps
-- an audit row per challenge (who, why, which poses were asked, pass or fail).
--
-- Run once in the Supabase SQL Editor. Safe to re-run.

-- ---------------------------------------------------------------------------------------------------------
-- 1. profiles: the restriction flag
-- ---------------------------------------------------------------------------------------------------------
alter table public.profiles add column if not exists reverification_required boolean not null default false;
alter table public.profiles add column if not exists reverification_reason text;
-- Country of the member's last session (edge geolocation), to spot a login from somewhere new.
alter table public.profiles add column if not exists last_login_country text;

-- Members must never be able to lift the restriction themselves: only the server (service role), staff
-- in the SQL editor, or SECURITY DEFINER code can change these columns.
create or replace function public.guard_profile_reverification()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null or coalesce(auth.role(), '') = 'service_role' then
    return NEW;
  end if;
  if TG_OP = 'UPDATE' then
    NEW.reverification_required := OLD.reverification_required;
    NEW.reverification_reason := OLD.reverification_reason;
    NEW.last_login_country := OLD.last_login_country;
  else
    NEW.reverification_required := false;
    NEW.reverification_reason := null;
    NEW.last_login_country := null;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_guard_profile_reverification on public.profiles;
create trigger trg_guard_profile_reverification
  before insert or update on public.profiles
  for each row execute function public.guard_profile_reverification();

-- Staff approving the manual-review fallback in /admin/verifications (status becomes 'verified') also
-- lifts the restriction.
create or replace function public.clear_reverification_on_approval()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if NEW.reverification_required
     and NEW.verification_status = 'verified'
     and OLD.verification_status is distinct from 'verified' then
    NEW.reverification_required := false;
    NEW.reverification_reason := null;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_clear_reverification_on_approval on public.profiles;
create trigger trg_clear_reverification_on_approval
  before update on public.profiles
  for each row execute function public.clear_reverification_on_approval();

-- ---------------------------------------------------------------------------------------------------------
-- 2. liveness_challenges: audit trail, one row per challenge issued
-- ---------------------------------------------------------------------------------------------------------
create table if not exists public.liveness_challenges (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  trigger_reason        text not null check (trigger_reason in
                          ('photo_swap', 'velocity', 'reports', 'new_country', 'quarantine_recovery', 'manual')),
  poses_requested       text[] not null,
  -- Single-use: the signed token carries this nonce and the row can be completed once.
  nonce                 text not null unique,
  passed                boolean,
  outcome               text check (outcome in ('passed', 'failed', 'manual_review')),
  face_match_confidence integer,
  -- photo_swap: hash of the exact photo that was matched, so only that file can be committed as primary.
  photo_sha256          text,
  consumed_at           timestamptz,
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);

create index if not exists idx_liveness_challenges_user on public.liveness_challenges (user_id, created_at desc);

alter table public.liveness_challenges enable row level security;

-- Members can read their own history. Writes happen only through the server (service role bypasses RLS).
drop policy if exists liveness_challenges_select_own on public.liveness_challenges;
create policy liveness_challenges_select_own on public.liveness_challenges
  for select to authenticated
  using (auth.uid() = user_id);

grant select on public.liveness_challenges to authenticated;

-- ---------------------------------------------------------------------------------------------------------
-- 3. Safety hold released -> the member confirms their identity before messaging again
-- ---------------------------------------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.account_freezes') is not null then
    create or replace function public.require_reverification_after_hold()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $fn$
    begin
      if OLD.cleared_at is null and NEW.cleared_at is not null then
        update public.profiles
           set reverification_required = true,
               reverification_reason = 'quarantine_recovery'
         where id = NEW.user_id;
      end if;
      return NEW;
    end;
    $fn$;

    drop trigger if exists trg_require_reverification_after_hold on public.account_freezes;
    create trigger trg_require_reverification_after_hold
      after update of cleared_at on public.account_freezes
      for each row execute function public.require_reverification_after_hold();
  end if;
end $$;

notify pgrst, 'reload schema';
