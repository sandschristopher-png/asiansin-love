-- =====================================================================
-- 20261124_ip_risk.sql        (meetin.asia)
--
-- VPN / proxy / Tor / datacenter detection (lib/safety/vpnCheck.ts). All three tables are
-- server-only: RLS is on and no policy is created, so members can neither read nor write them and
-- nothing about a member's network appears on profiles.
--
--   ip_reputation_cache   one lookup result per IP, reused for 24 hours so repeated requests do not
--                         burn the lookup provider's quota or add latency. Holds no member data.
--   member_ip_flags       the latest network assessment for a member (tier, ASN, organisation, the
--                         connection's country against the country on the profile) and when the
--                         high-risk reputation penalty was last applied (once per 24 hours). The
--                         Admin Console reads this.
--   trusted_members       accounts that are never throttled, penalised or gated for their network
--                         (your own admin and test accounts on WireGuard or Tailscale). Staff roles
--                         are exempt as well. Add one with:
--                           insert into public.trusted_members (user_id, note) values ('<id>', 'owner test account');
-- Safe to re-run.
-- =====================================================================

begin;

create table if not exists public.ip_reputation_cache (
  ip text primary key,
  is_vpn boolean not null default false,
  is_proxy boolean not null default false,
  is_tor boolean not null default false,
  is_datacenter boolean not null default false,
  is_abuser boolean not null default false,
  asn integer,
  org text,
  country_code text,
  checked_at timestamptz not null default now()
);

create index if not exists idx_ip_reputation_cache_checked on public.ip_reputation_cache (checked_at);

create table if not exists public.member_ip_flags (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null check (tier in ('clean', 'vpn', 'high')),
  ip text,
  asn integer,
  org text,
  ip_country text,
  header_country text,
  declared_country text,
  country_mismatch boolean not null default false,
  last_event text,
  penalized_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_member_ip_flags_risky on public.member_ip_flags (updated_at desc) where tier <> 'clean' or country_mismatch;

create table if not exists public.trusted_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

alter table public.ip_reputation_cache enable row level security;
alter table public.member_ip_flags enable row level security;
alter table public.trusted_members enable row level security;

revoke all on public.ip_reputation_cache, public.member_ip_flags, public.trusted_members from anon, authenticated;

commit;

-- Checks worth running afterwards (read-only)
--   select tablename, policyname from pg_policies
--    where schemaname = 'public' and tablename in ('ip_reputation_cache', 'member_ip_flags', 'trusted_members');
--   -- no rows: the three tables are reachable only with the service role.
