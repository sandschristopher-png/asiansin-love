'use client';

import { useSyncExternalStore } from 'react';

/**
 * Live unread counts shared by the app-wide RealtimeNotifier (writer) and the BottomNav badges /
 * document title (readers). One realtime channel feeds everything.
 */
export interface NotificationCounts {
  unreadMessages: number;
  unseenSparks: number;
}

let state: NotificationCounts = { unreadMessages: 0, unseenSparks: 0 };
const listeners = new Set<() => void>();
const SERVER_STATE: NotificationCounts = { unreadMessages: 0, unseenSparks: 0 };

export function getNotificationCounts(): NotificationCounts {
  return state;
}

export function setNotificationCounts(patch: Partial<NotificationCounts>) {
  const next = { ...state, ...patch };
  if (next.unreadMessages === state.unreadMessages && next.unseenSparks === state.unseenSparks) return;
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useNotificationCounts(): NotificationCounts {
  return useSyncExternalStore(subscribe, getNotificationCounts, () => SERVER_STATE);
}

// ---- Member alert preferences (this device) -------------------------------------------------
// Browser alerts are a per-device choice, so it lives in localStorage. (No sounds: alerts are
// visual + haptic only.)

const BROWSER_KEY = 'ail_alert_browser';

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === '1';
  } catch {
    return fallback;
  }
}

function writeFlag(key: string, on: boolean) {
  try {
    localStorage.setItem(key, on ? '1' : '0');
  } catch {
    // storage unavailable (private mode): keep the default
  }
}

export const alertPrefs = {
  browserAlertsEnabled: () => readFlag(BROWSER_KEY, true),
  setBrowserAlertsEnabled: (on: boolean) => writeFlag(BROWSER_KEY, on),
};
