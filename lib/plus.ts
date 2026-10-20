export type PlusLike = {
  is_plus?: boolean | null;
  is_premium?: boolean | null;
  subscription_status?: string | null;
  current_period_end?: string | null;
} | null | undefined;

export function isPlusProfile(p: PlusLike): boolean {
  if (!p) return false;
  if (p.is_plus === true || p.is_premium === true) return true;
  const s = (p.subscription_status || '').toLowerCase();
  if (s === 'active' || s === 'trialing') {
    if (p.current_period_end) {
      const end = new Date(p.current_period_end).getTime();
      if (Number.isFinite(end) && end < Date.now()) return false;
    }
    return true;
  }
  return false;
}