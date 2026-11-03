'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface MessageToastData {
  /** Changes for every toast so a new message restarts the timer and animation. */
  key: string;
  senderId: string;
  name: string;
  avatarUrl: string | null;
  preview: string;
}

const AUTO_DISMISS_MS = 4500;

/**
 * Floating in-app message toast: slides down from the top (z-[100]), avatar + name + one-line
 * preview. Tapping it opens the chat; it closes itself after 4.5 s.
 */
export function NotificationToast({
  toast,
  onOpen,
  onClose,
}: {
  toast: MessageToastData | null;
  onOpen: (toast: MessageToastData) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(onClose, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] flex justify-center pointer-events-none">
      <div
        key={toast.key}
        role="status"
        aria-live="polite"
        onClick={() => onOpen(toast)}
        className="ail-toast-in pointer-events-auto mx-auto max-w-sm w-[92%] bg-white/95 backdrop-blur-md shadow-xl rounded-2xl p-3 border border-slate-100 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all"
      >
        <img
          src={toast.avatarUrl || '/placeholder-avatar.svg'}
          alt=""
          className="w-10 h-10 rounded-full object-cover ring-2 ring-[#6555B8]/20 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-[#2D264B] truncate">{toast.name}</p>
          <p className="text-xs text-[#8A839E] truncate max-w-[200px]">{toast.preview}</p>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default NotificationToast;
