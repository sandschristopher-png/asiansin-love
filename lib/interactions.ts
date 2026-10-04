import { SupabaseClient } from '@supabase/supabase-js';

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
          .match({ user_id: user.id, favorite_profile_id: targetId });
      } else {
        // Add favorite
        const { error: favError } = await supabase
          .from('favorites')
          .upsert({
            user_id: user.id,
            favorite_profile_id: targetId,
          }, { onConflict: 'user_id,favorite_profile_id' });

        if (!favError) {
          // Check for reciprocal like (Mutual Match)
          try {
            const { data: reciprocal } = await supabase
              .from('favorites')
              .select('id')
              .eq('user_id', targetId)
              .eq('favorite_profile_id', user.id)
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

              // Notify both users of the mutual match
              await supabase.from('notifications').insert([
                {
                  user_id: targetId,
                  type: 'match',
                  title: "It's a Match!",
                  description: "You both liked each other! Start a conversation now.",
                  is_read: false,
                },
                {
                  user_id: user.id,
                  type: 'match',
                  title: "It's a Match!",
                  description: "You have a new mutual match!",
                  is_read: false,
                }
              ]);
            } else {
              // Standard single like notification
              await supabase.from('notifications').insert({
                user_id: targetId,
                type: 'favorite',
                title: action === 'star' ? 'Super Liked!' : 'New Favorite',
                description: action === 'star' 
                  ? 'Someone starred your profile as a priority match.' 
                  : 'Someone added your profile to their favorites.',
                is_read: false,
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
