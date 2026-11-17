-- =====================================================================
-- 20261125_moments_vibes.sql        (meetin.asia)
--
-- Moments overhaul: lifestyle vibes, guided prompts and the full Southeast Asia city list.
--
--   moments.vibe_tag        one of 8 lifestyle vibes (replaces the old activity tag; old rows are backfilled)
--   moments.prompt_question one of 5 guided prompts shown above the caption (optional)
--   moments.city            now any of the 46 Southeast Asian cities in lib/seaLocations.ts
--   create_moment(...)      new signature: p_vibe_tag, p_prompt, p_location_verified (service role only, same
--                           verification, reputation and 2-per-24-hours rules as before)
--   moments.location_verified true when the city was confirmed from the author's GPS fix (server-checked)
-- Safe to re-run.
-- =====================================================================

begin;

-- 1. Columns ---------------------------------------------------------------------------------------
alter table public.moments add column if not exists vibe_tag text;
alter table public.moments add column if not exists prompt_question text;
alter table public.moments add column if not exists location_verified boolean not null default false;

alter table public.moments alter column activity_tag drop not null;

update public.moments
   set vibe_tag = case activity_tag
                    when 'coffee' then 'cafe_hopping'
                    when 'street_food' then 'street_food'
                    when 'city_walk' then 'city_walks'
                    when 'sunset' then 'beach_sunset'
                    when 'gym' then 'fitness_wellness'
                    when 'date_spot' then 'local_gems'
                    else 'local_gems'
                  end
 where vibe_tag is null;

alter table public.moments drop constraint if exists moments_vibe_tag_check;
alter table public.moments add constraint moments_vibe_tag_check
  check (vibe_tag is null or vibe_tag in ('cafe_hopping', 'street_food', 'city_walks', 'beach_sunset', 'fitness_wellness', 'remote_work', 'weekend_trips', 'local_gems'));

alter table public.moments drop constraint if exists moments_prompt_question_check;
alter table public.moments add constraint moments_prompt_question_check
  check (prompt_question is null or prompt_question in ('favorite_spot', 'weekend', 'best_food', 'first_hangout', 'view'));

create index if not exists idx_moments_vibe_feed on public.moments (vibe_tag, created_at desc) where status = 'active';

-- 2. Cities: exactly the 46 in lib/seaLocations.ts -------------------------------------------------
alter table public.moments drop constraint if exists moments_city_check;
alter table public.moments drop constraint if exists moments_city_sea_check;
alter table public.moments add constraint moments_city_sea_check
  check (city in ('Manila', 'Cebu', 'Davao', 'Angeles / Clark', 'Iloilo', 'Bacolod', 'Dumaguete', 'Palawan', 'Boracay', 'Baguio', 'Subic', 'Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Krabi', 'Koh Samui', 'Hua Hin', 'Chiang Rai', 'Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Nha Trang', 'Hoi An', 'Phu Quoc', 'Dalat', 'Jakarta', 'Bali', 'Surabaya', 'Yogyakarta', 'Bandung', 'Lombok', 'Phnom Penh', 'Siem Reap', 'Sihanoukville', 'Kampot', 'Kratie', 'Kuala Lumpur', 'Penang', 'Johor Bahru', 'Kota Kinabalu', 'Malacca', 'Singapore', 'Vientiane', 'Luang Prabang', 'Bandar Seri Begawan'));

-- 3. create_moment: verification, reputation and the 2-per-24-hours cap (service role only) --------
drop function if exists public.create_moment(uuid, text, text, text, text, text);
drop function if exists public.create_moment(uuid, text, text, text, text, text, text);

create or replace function public.create_moment(
  p_user_id uuid,
  p_image_url text,
  p_aspect_ratio text,
  p_caption text,
  p_vibe_tag text,
  p_prompt text,
  p_city text,
  p_location_verified boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_verified boolean;
  v_rep integer;
  v_recent integer;
  v_id uuid;
begin
  -- One poster at a time per member, so two parallel requests cannot both pass the cap.
  perform pg_advisory_xact_lock(hashtext('moments:' || p_user_id::text));

  select (coalesce(is_verified, false) or lower(coalesce(verification_status, '')) = 'verified'),
         coalesce(reputation_score, 100)
    into v_verified, v_rep
    from public.profiles where id = p_user_id;

  if not coalesce(v_verified, false) then
    raise exception 'MOMENT_VERIFICATION_REQUIRED' using errcode = 'P0001';
  end if;
  if v_rep < 70 then
    raise exception 'MOMENT_LOW_REPUTATION' using errcode = 'P0001';
  end if;

  select count(*) into v_recent from public.moments
   where user_id = p_user_id and created_at > now() - interval '24 hours' and status <> 'removed';
  if v_recent >= 2 then
    raise exception 'MOMENT_RATE_LIMIT' using errcode = 'P0001';
  end if;

  insert into public.moments (user_id, image_url, aspect_ratio, caption, vibe_tag, prompt_question, city, location_verified)
  values (p_user_id, p_image_url, coalesce(nullif(p_aspect_ratio, ''), '4:5'), nullif(btrim(coalesce(p_caption, '')), ''),
          p_vibe_tag, nullif(p_prompt, ''), p_city, coalesce(p_location_verified, false))
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_moment(uuid, text, text, text, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.create_moment(uuid, text, text, text, text, text, text, boolean) to service_role;

commit;

-- Make PostgREST pick up the new columns and function signature right away.
notify pgrst, 'reload schema';

-- Checks worth running afterwards (read-only)
--   select vibe_tag, count(*) from public.moments group by 1 order by 2 desc;
--   select conname from pg_constraint where conrelid = 'public.moments'::regclass and contype = 'c';
--   select p.proname, pg_get_function_identity_arguments(p.oid) from pg_proc p where p.proname = 'create_moment';
