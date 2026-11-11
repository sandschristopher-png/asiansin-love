import type { Locale } from '@/lib/i18n/config';
import type { Messages } from '@/lib/i18n/messages';

/**
 * Client-side dictionary loader: each language is its own small chunk, fetched only when a
 * visitor switches to it. Typed against en.json, so a dictionary missing a key fails the build.
 */
const LOADERS: Record<Locale, () => Promise<{ default: Messages }>> = {
  en: () => import('@/messages/en.json'),
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

export async function loadMessages(locale: Locale): Promise<Messages> {
  return (await LOADERS[locale]()).default;
}
