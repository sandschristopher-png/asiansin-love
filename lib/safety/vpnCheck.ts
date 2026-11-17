/**
 * Network-risk checks: is this connection a VPN, proxy, Tor exit or hosting datacenter, and what
 * should that change? Built so it can never lock out a real member or fail the request:
 *
 *   Client IP     the real client address from the platform's headers, ignoring loopback, private,
 *                 link-local and CGNAT / Tailscale ranges (local development and WireGuard).
 *   Lookup        ipapi.is with a 3 s timeout (IPAPI_IS_KEY lifts its free quota). A timeout, rate
 *                 limit or outage returns "unknown" and logs a warning: fail OPEN.
 *   Caching       24 hours per IP in Supabase (ip_reputation_cache) plus a short in-memory layer, so
 *                 repeated requests cost nothing.
 *   Tiers         clean    ordinary residential or mobile connection: nothing happens.
 *                 vpn      a consumer VPN (a legitimate traveller, privacy-minded member): never banned
 *                          for it, but a live selfie is required before messaging, and the connection
 *                          can never prove they are physically in a Southeast Asian city.
 *                 high     Tor, an open proxy, a flagged abuser or a plain hosting datacenter: -15
 *                          reputation (once per 24 hours), unverified accounts cannot message, and the
 *                          session is flagged in the Admin Console.
 *   Trusted       staff roles and rows in trusted_members are never throttled, penalised or gated.
 * Regression cases: scripts/test-vpn-check.mjs.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type NetworkTier = 'clean' | 'vpn' | 'high' | 'unknown';

export interface IpInfo {
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  isAbuser: boolean;
  asn: number | null;
  org: string | null;
  country: string | null;
}

export interface NetworkAssessment {
  ip: string | null;
  tier: NetworkTier;
  /** false when no verdict was reached (private IP, disabled, outage): treated like clean. */
  checked: boolean;
  trusted: boolean;
  asn: number | null;
  org: string | null;
  /** Country the lookup places the IP in. */
  ipCountry: string | null;
  /** Country the hosting platform's edge geolocation reports (x-vercel-ip-country). */
  headerCountry: string | null;
  source: 'none' | 'memory' | 'cache' | 'lookup';
}

/** Reputation cost of a high-risk connection, applied at most once per 24 hours per member. */
export const HIGH_RISK_PENALTY = 15;
export const HIGH_RISK_PENALTY_WINDOW_MS = 24 * 60 * 60 * 1000;

const LOOKUP_TIMEOUT_MS = 3000;
const MEMORY_TTL_MS = 10 * 60 * 1000;
const FAILURE_TTL_MS = 60 * 1000;
const DB_TTL_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------------------------
// Client IP
// ---------------------------------------------------------------------------------------------

/** Loopback, private, link-local, CGNAT (Tailscale) and unspecified addresses. */
export function isPrivateIp(raw: string): boolean {
  const ip = raw.trim().toLowerCase().replace(/^\[|\]$/g, '').replace(/^::ffff:/, '');
  if (!ip) return true;
  if (ip === '::1' || ip === '::' || ip === 'localhost') return true;
  if (/^f[cd][0-9a-f]{2}:/.test(ip) || /^fe[89ab][0-9a-f]:/.test(ip)) return true; // unique-local, link-local v6
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!v4) return false;
  const [a, b] = [Number(v4[1]), Number(v4[2])];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT, Tailscale
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

/**
 * The real client address. On Vercel the platform sets x-vercel-forwarded-for / x-real-ip itself
 * and a client-supplied cf-connecting-ip is just a header anyone can send, so it is only trusted
 * when the app is not on Vercel (self-hosted behind Cloudflare). Entries that are private are
 * skipped, so local development and WireGuard / Tailscale hops yield null instead of a bogus IP.
 */
