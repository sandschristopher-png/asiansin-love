-- ===== 20261121_free_private_mode =====

begin;

create or replace function public.guard_profile_member_flags()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null or coalesce(auth.role(), '') = 'service_role' then
    return NEW;
  end if;

  if TG_OP = 'INSERT' then
    NEW.onboarding_completed := false;
  elsif NEW.onboarding_completed is distinct from OLD.onboarding_completed then
    NEW.onboarding_completed := OLD.onboarding_completed;
  end if;

  return NEW;
end;
$$;

revoke all on function public.guard_profile_member_flags() from public, anon, authenticated;
grant execute on function public.guard_profile_member_flags() to service_role;

drop trigger if exists trg_guard_profile_member_flags on public.profiles;
create trigger trg_guard_profile_member_flags
  before insert or update of onboarding_completed on public.profiles
  for each row execute function public.guard_profile_member_flags();

commit;

-- ===== 20261122_safety_reports =====

begin;

create table if not exists public.message_safety_flags (
  message_id uuid primary key references public.messages(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('solicitation', 'adult_content', 'financial', 'harassment', 'off_platform', 'low_reputation')),
  created_at timestamptz not null default now()
);

create index if not exists idx_message_safety_flags_receiver on public.message_safety_flags (receiver_id, created_at desc);

alter table public.message_safety_flags enable row level security;

drop policy if exists "Recipients read the safety flag on their messages" on public.message_safety_flags;
create policy "Recipients read the safety flag on their messages" on public.message_safety_flags
  for select to authenticated using (receiver_id = auth.uid());

revoke all on public.message_safety_flags from anon, authenticated;
grant select on public.message_safety_flags to authenticated;

create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  reason text not null,
  message_excerpt text,
  created_at timestamptz not null default now(),
  unique (reporter_id, message_id)
);

create index if not exists idx_message_reports_reported on public.message_reports (reported_user_id, created_at desc);

alter table public.message_reports enable row level security;

drop policy if exists "Reporters read their own message reports" on public.message_reports;
create policy "Reporters read their own message reports" on public.message_reports
  for select to authenticated using (reporter_id = auth.uid());

revoke all on public.message_reports from anon, authenticated;
grant select on public.message_reports to authenticated;

create table if not exists public.account_freezes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reason text not null,
  source text not null default 'filter',
  created_at timestamptz not null default now(),
  cleared_at timestamptz
);

alter table public.account_freezes enable row level security;
revoke all on public.account_freezes from anon, authenticated;

commit;

-- ===== 20261123_moments =====

begin;

create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  aspect_ratio text not null default '4:5',
  caption text check (caption is null or char_length(caption) <= 140),
  activity_tag text not null check (activity_tag in ('coffee', 'street_food', 'city_walk', 'sunset', 'gym', 'date_spot')),
  city text not null check (city in ('Manila', 'Cebu', 'Bangkok', 'Chiang Mai', 'Ho Chi Minh City', 'Hanoi', 'Jakarta', 'Bali', 'Phnom Penh', 'Kuala Lumpur', 'Singapore')),
  status text not null default 'active' check (status in ('active', 'hidden', 'removed')),
  likes_count integer not null default 0 check (likes_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_moments_feed on public.moments (created_at desc) where status = 'active';
create index if not exists idx_moments_city_feed on public.moments (city, created_at desc) where status = 'active';
create index if not exists idx_moments_author on public.moments (user_id, created_at desc);

create table if not exists public.moment_likes (
  moment_id uuid not null references public.moments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (moment_id, user_id)
);

create table if not exists public.moment_reports (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (reporter_id, moment_id)
);

create index if not exists idx_moment_reports_moment on public.moment_reports (moment_id, created_at desc);

alter table public.messages add column if not exists moment_id uuid references public.moments(id) on delete set null;
alter table public.sparks add column if not exists moment_id uuid references public.moments(id) on delete set null;

create or replace function public.moment_author_visible(p_author uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select coalesce(reputation_score, 100) >= 70 from public.profiles where id = p_author), false);
$$;

create or replace function public.moment_blocked_with(p_author uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_blocks b
     where (b.blocker_id = auth.uid() and b.blocked_id = p_author)
        or (b.blocker_id = p_author and b.blocked_id = auth.uid())
  );
$$;

revoke all on function public.moment_author_visible(uuid) from public, anon;
revoke all on function public.moment_blocked_with(uuid) from public, anon;
grant execute on function public.moment_author_visible(uuid) to authenticated, service_role;
grant execute on function public.moment_blocked_with(uuid) to authenticated, service_role;

