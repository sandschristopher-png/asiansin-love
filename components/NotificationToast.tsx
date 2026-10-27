'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { notificationService } from '@/lib/notificationService';

export interface ToastPayload {
  title: string;
  description?: string;
  avatarUrl?: string | null;
  linkUrl?: string;
}

// Fire a heads-up toast from anywhere in the app.
export function emitNotificationToast(payload: ToastPayload) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ToastPayload>('ail-toast', { detail: payload }));
}

export function NotificationToast() {
  const [activeToast, setActiveToast] = useState<ToastPayload | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (dismissTimer.current) { clearTimeout(dismissTimer.current); dismissTimer.current = null; }
    if (exitTimer.current) { clearTimeout(exitTimer.current); exitTimer.current = null; }
  }, []);

  const dismissToast = useCallback(() => {
    clearTimers();
    setIsExiting(true);
    exitTimer.current = setTimeout(() => {
      setIsExiting(false);
      setActiveToast(null);
    }, 280);
  }, [clearTimers]);

  const dispatchToast = useCallback((toast: ToastPayload) => {
    clearTimers();
    setIsExiting(false);
    notificationService.triggerSystemNotification(toast.title, toast.description);
    setActiveToast(toast);
    // Pixel-style heads-up: auto-dismiss after ~5s.
    dismissTimer.current = setTimeout(() => dismissToast(), 5000);
  }, [clearTimers, dismissToast]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastPayload>;
      dispatchToast(customEvent.detail);
    };
    window.addEventListener('ail-toast', handleToastEvent);
    return () => {
      window.removeEventListener('ail-toast', handleToastEvent);
      clearTimers();
    };
  }, [dispatchToast, clearTimers]);

  if (!activeToast) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-3 z-[100070] w-[calc(100%-1.5rem)] max-w-[360px] -translate-x-1/2">
      <Link
        href={activeToast.linkUrl && activeToast.linkUrl !== '#' ? activeToast.linkUrl : ''}
        onClick={(e) => {
          if (!activeToast.linkUrl || activeToast.linkUrl === '#') e.preventDefault();
          else dismissToast();
        }}
        className={
          'pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-[#9A8CC3]/25 bg-[#F8F7FA]/95 p-3.5 shadow-lg shadow-black/15 backdrop-blur-md ' +
          (isExiting ? 'animate-ail-headsup-out' : 'animate-ail-headsup-in')
        }
      >
        {/* Circular avatar, same treatment as chat messages */}
        {activeToast.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeToast.avatarUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6555B8]/10 text-sm font-bold text-[#6555B8]">
            {(activeToast.title || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate text-[13px] font-semibold text-[#1C1924]">{activeToast.title}</p>
          {activeToast.description ? (
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[#6C637B]">{activeToast.description}</p>
          ) : null}
        </div>
        <span
          role="button"
          tabIndex={-1}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissToast(); }}
          className="ml-1 mt-0.5 shrink-0 cursor-pointer rounded-full p-1 text-[#6C637B]/70 transition-colors hover:bg-black/5 hover:text-[#1C1924]"
          aria-label="Dismiss notification"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </span>
      </Link>
    </div>
  );
}