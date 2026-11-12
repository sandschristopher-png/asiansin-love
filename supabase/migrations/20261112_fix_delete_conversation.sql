-- =====================================================================
-- 20261112_fix_delete_conversation.sql        (meetin.asia)
--
-- Fixes "Could not delete the conversation" on /messages.
--
-- Cause: the old delete wrote hidden_before into public.conversation_states, a table from
-- 20261115_conversation_states.sql that was never created in this database (PostgREST answers
-- PGRST205), so every delete failed. Writing to public.messages directly cannot work either: members
-- may only update rows they RECEIVED (read receipts), and the guard trigger pins the other columns.
--
-- Design: per-member hide on the message rows themselves, written only through a SECURITY DEFINER
-- RPC. Nothing is erased, so reports and moderation evidence stay intact.
--   messages.deleted_by   uuids of the members who removed their copy of the row.
--   SELECT policy         a member never sees a row whose deleted_by contains their own id.
--   delete_conversation   appends the caller to deleted_by for every message between the two members.
--   guard trigger         members cannot edit deleted_by directly (no hiding messages from the other
--                         member, no un-deleting); only the RPC and the service role can.
-- A newer message is a new row with deleted_by = '{}', so the thread comes back starting after the
-- delete without resurrecting the old messages. The other member keeps their whole thread.
--
-- Not changed: public.sparks. Deleting a conversation does not undo a Spark or a match; the member
-- can still open the profile and write again, and the thread then starts empty.
-- Known limit: the other member's client can read the deleted_by array of rows they share with you,
-- so a hand-written query could tell that you removed your copy. It never exposes message content.
-- Safe to re-run.
-- =====================================================================

begin;

-- 1. Column ------------------------------------------------------------
alter table public.messages
  add column if not exists deleted_by uuid[] not null default '{}'::uuid[];

-- 2. SELECT policy: hide the member's own deleted rows -------------------
alter table public.messages enable row level security;

drop policy if exists "Participants can view deliverable messages" on public.messages;
create policy "Participants can view deliverable messages"
  on public.messages for select to authenticated
  using (
    not (auth.uid() = any (deleted_by))
    and (
      auth.uid() = sender_id
      or (auth.uid() = receiver_id and coalesce(is_quarantined, false) = false)
    )
  );

-- 3. Guard: deleted_by is writable only by the RPC below and the service role ----------------------
-- Inside the SECURITY DEFINER RPC current_user is the function owner; a direct PostgREST update runs
-- as authenticated/anon, whose attempt to change deleted_by is silently reverted.
create or replace function public.guard_message_deleted_by()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    NEW.deleted_by := OLD.deleted_by;
  end if;
  return NEW;
end;
$$;

revoke all on function public.guard_message_deleted_by() from public, anon, authenticated;

drop trigger if exists trg_guard_message_deleted_by on public.messages;
create trigger trg_guard_message_deleted_by
  before update on public.messages
  for each row execute function public.guard_message_deleted_by();

-- 4. RPC ------------------------------------------------------------------------
create or replace function public.delete_conversation(p_other_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if p_other_user_id is null or p_other_user_id = v_uid then
    raise exception 'Invalid conversation' using errcode = '22023';
  end if;

  update public.messages
     set deleted_by = array_append(deleted_by, v_uid)
   where ((sender_id = v_uid and receiver_id = p_other_user_id)
       or (sender_id = p_other_user_id and receiver_id = v_uid))
     and not (v_uid = any (deleted_by));

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.delete_conversation(uuid) from public, anon;
grant execute on function public.delete_conversation(uuid) to authenticated;

commit;

-- ---------------------------------------------------------------------
-- Checks worth running afterwards (read-only)
-- ---------------------------------------------------------------------
--   select column_name, data_type, column_default from information_schema.columns
--    where table_schema = 'public' and table_name = 'messages' and column_name = 'deleted_by';
--
--   select p.oid::regprocedure, has_function_privilege('anon', p.oid, 'execute') as anon_can_run,
--          has_function_privilege('authenticated', p.oid, 'execute') as member_can_run
--     from pg_proc p where p.proname = 'delete_conversation';
--
--   select policyname, cmd, qual from pg_policies
--    where schemaname = 'public' and tablename = 'messages';
--
-- Undo (only if needed; deleted conversations reappear):
--   drop trigger if exists trg_guard_message_deleted_by on public.messages;
--   drop function if exists public.delete_conversation(uuid);
--   alter table public.messages drop column if exists deleted_by;
--   -- then re-run section 5 of 20261102_security_hardening.sql to restore the original policy.
