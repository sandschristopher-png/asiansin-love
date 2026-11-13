import type { SupabaseClient } from '@supabase/supabase-js';
import { translate, type TKey } from '@/lib/i18n';
import { getMessages } from '@/lib/i18n/messages';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config';

/**
 * Composed notification titles, "{name} sent you a message" style, from messages/<locale>.json
 * (notif.*). Server-only: getMessages loads every dictionary.
 */
export type TitleKind =
  | 'message'
  | 'voice'
  | 'spark'
  | 'match'
  | 'visit'
  | 'adminVerification'
  | 'adminPhoto'
  | 'adminReport'
  | 'adminModeration';

export function composeTitle(locale: Locale, kind: TitleKind, name: string | null | undefined): string {
  return translate(getMessages(locale), `notif.${kind}` as TKey, { name: (name || '').replace(/^@/, '') || 'Someone' });
}

/**
 * Notification locale. profiles.preferred_language does not exist in the live database yet
 * (20261112_preferred_language.sql has not run), so titles compose in DEFAULT_LOCALE (English)
 * for everyone. Once that column exists, restore the profiles lookup here.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function localeOf(_db: SupabaseClient, _userId: string): Promise<Locale> {
  return DEFAULT_LOCALE;
}

/** Compose in the recipient's language. */
export async function titleForRecipient(db: SupabaseClient, userId: string, kind: TitleKind, actorName: string | null | undefined) {
  return composeTitle(await localeOf(db, userId), kind, actorName);
}

/**
 * Legacy rows stored a bare label ("New Message"). For those, the API composes the display title
 * from the joined actor instead (no data migration).
 */
const GENERIC_TITLES: Record<string, TitleKind> = {
  'new message': 'message',
  'new voice note': 'voice',
  'new spark': 'spark',
  'new spark!': 'spark',
  'super spark!': 'spark',
  "it's a match!": 'match',
  'new profile visit': 'visit',
};

export function legacyTitleKind(title: string | null | undefined, type: string): TitleKind | null {
  if (!title) {
    if (type === 'message') return 'message';
    if (type === 'favorite' || type === 'spark') return 'spark';
    if (type === 'match') return 'match';
    if (type === 'visit') return 'visit';
    return null;
  }
  return GENERIC_TITLES[title.trim().toLowerCase()] ?? null;
}
