/**
 * "Looking for": the one intent a member picks, shown the same way on the profile, onboarding and the Discover
 * filter (Pairs / with.is model). Stored in profiles.relationship_intent as the value below. Older profiles hold
 * older values (marriage, dating, ...); normalizeIntent maps every one of them onto these five, so nothing needs
 * rewriting in the database and an old profile still matches the new filter.
 */
export const INTENT_OPTIONS = [
  { value: 'friends', label: 'Friends' },
  { value: 'local_guide', label: 'Local Guide' },
  { value: 'casual_dating', label: 'Casual Dating' },
  { value: 'serious_relationship', label: 'Serious Relationship' },
  { value: 'figuring_it_out', label: 'Figuring it Out' },
] as const;

export type IntentValue = (typeof INTENT_OPTIONS)[number]['value'];

const LEGACY_INTENT_MAP: Record<string, IntentValue> = {
  // serious
  the_real_thing: 'serious_relationship',
  serious: 'serious_relationship',
  'serious relationship': 'serious_relationship',
  long_term: 'serious_relationship',
  'long-term': 'serious_relationship',
  long_term_relationship: 'serious_relationship',
  'long-term relationship': 'serious_relationship',
  'long-term partner': 'serious_relationship',
  'life partner': 'serious_relationship',
  'meaningful connection': 'serious_relationship',
  'committed courtship': 'serious_relationship',
  courtship: 'serious_relationship',
  // marriage folds into serious: the five-pill model has no separate marriage pill
  marriage: 'serious_relationship',
  'marriage & kids': 'serious_relationship',
  'marriage (no kids)': 'serious_relationship',
  marriage_minded: 'serious_relationship',
  'marriage-minded': 'serious_relationship',
  'marriage & long-term partner': 'serious_relationship',
  // casual
  dating: 'casual_dating',
  casual: 'casual_dating',
  'casual dating': 'casual_dating',
  keeping_it_light: 'casual_dating',
  // friends
  friendship: 'friends',
  'friendship & connection': 'friends',
  friend: 'friends',
  friends: 'friends',
  // local guide and undecided
  'local guide': 'local_guide',
  guide: 'local_guide',
  'figuring it out': 'figuring_it_out',
  exploring: 'figuring_it_out',
  open: 'figuring_it_out',
  'not sure': 'figuring_it_out',
};

export function normalizeIntent(value: unknown): IntentValue | '' {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return '';
  if (INTENT_OPTIONS.some((option) => option.value === raw)) return raw as IntentValue;
  return LEGACY_INTENT_MAP[raw] ?? '';
}

export function intentLabel(value: unknown): string {
  const normalized = normalizeIntent(value);
  return INTENT_OPTIONS.find((option) => option.value === normalized)?.label ?? '';
}
