-- =====================================================================
-- 20261114_privacy_features.sql        (asiansin.love)
--
-- Ghost Mode, Discover lifestyle filters and private member notes.
--   1. profiles.ghost_mode: Plus members browse without leaving a footprint. POST
--      /api/profile/view skips the profile_views insert while the viewer is Plus and ghost_mode
--      is on (the flag alone does nothing for a free member).
--   2. profiles.english_level ('fluent' | 'conversational' | 'basic'): Discover
--      "English Proficiency" filter, set in Edit Profile.
--   3. public.user_notes: one private note per (member, profile). RLS: owner only, for
--      select / insert / update / delete.
--   4. profile_views lookup index for the Visitors tab (newest visits to a member).
-- Safe to re-run.
-- =====================================================================

begin;

-- 1. Ghost Mode ---------------------------------------------------------------------------
alter table public.profiles add column if not exists ghost_mode boolean not null default false;

-- 2. English proficiency ------------------------------------------------------------------
alter table public.profiles add column if not exists english_level text;
alter table public.profiles drop constraint if exists profiles_english_level_check;
alter table public.profiles add constraint profiles_english_level_check
  check (english_level is null or english_level in ('fluent', 'conversational', 'basic'));

-- 3. Private member notes -----------------------------------------------------------------
create table if not exists public.user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  note text not null,
  updated_at timestamp with time zone default now(),
  unique (user_id, target_id)
);

alter table public.user_notes drop constraint if exists user_notes_note_length;
alter table public.user_notes add constraint user_notes_note_length check (char_length(note) <= 2000);

alter table public.user_notes enable row level security;

drop policy if exists "Members read their own notes" on public.user_notes;
create policy "Members read their own notes" on public.user_notes
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Members add their own notes" on public.user_notes;
create policy "Members add their own notes" on public.user_notes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Members edit their own notes" on public.user_notes;
create policy "Members edit their own notes" on public.user_notes
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Members delete their own notes" on public.user_notes;
create policy "Members delete their own notes" on public.user_notes
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.user_notes to authenticated;

-- 4. Visitors lookup ----------------------------------------------------------------------
do $$
begin
  if to_regclass('public.profile_views') is not null then
    execute 'create index if not exists idx_profile_views_viewed_recent on public.profile_views (viewed_id, created_at desc)';
  end if;
end;
$$;

commit;
