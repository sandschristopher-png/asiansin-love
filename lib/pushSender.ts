import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@asiansin.love';

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.warn('[Push] VAPID keys missing - push disabled');
    return false;
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  configured = true;
  return true;
}

export type PushType = 'spark' | 'match' | 'message' | 'visit';

const PREF_KEY: Partial<Record<PushType, string>> = {
  spark: 'sparks',
  match: 'matches',
  visit: 'visits',
  message: 'messages',
};

const TITLE: Record<PushType, string> = {
  spark: 'New Spark',
  match: "It's a Match!",
  message: 'New Message',
  visit: 'New Profile Visit',
};

interface SendOpts {
  userId: string;
  type: PushType;
  conversationId?: string;
}

/**
 * Sends a web push to every device the user has subscribed.
 * Respects profiles.notification_prefs the same way notifyUser() does.
 * Prunes subscriptions that the push service reports as gone (404/410).
 */
export async function sendPushToUser({ userId, type, conversationId }: SendOpts): Promise<void> {
  if (!ensureConfigured()) return;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // Respect recipient's notification preferences: the Settings page toggles
  // (notify_messages / notify_sparks) and the per-type notification_prefs map.
  const prefKey = PREF_KEY[type];
  {
    const { data: profile } = await admin
      .from('profiles')
      .select('notification_prefs, notify_messages, notify_sparks')
      .eq('id', userId)
      .maybeSingle();
    if (type === 'message' && profile?.notify_messages === false) return;
    if ((type === 'spark' || type === 'match') && profile?.notify_sparks === false) return;
    const prefs = profile?.notification_prefs as Record<string, boolean> | null;
    if (prefKey && prefs && prefs[prefKey] === false) return;
  }

  const { data: subs, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error) {
    console.error('[Push] Failed to load subscriptions:', error.message);
    return;
  }
  if (!subs || subs.length === 0) return;

  const payload = JSON.stringify({
    title: TITLE[type],
    body: type === 'match'
      ? 'You sparked each other. Say hi.'
      : type === 'message'
        ? 'You have a new message.'
        : type === 'spark'
          ? 'Someone sparked your profile.'
          : 'Someone viewed your profile.',
    url: type === 'message' && conversationId
      ? `/chat/${conversationId}`
      : type === 'match' || type === 'spark'
        ? '/favorites'
        : '/discover',
    type,
    tag: type === 'message' && conversationId ? `message:${conversationId}` : type,
  });

  const dead: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          // Messages and matches: high urgency, so the browser's push service (Google's for Chrome,
          // Apple's for Safari)
          // delivers at once instead of batching for battery. Sparks / visits can wait. TTL: a
          // stale alert after an hour is noise, so the service may drop it.
          { urgency: type === 'message' || type === 'match' ? 'high' : 'normal', TTL: 3600 }
        );
      } catch (err: any) {
        const status = err?.statusCode;
        if (status === 404 || status === 410) {
          dead.push(sub.id);
        } else {
          console.error('[Push] Send failed:', status, err?.body || err?.message);
        }
      }
    })
  );

  if (dead.length > 0) {
    await admin.from('push_subscriptions').delete().in('id', dead);
    console.log(`[Push] Pruned ${dead.length} dead subscription(s)`);
  }
}