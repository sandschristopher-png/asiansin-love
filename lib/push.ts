'use client';

/**
 * Web Push client helpers (single source of truth; the service worker is public/sw.js).
 *   syncPushSubscription()     - silent: re-saves an existing subscription when permission is granted
 *   enablePushNotifications()  - call from a tap: asks permission, subscribes, saves
 * Subscriptions are stored by /api/notifications/subscribe (base64url keys, as web-push expects).
 */

export type PushSupport = 'unsupported' | 'needs-install' | 'default' | 'granted' | 'denied';

const SUBSCRIBE_ROUTE = '/api/notifications/subscribe';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function getPushSupport(): PushSupport {
  if (typeof window === 'undefined') return 'unsupported';
  // iOS only allows web push for apps added to the Home Screen.
  if (isIos() && !isStandalone()) return 'needs-install';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as PushSupport;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    await navigator.serviceWorker.register('/sw.js');
    return await navigator.serviceWorker.ready;
  } catch (err) {
    console.warn('[push] service worker registration failed:', err);
    return null;
  }
}

async function saveSubscription(sub: PushSubscription): Promise<boolean> {
  const json = sub.toJSON();
  const res = await fetch(SUBSCRIBE_ROUTE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth }),
  });
  return res.ok;
}

async function subscribe(reg: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  const res = await fetch('/api/push/public-key');
  if (!res.ok) return null;
  const { publicKey } = await res.json();
  if (!publicKey) return null;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });
}

/** Silent: keeps the server copy of an already-granted subscription fresh. Never prompts. */
export async function syncPushSubscription(): Promise<void> {
  if (getPushSupport() !== 'granted') return;
  const reg = await registerServiceWorker();
  if (!reg) return;
  try {
    const sub = await subscribe(reg);
    if (sub) await saveSubscription(sub);
  } catch (err) {
    console.warn('[push] sync failed:', err);
  }
}

/** Must run from a user gesture (iOS / Safari require it). Returns the resulting state. */
export async function enablePushNotifications(): Promise<PushSupport | 'error'> {
  const support = getPushSupport();
  if (support === 'unsupported' || support === 'needs-install' || support === 'denied') return support;
  const permission = support === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') return permission as PushSupport;
  const reg = await registerServiceWorker();
  if (!reg) return 'error';
  try {
    const sub = await subscribe(reg);
    if (!sub) return 'error';
    return (await saveSubscription(sub)) ? 'granted' : 'error';
  } catch (err) {
    console.warn('[push] enable failed:', err);
    return 'error';
  }
}
