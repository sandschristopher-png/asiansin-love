-- =====================================================================
-- 20261104_normalize_profile_country.sql        (asiansin.love)
--
-- Some profiles store the ISO code "US" as their country, including one
-- with city "Manila", which the Discover card showed as "Manila, US".
-- The app now normalizes country on save and display (lib/countries.ts);
-- this repairs the stored rows so filters and the location check agree.
-- Safe to re-run.
-- =====================================================================

begin;

-- 1. Known Philippine cities stored with a US code / name -> Philippines.
update public.profiles
   set country  = 'Philippines',
       location = trim(city) || ', Philippines'
 where lower(trim(city)) in ('manila', 'metro manila', 'quezon city', 'makati', 'makati city',
                             'taguig', 'pasig', 'cebu', 'cebu city', 'davao', 'davao city',
                             'angeles city', 'bislig')
   and upper(trim(country)) in ('US', 'USA', 'UNITED STATES');

-- 2. Bare codes / aliases -> display names (matches lib/countries.ts).
update public.profiles set country = 'United States'
 where upper(trim(country)) in ('US', 'USA', 'U.S.', 'U.S.A.', 'UNITED STATES OF AMERICA');
update public.profiles set country = 'Philippines'
 where upper(trim(country)) in ('PH', 'PHL', 'PHILS');

-- 3. Keep the denormalized "City, Country" label in sync where a city exists.
update public.profiles
   set location = trim(city) || ', ' || country
 where coalesce(trim(city), '') <> ''
   and coalesce(trim(country), '') <> ''
   and location is distinct from trim(city) || ', ' || country;

commit;
