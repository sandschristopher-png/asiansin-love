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

-- Make PostgREST pick up the new columns and function signature right away.
notify pgrst, 'reload schema';


-- ===== 20261126_voice_calls =====
-- Voice calls (1-on-1, audio only, peer to peer over WebRTC).
--
-- Nothing here records or stores audio: media flows directly between the two browsers. The database only keeps
-- a log row per call (who, when, how long, how it ended) so the chat timeline can show "Voice call - 6m 24s",
-- "Missed voice call" and "Voice call declined", and so the anti-spam cooldown can count missed calls.
--
-- Run this once in the Supabase SQL Editor. It is safe to re-run.

-- ---------------------------------------------------------------------------------------------------------
-- 1. call_logs
-- ---------------------------------------------------------------------------------------------------------
create table if not exists public.call_logs (
  id           uuid primary key default gen_random_uuid(),
  -- The pair the call belongs to: both member ids, sorted, joined with ':' (the same key as the realtime topic).
  match_id     text not null,
  caller_id    uuid not null references auth.users(id) on delete cascade,
  callee_id    uuid not null references auth.users(id) on delete cascade,
  started_at   timestamptz not null default now(),
  ended_at     timestamptz,
  duration_sec integer not null default 0 check (duration_sec >= 0 and duration_sec <= 7200),
  end_reason   text not null check (end_reason in ('completed', 'missed', 'declined', 'failed')),
  created_at   timestamptz not null default now(),
  constraint call_logs_distinct_members check (caller_id <> callee_id),
  constraint call_logs_match_key check (
    match_id = least(caller_id::text, callee_id::text) || ':' || greatest(caller_id::text, callee_id::text)
  )
);

create index if not exists idx_call_logs_match on public.call_logs (match_id, started_at desc);
create index if not exists idx_call_logs_caller on public.call_logs (caller_id, started_at desc);
create index if not exists idx_call_logs_callee on public.call_logs (callee_id, started_at desc);

alter table public.call_logs enable row level security;

-- Only the two members of the call can see, add or amend its row.
drop policy if exists call_logs_select_participants on public.call_logs;
create policy call_logs_select_participants on public.call_logs
  for select to authenticated
  using (auth.uid() = caller_id or auth.uid() = callee_id);

-- The caller writes the log (one writer, so a call is never logged twice).
drop policy if exists call_logs_insert_caller on public.call_logs;
create policy call_logs_insert_caller on public.call_logs
  for insert to authenticated
  with check (auth.uid() = caller_id);

drop policy if exists call_logs_update_participants on public.call_logs;
create policy call_logs_update_participants on public.call_logs
  for update to authenticated
  using (auth.uid() = caller_id or auth.uid() = callee_id)
  with check (auth.uid() = caller_id or auth.uid() = callee_id);

grant select, insert, update on public.call_logs to authenticated;

-- ---------------------------------------------------------------------------------------------------------
-- 2. call_mutes: "Mute voice calls" in a chat's menu. One row = this member does not take calls from that member.
-- ---------------------------------------------------------------------------------------------------------
create table if not exists public.call_mutes (
  user_id    uuid not null references auth.users(id) on delete cascade,
  peer_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, peer_id),
  constraint call_mutes_distinct_members check (user_id <> peer_id)
);

alter table public.call_mutes enable row level security;

drop policy if exists call_mutes_own on public.call_mutes;
create policy call_mutes_own on public.call_mutes
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, delete on public.call_mutes to authenticated;

-- ---------------------------------------------------------------------------------------------------------
-- 3. Realtime authorization for call signalling (private Broadcast channels).
--
--   call:<idA>:<idB>   the pair's signalling channel (ids sorted): offer, answer, ICE, accept, decline,
--                      network-quality, hangup. Only the two members can join or send.
--   callbox:<id>       a member's inbox for incoming-call rings. Any signed-in member may ring it (the
--                      receiving app re-checks eligibility on the server before it shows anything); only the
--                      owner can listen.
--
-- Without these policies a private channel refuses to join, and the app simply hides the call button.
-- ---------------------------------------------------------------------------------------------------------
drop policy if exists voice_signaling_receive on realtime.messages;
create policy voice_signaling_receive on realtime.messages
  for select to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and (
      (realtime.topic() like 'call:%'
        and auth.uid()::text = any (string_to_array(substr(realtime.topic(), 6), ':')))
      or realtime.topic() = 'callbox:' || auth.uid()::text
    )
  );

drop policy if exists voice_signaling_send on realtime.messages;
create policy voice_signaling_send on realtime.messages
  for insert to authenticated
  with check (
    realtime.messages.extension = 'broadcast'
    and (
      (realtime.topic() like 'call:%'
        and auth.uid()::text = any (string_to_array(substr(realtime.topic(), 6), ':')))
      or realtime.topic() like 'callbox:%'
    )
  );

