'use client';

import React, { useMemo, useState } from 'react';
import { Check, Ruler, Search, X } from 'lucide-react';
import { LANGUAGES, MAX_PROFILE_LANGUAGES, languageLabel } from '@/lib/constants/languages';
import {
  HEIGHT_MAX_CM,
  HEIGHT_MIN_CM,
  LIFESTYLE_FIELDS,
  LIFESTYLE_KEYS,
  cmToFeetInches,
  feetInchesToCm,
  formatHeight,
  lifestyleOption,
  type LifestyleField,
  type LifestyleOption,
  type LifestyleValues,
} from '@/lib/lifestyle';

const PILL = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition cursor-pointer';
const PILL_ON = 'bg-[#6555B8] text-white border-[#6555B8]';
const PILL_OFF = 'bg-white text-[#524B5E] border-[#DDD7E5] hover:border-[#6555B8]/50';

/** Searchable multi-select over the preset language list. */
export function LanguagePicker({
  value,
  onChange,
  max = MAX_PROFILE_LANGUAGES,
  placeholder = 'Search languages',
}: {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LANGUAGES.filter((l) => !value.includes(l.value)).filter(
      (l) => !q || l.label.toLowerCase().includes(q) || l.value.toLowerCase().includes(q)
    );
  }, [query, value]);
  const full = value.length >= max;

  return (
    <div className="space-y-2.5">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 pl-3 pr-2 py-1 rounded-full bg-[#F3EFFC] border border-[#DDD7E5] text-xs font-semibold text-[#6555B8]">
              {languageLabel(v)}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} aria-label={`Remove ${v}`} className="hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9A93A8]" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={full ? `Up to ${max} languages` : placeholder}
          disabled={full}
          className="w-full pl-8 pr-3 py-2 rounded-2xl bg-[#F8F7FA] border border-[#DDD7E5] text-base sm:text-xs font-medium text-[#1C1924] focus:outline-none focus:border-[#6555B8] disabled:opacity-60"
        />
      </div>
      {!full && (
        <div className="max-h-40 overflow-y-auto rounded-2xl border border-[#ECE8F4] divide-y divide-[#F0EDF5] bg-white">
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[#9A93A8]">No matching languages</p>
          ) : (
            matches.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => {
                  onChange([...value, l.value]);
                  setQuery('');
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-[#1C1924] hover:bg-[#F3EFFC]"
              >
                {l.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** Height in cm with a feet / inches or centimeters entry mode. */
export function HeightInput({ valueCm, onChange }: { valueCm: number | null; onChange: (cm: number | null) => void }) {
  const [unit, setUnit] = useState<'ft' | 'cm'>('ft');
  const fi = valueCm ? cmToFeetInches(valueCm) : null;
  const select = 'px-2.5 py-1.5 rounded-xl bg-[#F8F7FA] border border-[#DDD7E5] text-base sm:text-xs font-semibold text-[#1C1924] focus:outline-none focus:border-[#6555B8]';
  const cmOptions = useMemo(() => Array.from({ length: HEIGHT_MAX_CM - HEIGHT_MIN_CM + 1 }, (_, i) => HEIGHT_MIN_CM + i), []);

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-end">
      {unit === 'ft' ? (
        <>
          <select
            aria-label="Feet"
            className={select}
            value={fi?.feet ?? ''}
            onChange={(e) => {
              const feet = Number(e.target.value);
              onChange(e.target.value ? clampCm(feetInchesToCm(feet, fi?.inches ?? 0)) : null);
            }}
          >
            <option value="">ft</option>
            {[4, 5, 6, 7].map((f) => (
              <option key={f} value={f}>{f} ft</option>
            ))}
          </select>
          <select
            aria-label="Inches"
            className={select}
            value={fi ? fi.inches : ''}
            disabled={!fi}
            onChange={(e) => fi && onChange(clampCm(feetInchesToCm(fi.feet, Number(e.target.value))))}
          >
            <option value="">in</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{i} in</option>
            ))}
          </select>
        </>
      ) : (
        <select
          aria-label="Centimeters"
          className={select}
          value={valueCm ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">cm</option>
          {cmOptions.map((c) => (
            <option key={c} value={c}>{c} cm</option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={() => setUnit(unit === 'ft' ? 'cm' : 'ft')}
        className="px-2 py-1.5 rounded-xl text-[11px] font-semibold text-[#6555B8] hover:bg-[#F3EFFC]"
        aria-label={`Switch to ${unit === 'ft' ? 'centimeters' : 'feet and inches'}`}
      >
        {unit === 'ft' ? 'cm' : 'ft/in'}
      </button>
      {valueCm && <span className="w-full text-right text-[11px] text-[#8C849B]">{formatHeight(valueCm)}</span>}
    </div>
  );
}

const clampCm = (cm: number) => Math.min(HEIGHT_MAX_CM, Math.max(HEIGHT_MIN_CM, cm));

/** Single-choice pills for each lifestyle field. Tapping the active pill clears it. */
export function LifestylePills({
  values,
  onChange,
  fields = LIFESTYLE_KEYS,
}: {
  values: LifestyleValues;
  onChange: (field: LifestyleField, value: string | null) => void;
  fields?: LifestyleField[];
}) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field} className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C849B]">{LIFESTYLE_FIELDS[field].label}</p>
          <div className="flex flex-wrap gap-1.5">
            {(LIFESTYLE_FIELDS[field].options as readonly LifestyleOption[]).map((o) => {
              const on = values[field] === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange(field, on ? null : o.value)}
                  className={`${PILL} ${on ? PILL_ON : PILL_OFF}`}
                >
                  {on ? <Check className="w-3 h-3" aria-hidden /> : <o.icon className="w-3 h-3" aria-hidden />}
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Read-only lifestyle badges (plus height) for profile views. Renders nothing when empty. */
export function LifestyleBadges({ values, heightCm, className = '' }: { values: LifestyleValues; heightCm?: number | null; className?: string }) {
  const chips = LIFESTYLE_KEYS.map((field) => lifestyleOption(field, values[field])).filter(Boolean) as LifestyleOption[];
  if (!chips.length && !heightCm) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {heightCm ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3EFFC] border border-[#ECE8F4] text-xs font-semibold text-[#6555B8]">
          <Ruler className="w-3 h-3" aria-hidden /> {formatHeight(heightCm)}
        </span>
      ) : null}
      {chips.map((o) => (
        <span key={o.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3EFFC] border border-[#ECE8F4] text-xs font-semibold text-[#6555B8]">
          <o.icon className="w-3 h-3" aria-hidden /> {o.label}
        </span>
      ))}
    </div>
  );
}
