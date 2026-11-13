'use client';

import { supabase } from '@/lib/supabase/client';

/**
 * One cached copy of the signed-in member's header profile (name, avatar, Plus, staff role),
 * shared by components/Navbar and components/HeaderActions so the header never flickers:
 *   - in memory: a header that remounts (route change, Settings' own header) renders instantly;
 *   - sessionStorage: a full reload paints the last known avatar before the network answers;
 *   - one in-flight request: both components share a single profiles query.
 */
export const HEADER_PROFILE_COLUMNS =
  'id, username, avatar_url, is_plus, is_premium, subscription_status, current_period_end, plus_expires_at, admin_role, role, is_admin';

export type HeaderProfile = Record<string, any> & { id: string };

const STORAGE_KEY = 'mia_header_profile';
const COUNT_KEY = 'mia_header_unread';
let cached: HeaderProfile | null = null;
let inflight: { id: string; promise: Promise<HeaderProfile | null> } | null = null;
let unread: number | null = null;

/** Last known profile for this member (memory first, then sessionStorage). Client only. */
export function cachedHeaderProfile(userId?: string | null): HeaderProfile | null {
  if (!cached && typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) cached = JSON.parse(raw);
    } catch {
      // storage unavailable: the network fetch fills it
    }
  }
  if (!cached || (userId && cached.id !== userId)) return null;
  return cached;
}

/** Fresh profile from the database (deduplicated); updates the cache. */
export function loadHeaderProfile(userId: string): Promise<HeaderProfile | null> {
  if (inflight?.id === userId) return inflight.promise;
  const promise = (async () => {
    const { data } = await supabase.from('profiles').select(HEADER_PROFILE_COLUMNS).eq('id', userId).maybeSingle();
    if (data) {
      cached = data as HeaderProfile;
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {}
    }
    return (data as HeaderProfile | null) ?? null;
  })().finally(() => {
    if (inflight?.promise === promise) inflight = null;
  });
  inflight = { id: userId, promise };
  return promise;
}

export function clearHeaderProfile() {
  cached = null;
  unread = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(COUNT_KEY);
  } catch {}
}

/** Last known unread count for the bell chip, so a remounted bell does not pop in from zero. */
export function cachedUnread(): number {
  if (unread === null && typeof window !== 'undefined') {
    try {
      unread = Number(sessionStorage.getItem(COUNT_KEY)) || 0;
    } catch {
      unread = 0;
    }
  }
  return unread ?? 0;
}
export function setCachedUnread(n: number) {
  unread = n;
  try {
    sessionStorage.setItem(COUNT_KEY, String(n));
  } catch {}
}
