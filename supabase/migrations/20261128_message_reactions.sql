-- Message reactions: one reaction per member per message (heart, thumbs up, laugh, fire).
--
-- Both people in the conversation can read them, a member can only add, change or remove their own, and
-- changes reach the other member live through Supabase Realtime.
--
-- Run once in the Supabase SQL Editor. Safe to re-run.

create table if not exists public.message_reactions (
  message_id uuid not null,
  user_id    uuid not null references auth.users(id) on delete cascade,
  reaction   text not null check (reaction in ('heart', 'thumbs_up', 'laugh', 'fire')),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists idx_message_reactions_message on public.message_reactions (message_id);

-- Deleting a message removes its reactions (only when messages.id is a uuid, as the app assumes).
do $$
begin
  if (select data_type from information_schema.columns
       where table_schema = 'public' and table_name = 'messages' and column_name = 'id') = 'uuid'
     and not exists (select 1 from pg_constraint where conname = 'message_reactions_message_fk') then
    alter table public.message_reactions
      add constraint message_reactions_message_fk foreign key (message_id)
      references public.messages(id) on delete cascade;
  end if;
end $$;

alter table public.message_reactions enable row level security;

-- Read: the two members of the message's conversation.
drop policy if exists message_reactions_select_participants on public.message_reactions;
create policy message_reactions_select_participants on public.message_reactions
  for select to authenticated
  using (
    exists (
      select 1 from public.messages m
       where m.id = message_reactions.message_id
         and auth.uid() in (m.sender_id, m.receiver_id)
    )
  );

-- Write: only your own reaction, and only on a message you are part of. (The app also refuses blocked pairs.)
drop policy if exists message_reactions_insert_own on public.message_reactions;
create policy message_reactions_insert_own on public.message_reactions
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.messages m
       where m.id = message_reactions.message_id
         and auth.uid() in (m.sender_id, m.receiver_id)
    )
  );

drop policy if exists message_reactions_update_own on public.message_reactions;
create policy message_reactions_update_own on public.message_reactions
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists message_reactions_delete_own on public.message_reactions;
create policy message_reactions_delete_own on public.message_reactions
  for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.message_reactions to authenticated;

-- Live updates: reactions appear for the other member without a refresh.
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'supabase_realtime publication not found - live reactions skipped';
  elsif not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'message_reactions'
  ) then
    alter publication supabase_realtime add table public.message_reactions;
  end if;
end $$;

notify pgrst, 'reload schema';
