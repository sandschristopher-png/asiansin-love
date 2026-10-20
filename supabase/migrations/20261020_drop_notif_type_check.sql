-- Drop notifications type check constraint
-- The app notification vocabulary evolved beyond the original whitelist
-- (spark_received, system, etc.), causing silent insert failures (23514).
-- Known types in the live table: message, favorite, match.
-- Unknown types are handled gracefully by TYPE_META in NotificationsSection.tsx.
-- Consider re-adding a widened constraint post-launch once vocabulary stabilizes.
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;