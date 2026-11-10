/**
 * The name other members see: the member's chosen username, never the real name that comes from
 * the sign-in provider (profiles.full_name / display_name are filled from Google). Placeholder
 * handles ("user_...") from an unfinished onboarding count as no username.
 */
export function publicName(p: { username?: string | null } | null | undefined, fallback = 'Member'): string {
  const handle = typeof p?.username === 'string' ? p.username.trim().replace(/^@+/, '') : '';
  return handle && !handle.startsWith('user_') ? handle : fallback;
}
