-- 20261121_admin_notifications.sql
-- Run by hand in the Supabase SQL editor. Safe to re-run.
--
-- Staff alerts (lib/adminNotify.ts) are stored as ordinary rows in public.notifications with a
-- type starting 'admin_' (admin_verification, admin_photo, admin_report, admin_moderation,
-- admin_appeal, admin_review), one row per admin, payload = { kind, ref }. No new table: the
-- type CHECK constraint was dropped in 20261020_drop_notif_type_check.sql, and RLS already lets
-- each admin read and update only their own rows. Member-facing lists exclude admin_ types.
--
-- Per-type push opt-outs live in the existing profiles.notification_prefs JSON map
-- (push_messages, push_sparks, push_matches, push_visits, push_announcements, push_admin);
-- no column changes.

-- Cheap unread reads for the Admin Notifications view and the "one open alert per item" check.
create index if not exists idx_notifications_admin_unread
  on public.notifications (user_id, created_at desc)
  where is_read = false and type like 'admin\_%';

create index if not exists idx_notifications_admin_ref
  on public.notifications (type, ((payload->>'ref')))
  where is_read = false and type like 'admin\_%';

-- Admin Console count chip: pending verifications + pending photo approvals + open reports.
create index if not exists idx_profiles_verification_pending
  on public.profiles (id) where verification_status = 'pending';

create index if not exists idx_profiles_avatar_pending
  on public.profiles (id) where avatar_status = 'pending_review' or photo_review_status = 'pending';

create index if not exists idx_user_reports_pending
  on public.user_reports (created_at desc) where status = 'pending';

-- Staff lookup for the fan-out (profiles with a staff role).
create index if not exists idx_profiles_staff
  on public.profiles (id) where admin_role in ('moderator', 'super_admin') or role = 'admin' or is_admin = true;

-- Realtime: the account dropdown refreshes its unread chip on new notifications rows.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
