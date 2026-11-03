/**
 * Onboarding location-integrity check: is this connection a VPN, proxy, Tor exit or hosting
 * datacenter? Used ONLY by /api/onboarding; established members are never blocked for using a
 * privacy VPN later.
 *
 * Lookup: ipapi.is (works without a key at low volume; set IPAPI_IS_KEY for a paid quota).
 * Fails open: if the lookup is down or times out, the member is not blocked (logged instead),
 * so an outage can never stop genuine sign-ups. Set IP_REPUTATION_DISABLED=1 to switch off.
 */

export interface IpVerdict {
  ip: string | null;
  blocked: boolean;
  reason: 'vpn' | 'proxy' | 'tor' | 'datacenter' | null;
  /** false when no lookup was made (local IP, disabled, error) */
  checked: boolean;
}

const LOOKUP_TIMEOUT_MS = 3000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { verdict: IpVerdict; at: number }>();

/** First public address from the proxy headers Vercel / Cloudflare set. */
export function clientIpFromHeaders(headers: Headers): string | null {
  const candidates = [
    headers.get('cf-connecting-ip'),
    headers.get('x-real-ip'),
    ...(headers.get('x-forwarded-for') || '').split(','),
  ];
  for (const raw of candidates) {
    const ip = (raw || '').trim();
    if (ip) return ip;
  }
  return null;
}

function isPrivateIp(ip: string): boolean {
  return (
    ip === '::1' ||
    ip.startsWith('127.') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^f[cd][0-9a-f]{2}:/i.test(ip) ||
    ip.startsWith('fe80:')
  );
}

export async function checkIpReputation(ip: string | null): Promise<IpVerdict> {
  const pass = (checked: boolean): IpVerdict => ({ ip, blocked: false, reason: null, checked });
  if (!ip || isPrivateIp(ip) || process.env.IP_REPUTATION_DISABLED === '1') return pass(false);

  const hit = cache.get(ip);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.verdict;

  try {
    const url = new URL('https://api.ipapi.is/');
    url.searchParams.set('q', ip);
    if (process.env.IPAPI_IS_KEY) url.searchParams.set('key', process.env.IPAPI_IS_KEY);
    const res = await fetch(url, { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`ipapi.is ${res.status}`);
    const d = (await res.json()) as Record<string, unknown>;

    const reason: IpVerdict['reason'] = d.is_tor
      ? 'tor'
      : d.is_vpn
        ? 'vpn'
        : d.is_proxy
          ? 'proxy'
          : d.is_datacenter
            ? 'datacenter'
            : null;
    const verdict: IpVerdict = { ip, blocked: reason !== null, reason, checked: true };
    cache.set(ip, { verdict, at: Date.now() });
    return verdict;
  } catch (err) {
    console.warn('[ipReputation] lookup failed, allowing:', err instanceof Error ? err.message : err);
    return pass(false);
  }
}
