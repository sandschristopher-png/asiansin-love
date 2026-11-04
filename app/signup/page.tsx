import { headers } from 'next/headers';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { citiesForVisitor, visitorCountry } from '@/lib/geoCities';

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const cities = citiesForVisitor(visitorCountry(await headers()), (await searchParams).geo);
  return <AuthScreen mode="signup" cities={cities} />;
}
