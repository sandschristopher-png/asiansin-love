-- =====================================================================
-- Signed-out visitors must not read member data.
--
-- Found by probing the live API with the public anon key (the same key every visitor's browser
-- receives): `GET /rest/v1/profiles` returned all member rows with every column, including
-- birthdate, latitude / longitude, full_name and Stripe customer / subscription ids.
-- 20261102_security_hardening.sql section 6 intends profiles to be members-only, but the live
-- database does not match it (an anon-readable policy or grant is still in place).
--
-- Nothing in the app reads a table while signed out: pages and API routes use the member's
-- session, middleware and server routes use the service role, and the landing, login, signup and
-- city pages query no tables. So the anon role needs no table access at all.
--
--   - REVOKE removes the privilege itself, so it holds whatever RLS policies exist.
--   - Signed-in members (role "authenticated") and the service role are untouched.
--   - Default privileges are tightened too, so tables created later start closed to anon.
--
-- Safe to re-run. Check afterwards with supabase/audits/rls_audit.sql.
-- =====================================================================

begin;

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;

commit;

-- Rollback (only if a signed-out feature that needs table access is added on purpose):
--   grant select on public.<table> to anon;   -- plus a matching RLS policy, one table at a time
