export const INTENT_OPTIONS = [
  { value: 'dating', label: 'Dating' },
  { value: 'serious_relationship', label: 'Serious Relationship' },
  { value: 'marriage', label: 'Marriage' },
  { value: 'friendship', label: 'Friends' },
] as const;

export type IntentValue = (typeof INTENT_OPTIONS)[number]['value'];

const LEGACY_INTENT_MAP: Record<string, IntentValue> = {
  the_real_thing: 'serious_relationship',
  serious: 'serious_relationship',
  'serious relationship': 'serious_relationship',
  long_term: 'serious_relationship',
  'long-term': 'serious_relationship',
  long_term_relationship: 'serious_relationship',
  'long-term relationship': 'serious_relationship',
  'life partner': 'serious_relationship',
  'meaningful connection': 'serious_relationship',
  'committed courtship': 'serious_relationship',
  courtship: 'serious_relationship',
  marriage: 'marriage',
  'marriage & kids': 'marriage',
  'marriage (no kids)': 'marriage',
  marriage_minded: 'marriage',
  'marriage-minded': 'marriage',
  'marriage & long-term partner': 'marriage',
  dating: 'dating',
  casual: 'dating',
  'casual dating': 'dating',
  keeping_it_light: 'dating',
  friendship: 'friendship',
  friends: 'friendship',
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