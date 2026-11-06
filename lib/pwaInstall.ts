'use client';

/**
 * Custom PWA install (Android Chrome, desktop Chrome / Edge). Chrome fires `beforeinstallprompt`
 * when the site is installable; we keep the event and show our own Install card instead of the
 * mini-infobar. An inline script in app/layout.tsx catches the event before React hydrates
 * (window.__ailInstallEvent), so an early fire is never missed.
 *
 * The hero card is shown once: "Not now", or any answer to the browser dialog, sets
 * ail_install_dismissed. The Settings row stays available while the site is installable.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

declare global {
  interface Window {
    __ailInstallEvent?: BeforeInstallPromptEvent | null;
  }
}

const DISMISS_KEY = 'ail_install_dismissed';
let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
let started = false;
let version = 0;
const listeners = new Set<() => void>();

const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  // iPadOS reports a Mac UA; touch points tell them apart.
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

export function isInstallDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissInstall(): void {
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // private mode: hidden for this visit only
  }
  emit();
}

/** Call once on the client (components/PwaRegister.tsx). */
export function startInstallCapture(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  if (window.__ailInstallEvent) {
    deferred = window.__ailInstallEvent;
    window.__ailInstallEvent = null;
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    dismissInstall();
  });
  emit();
}

/** Opens the browser's install dialog. Any answer counts as "shown once". */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const e = deferred;
  if (!e) return 'unavailable';
  deferred = null;
  await e.prompt();
  const { outcome } = await e.userChoice;
  dismissInstall();
  return outcome;
}

export const subscribeInstall = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** Snapshot for useSyncExternalStore. */
export const installVersion = () => version;

export const canPromptInstall = () => Boolean(deferred) && !installed && !isStandalone();