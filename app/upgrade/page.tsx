import { redirect } from 'next/navigation';

/**
 * Old upgrade link. /plus is the one upgrade screen (plans, comparison, checkout, billing), so
 * anything that still points here lands there, keeping an optional ?feature= context.
 */
export default async function UpgradePage({ searchParams }: { searchParams: Promise<{ feature?: string | string[] }> }) {
  const { feature } = await searchParams;
  const value = Array.isArray(feature) ? feature[0] : feature;
  redirect(value && /^[a-z-]{1,24}$/.test(value) ? `/plus?feature=${value}` : '/plus');
}
