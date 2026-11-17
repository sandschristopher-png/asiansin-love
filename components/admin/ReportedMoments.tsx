'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Trash2 } from 'lucide-react';

interface QueueMoment {
  id: string;
  image_url: string;
  caption: string | null;
  vibe_tag: string | null;
  city: string;
  status: 'active' | 'hidden';
  reportCount: number;
  reasons: string[];
  author: { username: string | null; reputation_score: number | null } | null;
}

/**
 * Reported Moments, listed under the reported messages in the moderation console. A Moment with 2
 * unique reports (or an underage report) is already hidden from the feed; staff either restore it
 * or remove it (photo deleted, optional reputation penalty for the author).
 */
export function ReportedMoments() {
  const [items, setItems] = useState<QueueMoment[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch('/api/admin/moments').catch(() => null);
      const data = res && res.ok ? await res.json().catch(() => ({})) : {};
      if (active) setItems((data.moments as QueueMoment[]) || []);
    })();
    return () => {
      active = false;
    };
  }, [reload]);

  const act = async (momentId: string, action: 'restore' | 'remove') => {
    setBusy(momentId);
    await fetch('/api/admin/moments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ momentId, action, penaltyPoints: action === 'remove' ? 10 : 0 }),
    }).catch(() => null);
    setBusy(null);
    setReload((n) => n + 1);
  };

  if (items === null || items.length === 0) return null;

  return (
    <section aria-label="Reported Moments" className="mt-6 rounded-2xl border border-[#D0CDE1] bg-white p-4">
      <h2 className="text-sm font-semibold text-[#413B5E]">Reported Moments ({items.length})</h2>
      <ul className="mt-3 space-y-3">
        {items.map((m) => (
          <li key={m.id} className="flex gap-3 rounded-xl border border-[#D0CDE1]/70 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.image_url} alt="" className="h-24 w-[4.8rem] shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#413B5E]">
                @{m.author?.username || 'member'} <span className="font-normal text-slate-600">· {m.city} · rep {m.author?.reputation_score ?? '?'}</span>
              </p>
              {m.caption && <p className="mt-0.5 text-xs text-slate-600 break-words">{m.caption}</p>}
              <p className="mt-1 text-[11px] text-slate-600">
                {m.status === 'hidden' ? 'Hidden from the feed' : 'Live'} · {m.reportCount} report{m.reportCount === 1 ? '' : 's'}: {m.reasons.join(', ') || 'none'}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={busy === m.id}
                  onClick={() => act(m.id, 'restore')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {busy === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                  Restore
                </button>
                <button
                  type="button"
                  disabled={busy === m.id}
                  onClick={() => act(m.id, 'remove')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-red-500 disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove (-10)
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ReportedMoments;
