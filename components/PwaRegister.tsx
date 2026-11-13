'use client';

import { useEffect } from 'react';
import { registerServiceWorker, syncPushSubscription } from '@/lib/push';
import { startInstallCapture } from '@/lib/pwaInstall';
import { supabase } from '@/lib/supabase/client';

/**
 * Registers public/sw.js (offline cache + push / notificationclick handlers) and, when the
 * member already granted notifications, keeps their push subscription saved - on every app open
 * and again right after sign-in, so the subscription belongs to the member who just signed in.
 * Never prompts: the one-time prompt is components/PushPromptOnce, Settings has the device row.
 */
export default function PwaRegister() {
  useEffect(() => {
    startInstallCapture(); // custom Install card (components/InstallAppCard.tsx)
    registerServiceWorker().then(() => syncPushSubscription());
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') void syncPushSubscription();
    });
    return () => subscription.unsubscribe();
  }, []);

  return null;
}
