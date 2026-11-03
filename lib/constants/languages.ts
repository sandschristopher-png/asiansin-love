/**
 * Languages offered in profile editing and the Discover language filter.
 * `value` is what is stored in profiles.languages (text[]); `label` is what members see.
 */
export interface LanguageOption {
  value: string;
  label: string;
}

export const LANGUAGES: readonly LanguageOption[] = [
  { value: 'English', label: 'English' },
  { value: 'Tagalog', label: 'Tagalog (Filipino)' },
  { value: 'Cebuano', label: 'Cebuano (Bisaya)' },
  { value: 'Ilocano', label: 'Ilocano' },
  { value: 'Hiligaynon', label: 'Hiligaynon (Ilonggo)' },
  { value: 'Waray', label: 'Waray' },
  { value: 'Kapampangan', label: 'Kapampangan' },
  { value: 'Bicolano', label: 'Bicolano' },
  { value: 'Pangasinan', label: 'Pangasinan' },
  { value: 'Japanese', label: 'Japanese (日本語)' },
  { value: 'Korean', label: 'Korean (한국어)' },
  { value: 'Mandarin Chinese', label: 'Mandarin Chinese (中文)' },
  { value: 'Cantonese', label: 'Cantonese (粵語)' },
  { value: 'Vietnamese', label: 'Vietnamese (Tiếng Việt)' },
  { value: 'Thai', label: 'Thai (ไทย)' },
  { value: 'Indonesian', label: 'Indonesian (Bahasa Indonesia)' },
  { value: 'Malay', label: 'Malay (Bahasa Melayu)' },
  { value: 'Khmer', label: 'Khmer (ភាសាខ្មែរ)' },
  { value: 'Burmese', label: 'Burmese (မြန်မာဘာသာ)' },
  { value: 'Hindi', label: 'Hindi (हिन्दी)' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
];

export const MAX_PROFILE_LANGUAGES = 10;

const ALIASES: Record<string, string> = {
  filipino: 'Tagalog',
  pilipino: 'Tagalog',
  bisaya: 'Cebuano',
  binisaya: 'Cebuano',
  visayan: 'Cebuano',
  ilonggo: 'Hiligaynon',
  ilokano: 'Ilocano',
  bikol: 'Bicolano',
  bicol: 'Bicolano',
  mandarin: 'Mandarin Chinese',
  chinese: 'Mandarin Chinese',
  'bahasa indonesia': 'Indonesian',
  bahasa: 'Indonesian',
  'bahasa melayu': 'Malay',
  cambodian: 'Khmer',
  myanmar: 'Burmese',
  español: 'Spanish',
  francais: 'French',
  français: 'French',
  deutsch: 'German',
};

const BY_VALUE = new Map(LANGUAGES.map((l) => [l.value.toLowerCase(), l]));

/** Canonical stored value for a typed / legacy language name, or null if it is not offered. */
export function canonicalLanguage(input: string): string | null {
  const key = String(input || '').trim().toLowerCase();
  if (!key) return null;
  const direct = BY_VALUE.get(key);
  if (direct) return direct.value;
  if (ALIASES[key]) return ALIASES[key];
  // "Tagalog (Filipino)" style labels
  const base = key.replace(/\s*\(.*\)\s*$/, '');
  return BY_VALUE.get(base)?.value ?? ALIASES[base] ?? null;
}

export function languageLabel(value: string): string {
  return BY_VALUE.get(String(value || '').toLowerCase())?.label ?? value;
}

/**
 * Reads profiles.languages in any stored shape: text[] (after 20261109), the JSON text an array
 * becomes in the old text column ('["English","Tagalog"]'), or a legacy comma list.
 */
export function readLanguages(v: unknown): string[] {
  let raw: unknown[] = [];
  if (Array.isArray(v)) raw = v;
  else if (typeof v === 'string') {
    const t = v.trim();
    if (t.startsWith('[') || t.startsWith('{')) {
      try {
        const parsed = JSON.parse(t.startsWith('{') ? `[${t.slice(1, -1)}]` : t);
        raw = Array.isArray(parsed) ? parsed : [];
      } catch {
        raw = t.replace(/^[[{]|[\]}]$/g, '').split(',');
      }
    } else {
      raw = t.split(',');
    }
  }
  const out: string[] = [];
  for (const item of raw) {
    const s = String(item ?? '').replace(/^"|"$/g, '').trim();
    if (!s) continue;
    const canon = canonicalLanguage(s) ?? s;
    if (!out.some((x) => x.toLowerCase() === canon.toLowerCase())) out.push(canon);
  }
  return out;
}

/** Canonical, de-duplicated list of offered languages (unknown entries dropped), for saving. */
export function normalizeLanguages(v: unknown): string[] {
  return readLanguages(v)
    .map((l) => canonicalLanguage(l))
    .filter((l): l is string => Boolean(l))
    .filter((l, i, all) => all.indexOf(l) === i)
    .slice(0, MAX_PROFILE_LANGUAGES);
}
