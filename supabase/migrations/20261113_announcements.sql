-- =====================================================================
-- 20261113_announcements.sql        (asiansin.love)
--
-- Admin broadcast announcements (/admin/announcements -> /announcements for every member).
--   1. public.announcements (title, body, tag, is_pinned, author_id, published_at)
--   2. profiles.last_read_announcements_at: the side menu shows a pink dot while the newest
--      announcement is newer than this. Existing members start "read" (now()).
--   3. RLS: signed-in members read; staff (admin_role moderator / super_admin, or the legacy
--      role = 'admin' / is_admin flags) manage. The API routes write with the service role.
-- Safe to re-run.
-- =====================================================================

begin;

-- 1. Announcements ------------------------------------------------------------------------
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  tag text not null default 'Update',
  is_pinned boolean not null default false,
  author_id uuid references auth.users(id) on delete set null,
  published_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

alter table public.announcements drop constraint if exists announcements_tag_check;
alter table public.announcements add constraint announcements_tag_check
  check (tag in ('Update', 'Feature', 'Safety', 'Notice'));

create index if not exists idx_announcements_feed on public.announcements (is_pinned desc, published_at desc);

-- 2. Read marker --------------------------------------------------------------------------
alter table public.profiles
  add column if not exists last_read_announcements_at timestamp with time zone default now();

-- 3. RLS ----------------------------------------------------------------------------------
alter table public.announcements enable row level security;

drop policy if exists "Anyone authenticated can view published announcements" on public.announcements;
create policy "Anyone authenticated can view published announcements"
  on public.announcements for select
  to authenticated
  using (true);

drop policy if exists "Admins can manage announcements" on public.announcements;
create policy "Admins can manage announcements"
  on public.announcements for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
       where profiles.id = auth.uid()
         and (profiles.admin_role in ('moderator', 'super_admin')
              or profiles.role = 'admin'
              or coalesce(profiles.is_admin, false))
    )
  )
  with check (
    exists (
      select 1 from public.profiles
       where profiles.id = auth.uid()
         and (profiles.admin_role in ('moderator', 'super_admin')
              or profiles.role = 'admin'
              or coalesce(profiles.is_admin, false))
    )
  );

commit;
