'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, Heart, MessageCircle } from 'lucide-react';
import { AVATAR_IMAGE, supabaseImage } from '@/lib/images/supabaseImage';

export type NotificationKind = 'message' | 'spark' | 'mutual' | 'visit';

export interface NotificationToastData {
  /** Changes for every toast so a new event restarts the timer and animation. */
  key: string;
  kind: NotificationKind;
  actorId: string;
  name: string;
  avatarUrl: string | null;
  preview: string;
  href: string;
}

const AUTO_DISMISS_MS = 4500;
/** Exit animation length (.ail-toast-out in globals.css). */
const EXIT_MS = 180;

const KIND_ICON = {
  message: MessageCircle,
  spark: Heart,
  mutual: Heart,
  visit: Eye,
} as const;

/**
 * Floating in-app notification (messages, Sparks, mutual Sparks, profile visits): slides down at
 * the top (z-[100]), avatar + name with a context icon + one-line preview + unread dot. Tapping it
 * opens the destination; it closes itself after 4.5 s.
 */
export function NotificationToast({
  toast,
  onOpen,
  onClose,
}: {
  toast: NotificationToastData | null;
  onOpen: (toast: NotificationToastData) => void;
  onClose: () => void;
}) {
  // Which toast is playing its exit animation; a newer toast is never caught by an older exit.
  const [leavingKey, setLeavingKey] = useState<string | null>(null);
  const exitTimer = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (!toast) return;
    setLeavingKey(toast.key);
    exitTimer.current = window.setTimeout(onClose, EXIT_MS);
  }, [toast, onClose]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => {
      window.clearTimeout(t);
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
      exitTimer.current = null;
    };
  }, [toast, dismiss]);

  if (!toast) return null;
  const leaving = leavingKey === toast.key;
  const Icon = KIND_ICON[toast.kind];
  const mutual = toast.kind === 'mutual';

  return (
    // Centering lives on this wrapper so the slide-in transform on the card can't fight it.
    // Below the status bar / notch in Home Screen mode (viewport-fit=cover); never over the bottom nav.
    <div className="fixed top-[calc(env(safe-area-inset-top,0px)+0.75rem)] inset-x-0 z-[100] flex justify-center pointer-events-none">
      <div
        key={toast.key}
        role="status"
        aria-live="polite"
        onClick={() => onOpen(toast)}
        className={`${leaving ? 'ail-toast-out pointer-events-none' : 'ail-toast-in pointer-events-auto'} w-[94%] max-w-sm backdrop-blur-md shadow-xl rounded-2xl p-3 border flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all ${
          mutual ? 'bg-[#8574B7] border-[#8574B7]' : 'bg-white/95 border-[#D0CDE1]/60'
        }`}
      >
        <img
          src={supabaseImage(toast.avatarUrl, AVATAR_IMAGE)}
          alt=""
          className="w-11 h-11 rounded-full object-cover ring-2 ring-[#8574B7]/20 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className={`flex items-center gap-1.5 font-semibold text-sm truncate ${mutual ? 'text-white' : 'text-[#413B5E]'}`}>
            <Icon
              className={`w-3.5 h-3.5 shrink-0 ${mutual ? 'text-white fill-white' : 'text-[#8574B7]'} ${toast.kind === 'spark' ? 'fill-[#8574B7]' : ''}`}
              strokeWidth={2}
            />
            <span className="truncate">{toast.name}</span>
          </p>
          <p className={`text-xs truncate max-w-[210px] mt-0.5 ${mutual ? 'text-white/85' : 'text-[#413B5E]/55'}`}>{toast.preview}</p>
        </div>
        <span aria-hidden className={`w-2 h-2 rounded-full shrink-0 ${mutual ? 'bg-white' : 'bg-[#8574B7]'}`} />
      </div>
    </div>
  );
}

export default NotificationToast;
