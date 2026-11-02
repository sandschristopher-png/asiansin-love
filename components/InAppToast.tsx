'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/** Classes every in-app toast uses: centered inside the 430px app shell. */
export const TOAST_POSITION_CLASS =
  'fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-50';

/** Lightweight toast that auto-dismisses; render it with a message to show it. */
export function InAppToast({
  message,
  icon,
  onClose,
  durationMs = 4000,
}: {
  message: string | null;
  icon?: React.ReactNode;
  onClose: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, durationMs);
    return () => clearTimeout(t);
  }, [message, durationMs, onClose]);

  if (!message) return null;
  return (
    <div role="status" aria-live="polite" className={`${TOAST_POSITION_CLASS} animate-slide-down`}>
      <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[#ECE8F4] shadow-[0_12px_32px_rgba(101,85,184,0.18)] text-xs text-[#1C1924]">
        {icon && <span className="shrink-0 mt-0.5 text-[#6555B8]">{icon}</span>}
        <p className="flex-1 leading-relaxed">{message}</p>
        <button type="button" onClick={onClose} aria-label="Dismiss" className="shrink-0 text-[#9A93A8] hover:text-[#1C1924]">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default InAppToast;

// Legacy no-op API (the old global toast system was removed); kept so existing imports stay valid.
export interface ToastData { senderName?: string; avatarUrl?: string; message?: string; chatUrl?: string; id?: string }
export function notifyUser(_data: Omit<ToastData, 'id'> & { id?: string }) { /* no-op */ }
