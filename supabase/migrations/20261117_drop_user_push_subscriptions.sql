-- =====================================================================
-- 20261117_drop_user_push_subscriptions.sql        (asiansin.love)
--
-- Removes the legacy public.user_push_subscriptions table. Web push uses public.push_subscriptions
-- (lib/pushSender.ts, /api/push/subscribe); nothing in app/, components/, lib/, scripts/ or
-- supabase/ references user_push_subscriptions, and it held 0 rows when this was written.
-- Safe to re-run.
-- =====================================================================

drop table if exists public.user_push_subscriptions cascade;