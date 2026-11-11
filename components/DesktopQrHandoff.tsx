'use client';

import React, { useSyncExternalStore } from 'react';
import { X } from 'lucide-react';
import { QrCode } from '@/components/QrCode';

const DISMISS_KEY = 'ail_qr_handoff_dismissed_v1';
const DISMISS_EVENT = 'ail-qr-handoff-dismissed';

const subscribe = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  window.addEventListener(DISMISS_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(DISMISS_EVENT, onChange);
  };
};
const isDismissed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * Wide desktop screens only (xl): a small corner card outside the 480px column with a QR code to
 * open asiansin.love on a phone. Hidden until the client reads the dismissal (no flash), and gone
 * for good once dismissed.
 */
export function DesktopQrHandoff() {
  const dismissed = useSyncExternalStore(subscribe, isDismissed, () => true);
  if (dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {}
    window.dispatchEvent(new Event(DISMISS_EVENT));
  };

  return (
    <aside className="fixed bottom-5 right-5 z-30 hidden xl:flex items-center gap-3 rounded-2xl border border-[#D0CDE1] bg-white p-3 shadow-sm max-w-[240px]">
      <QrCode value="https://asiansin.love" size={72} label="QR code to open asiansin.love on your phone" className="shrink-0 rounded-lg" />
      <p className="text-[11px] font-semibold leading-snug text-[#413B5E] pr-4">
        Take Asians in Love on the go — Scan to open on your phone
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[#413B5E]/55 hover:text-[#413B5E] hover:bg-[#E8E6F1]/60 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
}

export default DesktopQrHandoff;
