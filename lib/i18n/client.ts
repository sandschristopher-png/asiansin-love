import {
  LEGACY_LOCALE_COOKIE,
  LOCALE_COOKIE,
  LOCALE_MAX_AGE,
  LOCALE_STORAGE_KEY,
  isLocale,
  matchLocale,
  type Locale,
} from '@/lib/i18n/config';

function cookieValue(name: string): string | null {
  const hit = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

/** The explicit choice in the mia_lang cookie (or the older NEXT_LOCALE one), if valid. */
export function readLocaleCookie(): Locale | null {
  const value = cookieValue(LOCALE_COOKIE) ?? cookieValue(LEGACY_LOCALE_COOKIE);
  return isLocale(value) ? value : null;
}

export function readStoredLocale(): Locale | null {
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

/** Writes mia_lang (path=/, one year, SameSite=Lax) and retires the older cookie name. */
export function writeLocaleCookie(locale: Locale) {
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_MAX_AGE}; samesite=lax${secure}`;
  document.cookie = `${LEGACY_LOCALE_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/** Saves the choice on this device: the cookie the server reads, plus a localStorage backup. */
export function persistLocale(locale: Locale) {
  writeLocaleCookie(locale);
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {}
}

/** The browser's own language list (navigator.languages), matched against the supported locales. */
export function detectBrowserLocale(): Locale | null {
  const tags = typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of tags) {
    const found = matchLocale(tag);
    if (found) return found;
  }
  return null;
}

/**
 * Tells the server (the mia_lang cookie, and profiles.preferred_language when signed in).
 * Best effort: the device already has the choice, so a failed request never blocks the screen.
 */
export async function saveLocaleToServer(locale: Locale): Promise<boolean> {
  try {
    const res = await fetch('/api/profile/language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: locale }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
