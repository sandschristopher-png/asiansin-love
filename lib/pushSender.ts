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

  // Respect recipient's notification preferences
  const prefKey = PREF_KEY[type];
  if (prefKey) {
    const { data: profile } = await admin
      .from('profiles')
      .select('notification_prefs')
      .eq('id', userId)
      .maybeSingle();
    const prefs = profile?.notification_prefs as Record<string, boolean> | null;
    if (prefs && prefs[prefKey] === false) return;
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
          payload
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