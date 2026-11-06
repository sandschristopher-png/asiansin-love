/**
 * Display tiers for the Reputation score (visual only: messaging / voice-note restrictions are
 * enforced separately in lib/reputation.ts). Every screen shows the score as "[Shield] 98%".
 *
 *   Pristine 90-100  brand plum
 *   Good     75-89   warm amber
 *   Caution  50-74   coral orange
 *   Flagged  < 50    vibrant purple
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
      container: 'bg-[#E8E6F1]/50 border border-[#D0CDE1]',
      text: 'text-[#665D96]',
      icon: 'text-[#665D96]',
      bar: 'bg-gradient-to-r from-[#665D96] to-[#9A93BC]',
      track: 'bg-[#E8E6F1]',
    },
    frosted: { container: FROSTED_CONTAINER, text: 'text-white', icon: 'text-[#D0CDE1]' },
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
      container: 'bg-red-50 border border-red-200',
      text: 'text-[#DC2626]',
      icon: 'text-red-500',
      bar: 'bg-red-500',
      track: 'bg-red-100',
    },
    frosted: { container: FROSTED_CONTAINER, text: 'text-red-200', icon: 'text-red-300' },
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