alter table public.moments enable row level security;
alter table public.moment_likes enable row level security;
alter table public.moment_reports enable row level security;

drop policy if exists "Members read active Moments" on public.moments;
create policy "Members read active Moments" on public.moments
  for select to authenticated
  using (
    user_id = auth.uid()
    or (status = 'active' and public.moment_author_visible(user_id) and not public.moment_blocked_with(user_id))
  );

drop policy if exists "Authors delete their Moments" on public.moments;
create policy "Authors delete their Moments" on public.moments
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "Members read their own likes" on public.moment_likes;
create policy "Members read their own likes" on public.moment_likes
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "Reporters read their own Moment reports" on public.moment_reports;
create policy "Reporters read their own Moment reports" on public.moment_reports
  for select to authenticated using (reporter_id = auth.uid());

revoke all on public.moments, public.moment_likes, public.moment_reports from anon, authenticated;
grant select, delete on public.moments to authenticated;
grant select on public.moment_likes, public.moment_reports to authenticated;

create or replace function public.create_moment(
  p_user_id uuid,
  p_image_url text,
  p_aspect_ratio text,
  p_caption text,
  p_activity_tag text,
  p_city text
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

  insert into public.moments (user_id, image_url, aspect_ratio, caption, activity_tag, city)
  values (p_user_id, p_image_url, coalesce(nullif(p_aspect_ratio, ''), '4:5'), nullif(btrim(coalesce(p_caption, '')), ''), p_activity_tag, p_city)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_moment(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_moment(uuid, text, text, text, text, text) to service_role;

create or replace function public.toggle_moment_like(p_moment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_author uuid;
  v_status text;
  v_count integer;
  v_liked boolean;
  v_rows integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select user_id, status into v_author, v_status from public.moments where id = p_moment_id;
  if v_author is null or v_status <> 'active' or public.moment_blocked_with(v_author) then
    raise exception 'MOMENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  delete from public.moment_likes where moment_id = p_moment_id and user_id = v_uid;
  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    v_liked := false;
    update public.moments set likes_count = greatest(likes_count - 1, 0) where id = p_moment_id returning likes_count into v_count;
  else
    insert into public.moment_likes (moment_id, user_id) values (p_moment_id, v_uid) on conflict do nothing;
    get diagnostics v_rows = row_count;
    v_liked := true;
    if v_rows > 0 then
      update public.moments set likes_count = likes_count + 1 where id = p_moment_id returning likes_count into v_count;
    else
      select likes_count into v_count from public.moments where id = p_moment_id;
    end if;
  end if;

  return jsonb_build_object('liked', v_liked, 'likes_count', v_count);
end;
$$;

revoke all on function public.toggle_moment_like(uuid) from public, anon;
grant execute on function public.toggle_moment_like(uuid) to authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('moment-photos', 'moment-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Moment photos are publicly readable" on storage.objects;
create policy "Moment photos are publicly readable" on storage.objects
  for select to anon, authenticated using (bucket_id = 'moment-photos');

drop policy if exists "Members upload Moment photos to their own folder" on storage.objects;
create policy "Members upload Moment photos to their own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'moment-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Members delete their own Moment photos" on storage.objects;
create policy "Members delete their own Moment photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'moment-photos' and (storage.foldername(name))[1] = auth.uid()::text);

commit;

-- ===== 20261124_ip_risk =====

begin;

create table if not exists public.ip_reputation_cache (
  ip text primary key,
  is_vpn boolean not null default false,
  is_proxy boolean not null default false,
  is_tor boolean not null default false,
  is_datacenter boolean not null default false,
  is_abuser boolean not null default false,
  asn integer,
  org text,
  country_code text,
  checked_at timestamptz not null default now()
);

create index if not exists idx_ip_reputation_cache_checked on public.ip_reputation_cache (checked_at);

create table if not exists public.member_ip_flags (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null check (tier in ('clean', 'vpn', 'high')),
  ip text,
  asn integer,
  org text,
  ip_country text,
  header_country text,
  declared_country text,
  country_mismatch boolean not null default false,
  last_event text,
  penalized_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_member_ip_flags_risky on public.member_ip_flags (updated_at desc) where tier <> 'clean' or country_mismatch;

create table if not exists public.trusted_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

alter table public.ip_reputation_cache enable row level security;
alter table public.member_ip_flags enable row level security;
alter table public.trusted_members enable row level security;

revoke all on public.ip_reputation_cache, public.member_ip_flags, public.trusted_members from anon, authenticated;

commit;

-- ===== 20261125_moments_vibes =====

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
