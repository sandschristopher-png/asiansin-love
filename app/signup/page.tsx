import { headers } from 'next/headers';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { firstParam, resolveHeroAudience, visitorCountry } from '@/lib/geoCities';

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  // Western visitors: "Meet someone in" + Asian cities. Asian visitors: "Meet someone from" + Western countries.
  const audience = resolveHeroAudience(visitorCountry(await headers()), { geo: firstParam(params.geo), target: firstParam(params.target) });
  return <AuthScreen mode="signup" audience={audience} />;
}
