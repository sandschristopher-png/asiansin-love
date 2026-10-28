import { SupabaseClient } from '@supabase/supabase-js';

export type NotifType = 'favorite' | 'match' | 'visit' | 'message' | 'system';

// Map notification type -> key in profiles.notification_prefs
const PREF_KEY: Partial<Record<NotifType, string>> = {
  favorite: 'sparks',
  match: 'matches',
  visit: 'visits',
  message: 'messages',
};

interface NotifyOptions {
  actorId?: string;
  type: NotifType;
  title: string;
  description: string;
}

/**
 * Central notification insert. Checks the recipient's notification_prefs
 * first and returns early if that type is disabled, then inserts with
 * actor_id so the toast/dropdown can show the actor's name and avatar.
 */
export async function notifyUser(
  supabase: SupabaseClient,
  userId: string,
  opts: NotifyOptions
): Promise<void> {
  try {
    const prefKey = PREF_KEY[opts.type];
    if (prefKey) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_prefs')
        .eq('id', userId)
        .maybeSingle();
      const prefs = profile?.notification_prefs as Record<string, boolean> | null;
      if (prefs && prefs[prefKey] === false) return; // recipient disabled this type
    }

    await supabase.from('notifications').insert({
      user_id: userId,
      actor_id: opts.actorId ?? null,
      type: opts.type,
      title: opts.title,
      description: opts.description,
      is_read: false,
    });
  } catch (err) {
    console.warn('notifyUser failed:', err);
  }
}

/**
 * Visit notification with 24h throttle: max one visit notification
 * per visitor per profile owner per day.
 */
export async function notifyVisit(
  supabase: SupabaseClient,
  profileOwnerId: string,
  viewerId: string
): Promise<void> {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', profileOwnerId)
      .eq('actor_id', viewerId)
      .eq('type', 'visit')
      .gte('created_at', since)
      .maybeSingle();
    if (recent) return; // already notified within 24h

    await notifyUser(supabase, profileOwnerId, {
      actorId: viewerId,
      type: 'visit',
      title: 'New Profile Visit',
      description: 'Someone viewed your profile.',
    });
  } catch (err) {
    console.warn('notifyVisit failed:', err);
  }
}

/** Mutual match: notifies both parties, respecting each one's prefs. */
export async function notifyMatchPair(
  supabase: SupabaseClient,
  userId: string,
  targetId: string,
  action: 'like' | 'star'
): Promise<void> {
  const desc =
    action === 'star'
      ? 'You both super sparked each other! Start a conversation now.'
      : 'You both sparked each other! Start a conversation now.';
  await notifyUser(supabase, targetId, { actorId: userId, type: 'match', title: "It's a Match!", description: desc });
  await notifyUser(supabase, userId, { actorId: targetId, type: 'match', title: "It's a Match!", description: desc });
}