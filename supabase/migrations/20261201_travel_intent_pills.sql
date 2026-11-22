-- =====================================================================
-- Travel Hub (/travel): the optional travel intent pill on "My Trips".
--
-- profiles.travel_intent already exists (20261111_travel_paywall.sql) with a check that only allows
-- 'expat', 'frequent_visitor', 'trip_booked', 'planning_move' and 'explorer'. The Travel Hub offers
-- three pills (Open to dates, Local guide, Relocating), stored as 'open_to_dates', 'local_guide' and
-- 'relocating'. The old values stay allowed, so no existing row can break the new check.
--
-- Run once in the Supabase SQL Editor (after 20261111_travel_paywall.sql). Safe to re-run.
-- =====================================================================

alter table public.profiles drop constraint if exists profiles_travel_intent_check;

alter table public.profiles
  add constraint profiles_travel_intent_check
  check (
    travel_intent is null
    or travel_intent in (
      'expat', 'frequent_visitor', 'trip_booked', 'planning_move', 'explorer',
      'open_to_dates', 'local_guide', 'relocating'
    )
  );

notify pgrst, 'reload schema';