export function getClientIp(headers: Headers, opts: { vercel?: boolean } = {}): string | null {
  const onVercel = opts.vercel ?? Boolean(process.env.VERCEL);
  const forwarded = (headers.get('x-forwarded-for') || '').split(',');
  const candidates = onVercel
    ? [headers.get('x-vercel-forwarded-for'), headers.get('x-real-ip'), ...forwarded]
    : [headers.get('cf-connecting-ip'), headers.get('x-real-ip'), ...forwarded];
  for (const raw of candidates) {
    const ip = (raw || '').trim();
    if (ip && !isPrivateIp(ip)) return ip;
  }
  return null;
}

// ---------------------------------------------------------------------------------------------
// Tiers and gates
// ---------------------------------------------------------------------------------------------

/**
 * Tor, open proxies, flagged abusers and plain hosting datacenters are high risk. An IP that a VPN
 * provider runs (flagged is_vpn, usually from a datacenter ASN) is a consumer VPN, not a scammer.
 */
export function tierFromIpInfo(info: IpInfo): Exclude<NetworkTier, 'unknown'> {
  if (info.isTor || info.isAbuser) return 'high';
  if (info.isVpn) return 'vpn';
  if (info.isProxy || info.isDatacenter) return 'high';
  return 'clean';
}

export type NetworkGate = { code: 'NETWORK_VERIFICATION_REQUIRED' | 'NETWORK_RESTRICTED'; status: 403 } | null;

/**
 * What a connection costs an UNVERIFIED member. Verified members, trusted accounts and unknown
 * results (outage, local IP) are never gated, and nobody is banned for the connection alone.
 */
export function networkGate(tier: NetworkTier, opts: { verified: boolean; trusted: boolean }): NetworkGate {
  if (opts.trusted || opts.verified) return null;
  if (tier === 'vpn') return { code: 'NETWORK_VERIFICATION_REQUIRED', status: 403 };
  if (tier === 'high') return { code: 'NETWORK_RESTRICTED', status: 403 };
  return null;
}

/** Reputation points for a connection: only the high tier costs anything, and trusted accounts never. */
export function networkPenalty(tier: NetworkTier, trusted: boolean): number {
  return !trusted && tier === 'high' ? HIGH_RISK_PENALTY : 0;
}

/** A VPN or datacenter connection cannot show that someone is physically in a city. */
export function canProvePresence(tier: NetworkTier, trusted: boolean): boolean {
  return trusted || tier === 'clean' || tier === 'unknown';
}

// ---------------------------------------------------------------------------------------------
// Lookup with a database cache
// ---------------------------------------------------------------------------------------------

type Minimal = SupabaseClient;

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

const memory = new Map<string, { info: IpInfo | null; at: number; ttl: number }>();
const trustedMemory = new Map<string, { trusted: boolean; at: number }>();

export function clearVpnCaches() {
  memory.clear();
  trustedMemory.clear();
}

