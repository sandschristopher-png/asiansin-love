'use client';

import React, { useEffect, useState } from 'react';

interface Flag {
  user_id: string;
  tier: 'vpn' | 'high' | 'clean';
  ip: string | null;
  asn: number | null;
  org: string | null;
  ip_country: string | null;
  header_country: string | null;
  declared_country: string | null;
  country_mismatch: boolean;
  last_event: string | null;
  penalized_at: string | null;
  updated_at: string;
  member: { username: string | null; reputation_score: number | null; is_verified: boolean | null } | null;
}

/**
 * Network flags for staff: members seen on a VPN or a high-risk connection, and connections in a
 * different country from the profile. VPN is informational (a live selfie is asked for before
 * messaging); high risk has already cost 15 reputation. Nothing here bans anyone.
 */
export function IpRiskFlags() {
  const [flags, setFlags] = useState<Flag[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch('/api/admin/ip-flags').catch(() => null);
      const data = res && res.ok ? await res.json().catch(() => ({})) : {};
      if (active) setFlags((data.flags as Flag[]) || []);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (flags === null || flags.length === 0) return null;

  return (
    <section aria-label="Network flags" className="mt-6 rounded-2xl border border-[#D0CDE1] bg-white p-4">
      <h2 className="text-sm font-semibold text-[#413B5E]">Network flags ({flags.length})</h2>
      <ul className="mt-3 space-y-2">
        {flags.map((f) => (
          <li key={f.user_id} className="rounded-xl border border-[#D0CDE1]/70 p-3 text-xs">
            <p className="font-semibold text-[#413B5E]">
              @{f.member?.username || 'member'}{' '}
              <span className={`ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${f.tier === 'high' ? 'bg-red-50 text-red-700' : 'bg-[#726E97]/15 text-[#726E97]'}`}>
                {f.tier === 'high' ? 'High risk' : f.tier === 'vpn' ? 'VPN' : 'Country mismatch'}
              </span>
              {f.member?.is_verified ? <span className="ml-1 font-normal text-slate-600">verified</span> : <span className="ml-1 font-normal text-slate-600">not verified</span>}
            </p>
            <p className="mt-1 text-slate-600 break-words">
              {f.ip ?? 'ip unknown'} · AS{f.asn ?? '?'} {f.org ?? ''} · connection {f.ip_country ?? '?'} (edge {f.header_country ?? '?'}) · profile {f.declared_country ?? '?'}
              {f.country_mismatch ? ' · mismatch' : ''} · {f.last_event ?? 'event'} · rep {f.member?.reputation_score ?? '?'}
              {f.penalized_at ? ' · -15 applied' : ''}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default IpRiskFlags;
