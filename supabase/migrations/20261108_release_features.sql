-- =====================================================================
-- 20261108_release_features.sql        (asiansin.love)
--
-- 1. "Visiting:" travel notice (AIL+): visiting_city / visiting_country / visiting_dates /
--    is_travel_mode_active on profiles.
-- 2. Day 1 founding cohort: day_one_number (unique, 1-200) + is_day_one, assigned atomically by
--    claim_day_one_slot() from POST /api/onboarding (first 100 verified men + 100 verified women),
--    with 90 days of complimentary AIL+ (plus_expires_at).
-- 3. expire_complimentary_plus(): turns is_plus off once plus_expires_at passes for members
--    without a live Stripe subscription (scheduled hourly when pg_cron is available).
-- 4. photo_placeholders: { "<photo url>": "<tiny blurred data URL>" } written at upload time so
--    slow connections paint a blurred preview instead of an empty box.
-- 5. profiles.role ('member' | 'admin'); admin checks accept role = 'admin' or is_admin.
-- 6. Members cannot write the server-owned columns above from the browser.
--
-- The app runs before this migration: every new column is read with a fallback.
-- Safe to re-run.
-- =====================================================================

begin;

-- 1. Travel notice ----------------------------------------------------------
alter table public.profiles add column if not exists visiting_city text;
alter table public.profiles add column if not exists visiting_country text;
alter table public.profiles add column if not exists visiting_dates text;
alter table public.profiles add column if not exists is_travel_mode_active boolean not null default false;

-- 2. Day 1 cohort -------------------------------------------------------------
alter table public.profiles add column if not exists day_one_number integer;
alter table public.profiles add column if not exists is_day_one boolean not null default false;
alter table public.profiles add column if not exists plus_expires_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_day_one_number_range') then
    alter table public.profiles
      add constraint profiles_day_one_number_range
      check (day_one_number is null or (day_one_number between 1 and 200));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_day_one_number_key') then
    alter table public.profiles add constraint profiles_day_one_number_key unique (day_one_number);
  end if;
end;
$$;

-- Returns the member's Day 1 number (existing or newly assigned), or null when the cohort
-- (or their gender's half of it) is full or they are not verified. A transaction-scoped
-- advisory lock serializes concurrent claims so numbers are never duplicated or skipped.
create or replace function public.claim_day_one_slot(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_gender_count int;
  v_next int;
begin
  perform pg_advisory_xact_lock(hashtext('ail_day_one_cohort'));

  select id, gender, is_verified, verification_status, day_one_number
    into v_profile
    from public.profiles
   where id = p_user_id
   for update;

  if not found then
    return null;
  end if;
  if v_profile.day_one_number is not null then
    return v_profile.day_one_number;
  end if;
  if not (coalesce(v_profile.is_verified, false) or v_profile.verification_status = 'verified') then
    return null;
  end if;
  if v_profile.gender not in ('male', 'female') then
    return null;
  end if;

  select count(*) into v_gender_count
    from public.profiles
   where is_day_one and gender = v_profile.gender;
  if v_gender_count >= 100 then
    return null;
  end if;

  select coalesce(max(day_one_number), 0) + 1 into v_next from public.profiles where is_day_one;
  if v_next > 200 then
    return null;
  end if;

  update public.profiles
     set day_one_number = v_next,
         is_day_one = true,
         is_plus = true,
         plus_expires_at = greatest(coalesce(plus_expires_at, now()), now()) + interval '90 days'
   where id = p_user_id;

  return v_next;
end;
$$;

revoke all on function public.claim_day_one_slot(uuid) from public, anon, authenticated;
grant execute on function public.claim_day_one_slot(uuid) to service_role;

-- 3. Complimentary AIL+ expiry ---------------------------------------------------
create or replace function public.expire_complimentary_plus()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update public.profiles p
     set is_plus = false
   where p.is_plus
     and p.plus_expires_at is not null
     and p.plus_expires_at < now()
     and coalesce(to_jsonb(p) ->> 'subscription_status', '') not in ('active', 'trialing');
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.expire_complimentary_plus() from public, anon, authenticated;
grant execute on function public.expire_complimentary_plus() to service_role;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('ail-expire-complimentary-plus', '17 * * * *', 'select public.expire_complimentary_plus()');
  end if;
exception when others then
  raise notice 'pg_cron schedule skipped: %', sqlerrm;
end;
$$;

-- 4. Blurred photo previews ----------------------------------------------------
alter table public.profiles add column if not exists photo_placeholders jsonb not null default '{}'::jsonb;

-- 5. Admin role -------------------------------------------------------------------
alter table public.profiles add column if not exists role text not null default 'member';
update public.profiles set role = 'admin' where coalesce(is_admin, false) and role <> 'admin';

-- 6. Server-owned columns ---------------------------------------------------------
create or replace function public.guard_profile_release_columns()
returns trigger
language plpgsql
set search_path = public
as $g$
begin
  if auth.uid() is not null and coalesce(auth.role(), '') <> 'service_role' then
    NEW.day_one_number  := OLD.day_one_number;
    NEW.is_day_one      := OLD.is_day_one;
    NEW.plus_expires_at := OLD.plus_expires_at;
    NEW.role            := OLD.role;
  end if;
  return NEW;
end;
$g$;

drop trigger if exists guard_profile_release_columns on public.profiles;
create trigger guard_profile_release_columns
  before update on public.profiles
  for each row execute function public.guard_profile_release_columns();

commit;
