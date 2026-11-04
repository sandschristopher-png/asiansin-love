import { headers } from 'next/headers';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { firstParam, resolveGeoRoster, visitorCountry } from '@/lib/geoCities';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const cities = resolveGeoRoster(visitorCountry(await headers()), { geo: firstParam(params.geo), target: firstParam(params.target) });
  return <AuthScreen mode="login" cities={cities} />;
}
