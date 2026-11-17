/**
 * Moments: the fixed lists and limits shared by the composer, the feed, the API routes and the
 * database (20261123_moments.sql and 20261125_moments_vibes.sql check the same lists). No imports
 * beyond the location list, so server and client code can both use it.
 */
import { SEA_CITIES, isSeaCity, type SeaCity } from '@/lib/seaLocations';

/** Cities a Moment can be posted from: every Southeast Asian city in lib/seaLocations.ts. */
export const MOMENT_CITIES = SEA_CITIES;
export type MomentCity = SeaCity;
export const isMomentCity = isSeaCity;

/** Lifestyle vibes: the shared interests a Moment is filed under (and browsed by). */
export const VIBE_TAGS = ['cafe_hopping', 'street_food', 'city_walks', 'beach_sunset', 'fitness_wellness', 'remote_work', 'weekend_trips', 'local_gems'] as const;
export type VibeTag = (typeof VIBE_TAGS)[number];
export const isVibeTag = (v: unknown): v is VibeTag => typeof v === 'string' && (VIBE_TAGS as readonly string[]).includes(v);

/** Guided prompts shown as an eyebrow above the caption. */
export const MOMENT_PROMPTS = ['favorite_spot', 'weekend', 'best_food', 'first_hangout', 'view'] as const;
export type MomentPrompt = (typeof MOMENT_PROMPTS)[number];
export const isMomentPrompt = (v: unknown): v is MomentPrompt => typeof v === 'string' && (MOMENT_PROMPTS as readonly string[]).includes(v);

/**
 * Today's featured prompt: rotates by day of the year (UTC), so every member sees the same one
 * on the same day.
 */
export function promptOfDay(now: Date = new Date()): MomentPrompt {
  const day = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86_400_000);
  return MOMENT_PROMPTS[day % MOMENT_PROMPTS.length];
}

/**
 * Words in a member's profile interests that mean they share a vibe ("Shared vibe" on a card).
 * Compared case-insensitively against each interest as a whole word or phrase.
 */
export const VIBE_INTEREST_KEYWORDS: Record<VibeTag, string[]> = {
  cafe_hopping: ['coffee', 'cafe', 'cafes', 'brunch', 'baking'],
  street_food: ['food', 'foodie', 'cooking', 'street food', 'markets'],
  city_walks: ['walks', 'walking', 'architecture', 'photography', 'sightseeing', 'museums', 'city walks'],
  beach_sunset: ['beach', 'ocean', 'sunset', 'sunsets', 'surfing', 'diving', 'swimming', 'snorkeling'],
  fitness_wellness: ['fitness', 'gym', 'yoga', 'running', 'wellness', 'workout', 'hiking', 'cycling'],
  remote_work: ['entrepreneurship', 'remote work', 'digital nomad', 'startups', 'coding', 'freelancing'],
  weekend_trips: ['travel', 'adventure', 'camping', 'road trips', 'getaways'],
  local_gems: ['art', 'music', 'culture', 'exploring', 'nightlife', 'hidden gems'],
};

/** True when any of the member's profile interests (e.g. "Coffee & Cafes") matches the vibe. */
export function sharesVibe(interests: readonly string[], vibe: VibeTag): boolean {
  const keywords = VIBE_INTEREST_KEYWORDS[vibe];
  for (const interest of interests) {
    const text = String(interest).toLowerCase();
    const words = new Set(text.split(/[^a-z]+/).filter(Boolean));
    if (keywords.some((k) => (k.includes(' ') ? text.includes(k) : words.has(k)))) return true;
  }
  return false;
}

/** Old activity tags (20261123) mapped onto vibes, for Moments posted before vibes existed. */
export const LEGACY_ACTIVITY_VIBE: Record<string, VibeTag> = {
  coffee: 'cafe_hopping',
  street_food: 'street_food',
  city_walk: 'city_walks',
  sunset: 'beach_sunset',
  gym: 'fitness_wellness',
  date_spot: 'local_gems',
};

/** localStorage key and window event for "the member has seen the feed" (clears the nav tab's dot). */
export const MOMENTS_SEEN_KEY = 'ail_moments_seen_at';
export const MOMENTS_SEEN_EVENT = 'ail:moments-seen';

export const MAX_CAPTION = 140;
export const MAX_MOMENTS_PER_DAY = 2;
export const MOMENT_BUCKET = 'moment-photos';
export const MAX_MOMENT_BYTES = 5 * 1024 * 1024;
/** Unique reports that hide a Moment until staff review it. */
export const HIDE_AT_REPORTS = 2;
/** Client-side resize before upload. */
export const MOMENT_MAX_WIDTH = 1080;
export const MOMENT_QUALITY = 0.85;

/** Report reasons for a Moment; the ids are what the API stores. */
export const MOMENT_REPORT_REASONS = ['explicit_photo', 'financial_scam', 'sex_solicitation', 'spam_link', 'fake_or_underage'] as const;
export type MomentReportReason = (typeof MOMENT_REPORT_REASONS)[number];
export const isMomentReportReason = (v: unknown): v is MomentReportReason =>
  typeof v === 'string' && (MOMENT_REPORT_REASONS as readonly string[]).includes(v);

/** What the feed API returns for one Moment. */
export interface MomentItem {
  id: string;
  userId: string;
  imageUrl: string;
  aspectRatio: string;
  caption: string | null;
  vibeTag: VibeTag | null;
  prompt: MomentPrompt | null;
  city: string;
  country: string | null;
  likesCount: number;
  likedByMe: boolean;
  /** The viewer's profile interests overlap this Moment's vibe. */
  sharedVibe: boolean;
  /** The city was confirmed from the author's GPS fix when they posted. */
  locationVerified: boolean;
  createdAt: string;
  isMine: boolean;
  author: {
    id: string;
    username: string;
    age: number | null;
    avatarUrl: string | null;
    verified: boolean;
    founding: boolean;
  };
}
