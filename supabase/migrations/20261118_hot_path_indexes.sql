-- Hot-path indexes for queries that run on nearly every signed-in page view.
-- Safe to re-run (IF NOT EXISTS). CONCURRENTLY avoids locking writes; run each statement on its
-- own (not inside a transaction) in the Supabase SQL editor.

-- Unread message badge (components/RealtimeNotifier.tsx: receiver_id = me AND is_read = false)
-- and mark-as-read (app/messages/page.tsx, app/chat/[id]/page.tsx: + sender_id). Partial index:
-- only unread rows, so it stays tiny however large messages grows.
create index concurrently if not exists idx_messages_receiver_unread
  on public.messages (receiver_id, sender_id)
  where is_read = false;

-- Notifications list (app/api/notifications/route.ts: user_id = me ORDER BY created_at DESC).
create index concurrently if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

-- Unread notifications badge (components/Navbar.tsx) and mark-all-read (same API route).
create index concurrently if not exists idx_notifications_user_unread
  on public.notifications (user_id)
  where is_read = false;
