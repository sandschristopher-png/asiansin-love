import type { Locale } from '@/lib/i18n/config';
import { mergeMessages, type DeepPartial, type Messages } from '@/lib/i18n';
import en from '@/messages/en.json';
import fil from '@/messages/fil.json';
import vi from '@/messages/vi.json';
import th from '@/messages/th.json';
import id from '@/messages/id.json';
import ms from '@/messages/ms.json';
import km from '@/messages/km.json';
import es from '@/messages/es.json';
import ja from '@/messages/ja.json';
import ko from '@/messages/ko.json';
import zh from '@/messages/zh.json';

export type { Messages } from '@/lib/i18n';

/** Other languages are partial copies of English: anything they lack falls back to en.json. */
const DICTIONARIES: Record<Locale, DeepPartial<Messages>> = { en, fil, vi, th, id, ms, km, es, ja, ko, zh };

/**
 * Server-side only: importing this from a client component would ship every dictionary. Pages
 * pass the one active dictionary down as a prop instead. Always complete (merged over English).
 */
export function getMessages(locale: Locale): Messages {
  return mergeMessages(DICTIONARIES[locale]);
}
