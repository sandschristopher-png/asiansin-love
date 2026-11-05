'use client';

import React, { useState } from 'react';
import { BellRing } from 'lucide-react';
import { alertPrefs } from '@/lib/notificationStore';

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-[#72519A]' : 'bg-[#E8DFF5]'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </span>
  );
}

/**
 * Settings row for this device's browser alerts (shown while the tab is in the background).
 * In-app alerts are silent: toast + haptic only. Web push has its own row (PushDeviceRow).
 */
export function AlertPrefsRows() {
  const [browser, setBrowser] = useState(() =>
    typeof window === 'undefined' || typeof Notification === 'undefined'
      ? false
      : alertPrefs.browserAlertsEnabled() && Notification.permission === 'granted'
  );
  const [note, setNote] = useState<string | null>(null);

  const toggleBrowser = async () => {
    setNote(null);
    if (browser) {
      alertPrefs.setBrowserAlertsEnabled(false);
      setBrowser(false);
      return;
    }
    if (typeof Notification === 'undefined') {
      setNote('This browser does not support notifications.');
      return;
    }
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    if (permission !== 'granted') {
      setNote('Notifications are blocked for this site. Allow them in your browser settings.');
      return;
    }
    alertPrefs.setBrowserAlertsEnabled(true);
    setBrowser(true);
  };

  const rowCls = 'w-full flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-[#E8DFF5]/40 transition cursor-pointer text-left';
  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={browser}
        onClick={toggleBrowser}
        className={rowCls}
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-[#E8DFF5]/60 text-[#72519A] flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold text-[#51376D]">Enable Notifications</span>
            <span className="block text-[11px] text-[#51376D]/75">Browser alerts when this tab is in the background</span>
          </span>
        </span>
        <Toggle on={browser} />
      </button>
      {note && <p className="mx-3 -mt-1 mb-1 text-[11px] font-medium text-[#72519A]">{note}</p>}

    </>
  );
}

export default AlertPrefsRows;
