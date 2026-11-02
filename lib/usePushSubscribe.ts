'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function bufToB64(buf: ArrayBuffer | null): string {
  if (!buf) return '';
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function usePushSubscribe() {
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!VAPID_PUBLIC_KEY || typeof window === 'undefined') return;

    const register = async () => {
      try {
        // Check auth via session
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Only prompt once - respect prior dismissal
        if (localStorage.getItem('ail_notif_prompt_dismissed') && Notification.permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;

        // Already subscribed?
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub && Notification.permission === 'granted') {
          setSubscribed(true);
          // Re-sync to backend in case row was pruned
          await syncSubscription(existingSub, session.access_token);
          return;
        }

        if (Notification.permission !== 'granted') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            localStorage.setItem('ail_notif_prompt_dismissed', '1');
            return;
          }
        }

        const subscription =
          existingSub ||
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          }));

        await syncSubscription(subscription, session.access_token);
        setSubscribed(true);
      } catch (err) {
        console.error('[Push] Subscription failed:', err);
      }
    };

    register();
  }, []);

  return { subscribed };
}

async function syncSubscription(subscription: PushSubscription, accessToken: string) {
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      p256dh: bufToB64(subscription.getKey('p256dh')),
      auth: bufToB64(subscription.getKey('auth')),
    }),
  });
  if (!res.ok) {
    console.error('[Push] Backend save failed:', await res.text());
  }
}