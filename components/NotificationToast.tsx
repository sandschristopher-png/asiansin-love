'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, Heart, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { AVATAR_IMAGE, supabaseImage } from '@/lib/images/supabaseImage';

export type NotificationKind = 'message' | 'spark' | 'mutual' | 'visit' | 'moment_like' | 'call' | 'identity';

export interface NotificationToastData {
  /** Changes for every toast so a new event restarts the timer and animation. */
  key: string;
  kind: NotificationKind;
  actorId: string;
  name: string;
  avatarUrl: string | null;
  /** Bold headline ("Annie sent you a message"). Falls back to `name` when a source has no sentence of its own. */
  title?: string;
  /** Snippet under the headline (the message text); the card shows nothing there when empty. */
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
  moment_like: Heart,
  call: Phone,
  identity: ShieldCheck,
} as const;

/**
 * Floating in-app notification (messages, Sparks, mutual Sparks, profile visits, likes, missed calls): slides
 * down at the top (z-[100]). A white card with a soft lavender edge: the sender's round avatar with a small
 * kind badge, a bold headline ("Annie sent you a message") and the message snippet in a lavender capsule.
 * Tapping it dismisses it and opens the destination; it closes itself after 4.5 s.
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
  const headline = toast.title || toast.name;

  return (
    // Centering lives on this wrapper so the slide-in transform on the card can't fight it.
    // Below the status bar / notch in Home Screen mode (viewport-fit=cover); never over the bottom nav.
    <div className="fixed top-[calc(env(safe-area-inset-top,0px)+0.75rem)] inset-x-0 z-[100] flex justify-center pointer-events-none">
      <div
        key={toast.key}
        role="status"
        aria-live="polite"
        onClick={() => onOpen(toast)}
        className={`${leaving ? 'ail-toast-out pointer-events-none' : 'ail-toast-in pointer-events-auto'} w-[94%] max-w-sm rounded-2xl p-3 border flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform ${
          mutual
            ? 'bg-[#726E97] border-[#726E97] shadow-[0_14px_34px_rgba(114, 110, 151,0.35)]'
            : 'bg-white border-[#726E97]/25 shadow-[0_14px_34px_rgba(114, 110, 151,0.22),0_2px_8px_rgba(65,59,94,0.06)]'
        }`}
      >
        <span className="relative shrink-0">
          <img
            src={supabaseImage(toast.avatarUrl, AVATAR_IMAGE)}
            alt=""
            width={48}
            height={48}
            className={`w-12 h-12 rounded-full object-cover bg-[#F6F4FB] ring-2 ${mutual ? 'ring-white/60' : 'ring-[#726E97]/20'}`}
          />
          <span
            aria-hidden
            className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-2 ${
              mutual ? 'bg-white text-[#726E97] ring-[#726E97]' : 'bg-[#726E97] text-white ring-white'
            }`}
          >
            <Icon className={`h-3 w-3 ${toast.kind === 'spark' || mutual ? 'fill-current' : ''}`} strokeWidth={2.25} />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-bold leading-snug ${mutual ? 'text-white' : 'text-[#413B5E]'}`}>{headline}</p>
          {toast.preview && (
            <p
              className={`mt-1 truncate rounded-lg px-2 py-1 text-xs leading-snug ${
                mutual ? 'bg-white/15 text-white' : 'bg-[#F6F4FB] text-[#413B5E]/80'
              }`}
            >
              {toast.preview}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationToast;
