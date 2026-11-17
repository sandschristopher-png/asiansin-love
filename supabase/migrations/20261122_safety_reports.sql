-- =====================================================================
-- 20261122_safety_reports.sql        (meetin.asia)
--
-- Chat safety: warning banners for the recipient, one-tap message reports, and the account
-- freeze used by the zero-tolerance filter. Reputation changes themselves keep going through the
-- existing SECURITY DEFINER RPC public.apply_moderation_penalty (service role only), so a member's
-- RLS can never block a score from dropping.
--
--   message_safety_flags   which warning banner a delivered message gets, written by the server when
--                          the master dictionary matched. Only the RECIPIENT can read a row, so the
--                          sender never learns the filter reacted (no probing for which words work).
--   message_reports        one row per (reporter, message): the exact message id, a 300-character
--                          excerpt and the reason. The unique key is what stops repeat reports.
--   account_freezes        accounts held for review after a zero-tolerance hit (underage or
--                          extortion wording, or an underage report). Server-only: no policy is
--                          created, so no member can read it or clear their own freeze, and nothing
--                          about a freeze appears on profiles. Clear one with:
--                            update public.account_freezes set cleared_at = now() where user_id = '<id>';
-- Safe to re-run.
-- =====================================================================

begin;

-- 1. Recipient-only warning banners -----------------------------------------------------------
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

-- 2. One report per reporter and message -------------------------------------------------------
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

-- 3. Freeze for review ------------------------------------------------------------------------
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

-- Checks worth running afterwards (read-only)
--   select tablename, policyname, cmd from pg_policies
--    where schemaname = 'public' and tablename in ('message_safety_flags', 'message_reports', 'account_freezes');
--   -- account_freezes must show no policy rows at all.
