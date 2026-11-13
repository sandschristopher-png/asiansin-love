import webpush from 'web-push';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@meetin.asia';

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

export type PushType = 'spark' | 'match' | 'message' | 'visit' | 'announcement' | 'admin';

/** Every push shows the brand as its title; the body carries the event. */
export const PUSH_TITLE = 'Meet in Asia';

/**
 * Per-type opt-outs. A member is opted out of a type when any of these is false:
 *   - profiles.notification_prefs[`push_<key>`]  (push_messages, push_sparks, push_matches, push_visits,
 *     push_announcements, push_admin) - push-only switches, stored in the existing JSON map
 *   - profiles.notification_prefs[<key>]           (the older all-channel switch)
 *   - profiles.notify_messages / notify_sparks     (the Settings page columns)
 */
const PREF_KEY: Record<PushType, string> = {
  spark: 'sparks',
  match: 'matches',
  visit: 'visits',
  message: 'messages',
  announcement: 'announcements',
  admin: 'admin',
};

const DEFAULT_BODY: Record<PushType, string> = {
  spark: 'Someone sparked your profile.',
  match: 'You sparked each other. Say hi.',
  message: 'You have a new message.',
  visit: 'Someone viewed your profile.',
  announcement: 'There is a new announcement.',
  admin: 'A new item is waiting for review.',
};

type PrefRow = { id?: string; notification_prefs?: unknown; notify_messages?: boolean | null; notify_sparks?: boolean | null };

export function pushAllowed(profile: PrefRow | null | undefined, type: PushType): boolean {
  if (!profile) return true;
  if (type === 'message' && profile.notify_messages === false) return false;
  if ((type === 'spark' || type === 'match') && profile.notify_sparks === false) return false;
  const prefs = (profile.notification_prefs && typeof profile.notification_prefs === 'object'
    ? profile.notification_prefs
    : {}) as Record<string, unknown>;
  const key = PREF_KEY[type];
  return prefs[key] !== false && prefs[`push_${key}`] !== false;
}

function serviceClient(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Absolute URL for an icon: storage URLs already are; app paths get the site origin. */
function absolute(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//.test(url)) return url;
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://meetin.asia';
  return site.replace(/\/+$/, '') + (url.startsWith('/') ? url : '/' + url);
}

function defaultUrl(type: PushType, conversationId?: string): string {
  if (type === 'message') return conversationId ? `/chat/${conversationId}` : '/messages';
  if (type === 'match' || type === 'spark' || type === 'visit') return '/favorites';
  if (type === 'announcement') return '/announcements';
  return '/admin/notifications';
}

type Sub = { id: string; endpoint: string; p256dh: string; auth: string };

/** Sends one payload to many subscriptions; prunes endpoints the push service reports gone (404 / 410). */
async function deliver(admin: SupabaseClient, subs: Sub[], payload: string, urgency: 'high' | 'normal'): Promise<void> {
  const dead: string[] = [];
  // Small batches keep a broadcast from opening thousands of sockets at once.
  for (let i = 0; i < subs.length; i += 50) {
    await Promise.all(
      subs.slice(i, i + 50).map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
            // TTL: an alert older than an hour is noise, so the push service may drop it.
            { urgency, TTL: 3600 }
          );
        } catch (err: any) {
          const status = err?.statusCode;
          if (status === 404 || status === 410) dead.push(sub.id);
          else console.error('[Push] Send failed:', status, err?.body || err?.message);
        }
      })
    );
  }
  if (dead.length > 0) {
    await admin.from('push_subscriptions').delete().in('id', dead);
    console.log(`[Push] Pruned ${dead.length} dead subscription(s)`);
  }
}

interface SendOpts {
  userId: string;
  type: PushType;
  /** Message pushes deep-link to /chat/<conversationId> (the other member's id). */
  conversationId?: string;
  /** Actor whose photo becomes the notification icon / image. */
  actorId?: string | null;
  body?: string;
  url?: string;
  tag?: string;
}

/**
 * Sends a web push to every device the user has subscribed, unless they opted out of the type.
 * Payload: { title: 'Meet in Asia', body, icon / image (actor photo), url, type, tag } (read by public/sw.js).
 */
export async function sendPushToUser({ userId, type, conversationId, actorId, body, url, tag }: SendOpts): Promise<void> {
  if (!ensureConfigured()) return;
  const admin = serviceClient();

  const [{ data: profile }, { data: subs, error }, actorRes] = await Promise.all([
    admin.from('profiles').select('notification_prefs, notify_messages, notify_sparks').eq('id', userId).maybeSingle(),
    admin.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', userId),
    actorId
      ? admin.from('profiles').select('username, avatar_url').eq('id', actorId).maybeSingle()
      : Promise.resolve({ data: null as { username?: string | null; avatar_url?: string | null } | null }),
  ]);
  if (!pushAllowed(profile as PrefRow | null, type)) return;
  if (error) {
    console.error('[Push] Failed to load subscriptions:', error.message);
    return;
  }
  if (!subs || subs.length === 0) return;

  const photo = absolute(actorRes.data?.avatar_url);
  const payload = JSON.stringify({
    title: PUSH_TITLE,
    body: body || DEFAULT_BODY[type],
    icon: photo,
    image: photo,
    url: url || defaultUrl(type, conversationId),
    type,
    tag: tag || (type === 'message' && conversationId ? `message:${conversationId}` : type),
  });
  // Messages, matches and staff alerts: high urgency, delivered at once instead of batched for battery.
  await deliver(admin, subs as Sub[], payload, type === 'spark' || type === 'visit' || type === 'announcement' ? 'normal' : 'high');
}

/**
 * Announcement broadcast: one push to every subscribed device whose owner has not opted out of
 * announcements. Reads subscriptions in pages so a large member base never loads at once.
 */
export async function broadcastPush({ body, url = '/announcements', tag = 'announcement' }: { body: string; url?: string; tag?: string }): Promise<void> {
  if (!ensureConfigured()) return;
  const admin = serviceClient();
  const payload = JSON.stringify({ title: PUSH_TITLE, body, icon: absolute('/icon-192.png'), url, type: 'announcement', tag });
  const PAGE = 500;
  for (let from = 0; ; from += PAGE) {
    const { data: subs, error } = await admin
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .order('id')
      .range(from, from + PAGE - 1);
    if (error) {
      console.error('[Push] broadcast load failed:', error.message);
      return;
    }
    if (!subs || subs.length === 0) return;
    const userIds = [...new Set(subs.map((s) => s.user_id as string))];
    const { data: prefs } = await admin.from('profiles').select('id, notification_prefs, notify_messages, notify_sparks').in('id', userIds);
    const optedOut = new Set((prefs ?? []).filter((p) => !pushAllowed(p as PrefRow, 'announcement')).map((p) => p.id as string));
    await deliver(admin, subs.filter((s) => !optedOut.has(s.user_id as string)) as Sub[], payload, 'normal');
    if (subs.length < PAGE) return;
  }
}
