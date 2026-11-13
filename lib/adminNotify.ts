import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ADMIN_TYPE_PREFIX, adminRoleOf, isStaff } from '@/lib/adminRoles';
export { ADMIN_TYPE_LIKE, ADMIN_TYPE_PREFIX } from '@/lib/adminRoles';
import { sendPushToUser } from '@/lib/pushSender';

/**
 * Staff alerts.
 *
 * Storage choice: admin alerts are ordinary rows in `notifications` with a `type` starting
 * `admin_` (no new table). Each admin gets their own row, so "unread for me" is a plain indexed
 * read: supabase/migrations/20261121_admin_notifications.sql adds a partial index on
 * (user_id, created_at desc) WHERE is_read = false AND type LIKE 'admin\_%'.
 * payload.ref identifies the queue item (member id or report id): marking an alert handled marks
 * every admin's copy for the same ref, so a second moderator does not pick it up again.
 * Member-facing lists (Announcements, the account dropdown) exclude admin_ types.
 */
export type AdminAlertKind = 'verification' | 'photo' | 'report' | 'moderation' | 'appeal' | 'review';


/** Where each alert opens inside the admin console. */
export const ADMIN_QUEUE_HREF: Record<AdminAlertKind, string> = {
  verification: '/admin/verifications',
  photo: '/admin/photos',
  report: '/admin/reports',
  moderation: '/admin/moderation',
  appeal: '/admin/reports',
  review: '/admin',
};

function service(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Ids of every active staff member (moderator / super_admin, per lib/adminRoles adminRoleOf). */
export async function staffIds(db: SupabaseClient = service()): Promise<string[]> {
  // '*': is_banned is optional across environments (as in lib/adminAuth.ts).
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .or('admin_role.in.(moderator,super_admin),role.eq.admin,is_admin.eq.true');
  if (error) {
    console.error('[adminNotify] staff lookup failed:', error.message);
    return [];
  }
  return (data ?? [])
    .filter((p: Record<string, unknown>) => isStaff(adminRoleOf(p)) && p.is_banned !== true)
    .map((p: Record<string, unknown>) => p.id as string);
}

interface AdminAlert {
  kind: AdminAlertKind;
  title: string;
  description?: string;
  /** Queue item id (member id for verifications / photos / moderation, report id for reports). */
  ref: string;
  actorId?: string | null;
}

/**
 * Inserts one notification per admin and sends each a web push. Never throws: a failed alert must
 * not fail the member's request. Call it inside next/server `after()` so the response is not delayed.
 */
export async function notifyAdmins({ kind, title, description, ref, actorId }: AdminAlert): Promise<void> {
  try {
    const db = service();
    const ids = await staffIds(db);
    if (ids.length === 0) return;
    const type = ADMIN_TYPE_PREFIX + kind;
    const link = ADMIN_QUEUE_HREF[kind];

    // One open alert per item: a re-submission refreshes nothing until the earlier one is handled.
    const { data: open } = await db
      .from('notifications')
      .select('id')
      .eq('type', type)
      .eq('is_read', false)
      .eq('payload->>ref', ref)
      .limit(1);
    if (open && open.length > 0) return;

    const { error } = await db.from('notifications').insert(
      ids.map((userId) => ({
        user_id: userId,
        actor_id: actorId ?? null,
        type,
        title,
        description: description ?? null,
        link_url: link,
        payload: { kind, ref },
        is_read: false,
      }))
    );
    if (error) console.error('[adminNotify] insert failed:', error.message);

    await Promise.all(
      ids.map((userId) =>
        sendPushToUser({ userId, type: 'admin', actorId, body: title, url: link, tag: `${type}:${ref}` }).catch(() => {})
      )
    );
  } catch (err) {
    console.error('[adminNotify] failed:', err);
  }
}

/** Pending queue sizes for the Admin Console chip: verifications + photo approvals + open reports. */
export async function pendingQueueCounts(db: SupabaseClient = service()) {
  const [v, p, r] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    db
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .or('photo_review_status.eq.pending,avatar_status.eq.pending_review'),
    db.from('user_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);
  const verifications = v.count ?? 0;
  const photos = p.count ?? 0;
  const reports = r.count ?? 0;
  return { verifications, photos, reports, total: verifications + photos + reports };
}
