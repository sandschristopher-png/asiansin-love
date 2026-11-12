import type { TKey } from '@/lib/i18n';
import type { ProfileContentResult } from '@/lib/moderation';

const KEY = {
  URL_DETECTED: 'moderation.url',
  SOCIAL_HANDLE_DETECTED: 'moderation.handle',
  PHONE_DETECTED: 'moderation.phone',
} as const satisfies Record<NonNullable<ProfileContentResult['reason']>, TKey>;

/**
 * The warning for a failed validateProfileContent() check, in the member's language. The check
 * itself (lib/moderation.ts) returns a reason code plus English text for server responses; forms
 * show this instead so the warning matches the rest of the screen.
 */
export function profileContentMessage(
  result: ProfileContentResult,
  t: (key: TKey) => string
): string | undefined {
  return result.reason ? t(KEY[result.reason]) : result.errorMessage;
}
