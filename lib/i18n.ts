import en from '@/messages/en.json';

/**
 * Translation core. messages/en.json is the canonical dictionary and the fallback: every other
 * language is a partial copy of it, merged over English at load time, so a missing key (or an
 * empty string) shows the English text and a raw key never reaches the screen. Keys are typed
 * from en.json, so a typo is a build error.
 */
export type Messages = typeof en;

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends string ? T[K] : DeepPartial<T[K]> };

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

/** Dotted path to a string in en.json, for example "nav.discover" or "travel.card.title". */
export type TKey = Leaves<Messages>;

export const EN: Messages = en;

function merge(base: unknown, over: unknown): unknown {
  if (typeof base === 'string') return typeof over === 'string' && over.trim() !== '' ? over : base;
  if (base && typeof base === 'object') {
    const o = over && typeof over === 'object' ? (over as Record<string, unknown>) : {};
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(base)) out[k] = merge((base as Record<string, unknown>)[k], o[k]);
    return out;
  }
  return base;
}

/** English with `override` laid over it: always a complete dictionary. */
export function mergeMessages(override?: DeepPartial<Messages> | null): Messages {
  return override ? (merge(en, override) as Messages) : en;
}

function dig(m: Messages, key: string): string | undefined {
  let cur: unknown = m;
  for (const part of key.split('.')) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

/** "In {city} now" with { city: 'Manila' } -> "In Manila now". Unknown placeholders are left as written. */
export function format(text: string, vars?: Record<string, string | number>): string {
  return vars ? text.replace(/\{(\w+)\}/g, (whole, name) => (name in vars ? String(vars[name]) : whole)) : text;
}

/** `m` is already merged over English, so the English fallback is built in. */
export function translate(m: Messages, key: TKey, vars?: Record<string, string | number>): string {
  return format(dig(m, key) ?? dig(en, key) ?? '', vars);
}
