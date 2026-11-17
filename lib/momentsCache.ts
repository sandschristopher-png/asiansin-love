/**
 * Instant stale-while-revalidate cache for the Moments feed (client only).
 *
 * The first page of the feed is kept in sessionStorage under ail_moments_fast_cache_v1 for 5 minutes,
 * so switching to /moments paints real cards at once while the page quietly revalidates
 * /api/moments. The page rewrites it whenever the feed changes (a like, a delete, a fresh load) and
 * clears it after a post, so it never shows a reaction count the member has already changed.
 * Everything is wrapped in try/catch: storage can be blocked, full or absent, and the feed must work
 * without it. Cleared on sign-out (lib/hardSignOut.ts).
 */
import type { MomentItem } from '@/lib/moments';

export const MOMENTS_CACHE_KEY = 'ail_moments_fast_cache_v1';
export const MOMENTS_CACHE_TTL_MS = 5 * 60 * 1000;
/** One API page: only the first page is cached, so a cached feed is always short and quick to parse. */
export const MOMENTS_CACHE_ITEMS = 12;

export interface MomentsFeed {
  items: MomentItem[];
  /** created_at of the last item, for "Load more"; null when there is nothing older. */
  cursor: string | null;
}

interface Stored extends MomentsFeed {
  at: number;
}

// Parsed once and reused, so useSyncExternalStore sees a stable object between renders.
let memory: Stored | null = null;
let memoryLoaded = false;

function isFresh(entry: Stored | null, now: number): entry is Stored {
  return Boolean(entry && Array.isArray(entry.items) && now - entry.at < MOMENTS_CACHE_TTL_MS);
}

/** The cached first page, or null when empty or older than 5 minutes. Safe to call during render. */
export function readMomentsCache(now: number = Date.now()): MomentsFeed | null {
  if (typeof window === 'undefined') return null;
  if (!memoryLoaded) {
    memoryLoaded = true;
    try {
      const raw = sessionStorage.getItem(MOMENTS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Stored;
        if (parsed && typeof parsed.at === 'number' && Array.isArray(parsed.items)) memory = parsed;
      }
    } catch {
      memory = null;
    }
  }
  if (isFresh(memory, now)) return memory;
  memory = null;
  return null;
}

/** Stores the first page of `feed` (never more than one API page). */
export function writeMomentsCache(feed: MomentsFeed, now: number = Date.now()): void {
  if (typeof window === 'undefined') return;
  const items = feed.items.slice(0, MOMENTS_CACHE_ITEMS);
  // Cut to one page: "Load more" must continue from the last cached item.
  const cursor = feed.items.length > MOMENTS_CACHE_ITEMS ? items[items.length - 1].createdAt : feed.cursor;
  memory = { items, cursor, at: now };
  memoryLoaded = true;
  try {
    sessionStorage.setItem(MOMENTS_CACHE_KEY, JSON.stringify(memory));
  } catch {
    /* storage full or blocked: the in-memory copy still serves this tab */
  }
}

export function clearMomentsCache(): void {
  memory = null;
  memoryLoaded = true;
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(MOMENTS_CACHE_KEY);
  } catch {
    /* ignore */
  }
}
