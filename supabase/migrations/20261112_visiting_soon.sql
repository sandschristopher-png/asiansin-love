-- =====================================================================
-- "Visiting Soon": forward-looking travel itineraries, built on public.user_trips
-- (created by 20261111_travel_paywall.sql; Plus paywall via public.has_active_plus).
--
-- Column names stay as they are in the live table, which the app already reads and writes:
--   destination_city = city, destination_country = country,
--   start_date = arrival_date, end_date = departure_date.
-- Renaming them would break Discover and the profile between a deploy and this script.
--
-- What this adds:
--   1. note        optional itinerary context, at most 140 characters.
--   2. A stop lasts at most 90 days (was 180).
--   3. Reading: a member sees their own trips, and other members' upcoming trips only while the
--      owner has Plus, the trip is active and has not ended, and neither of them has blocked the
--      other (public.users_blocked is security definer, since a member's own session cannot see
--      who blocked them).
--   4. Trigger guard_trip_rules: no links, handles or phone numbers in note / city / country (same
--      detector as profiles, public.profile_text_has_contact), and at most 3 upcoming trips each.
--   5. Index on (city, arrival, departure) for the Discover "Visiting hub" filter.
--   6. RLS on, anon fully revoked, members keep select / insert / update / delete as before
--      (insert and update still require Plus through the existing policies).
--
-- Needs 20261111_travel_paywall.sql and 20261111_profile_link_guard.sql (already run).
-- Safe to re-run.
-- =====================================================================

begin;

do $$
begin
  if to_regclass('public.user_trips') is null then
    raise exception 'public.user_trips is missing: run 20261111_travel_paywall.sql first';
  end if;
  if to_regprocedure('public.profile_text_has_contact(text, boolean)') is null then
    raise exception 'public.profile_text_has_contact is missing: run 20261111_profile_link_guard.sql first';
  end if;
  if to_regprocedure('public.has_active_plus(uuid)') is null then
    raise exception 'public.has_active_plus is missing: run 20261111_travel_paywall.sql first';
  end if;
end;
$$;

-- 1. Note --------------------------------------------------------------------
alter table public.user_trips add column if not exists note text;

alter table public.user_trips drop constraint if exists check_trip_note_len;
alter table public.user_trips
  add constraint check_trip_note_len check (note is null or char_length(note) <= 140);

-- 2. 90-day stops (NOT VALID: rows saved under the old 180-day rule are not re-checked) -----------
alter table public.user_trips drop constraint if exists check_trip_length;
alter table public.user_trips
  add constraint check_trip_length check (end_date - start_date <= 90) not valid;

-- 3. Blocks and reading ---------------------------------------------------------
create or replace function public.users_blocked(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_blocks b
     where (b.blocker_id = p_a and b.blocked_id = p_b)
        or (b.blocker_id = p_b and b.blocked_id = p_a)
  );
$$;

revoke all on function public.users_blocked(uuid, uuid) from public, anon;
grant execute on function public.users_blocked(uuid, uuid) to authenticated, service_role;

alter table public.user_trips enable row level security;
revoke all on table public.user_trips from anon;
revoke all on table public.user_trips from authenticated;
grant select, insert, update, delete on table public.user_trips to authenticated;

drop policy if exists "Allow authenticated users to read active trips" on public.user_trips;
drop policy if exists "Members read upcoming trips" on public.user_trips;
create policy "Members read upcoming trips"
  on public.user_trips
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or (
      is_active = true
      and end_date >= current_date
      and public.has_active_plus(user_id)
      and not public.users_blocked(auth.uid(), user_id)
    )
  );
-- Insert / update / delete policies from 20261111_travel_paywall.sql are unchanged: the owner only,
-- and only while they have Plus (delete stays open so a lapsed member can clean up).

-- 4. Text and count guard ---------------------------------------------------------
create or replace function public.guard_trip_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  upcoming integer;
begin
  if public.profile_text_has_contact(NEW.note, false)
     or public.profile_text_has_contact(NEW.destination_city, true)
     or public.profile_text_has_contact(NEW.destination_country, true) then
    raise exception 'Links, messaging handles and phone numbers are not allowed in trips.'
      using errcode = '23514';
  end if;

  if TG_OP = 'INSERT' then
    select count(*) into upcoming
      from public.user_trips
     where user_id = NEW.user_id and is_active = true and end_date >= current_date;
    if upcoming >= 3 then
      raise exception 'You can have up to 3 upcoming trips.' using errcode = '23514';
    end if;
  end if;

  return NEW;
end;
$$;

revoke all on function public.guard_trip_rules() from public, anon, authenticated;

drop trigger if exists trg_guard_trip_rules on public.user_trips;
create trigger trg_guard_trip_rules
  before insert or update of note, destination_city, destination_country on public.user_trips
  for each row execute function public.guard_trip_rules();

-- 5. Hub filter index ---------------------------------------------------------------
create index if not exists idx_user_trips_city_dates
  on public.user_trips (destination_city, start_date, end_date);

commit;

-- Rollback (manual):
--   drop trigger if exists trg_guard_trip_rules on public.user_trips;
--   drop function if exists public.guard_trip_rules();
--   drop index if exists public.idx_user_trips_city_dates;
--   alter table public.user_trips drop column if exists note;
--   drop function if exists public.users_blocked(uuid, uuid);
