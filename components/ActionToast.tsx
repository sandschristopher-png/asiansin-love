'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Check, Copy, Info, ShieldCheck } from 'lucide-react';

export type ActionToastIcon = 'check' | 'shield' | 'copy' | 'info';

type ShowActionToast = (message: string, icon?: ActionToastIcon) => void;

const ActionToastContext = createContext<ShowActionToast>(() => {});

const ICONS = { check: Check, shield: ShieldCheck, copy: Copy, info: Info } as const;
const VISIBLE_MS = 2000;

/**
 * Soft confirmation capsule (Pairs / with.is pattern) for the member's own actions: link copied,
 * member blocked, report sent, photo deleted, filters reset. Pinned just above the BottomNav,
 * silent, 15 ms haptic, gone after 2 s. Wrap the app once (LayoutShell) and call
 * `useActionToast()(message, icon)` anywhere below it.
 */
export function ActionToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string; icon: ActionToastIcon } | null>(null);
  const timer = useRef<number | null>(null);

  const show = useCallback<ShowActionToast>((message, icon = 'check') => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message, icon });
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([15]);
      } catch {}
    }
    timer.current = window.setTimeout(() => setToast(null), VISIBLE_MS);
  }, []);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    []
  );

  const Icon = toast ? ICONS[toast.icon] : null;
  return (
    <ActionToastContext.Provider value={show}>
      {children}
      {toast && Icon && (
        // Centering on the wrapper keeps the slide-up transform on the capsule from fighting it.
        // bottom-24 clears the floating BottomNav; z sits above modals (z-70 to z-999) so a toast
        // fired as a sheet closes is never hidden.
        <div className="fixed bottom-24 inset-x-0 z-[110] flex justify-center pointer-events-none mb-[env(safe-area-inset-bottom,0px)]">
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className="ail-action-toast-in inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#51376D]/95 text-white text-xs font-medium shadow-xl backdrop-blur-md"
          >
            <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2.25} />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </ActionToastContext.Provider>
  );
}

export function useActionToast(): ShowActionToast {
  return useContext(ActionToastContext);
}
