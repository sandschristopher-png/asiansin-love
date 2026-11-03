-- =====================================================================
-- 20261112_admin_console.sql        (asiansin.love)
--
-- Admin Console (/admin): role hierarchy, bans, photo review, report resolutions.
--   1. profiles.admin_role  member | moderator | super_admin   (+ is_banned, banned_at)
--   2. COS (username 'COS', id 2608a783-...) is the master super_admin. Matched by id, never by
--      display name (anyone can set a display name).
--   3. profiles.photo_review_status  pending | approved | rejected  (set to pending on upload)
--   4. user_reports resolution columns (the live reports table is user_reports)
--   5. Members can NEVER write admin_role / role / is_banned / banned_at / photo_review_status
--      from the browser - on INSERT (signup) or UPDATE. Only the service role (API) can.
-- Code works before this runs: role delegation, bans and photo status wait for these columns.
-- Safe to re-run.
-- =====================================================================

begin;

-- 1. Roles + bans ------------------------------------------------------------------------
alter table public.profiles add column if not exists admin_role text not null default 'member';
alter table public.profiles drop constraint if exists profiles_admin_role_check;
alter table public.profiles add constraint profiles_admin_role_check
  check (admin_role in ('member', 'moderator', 'super_admin'));

alter table public.profiles add column if not exists is_banned boolean not null default false;
alter table public.profiles add column if not exists banned_at timestamptz;
alter table public.profiles add column if not exists is_verified boolean default false;

-- Existing admins (role = 'admin' / is_admin) become moderators...
update public.profiles
   set admin_role = 'moderator'
 where admin_role = 'member'
   and (role = 'admin' or coalesce(is_admin, false));

-- 2. ...and COS is the sole master super_admin.
update public.profiles
   set admin_role = 'super_admin', role = 'admin', is_admin = true
 where id = '2608a783-4745-4087-a1bc-c9387c3c0ccd';

-- 3. Photo review --------------------------------------------------------------------------
alter table public.profiles add column if not exists photo_review_status text not null default 'approved';
alter table public.profiles drop constraint if exists profiles_photo_review_status_check;
alter table public.profiles add constraint profiles_photo_review_status_check
  check (photo_review_status in ('pending', 'approved', 'rejected'));

-- Main photos already waiting for review show up in the new queue too.
update public.profiles
   set photo_review_status = 'pending'
 where avatar_status = 'pending_review' and photo_review_status = 'approved';

-- 4. Report resolutions ---------------------------------------------------------------------
alter table public.user_reports add column if not exists resolution text not null default 'pending';
alter table public.user_reports drop constraint if exists user_reports_resolution_check;
alter table public.user_reports add constraint user_reports_resolution_check
  check (resolution in ('pending', 'dismissed', 'penalized', 'banned'));
alter table public.user_reports add column if not exists resolved_by uuid references public.profiles(id) on delete set null;
alter table public.user_reports add column if not exists resolved_at timestamptz;
alter table public.user_reports add column if not exists resolution_note text;

create index if not exists idx_user_reports_resolution on public.user_reports (resolution, created_at desc);

-- 5. Server-owned admin columns (INSERT and UPDATE) -----------------------------------------
create or replace function public.guard_profile_admin_columns()
returns trigger
language plpgsql
set search_path = public
as $g$
begin
  if auth.uid() is null or coalesce(auth.role(), '') = 'service_role' then
    return NEW;
  end if;

  if TG_OP = 'INSERT' then
    -- A member creating their own profile always starts as an ordinary, unbanned member.
    NEW.admin_role          := 'member';
    NEW.role                := 'member';
    NEW.is_admin            := false;
    NEW.is_banned           := false;
    NEW.banned_at           := null;
    NEW.photo_review_status := 'approved';
  else
    NEW.admin_role          := OLD.admin_role;
    NEW.role                := OLD.role;
    NEW.is_admin            := OLD.is_admin;
    NEW.is_banned           := OLD.is_banned;
    NEW.banned_at           := OLD.banned_at;
    NEW.photo_review_status := OLD.photo_review_status;
  end if;
  return NEW;
end;
$g$;

revoke all on function public.guard_profile_admin_columns() from public, anon, authenticated;
grant execute on function public.guard_profile_admin_columns() to service_role;

drop trigger if exists guard_profile_admin_columns on public.profiles;
create trigger guard_profile_admin_columns
  before insert or update on public.profiles
  for each row execute function public.guard_profile_admin_columns();

commit;
