'use client';

import { useEffect } from 'react';
import { registerServiceWorker, syncPushSubscription } from '@/lib/push';

/**
 * Registers public/sw.js (offline cache + push / notificationclick handlers) and, when the
 * member already granted notifications, keeps their push subscription saved. Never prompts:
 * permission is requested from a tap (Settings > Push on this device), which iOS requires.
 */
export default function PwaRegister() {
  useEffect(() => {
    registerServiceWorker().then(() => syncPushSubscription());
  }, []);

  return null;
}
