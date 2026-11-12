import { cookies, headers } from 'next/headers';
import { LEGACY_LOCALE_COOKIE, LOCALE_COOKIE, isLocale, parseAcceptLanguage, type Locale } from '@/lib/i18n/config';

/**
 * The visitor's language on the very first byte (Server Components only; reading cookies and
 * headers makes the route dynamic, which landing, login and signup already are):
 *   1. the mia_lang cookie (an explicit choice), or the older NEXT_LOCALE cookie;
 *   2. otherwise the browser's Accept-Language header, matched against the supported locales;
 *   3. otherwise English.
 */
export async function getRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  const saved = jar.get(LOCALE_COOKIE)?.value ?? jar.get(LEGACY_LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return parseAcceptLanguage((await headers()).get('accept-language'));
}
