-- =====================================================================
-- Spot-tagged Moments: an optional place name on a Moment ("Kapitolyo night market", "Tops Lookout").
--
-- moments.place_name   up to 80 characters, free text, screened by the API like the caption (no contact details, no
--                      transactional wording). The app opens it in an external maps app as "<place>, <city>"; there is
--                      no map SDK and no stored coordinates.
--
-- The feed query falls back to the older columns until this is run, so nothing breaks in the meantime.
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- =====================================================================

alter table public.moments add column if not exists place_name text;

alter table public.moments drop constraint if exists moments_place_name_len;
alter table public.moments
  add constraint moments_place_name_len check (place_name is null or char_length(place_name) between 1 and 80);

notify pgrst, 'reload schema';
