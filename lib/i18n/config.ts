/**
 * Locale roster, labels, storage names and detection. Shared by server and client code, so it
 * imports nothing.
 *
 * The chosen locale lives in three places:
 *   - cookie mia_lang: what the server reads, so landing, login and signup render in the right
 *     language on the first byte (no flash of English).
 *   - localStorage preferred_locale: a backup; if the cookie is cleared, it is restored from here.
 *   - profiles.preferred_language: follows a signed-in member to a new device.
 * With none of them, the browser's Accept-Language header decides (English if nothing matches).
 */
export const LOCALES = ['en', 'fil', 'vi', 'th', 'id', 'ms', 'km', 'es', 'ja', 'ko', 'zh'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'mia_lang';
/** Cookie name used before mia_lang: still read, so an existing visitor keeps their language. */
export const LEGACY_LOCALE_COOKIE = 'NEXT_LOCALE';
export const LOCALE_STORAGE_KEY = 'preferred_locale';
/** One year, in seconds. */
export const LOCALE_MAX_AGE = 31536000;

/** Each language named in its own script, as the pickers list it. No flags, by design. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fil: 'Filipino',
  vi: 'Tiếng Việt',
  th: 'ภาษาไทย',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu',
  km: 'ភាសាខ្មែរ',
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
  ms: 'ms',
  km: 'km',
  es: 'es',
  ja: 'ja',
  ko: 'ko',
  zh: 'zh-Hans',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** A language tag ("th-TH", "tl", "zh-Hans-CN") to a supported locale, or null. */
export function matchLocale(tag: string | null | undefined): Locale | null {
  const primary = String(tag || '').trim().toLowerCase().split(/[-_]/)[0];
  if (!primary) return null;
  if (primary === 'tl') return 'fil'; // Tagalog browsers announce "tl"
  if (primary === 'in') return 'id'; // legacy code for Indonesian
  return isLocale(primary) ? primary : null;
}

/**
 * Picks the best supported locale from an Accept-Language header, honouring q-values
 * ("de;q=0.9, th-TH;q=0.8" -> th: German is not supported, so the next choice wins).
 */
export function parseAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const weight = q ? Number(q.slice(2)) : 1;
      return { tag, weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((x) => x.tag && x.tag !== '*' && x.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const { tag } of ranked) {
    const found = matchLocale(tag);
    if (found) return found;
  }
  return DEFAULT_LOCALE;
}
