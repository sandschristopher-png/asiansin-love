-- Concurrency indexes for the hottest paths. NOT YET RUN. Safe to re-run (IF NOT EXISTS).
-- CONCURRENTLY avoids locking writes: run each statement on its own (not inside a transaction)
-- in the Supabase SQL editor.

-- 0. Check first: duplicate Spark pairs would make step 1 fail. This should return no rows.
--    select sender_id, receiver_id, count(*) from public.sparks group by 1, 2 having count(*) > 1;

-- 1. One Spark per pair. Also turns a double-tap race into a clean 23505, which /api/spark now
--    treats as "already sparked". Serves the existence check and the mutual check by itself.
create unique index concurrently if not exists sparks_sender_receiver_key
  on public.sparks (sender_id, receiver_id);

-- 2. Blocks: /api/discover reads blocker_id = me OR blocked_id = me on every feed load.
create index concurrently if not exists idx_user_blocks_blocker on public.user_blocks (blocker_id);
create index concurrently if not exists idx_user_blocks_blocked on public.user_blocks (blocked_id);

-- 3. Rolling-window Spark counts and "Sparked you" already use idx_sparks_sender /
--    idx_sparks_receiver (sender_id or receiver_id, created_at desc). Nothing to add.

-- 4. Still pending from 20261118_hot_path_indexes.sql if it has not been run: unread message
--    badge, notifications list and unread notifications badge.
