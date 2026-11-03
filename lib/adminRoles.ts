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

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  member: 'Member',
  moderator: 'Moderator',
  super_admin: 'Super Admin',
};
