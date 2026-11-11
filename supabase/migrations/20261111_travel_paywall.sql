-- =====================================================================
-- Travel itinerary engine ("Visiting Soon") with a database-level Plus paywall.
--
-- 1. profiles.travel_intent (optional self-description; is_plus already exists).
-- 2. public.has_active_plus(uid): the single SQL source of truth for the paywall. It reads
--    profiles.is_plus only. is_plus is a protected column (guard_profile_protected_columns), and
--    it is the one flag the Stripe webhook and claim_day_one_slot always write with the service role.
-- 3. user_trips: multi-leg itinerary. RLS:
--      - read: any signed-in member, but only active trips whose owner has Plus *now*
--        (a lapsed membership stops broadcasting immediately);
--      - insert / update: the owner, and only while they have Plus;
--      - delete: the owner, always (lapsed members can still clean up).
--    Text lengths and date order are enforced here too, so direct table writes that skip the
--    server actions in actions/trips.ts get the same limits.
-- 4. Security fix: subscription_status, current_period_end, plus_expires_at and is_premium were
--    writable by members, and lib/plus.ts isPlusProfile() trusts them (free Plus, unlimited
--    Sparks). A second guard trigger now keeps member JWT writes from changing them, using the
--    same pattern as guard_profile_protected_columns. The webhook and the Day 1 grant use the
--    service role and are unaffected.
--
-- Safe to re-run.
-- =====================================================================

begin;

-- 1. Profile columns -------------------------------------------------------
alter table public.profiles add column if not exists is_plus boolean not null default false;
alter table public.profiles add column if not exists travel_intent text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_travel_intent_check') then
    alter table public.profiles add constraint profiles_travel_intent_check
      check (travel_intent is null or travel_intent in ('expat', 'frequent_visitor', 'trip_booked', 'planning_move', 'explorer'));
  end if;
end;
$$;

-- 2. Paywall helper ----------------------------------------------------------
-- security definer so RLS on profiles never hides the row the check needs.
create or replace function public.has_active_plus(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_plus from public.profiles p where p.id = p_user_id), false);
$$;

revoke all on function public.has_active_plus(uuid) from public, anon;
grant execute on function public.has_active_plus(uuid) to authenticated, service_role;

-- 3. Trips table ---------------------------------------------------------------
create table if not exists public.user_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  destination_city text not null,
  destination_country text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint check_trip_dates check (end_date >= start_date),
  constraint check_trip_length check (end_date <= start_date + 180),
  constraint check_trip_city_len check (char_length(btrim(destination_city)) between 1 and 80),
  constraint check_trip_country_len check (char_length(btrim(destination_country)) between 1 and 80)
);

create index if not exists idx_user_trips_destination
  on public.user_trips (destination_country, destination_city, start_date, end_date)
  where is_active = true;

create index if not exists idx_user_trips_user_id
  on public.user_trips (user_id, start_date);

alter table public.user_trips enable row level security;

revoke all on table public.user_trips from anon, authenticated;
grant select, insert, update, delete on table public.user_trips to authenticated;

drop policy if exists "Allow authenticated users to read active trips" on public.user_trips;
create policy "Allow authenticated users to read active trips"
  on public.user_trips
  for select
  to authenticated
  using (
    (is_active = true and public.has_active_plus(user_id))
    or auth.uid() = user_id
  );

drop policy if exists "Allow only Plus members to create trips" on public.user_trips;
create policy "Allow only Plus members to create trips"
  on public.user_trips
  for insert
  to authenticated
  with check (auth.uid() = user_id and public.has_active_plus(auth.uid()));

drop policy if exists "Allow only Plus members to update own trips" on public.user_trips;
create policy "Allow only Plus members to update own trips"
  on public.user_trips
  for update
  to authenticated
  using (auth.uid() = user_id and public.has_active_plus(auth.uid()))
  with check (auth.uid() = user_id and public.has_active_plus(auth.uid()));

drop policy if exists "Allow users to delete own trips" on public.user_trips;
create policy "Allow users to delete own trips"
  on public.user_trips
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- 4. Guard the remaining Plus-status columns ------------------------------------
create or replace function public.guard_profile_plus_status_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  cols text[] := array['subscription_status', 'current_period_end', 'plus_expires_at', 'is_premium'];
  new_j jsonb := to_jsonb(NEW);
  old_j jsonb;
  col text;
begin
  -- Trusted contexts: no end-user JWT, or the service role (Stripe webhook, Day 1 grant).
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
    -- INSERT by a member: these start empty (is_premium false).
    foreach col in array cols loop
      if new_j ? col then
        new_j := jsonb_set(new_j, array[col], case when col = 'is_premium' then 'false'::jsonb else 'null'::jsonb end);
      end if;
    end loop;
  end if;

  NEW := jsonb_populate_record(NEW, new_j);
  return NEW;
end;
$$;

drop trigger if exists trg_guard_profile_plus_status on public.profiles;
create trigger trg_guard_profile_plus_status
  before insert or update on public.profiles
  for each row execute function public.guard_profile_plus_status_columns();

commit;

-- Rollback (manual):
--   drop trigger if exists trg_guard_profile_plus_status on public.profiles;
--   drop function if exists public.guard_profile_plus_status_columns();
--   drop table if exists public.user_trips;
--   drop function if exists public.has_active_plus(uuid);
--   alter table public.profiles drop constraint if exists profiles_travel_intent_check;
--   alter table public.profiles drop column if exists travel_intent;
