'use client';

import { useSyncExternalStore } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

/**
 * App-wide Supabase Realtime Presence: one channel per tab. Members who allow
 * "Show active status" track themselves; everyone listens. Exposes the set of user ids that
 * are connected right now (more precise than the last_active heartbeat).
 */
const CHANNEL = 'presence:online';
const EMPTY: ReadonlySet<string> = new Set();

let channel: RealtimeChannel | null = null;
let present: ReadonlySet<string> = EMPTY;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function joinPresence(userId: string, { track }: { track: boolean }) {
  if (channel) return;
  const ch = supabase.channel(CHANNEL, { config: { presence: { key: userId } } });
  channel = ch;
  ch.on('presence', { event: 'sync' }, () => {
    present = new Set(Object.keys(ch.presenceState()));
    emit();
  }).subscribe(async (status) => {
    if (status === 'SUBSCRIBED' && track) {
      await ch.track({ at: Date.now() }).catch(() => {});
    }
  });
}

export function leavePresence() {
  if (!channel) return;
  supabase.removeChannel(channel);
  channel = null;
  present = EMPTY;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Ids of members connected right now (empty until the channel syncs or when signed out). */
export function usePresentUserIds(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, () => present, () => EMPTY);
}