type Fetcher = (input: string, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

/** One ipapi.is lookup. Returns null on any failure (the caller fails open). */
export async function fetchIpInfo(ip: string, deps: { fetchImpl?: Fetcher; timeoutMs?: number; apiKey?: string } = {}): Promise<IpInfo | null> {
  const doFetch = deps.fetchImpl ?? (fetch as unknown as Fetcher);
  try {
    const url = new URL('https://api.ipapi.is/');
    url.searchParams.set('q', ip);
    const key = deps.apiKey ?? process.env.IPAPI_IS_KEY;
    if (key) url.searchParams.set('key', key);
    const res = await doFetch(url.toString(), { signal: AbortSignal.timeout(deps.timeoutMs ?? LOOKUP_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`ipapi.is ${res.status}`);
    const d = obj(await res.json());
    const asnBlock = obj(d.asn);
    const asn = typeof asnBlock.asn === 'number' ? asnBlock.asn : typeof d.asn === 'number' ? d.asn : null;
    const company = obj(d.company);
    const location = obj(d.location);
    return {
      isVpn: d.is_vpn === true,
      isProxy: d.is_proxy === true,
      isTor: d.is_tor === true,
      isDatacenter: d.is_datacenter === true,
      isAbuser: d.is_abuser === true,
      asn,
      org: typeof company.name === 'string' ? company.name : typeof asnBlock.org === 'string' ? asnBlock.org : null,
      country: typeof location.country_code === 'string' ? location.country_code.toUpperCase() : null,
    };
  } catch (err) {
    console.warn('[vpnCheck] lookup failed, failing open:', err instanceof Error ? err.message : err);
    return null;
  }
}

type CacheRow = { is_vpn: boolean; is_proxy: boolean; is_tor: boolean; is_datacenter: boolean; is_abuser: boolean; asn: number | null; org: string | null; country_code: string | null; checked_at: string };

async function readDbCache(db: Minimal | undefined, ip: string, now: number): Promise<IpInfo | null> {
  if (!db) return null;
  try {
    const { data } = await db.from('ip_reputation_cache').select('*').eq('ip', ip).maybeSingle();
    const row = data as CacheRow | null;
    if (!row || now - new Date(row.checked_at).getTime() > DB_TTL_MS) return null;
    return { isVpn: row.is_vpn, isProxy: row.is_proxy, isTor: row.is_tor, isDatacenter: row.is_datacenter, isAbuser: row.is_abuser, asn: row.asn, org: row.org, country: row.country_code };
  } catch {
    return null; // table not migrated yet
  }
}

async function writeDbCache(db: Minimal | undefined, ip: string, info: IpInfo) {
  if (!db) return;
  try {
    await db.from('ip_reputation_cache').upsert({
      ip,
      is_vpn: info.isVpn,
      is_proxy: info.isProxy,
      is_tor: info.isTor,
      is_datacenter: info.isDatacenter,
      is_abuser: info.isAbuser,
      asn: info.asn,
      org: info.org,
      country_code: info.country,
      checked_at: new Date().toISOString(),
    });
  } catch {
    // cache write is best effort
  }
}

/** Cached lookup: memory, then Supabase (24 h), then the provider. Never throws. */
export async function lookupIp(
  ip: string,
  deps: { db?: Minimal; fetchImpl?: Fetcher; now?: number; timeoutMs?: number; apiKey?: string } = {}
): Promise<{ info: IpInfo | null; source: NetworkAssessment['source'] }> {
  const now = deps.now ?? Date.now();
  const hit = memory.get(ip);
  if (hit && now - hit.at < hit.ttl) return { info: hit.info, source: 'memory' };

  const stored = await readDbCache(deps.db, ip, now);
  if (stored) {
    memory.set(ip, { info: stored, at: now, ttl: MEMORY_TTL_MS });
    return { info: stored, source: 'cache' };
  }

  const info = await fetchIpInfo(ip, deps);
  if (info) {
    memory.set(ip, { info, at: now, ttl: MEMORY_TTL_MS });
    await writeDbCache(deps.db, ip, info);
  } else {
    // Back off briefly so an outage does not add a 3 s wait to every request.
    memory.set(ip, { info: null, at: now, ttl: FAILURE_TTL_MS });
  }
  return { info, source: info ? 'lookup' : 'none' };
}

async function isTrustedMember(db: Minimal | undefined, userId: string | null | undefined): Promise<boolean> {
  if (!db || !userId) return false;
  const hit = trustedMemory.get(userId);
  if (hit && Date.now() - hit.at < 5 * 60 * 1000) return hit.trusted;
  let trusted = false;
  try {
    const { data } = await db.from('trusted_members').select('user_id').eq('user_id', userId).maybeSingle();
    trusted = Boolean(data);
    if (!trusted) {
      const { data: profile } = await db.from('profiles').select('*').eq('id', userId).maybeSingle();
      const role = String(profile?.admin_role ?? profile?.role ?? '').toLowerCase();
      trusted = role === 'moderator' || role === 'super_admin' || role === 'admin' || profile?.is_admin === true;
    }
  } catch {
    trusted = false;
  }
  trustedMemory.set(userId, { trusted, at: Date.now() });
  return trusted;
}

/** Assess the connection of one request. Never throws and never blocks on a provider outage. */
export async function assessNetwork(
  headers: Headers,
  opts: { userId?: string | null; db?: Minimal; vercel?: boolean; fetchImpl?: Fetcher; now?: number } = {}
): Promise<NetworkAssessment> {
  const headerCountry = headers.get('x-vercel-ip-country')?.toUpperCase() || null;
  const base: NetworkAssessment = { ip: null, tier: 'unknown', checked: false, trusted: false, asn: null, org: null, ipCountry: null, headerCountry, source: 'none' };
  try {
    const trusted = await isTrustedMember(opts.db, opts.userId);
    if (trusted) return { ...base, tier: 'clean', trusted: true };

    const ip = getClientIp(headers, { vercel: opts.vercel });
    if (!ip || process.env.IP_REPUTATION_DISABLED === '1') return { ...base, ip };

    const { info, source } = await lookupIp(ip, { db: opts.db, fetchImpl: opts.fetchImpl, now: opts.now });
    if (!info) return { ...base, ip, source };
    return { ip, tier: tierFromIpInfo(info), checked: true, trusted: false, asn: info.asn, org: info.org, ipCountry: info.country, headerCountry, source };
  } catch (err) {
    console.warn('[vpnCheck] assessment failed, failing open:', err instanceof Error ? err.message : err);
    return base;
  }
}

// ---------------------------------------------------------------------------------------------
// Persisting the result (member_ip_flags, reputation penalty, admin alert)
// ---------------------------------------------------------------------------------------------

/**
 * Records a non-clean assessment for the Admin Console and applies the high-risk penalty at most
 * once per 24 hours. Clean, unknown and trusted results write nothing. Never throws.
 * `declaredCountry` is the country on the member's profile; a different connection country is
 * logged as a mismatch. `onAlert` lets the route queue the staff notification (next/server `after`).
 */
export async function recordNetworkRisk(
  db: Minimal,
  userId: string,
  a: NetworkAssessment,
  ctx: { event: string; declaredCountry?: string | null; onAlert?: () => void }
): Promise<{ penalized: boolean; mismatch: boolean }> {
  const none = { penalized: false, mismatch: false };
  if (a.trusted || !a.checked || a.tier === 'unknown') return none;
  try {
    const declared = (ctx.declaredCountry || '').trim().toUpperCase();
    const mismatch = Boolean(declared && a.ipCountry && declared.length === 2 && declared !== a.ipCountry);
    if (a.tier === 'clean' && !mismatch) return none;

    const { data: existing } = await db.from('member_ip_flags').select('penalized_at').eq('user_id', userId).maybeSingle();
    const last = existing?.penalized_at ? new Date(existing.penalized_at).getTime() : 0;
    const owed = networkPenalty(a.tier, a.trusted) > 0 && Date.now() - last > HIGH_RISK_PENALTY_WINDOW_MS;

    await db.from('member_ip_flags').upsert({
      user_id: userId,
      tier: a.tier,
      ip: a.ip,
      asn: a.asn,
      org: a.org,
      ip_country: a.ipCountry,
      header_country: a.headerCountry,
      declared_country: declared || null,
      country_mismatch: mismatch,
      last_event: ctx.event,
      penalized_at: owed ? new Date().toISOString() : existing?.penalized_at ?? null,
      updated_at: new Date().toISOString(),
    });

    if (owed) {
      const { error } = await db.rpc('apply_moderation_penalty', {
        p_user_id: userId,
        p_deduction: HIGH_RISK_PENALTY,
        p_action: 'ip_risk',
        p_category: 'ip_high_risk',
        p_flagged: `${a.ip ?? '?'} AS${a.asn ?? '?'} ${a.org ?? ''}`.slice(0, 300),
      });
      if (error) console.warn('[vpnCheck] penalty failed:', error.message);
      ctx.onAlert?.();
    }
    return { penalized: owed, mismatch };
  } catch (err) {
    console.warn('[vpnCheck] could not record network risk:', err instanceof Error ? err.message : err);
    return none;
  }
}
