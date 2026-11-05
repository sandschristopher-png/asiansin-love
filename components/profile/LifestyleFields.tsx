'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Ruler, Search, X } from 'lucide-react';
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
const PILL_ON = 'bg-[#72519A] text-white border-[#72519A]';
const PILL_OFF = 'bg-white text-[#51376D]/85 border-[#D5C6EC] hover:border-[#72519A]/50';

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
            <span key={v} className="inline-flex items-center gap-1 pl-3 pr-2 py-1 rounded-full bg-[#E8DFF5]/60 border border-[#D5C6EC] text-xs font-semibold text-[#72519A]">
              {languageLabel(v)}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} aria-label={`Remove ${v}`} className="hover:text-[#72519A]">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#51376D]/55" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={full ? `Up to ${max} languages` : placeholder}
          disabled={full}
          className="w-full pl-8 pr-3 py-2 rounded-2xl bg-white border border-[#D5C6EC] text-base sm:text-xs font-medium text-[#51376D] focus:outline-none focus:border-[#72519A] disabled:opacity-60"
        />
      </div>
      {!full && (
        <div className="max-h-40 overflow-y-auto rounded-2xl border border-[#D5C6EC] divide-y divide-[#D5C6EC] bg-white">
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[#51376D]/55">No matching languages</p>
          ) : (
            matches.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => {
                  onChange([...value, l.value]);
                  setQuery('');
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-[#51376D] hover:bg-[#E8DFF5]/70"
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

/**
 * Height in cm, picked from a styled scrollable list (feet / inches or centimeters). Replaces the
 * native <select> popups, whose OS listbox highlights in Windows blue.
 */
export function HeightInput({ valueCm, onChange }: { valueCm: number | null; onChange: (cm: number | null) => void }) {
  const [unit, setUnit] = useState<'ft' | 'cm'>('ft');
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => {
    if (unit === 'cm') {
      return Array.from({ length: HEIGHT_MAX_CM - HEIGHT_MIN_CM + 1 }, (_, i) => {
        const cm = HEIGHT_MIN_CM + i;
        return { cm, label: `${cm} cm` };
      });
    }
    // One row per inch in range: 4'7" ... 7'2"
    const first = Math.ceil(HEIGHT_MIN_CM / 2.54);
    const last = Math.floor(HEIGHT_MAX_CM / 2.54);
    return Array.from({ length: last - first + 1 }, (_, i) => {
      const total = first + i;
      const feet = Math.floor(total / 12);
      const inches = total % 12;
      return { cm: clampCm(feetInchesToCm(feet, inches)), label: `${feet}' ${inches}"` };
    });
  }, [unit]);

  const isSelected = (cm: number) => {
    if (!valueCm) return false;
    if (unit === 'cm') return Math.round(valueCm) === cm;
    const a = cmToFeetInches(valueCm);
    const b = cmToFeetInches(cm);
    return a.feet === b.feet && a.inches === b.inches;
  };
  const current = valueCm ? options.find((o) => isSelected(o.cm))?.label ?? formatHeight(valueCm) : null;

  // Opening the list scrolls the current height into view.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' });
  }, [open, unit]);

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-end">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D5C6EC] text-base sm:text-xs font-semibold text-[#51376D] hover:bg-[#E8DFF5]/40 transition-colors cursor-pointer"
      >
        <Ruler className="w-3.5 h-3.5 text-[#51376D]/40" aria-hidden />
        {current ?? 'Select height'}
        <ChevronDown className={`w-3.5 h-3.5 text-[#51376D]/40 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => setUnit(unit === 'ft' ? 'cm' : 'ft')}
        className="px-2 py-1.5 rounded-xl text-[11px] font-semibold text-[#72519A] hover:bg-[#E8DFF5]/70"
        aria-label={`Switch to ${unit === 'ft' ? 'centimeters' : 'feet and inches'}`}
      >
        {unit === 'ft' ? 'cm' : 'ft/in'}
      </button>
      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-label="Height"
          className="w-full max-h-48 overflow-y-auto rounded-xl border border-[#D5C6EC] bg-white divide-y divide-[#D5C6EC]/60"
        >
          <div
            role="option"
            aria-selected={!valueCm}
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={`px-3.5 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between hover:bg-[#E8DFF5]/40 border-l-2 ${
              !valueCm ? 'bg-[#E8DFF5]/70 text-[#51376D] font-semibold border-[#72519A]' : 'text-[#51376D]/50 border-transparent'
            }`}
          >
            Prefer not to say
          </div>
          {options.map((o) => {
            const selected = isSelected(o.cm);
            return (
              <div
                key={o.label}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(o.cm);
                  setOpen(false);
                }}
                className={`px-3.5 py-2 text-sm text-[#51376D] cursor-pointer transition-colors flex items-center justify-between hover:bg-[#E8DFF5]/40 border-l-2 ${
                  selected ? 'bg-[#E8DFF5]/70 text-[#51376D] font-semibold border-[#72519A]' : 'border-transparent'
                }`}
              >
                <span>{o.label}</span>
                {unit === 'ft' && <span className="text-[11px] text-[#51376D]/40">{o.cm} cm</span>}
              </div>
            );
          })}
        </div>
      )}
      {valueCm && <span className="w-full text-right text-[11px] text-[#51376D]/55">{formatHeight(valueCm)}</span>}
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
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#51376D]/55">{LIFESTYLE_FIELDS[field].label}</p>
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8DFF5]/60 border border-[#D5C6EC] text-xs font-semibold text-[#72519A]">
          <Ruler className="w-3 h-3" aria-hidden /> {formatHeight(heightCm)}
        </span>
      ) : null}
      {chips.map((o) => (
        <span key={o.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8DFF5]/60 border border-[#D5C6EC] text-xs font-semibold text-[#72519A]">
          <o.icon className="w-3 h-3" aria-hidden /> {o.label}
        </span>
      ))}
    </div>
  );
}
