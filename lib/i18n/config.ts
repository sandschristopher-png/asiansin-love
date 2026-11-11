/**
 * Locale roster, labels and storage names. Shared by server and client code, so it imports nothing.
 *
 * The chosen locale lives in two places:
 *   - cookie NEXT_LOCALE: what the server reads, so the landing page renders in the right language
 *     on the first byte (no flash of English).
 *   - localStorage preferred_locale: a backup; if the cookie is cleared or expires, LocaleProvider
 *     restores it from here.
 */
export const LOCALES = ['en', 'fil', 'vi', 'th', 'id', 'es', 'ja', 'ko', 'zh'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'NEXT_LOCALE';
export const LOCALE_STORAGE_KEY = 'preferred_locale';
/** One year, in seconds. */
export const LOCALE_MAX_AGE = 31536000;

/** Each language named in its own script, as the selector lists it. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fil: 'Filipino',
  vi: 'Tiếng Việt',
  th: 'ภาษาไทย',
  id: 'Bahasa Indonesia',
  es: 'Español',
  ja: '日本語',
  ko: '한국어',
  zh: '简体中文',
};

/** BCP 47 tag for the lang attribute (drives CJK glyph choice and screen-reader voice). */
export const HTML_LANG: Record<Locale, string> = {
  en: 'en',
  fil: 'fil',
  vi: 'vi',
  th: 'th',
  id: 'id',
  es: 'es',
  ja: 'ja',
  ko: 'ko',
  zh: 'zh-Hans',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}
