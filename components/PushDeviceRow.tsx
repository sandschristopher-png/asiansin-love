'use client';

import React, { useEffect, useState } from 'react';
import { BellRing, Loader2 } from 'lucide-react';
import { enablePushNotifications, getPushSupport, type PushSupport } from '@/lib/push';
import { PushPermissionCard } from '@/components/PushPermissionCard';

const COPY: Record<PushSupport | 'error', string> = {
  granted: 'On for this device',
  default: 'Get alerts for messages and matches',
  denied: 'Blocked - allow notifications in your browser settings',
  'needs-install': 'On iPhone: Share > Add to Home Screen, then open the app',
  unsupported: 'Not supported in this browser',
  error: 'Could not turn on - please try again',
};

/** Settings row: turns on native push notifications for the current device (needs a tap). */
export function PushDeviceRow() {
  const [state, setState] = useState<PushSupport | 'error'>('default');
  const [busy, setBusy] = useState(false);
  const [explaining, setExplaining] = useState(false);

  useEffect(() => setState(getPushSupport()), []);

  const canEnable = state === 'default' || state === 'error';
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#E8DFF5]/40 transition">
      <div className="flex items-center gap-3 pr-4">
        <div className="w-8 h-8 rounded-xl bg-[#E8DFF5]/60 text-[#72519A] flex items-center justify-center shrink-0">
          <BellRing className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#51376D]">Push on this device</p>
          <p className="text-[11px] text-[#51376D]/75">{COPY[state]}</p>
        </div>
      </div>
      {canEnable ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => setExplaining(true)}
          className="h-8 px-3.5 rounded-full bg-[#72519A] hover:bg-[#72519A] text-white text-[11px] font-semibold shrink-0 inline-flex items-center gap-1.5 disabled:opacity-60"
        >
          {busy && <Loader2 className="w-3 h-3 animate-spin" />}
          Turn on
        </button>
      ) : state === 'granted' ? (
        <span className="text-[11px] font-semibold text-emerald-600 shrink-0">Enabled</span>
      ) : null}
      {explaining && (
        <PushPermissionCard
          onClose={() => setExplaining(false)}
          onAllow={async () => {
            setExplaining(false);
            setBusy(true);
            setState(await enablePushNotifications()); // the browser's own prompt appears here
            setBusy(false);
          }}
        />
      )}
    </div>
  );
}

export default PushDeviceRow;
