/**
 * Lifestyle profile attributes (non-transactional: no income, no weight).
 * Values must match the CHECK constraints in supabase/migrations/20261109_lifestyle_attributes.sql
 * (tattoos, piercings, fitness_rhythm, body_type). drinking / smoking keep their older free-text
 * columns, so legacy labels ("Socially", "No") are mapped on read via normalizeDrinking/Smoking.
 */
import type { LucideIcon } from 'lucide-react';
import { Activity, Beer, Cigarette, CircleSlash, Dumbbell, Footprints, Gem, Home, Mountain, PenTool, Sparkles, User, Wind } from 'lucide-react';

export interface LifestyleOption<V extends string = string> {
  value: V;
  label: string;
  icon: LucideIcon;
}

export const BODY_TYPE_OPTIONS = [
  { value: 'slim', label: 'Slim', icon: User },
  { value: 'athletic', label: 'Athletic', icon: Activity },
  { value: 'average', label: 'Average', icon: User },
  { value: 'curvy', label: 'Curvy', icon: Sparkles },
  { value: 'muscular', label: 'Muscular', icon: Dumbbell },
] as const satisfies readonly LifestyleOption[];

export const TATTOO_OPTIONS = [
  { value: 'none', label: 'No tattoos', icon: CircleSlash },
  { value: 'a_few', label: 'A few tattoos', icon: PenTool },
  { value: 'visible_sleeves', label: 'Visible / sleeves', icon: PenTool },
  { value: 'ink_enthusiast', label: 'Ink enthusiast', icon: PenTool },
] as const satisfies readonly LifestyleOption[];

export const PIERCING_OPTIONS = [
  { value: 'none', label: 'No piercings', icon: CircleSlash },
  { value: 'ears_only', label: 'Ears only', icon: Gem },
  { value: 'multiple', label: 'Multiple piercings', icon: Gem },
] as const satisfies readonly LifestyleOption[];

export const DRINKING_OPTIONS = [
  { value: 'non_drinker', label: 'Non-drinker', icon: CircleSlash },
  { value: 'socially', label: 'Drinks socially', icon: Beer },
  { value: 'regularly', label: 'Drinks regularly', icon: Beer },
] as const satisfies readonly LifestyleOption[];

export const SMOKING_OPTIONS = [
  { value: 'non_smoker', label: 'Non-smoker', icon: CircleSlash },
  { value: 'vape_only', label: 'Vapes only', icon: Wind },
  { value: 'social_smoker', label: 'Social smoker', icon: Cigarette },
] as const satisfies readonly LifestyleOption[];

export const FITNESS_OPTIONS = [
  { value: 'daily_workouts', label: 'Daily workouts', icon: Dumbbell },
  { value: 'walks_and_hiking', label: 'Walks & hiking', icon: Mountain },
  { value: 'weekend_warrior', label: 'Weekend warrior', icon: Footprints },
  { value: 'homebody', label: 'Homebody', icon: Home },
] as const satisfies readonly LifestyleOption[];

export const LIFESTYLE_FIELDS = {
  body_type: { label: 'Body type', options: BODY_TYPE_OPTIONS },
  tattoos: { label: 'Tattoos', options: TATTOO_OPTIONS },
  piercings: { label: 'Piercings', options: PIERCING_OPTIONS },
  drinking: { label: 'Drinking', options: DRINKING_OPTIONS },
  smoking: { label: 'Smoking', options: SMOKING_OPTIONS },
  fitness_rhythm: { label: 'Fitness', options: FITNESS_OPTIONS },
} as const;

export type LifestyleField = keyof typeof LIFESTYLE_FIELDS;
export type LifestyleValues = Partial<Record<LifestyleField, string | null>>;
export const LIFESTYLE_KEYS = Object.keys(LIFESTYLE_FIELDS) as LifestyleField[];
/** Columns added by 20261109_lifestyle_attributes.sql (the API saves around them until it runs). */
export const NEW_LIFESTYLE_COLUMNS: LifestyleField[] = ['tattoos', 'piercings', 'fitness_rhythm'];

export function lifestyleOption(field: LifestyleField, value: unknown): LifestyleOption | null {
  return (LIFESTYLE_FIELDS[field].options as readonly LifestyleOption[]).find((o) => o.value === value) ?? null;
}

export function isLifestyleValue(field: LifestyleField, value: unknown): boolean {
  return lifestyleOption(field, value) !== null;
}

/** Legacy free-text drinking labels -> enum (null if unknown / not set). */
export function normalizeDrinking(v: unknown): string | null {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return null;
  if (isLifestyleValue('drinking', s)) return s;
  if (/^(no|never|none|non[- ]?drinker|don'?t drink|sober)/.test(s)) return 'non_drinker';
  if (/(social|sometimes|occasion|rarely)/.test(s)) return 'socially';
  if (/(yes|often|regular|frequent)/.test(s)) return 'regularly';
  return null;
}

/** Legacy free-text smoking labels -> enum (null if unknown / not set). */
export function normalizeSmoking(v: unknown): string | null {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return null;
  if (isLifestyleValue('smoking', s)) return s;
  if (/vape/.test(s)) return 'vape_only';
  if (/^(no|never|none|non[- ]?smoker|don'?t smoke)/.test(s)) return 'non_smoker';
  if (/(social|sometimes|occasion|yes|regular)/.test(s)) return 'social_smoker';
  return null;
}

/** Normalizes any lifestyle value read from a profile row (drinking / smoking accept legacy labels). */
export function readLifestyle(field: LifestyleField, v: unknown): string | null {
  if (field === 'drinking') return normalizeDrinking(v);
  if (field === 'smoking') return normalizeSmoking(v);
  return isLifestyleValue(field, v) ? (v as string) : null;
}

// --- Height ---------------------------------------------------------------------------------

export const HEIGHT_MIN_CM = 130;
export const HEIGHT_MAX_CM = 220;

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / 2.54);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54);
}

/** 173 -> `5'8" (173 cm)` */
export function formatHeight(cm: number | null | undefined): string {
  if (!cm || !Number.isFinite(cm)) return '';
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}'${inches}" (${Math.round(cm)} cm)`;
}

/** height_cm, else the legacy free-text `height` column ("173 cm", "5'8\"", "5 ft 8 in"). */
export function readHeightCm(heightCm: unknown, legacy?: unknown): number | null {
  const n = Number(heightCm);
  if (Number.isFinite(n) && n >= HEIGHT_MIN_CM && n <= HEIGHT_MAX_CM) return Math.round(n);
  const s = String(legacy ?? '');
  const cm = s.match(/(\d{3})\s*cm/i);
  if (cm) return Number(cm[1]);
  const ft = s.match(/(\d)\s*(?:'|ft|feet)\s*(\d{1,2})?/i);
  if (ft) return feetInchesToCm(Number(ft[1]), Number(ft[2] || 0));
  return null;
}
