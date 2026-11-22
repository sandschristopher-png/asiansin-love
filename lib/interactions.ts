import { SupabaseClient } from '@supabase/supabase-js';

import { notifyUser, notifyMatchPair } from '@/lib/notify';

export type ActionType = 'pass' | 'star' | 'like';

const STORAGE_KEY_LIKES = 'ail_liked_ids';
const STORAGE_KEY_STARS = 'ail_starred_ids';
const STORAGE_KEY_PASSES = 'ail_passed_ids';

function getStoredIds(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredIds(key: string, ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch (err) {
    console.error('Failed to persist interaction locally', err);
  }
}

export function getLocalCardActions(): Record<string, ActionType> {
  const likes = getStoredIds(STORAGE_KEY_LIKES);
  const stars = getStoredIds(STORAGE_KEY_STARS);
  const passes = getStoredIds(STORAGE_KEY_PASSES);

  const actions: Record<string, ActionType> = {};
  passes.forEach((id) => { actions[id] = 'pass'; });
  likes.forEach((id) => { actions[id] = 'like'; });
  stars.forEach((id) => { actions[id] = 'star'; });
  return actions;
}

const SPARK_OVERRIDES_KEY = 'ail_spark_overrides';
/** A confirmed Spark change outranks a cached Discover feed for this long; after that the server feed decides. */
const SPARK_OVERRIDE_TTL_MS = 30 * 60 * 1000;

/**
 * The profile page's Spark button calls this once the server has confirmed a change, so /discover,
 * which may repaint from a cached feed on the way back, shows the same heart. Keeps the local "liked"
 * list and a short-lived per-member override (read by withSparkOverrides).
 */
export function recordSparkState(targetId: string, sparked: boolean): void {
  if (typeof window === 'undefined') return;
  const likes = getStoredIds(STORAGE_KEY_LIKES).filter((id) => id !== targetId);
  setStoredIds(STORAGE_KEY_LIKES, sparked ? [...likes, targetId] : likes);
  try {
    const raw = JSON.parse(sessionStorage.getItem(SPARK_OVERRIDES_KEY) || '{}') as Record<string, { sparked: boolean; at: number }>;
    raw[targetId] = { sparked, at: Date.now() };
    sessionStorage.setItem(SPARK_OVERRIDES_KEY, JSON.stringify(raw));
  } catch {
    // sessionStorage unavailable: the next server feed carries the truth
  }
}

/** A feed with the member's recent confirmed Spark changes applied (a cached feed can predate them). */
export function withSparkOverrides<T extends { id: string; hasSparked?: boolean }>(feed: T[]): T[] {
  if (typeof window === 'undefined' || feed.length === 0) return feed;
  let overrides: Record<string, { sparked: boolean; at: number }>;
  try {
    overrides = JSON.parse(sessionStorage.getItem(SPARK_OVERRIDES_KEY) || '{}');
  } catch {
    return feed;
  }
  const now = Date.now();
  return feed.map((p) => {
    const o = overrides[p.id];
    return o && now - o.at < SPARK_OVERRIDE_TTL_MS && Boolean(p.hasSparked) !== o.sparked ? { ...p, hasSparked: o.sparked } : p;
  });
}

export async function persistCardAction(
  supabase: SupabaseClient,
  targetId: string,
  action: ActionType,
  currentActive: boolean
): Promise<void> {
  // Update local storage first
  const key =
    action === 'like'
      ? STORAGE_KEY_LIKES
      : action === 'star'
      ? STORAGE_KEY_STARS
      : STORAGE_KEY_PASSES;

  const currentIds = getStoredIds(key);
  const updatedIds = currentActive
    ? currentIds.filter((id) => id !== targetId)
    : [...currentIds.filter((id) => id !== targetId), targetId];

  setStoredIds(key, updatedIds);

  // Bust the Sparks fast-cache so tab counts refetch fresh after any spark change
  try { sessionStorage.removeItem('ail_sparks_fast_cache_v2'); } catch {}

  // Dispatch custom sync event for UI components listening
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ail-interaction-sync', {
        detail: { targetId, action, active: !currentActive },
      })
    );
  }

  // Check if user is authenticated with Supabase
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Guest/demo session, local persistence only

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
    if (!isUuid) return; // Demo dummy profile, skip database call

    if (action === 'like' || action === 'star') {
      if (currentActive) {
        // Remove favorite
        await supabase
          .from('favorites')
          .delete()
          .match({ user_id: user.id, favorite_id: targetId });
      } else {
        // Add favorite
        const { error: favError } = await supabase
          .from('favorites')
          .upsert({
            user_id: user.id,
            favorite_id: targetId,
          }, { onConflict: 'user_id,favorite_id' });

        if (!favError) {
          // Check for reciprocal like (Mutual Match)
          try {
            const { data: reciprocal } = await supabase
              .from('favorites')
              .select('id')
              .eq('user_id', targetId)
              .eq('favorite_id', user.id)
              .maybeSingle();

            const isMutual = Boolean(reciprocal);

            if (isMutual) {
              // Dispatch mutual match event for client UI
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('ail-mutual-match', {
                    detail: { targetId, currentUserId: user.id },
                  })
                );
              }

              // Notify both users of the mutual match (respects prefs)
              await notifyMatchPair(supabase, user.id, targetId, action);
            } else {
              // Standard single like notification (respects prefs, carries actor)
              await notifyUser(supabase, targetId, {
                actorId: user.id,
                type: 'favorite',
                title: action === 'star' ? 'Super Spark!' : 'New Spark!',
                description: action === 'star'
                  ? 'Someone starred your profile as a priority match.'
                  : 'Someone sparked your profile.',
              });
            }
          } catch (notifErr) {
            console.warn('Match/notification check failed:', notifErr);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error persisting interaction to Supabase:', err);
  }
}
