'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

/** Classes every in-app toast uses: centered inside the 430px app shell, below the status bar. */
export const TOAST_POSITION_CLASS =
  'fixed top-[calc(env(safe-area-inset-top,0px)+1rem)] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-50';

/** Exit animation length (.ail-fade-out in globals.css). */
const EXIT_MS = 180;

/** Lightweight toast that auto-dismisses; render it with a message to show it. */
export function InAppToast({
  message,
  icon,
  onClose,
  durationMs = 4000,
  action,
}: {
  message: string | null;
  icon?: React.ReactNode;
  onClose: () => void;
  durationMs?: number;
  /** Optional one-tap follow-up (e.g. "Block" after a report). */
  action?: { label: string; onClick: () => void };
}) {
  const [leavingFor, setLeavingFor] = useState<string | null>(null);
  const exitTimer = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (!message) return;
    setLeavingFor(message);
    exitTimer.current = window.setTimeout(onClose, EXIT_MS);
  }, [message, onClose]);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(dismiss, durationMs);
    return () => {
      window.clearTimeout(t);
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
      exitTimer.current = null;
    };
  }, [message, durationMs, dismiss]);

  if (!message) return null;
  const leaving = leavingFor === message;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${TOAST_POSITION_CLASS} ${leaving ? 'ail-fade-out pointer-events-none' : 'animate-slide-down'}`}
    >
      <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[#D0CDE1] shadow-[0_12px_32px_rgba(102,93,150,0.18)] text-xs text-[#413B5E]">
        {icon && <span className="shrink-0 mt-0.5 text-[#8574B7]">{icon}</span>}
        <p className="flex-1 leading-relaxed">{message}</p>
        {action && (
          <button
            type="button"
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className="shrink-0 self-center px-3 py-1 rounded-full bg-[#413B5E] text-white text-[11px] font-semibold hover:bg-[#413B5E]"
          >
            {action.label}
          </button>
        )}
        <button type="button" onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-[#413B5E]/55 hover:text-[#413B5E]">
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
