-- =====================================================================
-- App language that follows a signed-in member to any device.
--
--   profiles.preferred_language   one of the 11 supported locales; 'en' by default.
--
-- Supported: en, fil, vi, th, id, ms, km, es, ja, ko, zh (lib/i18n/config.ts LOCALES). Adding a
-- language later means widening the check below together with that list.
--
-- Can members write it? Yes, and nothing here is needed to allow it. The guard triggers in this
-- repo only reset their own listed columns, and preferred_language is on none of those lists:
--   trg_guard_profile_protected   is_admin, is_plus, is_verified, verification_status, ...
--   guard_profile_admin_columns   admin_role, role, is_admin, is_banned, banned_at, photo_review_status
--   guard_profile_release_columns day_one_number, is_day_one, plus_expires_at, role
--   trg_guard_profile_plus_status subscription_status, current_period_end, plus_expires_at, is_premium
-- The app saves it from POST /api/profile/language with the service role anyway (after checking
-- the session), so it does not depend on the profile update policy either. Three triggers that
-- exist only in the live database (tr_protect_profile_privileged_columns,
-- trg_prevent_plus_tampering, trg_protect_username) are not in the repo; the route above bypasses
-- member-level checks the same way the other server routes do.
--
-- Safe to re-run.
-- =====================================================================

begin;

alter table public.profiles add column if not exists preferred_language text not null default 'en';

alter table public.profiles drop constraint if exists profiles_preferred_language_check;
alter table public.profiles
  add constraint profiles_preferred_language_check
  check (preferred_language in ('en', 'fil', 'vi', 'th', 'id', 'ms', 'km', 'es', 'ja', 'ko', 'zh'));

commit;

-- Rollback (manual):
--   alter table public.profiles drop constraint if exists profiles_preferred_language_check;
--   alter table public.profiles drop column if exists preferred_language;
