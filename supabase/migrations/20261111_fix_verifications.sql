-- =====================================================================
-- Two-step selfie verification: audit record per submission (verification_requests).
--
-- How it fits the app (differences from a client-writes design are deliberate):
--   - Members never write to this table, storage or profiles for verification. POST
--     /api/verify/submit (server, service role) applies the one-time pose token, the hourly
--     rate limit, the face gate and the AI pre-screen, stores face.jpg + selfie.jpg in the private
--     `verifications` bucket under <user id>/, inserts the row here and sets
--     profiles.verification_status = 'pending'. A browser that could insert here directly would
--     skip every one of those checks, so there is no member INSERT policy.
--   - The review queue (/admin/verifications) is still driven by profiles.verification_status
--     ('pending' | 'verified' | 'rejected', the values the whole app uses) and reads the photos
--     through signed URLs. This table is the history: who submitted what, who decided, and why.
--   - Status values in THIS table are pending / approved / rejected.
--
-- Safe to re-run.
-- =====================================================================

begin;

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  face_photo_url text not null,
  pose_photo_url text not null,
  gesture_requested text not null default 'three_fingers',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Older databases may already have a table of this name with fewer columns.
alter table public.verification_requests
  add column if not exists face_photo_url text,
  add column if not exists pose_photo_url text,
  add column if not exists gesture_requested text default 'three_fingers',
  add column if not exists rejection_reason text,
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists reviewed_at timestamptz;

-- The live database already has a verification_requests table with an older column layout (the
-- anon-key probe in the security audit found it, without face_photo_url). Make it compatible with
-- the server's insert: columns the server never fills must not be NOT NULL, and an old status
-- check must not reject 'pending' / 'approved' / 'rejected'.
alter table public.verification_requests add column if not exists status text not null default 'pending';
alter table public.verification_requests add column if not exists created_at timestamptz not null default now();
do $$
declare
  col record;
  con record;
begin
  for col in
    select column_name
      from information_schema.columns
     where table_schema = 'public' and table_name = 'verification_requests'
       and is_nullable = 'NO' and column_default is null
       and column_name not in ('id', 'user_id', 'face_photo_url', 'pose_photo_url')
  loop
    execute format('alter table public.verification_requests alter column %I drop not null', col.column_name);
  end loop;

  for con in
    select conname from pg_constraint
     where conrelid = 'public.verification_requests'::regclass and contype = 'c'
  loop
    execute format('alter table public.verification_requests drop constraint %I', con.conname);
  end loop;
end;
$$;
-- NOT VALID: rows written under the old layout are not re-checked, new rows are.
alter table public.verification_requests
  add constraint verification_requests_status_check
  check (status in ('pending', 'approved', 'rejected')) not valid;

-- Both flags already exist (protected columns: members cannot write them). 'verification_status'
-- keeps the app's own values, so no check constraint is added here.
alter table public.profiles add column if not exists is_verified boolean default false;
alter table public.profiles add column if not exists verification_status text default 'unverified';

create index if not exists idx_verification_requests_status_created
  on public.verification_requests (status, created_at desc);
create index if not exists idx_verification_requests_user
  on public.verification_requests (user_id, created_at desc);

-- Keeps profiles.verification_status in step when a row is inserted by the server (or by hand):
-- 'pending', unless the member is already verified.
create or replace function public.sync_profile_verification_pending()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status = 'pending' then
    update public.profiles
       set verification_status = 'pending'
     where id = NEW.user_id
       and coalesce(is_verified, false) = false;
  end if;
  return NEW;
end;
$$;

revoke all on function public.sync_profile_verification_pending() from public, anon, authenticated;

drop trigger if exists trg_sync_profile_verification_pending on public.verification_requests;
create trigger trg_sync_profile_verification_pending
  after insert on public.verification_requests
  for each row execute function public.sync_profile_verification_pending();

alter table public.verification_requests enable row level security;

revoke all on table public.verification_requests from anon, authenticated;
grant select on table public.verification_requests to authenticated;

-- Start from a clean slate: any policy left from the older layout (for example a member INSERT or
-- UPDATE policy) would let a browser write here without the server's checks.
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'verification_requests' loop
    execute format('drop policy %I on public.verification_requests', pol.policyname);
  end loop;
end;
$$;

-- Members can see their own submissions and decisions (read only).
drop policy if exists "Users can view own verification status" on public.verification_requests;
create policy "Users can view own verification status"
  on public.verification_requests for select
  to authenticated
  using (auth.uid() = user_id);

-- Admins can read the history. Decisions are written by /api/admin/verifications (service role).
drop policy if exists "Admins can view all verifications" on public.verification_requests;
create policy "Admins can view all verifications"
  on public.verification_requests for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and coalesce(p.is_admin, false) = true
    )
  );

-- The photos are sensitive: the bucket stays private, with no storage policy for members. The
-- server writes with the service role and admins read through signed URLs.
insert into storage.buckets (id, name, public)
values ('verifications', 'verifications', false)
on conflict (id) do update set public = false;

commit;

-- Rollback (manual):
--   drop trigger if exists trg_sync_profile_verification_pending on public.verification_requests;
--   drop function if exists public.sync_profile_verification_pending();
--   drop table if exists public.verification_requests;