notify pgrst, 'reload schema';


-- ===== 20261127_stepup_liveness =====
-- Step-up identity confirmation ("Turn left / right / up / down" video-selfie check).
--
-- It is not tied to voice calls. It runs when a member swaps their primary photo, when unusual activity
-- flags the account (burst messaging or sparking, repeated reports, a login from a new country), and
-- before a member released from a safety hold can message again.
--
-- Nothing here stores camera video. The check analyses the camera on the device; the server only keeps
-- an audit row per challenge (who, why, which poses were asked, pass or fail).
--
-- Run once in the Supabase SQL Editor. Safe to re-run.

-- ---------------------------------------------------------------------------------------------------------
-- 1. profiles: the restriction flag
-- ---------------------------------------------------------------------------------------------------------
alter table public.profiles add column if not exists reverification_required boolean not null default false;
alter table public.profiles add column if not exists reverification_reason text;
-- Country of the member's last session (edge geolocation), to spot a login from somewhere new.
alter table public.profiles add column if not exists last_login_country text;

-- Members must never be able to lift the restriction themselves: only the server (service role), staff
-- in the SQL editor, or SECURITY DEFINER code can change these columns.
create or replace function public.guard_profile_reverification()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null or coalesce(auth.role(), '') = 'service_role' then
    return NEW;
  end if;
  if TG_OP = 'UPDATE' then
    NEW.reverification_required := OLD.reverification_required;
    NEW.reverification_reason := OLD.reverification_reason;
    NEW.last_login_country := OLD.last_login_country;
  else
    NEW.reverification_required := false;
    NEW.reverification_reason := null;
    NEW.last_login_country := null;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_guard_profile_reverification on public.profiles;
create trigger trg_guard_profile_reverification
  before insert or update on public.profiles
  for each row execute function public.guard_profile_reverification();

-- Staff approving the manual-review fallback in /admin/verifications (status becomes 'verified') also
-- lifts the restriction.
create or replace function public.clear_reverification_on_approval()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if NEW.reverification_required
     and NEW.verification_status = 'verified'
     and OLD.verification_status is distinct from 'verified' then
    NEW.reverification_required := false;
    NEW.reverification_reason := null;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_clear_reverification_on_approval on public.profiles;
create trigger trg_clear_reverification_on_approval
  before update on public.profiles
  for each row execute function public.clear_reverification_on_approval();

-- ---------------------------------------------------------------------------------------------------------
-- 2. liveness_challenges: audit trail, one row per challenge issued
-- ---------------------------------------------------------------------------------------------------------
create table if not exists public.liveness_challenges (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  trigger_reason        text not null check (trigger_reason in
                          ('photo_swap', 'velocity', 'reports', 'new_country', 'quarantine_recovery', 'manual')),
  poses_requested       text[] not null,
  -- Single-use: the signed token carries this nonce and the row can be completed once.
  nonce                 text not null unique,
  passed                boolean,
  outcome               text check (outcome in ('passed', 'failed', 'manual_review')),
  face_match_confidence integer,
  -- photo_swap: hash of the exact photo that was matched, so only that file can be committed as primary.
  photo_sha256          text,
  consumed_at           timestamptz,
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);

create index if not exists idx_liveness_challenges_user on public.liveness_challenges (user_id, created_at desc);

alter table public.liveness_challenges enable row level security;

-- Members can read their own history. Writes happen only through the server (service role bypasses RLS).
drop policy if exists liveness_challenges_select_own on public.liveness_challenges;
create policy liveness_challenges_select_own on public.liveness_challenges
  for select to authenticated
  using (auth.uid() = user_id);

grant select on public.liveness_challenges to authenticated;

-- ---------------------------------------------------------------------------------------------------------
-- 3. Safety hold released -> the member confirms their identity before messaging again
-- ---------------------------------------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.account_freezes') is not null then
    create or replace function public.require_reverification_after_hold()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $fn$
    begin
      if OLD.cleared_at is null and NEW.cleared_at is not null then
        update public.profiles
           set reverification_required = true,
               reverification_reason = 'quarantine_recovery'
         where id = NEW.user_id;
      end if;
      return NEW;
    end;
    $fn$;

    drop trigger if exists trg_require_reverification_after_hold on public.account_freezes;
    create trigger trg_require_reverification_after_hold
      after update of cleared_at on public.account_freezes
      for each row execute function public.require_reverification_after_hold();
  end if;
end $$;

notify pgrst, 'reload schema';
