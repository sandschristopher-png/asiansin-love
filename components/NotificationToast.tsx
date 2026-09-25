'use client';

import React, { useState, useEffect } from 'react';
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

export function NotificationToast() {
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [activeToast, setActiveToast] = useState<ToastPayload | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Check if permission prompt is needed
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const dismissed = localStorage.getItem('ail_notif_prompt_dismissed');
      if (Notification.permission === 'default' && !dismissed) {
        const timer = setTimeout(() => setShowPermissionPrompt(true), 2500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Demo listener: simulate a welcome incoming message 8s after load to demonstrate the chime & toast
  useEffect(() => {
    const hasSimulated = sessionStorage.getItem('ail_simulated_arrival');
    if (!hasSimulated) {
      const demoTimer = setTimeout(() => {
        dispatchToast({
          id: 'toast-1',
          title: 'Camille sent a message',
          description: '"Good morning! Thank you for the warm message..."',
          linkUrl: '/chat/demo-1',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
          icon: '💬',
        });
        sessionStorage.setItem('ail_simulated_arrival', 'true');
      }, 7000);
      return () => clearTimeout(demoTimer);
    }
  }, []);

  const dispatchToast = (toast: ToastPayload) => {
    notificationService.playChime();
    notificationService.triggerSystemNotification(toast.title, toast.description);
    setIsExiting(false);
    setActiveToast(toast);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissToast();
    }, 5500);
  };

  const dismissToast = () => {
    setIsExiting(true);
    setTimeout(() => {
      setActiveToast(null);
      setIsExiting(false);
    }, 300);
  };

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
      {/* 1. Global Subtle Permission Prompt Bar */}
      {showPermissionPrompt && (
        <aside
          aria-label="Notification permissions"
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-md p-4 rounded-2xl bg-[#241E2F] border border-[#725A7A]/40 shadow-2xl shadow-black/80 flex items-center gap-3.5 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="h-10 w-10 rounded-full bg-[#17131F] border border-[#725A7A]/35 flex items-center justify-center text-xl shrink-0">
            🔔
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white">Enable Notifications</h2>
            <p className="text-[11px] text-[#DDD8D4] leading-snug mt-0.5">
              Get instant sound alerts when genuine matches message or verify.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleEnablePermissions}
              className="px-3 py-1.5 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] text-white text-xs font-bold shadow-md transition-all active:scale-[0.98]"
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

      {/* 2. Floating In-App Toast (Lower-Right Slide Up Animation) */}
      {activeToast && (
        <aside
          aria-label="Incoming notification alert"
          className={`fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 z-50 max-w-sm rounded-2xl bg-[#241E2F] border border-[#725A7A]/50 shadow-2xl p-3.5 transition-all duration-300 ${
            isExiting
              ? 'opacity-0 translate-y-4 scale-95'
              : 'opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-bottom-5 duration-300'
          }`}
        >
          <Link
            href={activeToast.linkUrl}
            onClick={dismissToast}
            className="flex items-start gap-3 group"
          >
            {activeToast.avatarUrl ? (
              <div className="relative h-11 w-11 rounded-full overflow-hidden bg-[#17131F] border border-[#725A7A]/40 shrink-0">
                <img
                  src={activeToast.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-11 w-11 rounded-full bg-[#17131F] border border-[#725A7A]/40 flex items-center justify-center text-lg shrink-0">
                {activeToast.icon || '🔔'}
              </div>
            )}

            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#E6D7FA] transition-colors truncate">
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
