-- Read-only security audit. Paste into the Supabase SQL editor; it changes nothing.
-- Expected result for a healthy database: queries 1, 2 and 3 return no rows.

-- 1. Tables in public with Row Level Security OFF (anyone with a grant can read and write them).
select c.relname as table_without_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
order by 1;

-- 2. Tables where the anon role (the public key every visitor has) holds any privilege.
select table_name, string_agg(privilege_type, ', ' order by privilege_type) as anon_privileges
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'anon'
group by table_name
order by 1;

-- 3. Policies that apply to anon or to everyone (role "public").
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public' and (roles::text[] && array['anon', 'public'])
order by 1, 2;

-- 4. RLS on, but no policy at all: the table is locked (fine for server-only tables, a bug otherwise).
select c.relname as table_with_rls_but_no_policy
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)
order by 1;

-- 5. Storage buckets that are public (the verifications bucket must NOT be listed).
select id, public from storage.buckets where public order by 1;

-- 6. Triggers that stop members editing their own protected columns (all five should exist).
select tgname from pg_trigger
where tgname in (
  'trg_guard_profile_protected',        -- is_admin, is_plus, is_verified, verification_status, ...
  'guard_profile_admin_columns',        -- admin_role, role, is_banned, ...
  'trg_guard_profile_plus_status',      -- subscription_status, plus_expires_at, is_premium, ...
  'trg_guard_profile_external_links',   -- links / handles in bio, username, display_name
  'trg_sync_profile_verification_pending'
)
order by 1;
