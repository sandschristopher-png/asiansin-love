/**
 * Display tiers for the Reputation score (visual only: messaging / voice-note restrictions are
 * enforced separately in lib/reputation.ts). Every screen shows the score as "[Shield] 98%".
 *
 *   Pristine 90-100  brand violet
 *   Good     75-89   warm amber
 *   Caution  50-74   coral orange
 *   Flagged  < 50    crimson rose
 */
export type ReputationTier = 'pristine' | 'good' | 'caution' | 'flagged';

export interface ReputationTokens {
  tier: ReputationTier;
  /** "Pristine", "Good", "Caution", "Flagged" */
  tierLabel: string;
  score: number;
  /** "98%" */
  percent: string;
  /** Light surfaces (cards, lists, profile). */
  light: { container: string; text: string; icon: string; bar: string; track: string };
  /** Dark frosted overlays on photos. */
  frosted: { container: string; text: string; icon: string };
}

const FROSTED_CONTAINER = 'bg-black/35 backdrop-blur-md border border-white/20';

const TIERS: Record<ReputationTier, Omit<ReputationTokens, 'score' | 'percent'>> = {
  pristine: {
    tier: 'pristine',
    tierLabel: 'Pristine',
    light: {
      container: 'bg-[#F3EFFC] border border-[#DDD3F7]',
      text: 'text-[#4F3FA3]',
      icon: 'text-[#6555B8]',
      bar: 'bg-[#6555B8]',
      track: 'bg-[#F3EFFC]',
    },
    frosted: { container: FROSTED_CONTAINER, text: 'text-white', icon: 'text-[#B7A6FF]' },
  },
  good: {
    tier: 'good',
    tierLabel: 'Good',
    light: {
      container: 'bg-amber-50 border border-amber-200',
      text: 'text-amber-800',
      icon: 'text-amber-500',
      bar: 'bg-amber-500',
      track: 'bg-amber-100',
    },
    frosted: { container: FROSTED_CONTAINER, text: 'text-amber-200', icon: 'text-amber-300' },
  },
  caution: {
    tier: 'caution',
    tierLabel: 'Caution',
    light: {
      container: 'bg-orange-50 border border-orange-200',
      text: 'text-orange-700',
      icon: 'text-orange-500',
      bar: 'bg-orange-500',
      track: 'bg-orange-100',
    },
    frosted: { container: FROSTED_CONTAINER, text: 'text-orange-200', icon: 'text-orange-300' },
  },
  flagged: {
    tier: 'flagged',
    tierLabel: 'Flagged',
    light: {
      container: 'bg-rose-50 border border-rose-200',
      text: 'text-rose-700',
      icon: 'text-rose-500',
      bar: 'bg-rose-500',
      track: 'bg-rose-100',
    },
    frosted: { container: FROSTED_CONTAINER, text: 'text-rose-200', icon: 'text-rose-300' },
  },
};

export function reputationTierOf(score: number): ReputationTier {
  if (score >= 90) return 'pristine';
  if (score >= 75) return 'good';
  if (score >= 50) return 'caution';
  return 'flagged';
}

/** Style tokens for a reputation score (non-numbers / missing scores read as 100). */
export function reputationTokens(raw: unknown): ReputationTokens {
  const n = typeof raw === 'number' && Number.isFinite(raw) ? raw : 100;
  const score = Math.max(0, Math.min(100, Math.round(n)));
  return { ...TIERS[reputationTierOf(score)], score, percent: `${score}%` };
}
