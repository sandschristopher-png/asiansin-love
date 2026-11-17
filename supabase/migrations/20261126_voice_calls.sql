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
