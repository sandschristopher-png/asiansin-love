/**
 * Discover filter drawer: lifestyle selectors and the query parameters /api/discover reads.
 *   intent   -> profiles.timeline_intent (lib/rhythm.ts TIMELINE_INTENT_OPTIONS)
 *   children -> profiles.wants_kids / has_kids (Edit Profile > Family & Values)
 *   english  -> profiles.english_level (20261114_privacy_features.sql)
 */

export const RELATIONSHIP_INTENT_FILTERS = [
  { value: 'marriage_1_2_years', label: 'Marriage-minded' },
  { value: 'long_term_dating', label: 'Long-term' },
  { value: 'exploring', label: 'Intentional dating' },
] as const;

export const CHILDREN_FILTERS = [
  { value: 'wants', label: 'Wants children' },
  { value: 'open', label: 'Open to children' },
  { value: 'has', label: 'Has children' },
  { value: 'not_looking', label: 'Not looking for children' },
] as const;

export const ENGLISH_LEVEL_OPTIONS = [
  { value: 'fluent', label: 'Fluent' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'basic', label: 'Basic' },
] as const;

export type EnglishLevel = (typeof ENGLISH_LEVEL_OPTIONS)[number]['value'];

export function isEnglishLevel(v: unknown): v is EnglishLevel {
  return ENGLISH_LEVEL_OPTIONS.some((o) => o.value === v);
}

/** PostgREST `or` clause for one children filter value (stored values are Edit Profile labels). */
export const CHILDREN_CLAUSES: Record<(typeof CHILDREN_FILTERS)[number]['value'], string> = {
  wants: 'wants_kids.eq."Wants children"',
  open: 'wants_kids.eq."Open to children"',
  has: 'has_kids.ilike.yes*',
  not_looking: 'wants_kids.eq."Does not want children"',
};

/** Keeps only known values from a comma-separated query parameter. */
export function readFilterList<T extends string>(raw: string | null, allowed: readonly { value: T }[]): T[] {
  if (!raw) return [];
  const known = new Set<string>(allowed.map((o) => o.value));
  return Array.from(new Set(raw.split(',').map((s) => s.trim()).filter((s) => known.has(s)))) as T[];
}

export interface DiscoverServerFilters {
  verifiedOnly: boolean;
  hideContacted: boolean;
  sparkedMeOnly: boolean;
  intents: string[];
  children: string[];
  english: string[];
}

/** Query string for /api/discover (hide_contacted is off by default, so only "on" is sent). */
export function discoverQuery(f: DiscoverServerFilters): string {
  const p = new URLSearchParams();
  if (f.verifiedOnly) p.set('verified', '1');
  if (f.hideContacted) p.set('hide_contacted', '1');
  if (f.sparkedMeOnly) p.set('sparked_me', '1');
  if (f.intents.length) p.set('intent', f.intents.join(','));
  if (f.children.length) p.set('children', f.children.join(','));
  if (f.english.length) p.set('english', f.english.join(','));
  const qs = p.toString();
  return qs ? `/api/discover?${qs}` : '/api/discover';
}
