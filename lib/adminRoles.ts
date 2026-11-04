/** Staff roles, lowest to highest. Pure helpers (safe for client and server). */
export type AdminRole = 'member' | 'moderator' | 'super_admin';

/**
 * Effective staff role of a profile row.
 *   admin_role (20261112_admin_console.sql) is the source of truth;
 *   older admins (role = 'admin' / is_admin) count as moderators until that migration runs.
 * Only admin_role = 'super_admin' ever grants super_admin.
 */
export function adminRoleOf(profile: Record<string, unknown> | null | undefined): AdminRole {
  if (!profile) return 'member';
  if (profile.admin_role === 'super_admin') return 'super_admin';
  if (profile.admin_role === 'moderator') return 'moderator';
  if (profile.role === 'admin' || profile.is_admin === true) return 'moderator';
  return 'member';
}

export const isStaff = (role: AdminRole) => role === 'moderator' || role === 'super_admin';

/**
 * The account owner (COS, the id 20261112_admin_console.sql promotes). Matched by id, never by
 * display name. The owner can manage every other account, other super admins included; nobody
 * can modify the owner. ADMIN_OWNER_ID overrides it on the server if ownership ever moves.
 */
export const ACCOUNT_OWNER_ID =
  (typeof process !== 'undefined' && process.env.ADMIN_OWNER_ID) || '2608a783-4745-4087-a1bc-c9387c3c0ccd';

export const isAccountOwner = (userId: string | null | undefined) => Boolean(userId) && userId === ACCOUNT_OWNER_ID;

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  member: 'Member',
  moderator: 'Mod',
  super_admin: 'Super Admin',
};
