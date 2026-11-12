import { headers } from 'next/headers';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { firstParam, resolveHeroAudience, visitorCountry } from '@/lib/geoCities';
import { getRequestLocale } from '@/lib/i18n/server';
import { getMessages } from '@/lib/i18n/messages';

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  // Western visitors: "Meet someone in" + Asian cities. Asian visitors: "Meet someone from" + Western countries.
  const audience = resolveHeroAudience(visitorCountry(await headers()), { geo: firstParam(params.geo), target: firstParam(params.target) });
  // App language on the first byte: mia_lang cookie, else Accept-Language, else English.
  const locale = await getRequestLocale();
  return (
    <LocaleProvider locale={locale} messages={getMessages(locale)}>
      <AuthScreen mode="signup" audience={audience} />
    </LocaleProvider>
  );
}
