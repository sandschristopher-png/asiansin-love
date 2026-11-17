-- The identity check (turn left / right / up / down) now also runs the main "get verified" flow at /verify,
-- replacing the hand-gesture selfie. It is recorded in liveness_challenges like every other check, so the
-- trigger_reason list gains 'verification'. A good result never grants the badge by itself: it goes to the
-- staff queue (/admin/verifications) as before.
--
-- Run once in the Supabase SQL Editor (after 20261127_stepup_liveness.sql). Safe to re-run.

alter table public.liveness_challenges drop constraint if exists liveness_challenges_trigger_reason_check;

alter table public.liveness_challenges
  add constraint liveness_challenges_trigger_reason_check
  check (trigger_reason in ('photo_swap', 'velocity', 'reports', 'new_country', 'quarantine_recovery', 'manual', 'verification'));

notify pgrst, 'reload schema';
