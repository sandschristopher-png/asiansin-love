'use client';

import { useEffect } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding: string = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64: string = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData: string = window.atob(base64);
  const outputArray: Uint8Array = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        // Subscribe to push if permission already granted
        if (Notification.permission === 'granted' && registration.pushManager) {
          const existing = await registration.pushManager.getSubscription();
          if (!existing) {
            const res = await fetch('/api/push/public-key');
            if (res.ok) {
              const { publicKey } = await res.json();
              if (publicKey) {
                await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('[pwa] register failed:', err);
      }
    };

    register();
  }, []);

  return null;
}