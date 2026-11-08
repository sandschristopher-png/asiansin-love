-- AI photo safeguard (20261108): per-photo origin classification keyed by public URL.
-- Populated ONLY at upload time going forward; existing photos default to '{}' (no badge).
alter table public.profiles
  add column if not exists photo_ai_status jsonb default '{}'::jsonb;

comment on column public.profiles.photo_ai_status is
  'Map of photo public URL -> camera | suspect | ai (20261108 AI safeguards)';