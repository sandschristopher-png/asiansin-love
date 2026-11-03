import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { reputationTokens } from '@/lib/utils/reputation';

/**
 * The one Reputation pill: "[Shield] 98%", tier-colored (lib/utils/reputation.ts).
 *   variant "light":   cards, lists, profile
 *   variant "frosted": over photos (Discover / Sparks cards)
 */
export function ReputationBadge({
  score,
  variant = 'light',
  size = 'sm',
  onClick,
  className = '',
}: {
  score: unknown;
  variant?: 'light' | 'frosted';
  size?: 'xs' | 'sm' | 'md';
  onClick?: () => void;
  className?: string;
}) {
  const t = reputationTokens(score);
  const v = variant === 'frosted' ? t.frosted : t.light;
  const Icon = t.tier === 'pristine' || t.tier === 'good' ? ShieldCheck : ShieldAlert;
  const sizing = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-0.5',
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1',
  }[size];
  const icon = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';
  const cls = `inline-flex items-center rounded-full font-semibold tabular-nums whitespace-nowrap ${sizing} ${v.container} ${v.text} ${className}`;
  const body = (
    <>
      <Icon className={`${icon} shrink-0 ${v.icon}`} aria-hidden />
      {t.percent}
    </>
  );
  const label = `Reputation ${t.percent} (${t.tierLabel})`;
  return onClick ? (
    <button type="button" onClick={onClick} aria-label={label} className={`${cls} transition active:scale-95 cursor-pointer`}>
      {body}
    </button>
  ) : (
    <span role="img" aria-label={label} className={cls}>
      {body}
    </span>
  );
}

export default ReputationBadge;
