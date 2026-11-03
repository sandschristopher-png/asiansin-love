-- =====================================================================
-- 20261109_lifestyle_attributes.sql        (asiansin.love)
--
-- Lifestyle profile attributes (non-transactional: no income, no weight).
--   1. tattoos / piercings / fitness_rhythm: new enum-like text columns.
--   2. body_type: existing values normalized, then constrained to the app's options.
--   3. height_cm backfilled from the legacy free-text `height` column.
--   4. languages: text -> text[] (from comma lists or the JSON text the app may have written).
-- drinking / smoking stay unconstrained text: older rows hold free labels ("Socially", "No") that
-- lib/lifestyle.ts maps on read; new saves write the enum values.
-- Values must match lib/lifestyle.ts and lib/constants/languages.ts. Safe to re-run.
-- =====================================================================

begin;

-- 1. New columns ---------------------------------------------------------------------
alter table public.profiles add column if not exists tattoos text;
alter table public.profiles add column if not exists piercings text;
alter table public.profiles add column if not exists fitness_rhythm text;

alter table public.profiles drop constraint if exists profiles_tattoos_check;
alter table public.profiles add constraint profiles_tattoos_check
  check (tattoos is null or tattoos in ('none', 'a_few', 'visible_sleeves', 'ink_enthusiast'));

alter table public.profiles drop constraint if exists profiles_piercings_check;
alter table public.profiles add constraint profiles_piercings_check
  check (piercings is null or piercings in ('none', 'ears_only', 'multiple'));

alter table public.profiles drop constraint if exists profiles_fitness_rhythm_check;
alter table public.profiles add constraint profiles_fitness_rhythm_check
  check (fitness_rhythm is null or fitness_rhythm in ('daily_workouts', 'walks_and_hiking', 'weekend_warrior', 'homebody'));

-- 2. body_type: normalize, then constrain (a CHECK is re-tested on every UPDATE of a row, so
--    legacy values must be fixed first or those members could never save their profile again).
update public.profiles
   set body_type = case
     when lower(trim(body_type)) in ('slim', 'thin', 'petite', 'skinny') then 'slim'
     when lower(trim(body_type)) in ('athletic', 'fit', 'toned', 'sporty') then 'athletic'
     when lower(trim(body_type)) in ('average', 'normal', 'medium') then 'average'
     when lower(trim(body_type)) in ('curvy', 'full figured', 'a few extra pounds', 'chubby') then 'curvy'
     when lower(trim(body_type)) in ('muscular', 'stocky', 'built') then 'muscular'
     else null
   end
 where body_type is not null
   and body_type not in ('slim', 'athletic', 'average', 'curvy', 'muscular');

alter table public.profiles drop constraint if exists profiles_body_type_check;
alter table public.profiles add constraint profiles_body_type_check
  check (body_type is null or body_type in ('slim', 'athletic', 'average', 'curvy', 'muscular'));

-- 3. height_cm from "173 cm" style legacy text --------------------------------------------
update public.profiles
   set height_cm = (substring(height from '(\d{3})\s*cm'))::int
 where height_cm is null
   and height ~ '\d{3}\s*cm'
   and (substring(height from '(\d{3})\s*cm'))::int between 130 and 220;

-- 4. languages: text -> text[] -------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'profiles'
       and column_name = 'languages' and data_type = 'text'
  ) then
    alter table public.profiles
      alter column languages type text[]
      using (
        case
          when languages is null or btrim(languages) = '' then null
          -- JSON text written while the column was still text: ["English","Tagalog"]
          when btrim(languages) like '[%' then
            array(select btrim(x) from jsonb_array_elements_text(languages::jsonb) as t(x) where btrim(x) <> '')
          -- legacy comma list: "English, Tagalog"
          else
            array(select btrim(x) from unnest(string_to_array(languages, ',')) as t(x) where btrim(x) <> '')
        end
      );
  end if;
end;
$$;

commit;
