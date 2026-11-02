-- =====================================================================
-- 20261105_voice_features.sql        (asiansin.love)
--
-- 1. voice-intros bucket   : public 5-10s profile greetings
--                            (/api/profile/voice-intro writes with the service role)
-- 2. voice-notes bucket    : PRIVATE in-chat voice notes, served only through
--                            short-lived signed URLs to the two participants
-- 3. messages.audio_path / audio_duration_ms for voice notes
-- 4. Members still cannot edit message content, now including the audio fields
-- 5. verifications bucket also accepts the review metadata JSON
--    (<stamp>_meta.json written by /api/verify/submit)
--
-- The app works before this runs: voice features report "not available yet".
-- Safe to re-run.
-- =====================================================================

begin;

-- 1 + 2. Buckets ------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('voice-intros', 'voice-intros', true, 1048576,
   array['audio/webm', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/mpeg', 'audio/ogg']),
  ('voice-notes', 'voice-notes', false, 2097152,
   array['audio/webm', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/mpeg', 'audio/ogg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 5. Review metadata next to verification photos
update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/json']
 where id = 'verifications';

-- 3. Voice-note columns ---------------------------------------------------
alter table public.messages add column if not exists audio_path text;
alter table public.messages add column if not exists audio_duration_ms integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'messages_audio_duration_range'
  ) then
    alter table public.messages
      add constraint messages_audio_duration_range
      check (audio_duration_ms is null or (audio_duration_ms > 0 and audio_duration_ms <= 31000));
  end if;
end;
$$;

-- 4. Same guard as 20261102_security_hardening.sql, plus the audio columns:
--    a recipient may only flip is_read.
create or replace function public.guard_message_user_update()
returns trigger
language plpgsql
set search_path = public
as $g$
begin
  if auth.uid() is not null and coalesce(auth.role(), '') <> 'service_role' then
    NEW.sender_id         := OLD.sender_id;
    NEW.receiver_id       := OLD.receiver_id;
    NEW.content           := OLD.content;
    NEW.is_quarantined    := OLD.is_quarantined;
    NEW.created_at        := OLD.created_at;
    NEW.audio_path        := OLD.audio_path;
    NEW.audio_duration_ms := OLD.audio_duration_ms;
  end if;
  return NEW;
end;
$g$;

revoke all on function public.guard_message_user_update() from public, anon, authenticated;
grant execute on function public.guard_message_user_update() to service_role;

commit;
