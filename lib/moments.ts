/**
 * Moments: the fixed lists and limits shared by the composer, the feed, the API routes and the
 * database (20261123_moments.sql checks the same city and tag lists). No imports, so server and
 * client code can both use it.
 */

/** Southeast Asian hubs a Moment can be posted in (the same cities as the login hero). */
export const MOMENT_CITIES = [
  'Manila',
  'Cebu',
  'Bangkok',
  'Chiang Mai',
  'Ho Chi Minh City',
  'Hanoi',
  'Jakarta',
  'Bali',
  'Phnom Penh',
  'Kuala Lumpur',
  'Singapore',
] as const;
export type MomentCity = (typeof MOMENT_CITIES)[number];

export const MOMENT_TAGS = ['coffee', 'street_food', 'city_walk', 'sunset', 'gym', 'date_spot'] as const;
export type MomentTag = (typeof MOMENT_TAGS)[number];

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

export const isMomentCity = (v: unknown): v is MomentCity => typeof v === 'string' && (MOMENT_CITIES as readonly string[]).includes(v);
export const isMomentTag = (v: unknown): v is MomentTag => typeof v === 'string' && (MOMENT_TAGS as readonly string[]).includes(v);

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
  activityTag: MomentTag;
  city: MomentCity;
  likesCount: number;
  likedByMe: boolean;
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
