import type { Locale } from '@/lib/i18n/config';
import en from '@/messages/en.json';
import fil from '@/messages/fil.json';
import vi from '@/messages/vi.json';
import th from '@/messages/th.json';
import id from '@/messages/id.json';
import es from '@/messages/es.json';
import ja from '@/messages/ja.json';
import ko from '@/messages/ko.json';
import zh from '@/messages/zh.json';

/** en.json is the source of truth: a dictionary missing any of its keys fails the type check (and the build). */
export type Messages = typeof en;

const DICTIONARIES: Record<Locale, Messages> = { en, fil, vi, th, id, es, ja, ko, zh };

/**
 * Server-side only: importing this from a client component would ship all nine dictionaries.
 * Pages pass the one active dictionary down as a prop instead.
 */
export function getMessages(locale: Locale): Messages {
  return DICTIONARIES[locale];
}
