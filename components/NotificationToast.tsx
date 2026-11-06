'use client';

import React, { useEffect } from 'react';
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
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(onClose, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const Icon = KIND_ICON[toast.kind];
  const mutual = toast.kind === 'mutual';

  return (
    // Centering lives on this wrapper so the slide-in transform on the card can't fight it.
    <div className="fixed top-3 inset-x-0 z-[100] flex justify-center pointer-events-none">
      <div
        key={toast.key}
        role="status"
        aria-live="polite"
        onClick={() => onOpen(toast)}
        className={`ail-toast-in pointer-events-auto w-[94%] max-w-sm backdrop-blur-md shadow-xl rounded-2xl p-3 border flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all ${
          mutual ? 'bg-[#665D96] border-[#665D96]' : 'bg-white/95 border-[#D0CDE1]/60'
        }`}
      >
        <img
          src={supabaseImage(toast.avatarUrl, AVATAR_IMAGE)}
          alt=""
          className="w-11 h-11 rounded-full object-cover ring-2 ring-[#665D96]/20 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className={`flex items-center gap-1.5 font-semibold text-sm truncate ${mutual ? 'text-white' : 'text-[#413B5E]'}`}>
            <Icon
              className={`w-3.5 h-3.5 shrink-0 ${mutual ? 'text-white fill-white' : 'text-[#665D96]'} ${toast.kind === 'spark' ? 'fill-[#665D96]' : ''}`}
              strokeWidth={2}
            />
            <span className="truncate">{toast.name}</span>
          </p>
          <p className={`text-xs truncate max-w-[210px] mt-0.5 ${mutual ? 'text-white/85' : 'text-[#413B5E]/55'}`}>{toast.preview}</p>
        </div>
        <span aria-hidden className={`w-2 h-2 rounded-full shrink-0 ${mutual ? 'bg-white' : 'bg-[#665D96]'}`} />
      </div>
    </div>
  );
}

export default NotificationToast;
