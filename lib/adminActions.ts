// Server-only moderation actions shared by the Admin Console routes (service-role client).
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminRoleOf, isAccountOwner, type AdminRole } from '@/lib/adminRoles';

/** Columns from 20261112_admin_console.sql: callers get a clear 503 until it has run. */
export const MISSING_ADMIN_COLUMNS_RE = /admin_role|is_banned|banned_at|photo_review_status|resolution|resolved_by|resolved_at|resolution_note/;
export const RUN_MIGRATION_MESSAGE = 'Run supabase/migrations/20261112_admin_console.sql to enable this action.';

/**
 * Who may act on whom: nobody touches the account owner; only the owner acts on another super
 * admin; only a super admin acts on a moderator.
 */
export async function canActOn(
  admin: SupabaseClient,
  actorRole: AdminRole,
  actorId: string,
  targetId: string
): Promise<{ ok: true; target: Record<string, any> } | { ok: false; status: number; error: string }> {
  const { data: target } = await admin.from('profiles').select('*').eq('id', targetId).maybeSingle();
  if (!target) return { ok: false, status: 404, error: 'Member not found.' };
  if (targetId === actorId) return { ok: false, status: 400, error: 'You cannot apply this to your own account.' };
  const targetRole = adminRoleOf(target);
  if (isAccountOwner(targetId)) return { ok: false, status: 403, error: 'The account owner cannot be modified.' };
  if (targetRole === 'super_admin' && !isAccountOwner(actorId)) {
    return { ok: false, status: 403, error: 'Only the account owner can act on a super admin.' };
  }
  if (targetRole === 'moderator' && actorRole !== 'super_admin') {
    return { ok: false, status: 403, error: 'Only a super admin can act on a moderator.' };
  }
  return { ok: true, target };
}

/** Writes one moderation_log row (live columns: see 20261107_launch_patch.sql). Never throws. */
export async function logModeration(
  admin: SupabaseClient,
  row: { userId: string; actorId: string; category: string; action: string; text?: string; points?: number }
) {
  const { error } = await admin.from('moderation_log').insert({
    user_id: row.userId,
    actor_id: row.actorId,
    category: row.category,
    action: row.action,
    flagged_text: (row.text || '').slice(0, 500),
    points_deducted: Math.max(0, row.points ?? 0),
  });
  if (error) console.error('[adminActions] moderation_log insert failed:', error.message);
}

/** Adds `delta` (negative = penalty) to reputation_score, clamped 0..100. Returns the new score. */
export async function adjustReputation(admin: SupabaseClient, userId: string, delta: number): Promise<number | null> {
  const { data } = await admin.from('profiles').select('reputation_score').eq('id', userId).maybeSingle();
  const current = typeof data?.reputation_score === 'number' ? data.reputation_score : 100;
  const next = Math.max(0, Math.min(100, Math.round(current + delta)));
  const { error } = await admin.from('profiles').update({ reputation_score: next }).eq('id', userId);
  if (error) {
    console.error('[adminActions] reputation update failed:', error.message);
    return null;
  }
  return next;
}

/**
 * Bans / unbans a member: profiles.is_banned (+ banned_at) and a Supabase Auth ban, which blocks
 * sign-in and token refresh (existing access tokens lapse within their ~1 h lifetime).
 */
export async function setBanned(admin: SupabaseClient, userId: string, banned: boolean): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { error } = await admin
    .from('profiles')
    .update({ is_banned: banned, banned_at: banned ? new Date().toISOString() : null })
    .eq('id', userId);
  if (error) {
    return MISSING_ADMIN_COLUMNS_RE.test(error.message)
      ? { ok: false, status: 503, error: RUN_MIGRATION_MESSAGE }
      : { ok: false, status: 500, error: 'Could not update the ban.' };
  }
  const { error: authErr } = await admin.auth.admin.updateUserById(userId, { ban_duration: banned ? '876000h' : 'none' });
  if (authErr) console.error('[adminActions] auth ban update failed:', authErr.message);
  return { ok: true };
}
