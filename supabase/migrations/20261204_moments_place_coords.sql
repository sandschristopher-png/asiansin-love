-- =====================================================================
-- Spot map: where a spot-tagged Moment sits on the map (needs 20261203_moments_place.sql).
--
-- moments.place_lat / place_lng   the pin, rounded to 3 decimals (about 110 m) by the API before it is written, so a
--                                 pin marks a venue or a street corner and never an exact door. The API also refuses a
--                                 pin that is not within 100 km of the Moment's city, and one without a place name.
--                                 The maps app is still opened with "<place>, <city>", not these coordinates.
--
-- The index serves the map query (active, pinned Moments, newest first). Until this is run the map shows nothing and
-- posting a Moment with a pin saves the spot name only.
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- =====================================================================

alter table public.moments add column if not exists place_lat double precision;
alter table public.moments add column if not exists place_lng double precision;

alter table public.moments drop constraint if exists moments_place_coords_valid;
alter table public.moments
  add constraint moments_place_coords_valid check (
    (place_lat is null and place_lng is null)
    or (place_lat between -90 and 90 and place_lng between -180 and 180 and place_name is not null)
  );

create index if not exists idx_moments_pinned
  on public.moments (created_at desc)
  where status = 'active' and place_lat is not null;

notify pgrst, 'reload schema';
