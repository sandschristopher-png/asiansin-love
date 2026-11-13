'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { enablePushNotifications, getPushSupport } from '@/lib/push';
import { PushPermissionCard } from '@/components/PushPermissionCard';

/** Set once the member answered the prompt (Allow or Not now); it is never shown again after that. */
const DISMISSED_KEY = 'mia_notif_prompt_dismissed';
/** One-time reset so members who dismissed an earlier prompt get exactly one new one. */
const RESET_KEY = 'mia_notif_prompt_reset_v1';
const SHOW_DELAY_MS = 2500;

function readFlag(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeFlag(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // storage unavailable: the prompt may show again next visit, which is harmless
  }
}

/**
 * One-time push permission prompt for signed-in members on in-app routes (LayoutShell mounts it
 * outside sign-up / onboarding, so it appears once onboarding is done). Shows the explainer card
 * first; the browser's own dialog only follows a tap on Allow (iOS requires a gesture).
 */
export function PushPromptOnce() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!readFlag(RESET_KEY)) {
      writeFlag(DISMISSED_KEY, null);
      writeFlag(RESET_KEY, '1');
    }
    if (readFlag(DISMISSED_KEY) || getPushSupport() !== 'default') return;
    let timer: number | undefined;
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !session?.user) return;
      timer = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    });
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!open) return null;
  const close = () => {
    writeFlag(DISMISSED_KEY, '1');
    setOpen(false);
  };
  return (
    <PushPermissionCard
      onClose={close}
      onAllow={() => {
        close();
        void enablePushNotifications(); // the browser's own prompt appears here
      }}
    />
  );
}

export default PushPromptOnce;
