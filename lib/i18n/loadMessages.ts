import type { Locale } from '@/lib/i18n/config';
import { EN, mergeMessages, type DeepPartial, type Messages } from '@/lib/i18n';

type Loader = () => Promise<{ default: DeepPartial<Messages> }>;

/**
 * Client-side dictionary loader: each language is its own small chunk, fetched only when a
 * visitor uses it. English is already in the bundle (it is the fallback for every language).
 */
const LOADERS: Record<Exclude<Locale, 'en'>, Loader> = {
  fil: () => import('@/messages/fil.json'),
  vi: () => import('@/messages/vi.json'),
  th: () => import('@/messages/th.json'),
  id: () => import('@/messages/id.json'),
  ms: () => import('@/messages/ms.json'),
  km: () => import('@/messages/km.json'),
  es: () => import('@/messages/es.json'),
  ja: () => import('@/messages/ja.json'),
  ko: () => import('@/messages/ko.json'),
  zh: () => import('@/messages/zh.json'),
};

/** The full dictionary for a locale: its own strings laid over English. */
export async function loadMessages(locale: Locale): Promise<Messages> {
  if (locale === 'en') return EN;
  return mergeMessages((await LOADERS[locale]()).default);
}
