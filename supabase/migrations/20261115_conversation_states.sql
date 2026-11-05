-- =====================================================================
-- 20261115_conversation_states.sql        (asiansin.love)
--
-- Per-member conversation state for the Messages list swipe actions. Nothing here touches the
-- shared public.messages rows, so the other member's thread and read receipts never change.
--   marked_unread   swipe right "Mark unread": the row shows as unread for this member until
--                   they open the chat (or swipe "Mark read").
--   hidden_before   swipe left "Delete": the conversation and every message up to this time are
--                   hidden for this member only. A newer message brings the conversation back,
--                   starting after this point.
-- RLS: a member can only read and write their own rows.
-- Safe to re-run.
-- =====================================================================

begin;

create table if not exists public.conversation_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid not null references public.profiles(id) on delete cascade,
  marked_unread boolean not null default false,
  hidden_before timestamp with time zone,
  updated_at timestamp with time zone not null default now(),
  primary key (user_id, partner_id)
);

alter table public.conversation_states enable row level security;

drop policy if exists "Members read their own conversation state" on public.conversation_states;
create policy "Members read their own conversation state" on public.conversation_states
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Members add their own conversation state" on public.conversation_states;
create policy "Members add their own conversation state" on public.conversation_states
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Members edit their own conversation state" on public.conversation_states;
create policy "Members edit their own conversation state" on public.conversation_states
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Members delete their own conversation state" on public.conversation_states;
create policy "Members delete their own conversation state" on public.conversation_states
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.conversation_states to authenticated;

commit;
