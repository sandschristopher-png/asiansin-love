'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { notificationService } from '@/lib/notificationService';

export interface ToastPayload {
  id: string;
  title: string;
  description: string;
  linkUrl: string;
  avatarUrl?: string;
  icon?: string;
}

export function emitNotificationToast(payload: ToastPayload) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ToastPayload>('ail-toast', { detail: payload }));
}

export function NotificationToast() {
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [activeToast, setActiveToast] = useState<ToastPayload | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const autoDismissRef = useRef<NodeJS.Timeout | null>(null);

  const dismissToast = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setActiveToast(null);
      setIsExiting(false);
    }, 300);
  }, []);

  const dispatchToast = useCallback((toast: ToastPayload) => {
    notificationService.playChime();
    notificationService.triggerSystemNotification(toast.title, toast.description);
    setIsExiting(false);
    setActiveToast(toast);

    if (autoDismissRef.current) {
      clearTimeout(autoDismissRef.current);
    }
    autoDismissRef.current = setTimeout(() => {
      dismissToast();
    }, 5500);
  }, [dismissToast]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const dismissed = localStorage.getItem('ail_notif_prompt_dismissed');
      if (Notification.permission === 'default' && !dismissed) {
        const timer = setTimeout(() => setShowPermissionPrompt(true), 2500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastPayload>;
      if (customEvent.detail) {
        dispatchToast(customEvent.detail);
      }
    };

    window.addEventListener('ail-toast', handleToastEvent);
    return () => {
      window.removeEventListener('ail-toast', handleToastEvent);
      if (autoDismissRef.current) {
        clearTimeout(autoDismissRef.current);
      }
    };
  }, [dispatchToast]);

  const handleEnablePermissions = async () => {
    const res = await notificationService.requestPermission();
    setShowPermissionPrompt(false);
    if (res === 'granted') {
      notificationService.playChime();
    }
  };

  const handleDismissPermission = () => {
    localStorage.setItem('ail_notif_prompt_dismissed', 'true');
    setShowPermissionPrompt(false);
  };

  return (
    <>
      {showPermissionPrompt && (
        <aside
          aria-label="Notification permissions"
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-md p-4 rounded-2xl bg-[#2D2F4C] border border-[#9A8CC3]/40 shadow-2xl shadow-black/80 flex items-center gap-3.5 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="h-10 w-10 rounded-full bg-[#2D2F4C] border border-[#9A8CC3]/35 flex items-center justify-center text-xl shrink-0">
            🔔
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs sm:text-sm font-medium text-white">Enable Notifications</h2>
            <p className="text-[11px] text-[#DDD8D4] leading-snug mt-0.5">
              Get instant sound alerts when genuine matches message or verify.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleEnablePermissions}
              className="px-3 py-1.5 rounded-xl bg-[#6555B8] hover:bg-[#7D4B9F] text-white text-xs font-medium shadow-md transition-all active:scale-[0.98]"
            >
              Allow
            </button>
            <button
              type="button"
              onClick={handleDismissPermission}
              aria-label="Dismiss notification prompt"
              className="px-2 py-1 text-xs text-[#978FA8] hover:text-white"
            >
              ✕
            </button>
          </div>
        </aside>
      )}

      {activeToast && (
        <aside
          aria-label="Incoming notification alert"
          className={
            'fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 z-50 max-w-sm rounded-2xl bg-[#2D2F4C] border border-[#9A8CC3]/50 shadow-2xl p-3.5 transition-all duration-300 ' +
            (isExiting
              ? 'opacity-0 translate-y-4 scale-95'
              : 'opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-bottom-5 duration-300')
          }
        >
          <Link
            href={activeToast.linkUrl}
            onClick={dismissToast}
            className="flex items-start gap-3 group"
          >
            {activeToast.avatarUrl ? (
              <div className="relative h-11 w-11 rounded-full overflow-hidden bg-[#2D2F4C] border border-[#9A8CC3]/40 shrink-0">
                <img
                  src={activeToast.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-11 w-11 rounded-full bg-[#2D2F4C] border border-[#9A8CC3]/40 flex items-center justify-center text-lg shrink-0">
                {activeToast.icon || '🔔'}
              </div>
            )}

            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-medium text-white group-hover:text-[#B2A4D7] transition-colors truncate">
                  {activeToast.title}
                </h3>
                <span className="text-[10px] text-[#978FA8]">Just now</span>
              </div>
              <p className="text-xs text-[#DDD8D4] truncate mt-0.5">
                {activeToast.description}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dismissToast();
              }}
              aria-label="Dismiss notification"
              className="text-xs text-[#978FA8] hover:text-white p-1"
            >
              ✕
            </button>
          </Link>
        </aside>
      )}
    </>
  );
}

export default NotificationToast;
