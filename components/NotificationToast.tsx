'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { notificationService } from '@/lib/notificationService';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Bell, X } from 'lucide-react';

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
  const pathname = usePathname();
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
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (pathname !== '/discover') return;
    if (localStorage.getItem('ail_notif_prompt_dismissed')) return;
    if (Notification.permission !== 'default') return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (cancelled || !user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled || !profile?.onboarding_completed) return;
      timer = setTimeout(() => setShowPermissionPrompt(true), 2500);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

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
        <div
          aria-label="Notification permissions"
          className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
        >
          <div className="pointer-events-auto w-full max-w-[300px] rounded-[28px] bg-[#F8F7FA] border border-[#9A8CC3]/25 shadow-2xl shadow-black/20 p-5 flex flex-col items-center text-center animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300">
            <div className="h-12 w-12 rounded-full bg-[#F3EFFC] flex items-center justify-center mb-3">
              <Bell className="h-5 w-5 text-[#6555B8]" />
            </div>
            <h2 className="text-sm font-bold text-[#1C1924]">Enable Notifications</h2>
            <p className="text-[11px] text-[#6C637B] leading-snug mt-1">
              Get instant sound alerts when genuine matches message or verify.
            </p>
            <div className="w-full flex flex-col gap-2 mt-4">
              <button
                type="button"
                onClick={handleEnablePermissions}
                className="w-full py-2.5 rounded-full bg-[#6555B8] hover:bg-[#52449e] text-white text-xs font-semibold shadow-md transition-all active:scale-[0.97]"
              >
                Allow
              </button>
              <button
                type="button"
                onClick={handleDismissPermission}
                className="w-full py-2 text-xs font-semibold text-[#6C637B] hover:text-[#1C1924] transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}

      {activeToast && (
        <div
          aria-label="Incoming notification alert"
          className={
            'fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none ' +
            (isExiting ? 'transition-opacity duration-300 opacity-0' : '')
          }
        >
          <div
            className={
              'pointer-events-auto w-full max-w-[300px] rounded-3xl bg-[#1E1A2E]/95 backdrop-blur-md border border-[#9A8CC3]/40 shadow-2xl shadow-black/30 p-3.5 ' +
              (isExiting
                ? 'opacity-0 scale-95'
                : 'opacity-100 scale-100 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300')
            }
          >
            <Link
              href={activeToast.linkUrl}
              onClick={dismissToast}
              className="flex items-center gap-3 group"
            >
              {activeToast.avatarUrl ? (
                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-[#2D2F4C] border border-[#9A8CC3]/40 shrink-0">
                  <img
                    src={activeToast.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-[#2D2F4C] border border-[#9A8CC3]/40 flex items-center justify-center shrink-0">
                  <Bell className="h-5 w-5 text-[#9A8CC3]" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-white group-hover:text-[#B2A4D7] transition-colors truncate">
                    {activeToast.title}
                  </h3>
                  <span className="text-[10px] text-[#978FA8] shrink-0">now</span>
                </div>
                <p className="text-[11px] text-[#DDD8D4] truncate mt-0.5">
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
                className="text-[#978FA8] hover:text-white p-1 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export default NotificationToast;