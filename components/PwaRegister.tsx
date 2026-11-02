'use client';

import { useEffect } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush(registration: ServiceWorkerRegistration) {
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  const res = await fetch('/api/push/public-key');
  if (!res.ok) return null;
  const { publicKey } = await res.json();
  if (!publicKey) return null;

  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  const json = sub.toJSON();
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: json.endpoint,
      p256dh: (json.keys as Record<string, string>)?.p256dh,
      auth: (json.keys as Record<string, string>)?.auth,
    }),
  });

  return sub;
}

export default function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (!('Notification' in window)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        // Already granted: just make sure the subscription is synced
        if (Notification.permission === 'granted') {
          if (registration.pushManager) await subscribeToPush(registration);
          return;
        }

        // Denied: nothing we can do
        if (Notification.permission === 'denied') return;

        // Default: ask once, only on discover, only for signed-in users
        if (window.location.pathname !== '/discover') return;
        if (localStorage.getItem('ail_notif_prompt_dismissed') === '1') return;

        const permission = await Notification.requestPermission();
        if (permission === 'granted' && registration.pushManager) {
          await subscribeToPush(registration);
        } else {
          localStorage.setItem('ail_notif_prompt_dismissed', '1');
        }
      } catch (err) {
        console.warn('[pwa] register failed:', err);
      }
    };

    register();
  }, []);

  return null;
}