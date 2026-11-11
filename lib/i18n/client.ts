import { LOCALE_COOKIE, LOCALE_MAX_AGE, LOCALE_STORAGE_KEY, type Locale } from '@/lib/i18n/config';

/** Saves the locale to the NEXT_LOCALE cookie (path=/, one year) and to localStorage preferred_locale. */
export function persistLocale(locale: Locale) {
  writeLocaleCookie(locale);
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {}
}

export function writeLocaleCookie(locale: Locale) {
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_MAX_AGE}; samesite=lax${secure}`;
}

export function hasLocaleCookie() {
  return document.cookie.split('; ').some((c) => c.startsWith(`${LOCALE_COOKIE}=`));
}

export function readStoredLocale(): string | null {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
}
