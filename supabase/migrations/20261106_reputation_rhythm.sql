-- =====================================================================
-- 20261106_reputation_rhythm.sql        (asiansin.love)
--
-- 1. Rhythm badges: profiles.reply_pace, relocation_readiness, timeline_intent (CHECK-constrained).
--    New columns on purpose: the older free-text relocation / relocation_intent / marriage_timeline
--    columns hold mixed labels, so they are left as they are.
-- 2. Bios are written only by /api/profile (screened server-side). Members' browser writes to
--    profiles.bio are ignored, same pattern as guard_profile_protected_columns.
-- 3. Reputation recovery: +1 per UTC day of unflagged mutual chatting, capped at 100.
--    reputation_recovery_log makes it idempotent per member per day.
--    apply_reputation_recovery() is called by /api/messages with the service role.
-- 4. Index for the "max 5 messages per hour below 70 rep" check.
--
-- The app runs before this migration: rhythm pickers save once the columns exist, bios keep
-- saving through /api/profile, and recovery is skipped while the function is missing.
-- Safe to re-run.
-- =====================================================================

begin;

-- 1. Rhythm columns ----------------------------------------------------
alter table public.profiles add column if not exists reply_pace text;
alter table public.profiles add column if not exists relocation_readiness text;
alter table public.profiles add column if not exists timeline_intent text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_reply_pace_check') then
    alter table public.profiles add constraint profiles_reply_pace_check
      check (reply_pace is null or reply_pace in ('fast_replier', 'evenings_only', 'slow_thoughtful', 'prefers_calls'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_relocation_readiness_check') then
    alter table public.profiles add constraint profiles_relocation_readiness_check
      check (relocation_readiness is null or relocation_readiness in ('open_to_relocate', 'prefer_partner_relocate', 'rooted_in_city'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_timeline_intent_check') then
    alter table public.profiles add constraint profiles_timeline_intent_check
      check (timeline_intent is null or timeline_intent in ('marriage_1_2_years', 'long_term_dating', 'exploring'));
  end if;
end;
$$;

-- 2. Server-only bio ---------------------------------------------------
create or replace function public.guard_profile_bio()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Trusted contexts: no end-user JWT, or the service role (/api/profile).
  if auth.uid() is null or coalesce(auth.role(), '') = 'service_role' then
    return NEW;
  end if;

  if TG_OP = 'UPDATE' then
    NEW.bio := OLD.bio;
  else
    NEW.bio := null;
  end if;
  return NEW;
end;
$$;

revoke all on function public.guard_profile_bio() from public, anon, authenticated;
grant execute on function public.guard_profile_bio() to service_role;

drop trigger if exists trg_guard_profile_bio on public.profiles;
create trigger trg_guard_profile_bio
  before insert or update of bio on public.profiles
  for each row execute function public.guard_profile_bio();

-- 3. Reputation recovery -----------------------------------------------
create table if not exists public.reputation_recovery_log (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- Server-only table: RLS on, no policies.
alter table public.reputation_recovery_log enable row level security;

create or replace function public.apply_reputation_recovery(p_user_id uuid, p_partner_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_start timestamptz := (v_today::timestamp at time zone 'utc');
  v_rows int;
begin
  if p_user_id is null or p_partner_id is null or p_user_id = p_partner_id then
    return false;
  end if;

  -- Already at the cap: nothing to recover.
  if not exists (
    select 1 from public.profiles
     where id = p_user_id and coalesce(reputation_score, 100) < 100
  ) then
    return false;
  end if;

  -- Mutual chatting today: both members sent each other a delivered message.
  if not exists (
    select 1 from public.messages
     where sender_id = p_user_id and receiver_id = p_partner_id
       and coalesce(is_quarantined, false) = false and created_at >= v_start
  ) or not exists (
    select 1 from public.messages
     where sender_id = p_partner_id and receiver_id = p_user_id
       and coalesce(is_quarantined, false) = false and created_at >= v_start
  ) then
    return false;
  end if;

  -- Unflagged today: no moderation entries and no quarantined messages.
  if exists (select 1 from public.moderation_log where user_id = p_user_id and created_at >= v_start)
     or exists (
       select 1 from public.messages
        where sender_id = p_user_id and coalesce(is_quarantined, false) = true and created_at >= v_start
     ) then
    return false;
  end if;

  insert into public.reputation_recovery_log (user_id, day)
  values (p_user_id, v_today)
  on conflict (user_id, day) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return false; -- already recovered today
  end if;

  update public.profiles
     set reputation_score = least(100, coalesce(reputation_score, 100) + 1)
   where id = p_user_id;
  return true;
end;
$$;

revoke all on function public.apply_reputation_recovery(uuid, uuid) from public, anon, authenticated;
grant execute on function public.apply_reputation_recovery(uuid, uuid) to service_role;

-- 4. Hourly send-limit lookups -----------------------------------------
create index if not exists messages_sender_created_idx on public.messages (sender_id, created_at desc);

commit;
