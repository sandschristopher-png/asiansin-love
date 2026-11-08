import React from 'react';
import { rhythmOption, RHYTHM_FIELDS, type RhythmField, type RhythmOption } from '@/lib/rhythm';
import { reputationTier } from '@/lib/reputation';
import { ReputationBadge } from '@/components/ReputationBadge';

const REP_TIER_CLASS = {
  good: 'bg-[#E8E6F1]/60 border-[#D0CDE1] text-[#8574B7]',
  fair: 'bg-amber-50 border-amber-200 text-amber-800',
  low: 'bg-red-50 border-red-200 text-red-700',
} as const;

/** Reputation pill ("[Shield] 98%", tier-colored); kept for existing callers. */
export function RepBadge({
  score,
  onClick,
  className = '',
}: {
  score: number;
  onClick?: () => void;
  className?: string;
}) {
  return <ReputationBadge score={score} onClick={onClick} className={className} />;
}

/** Small pill for a rhythm value (reply pace, relocation, timeline). Renders nothing when unset. */
export function RhythmPill({
  field,
  value,
  variant = 'light',
  className = '',
}: {
  field: RhythmField;
  value: unknown;
  variant?: 'light' | 'glass';
  className?: string;
}) {
  const opt = rhythmOption(field, value);
  if (!opt) return null;
  const tone =
    variant === 'glass'
      ? 'bg-black/35 border-white/25 text-white'
      : 'bg-[#E8E6F1]/60 border-[#D0CDE1] text-[#8574B7]';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold whitespace-nowrap ${tone} ${className}`}
    >
      <opt.icon className="w-3 h-3 shrink-0" aria-hidden />
      <span>{opt.label}</span>
    </span>
  );
}

/**
 * "N in common" card (full, with the shared items) or a count-only chip (compact) for Discover
 * cards: "1 thing in common" / "3 things in common". No item names and no emoji, so it never
 * truncates in the ~170px card column.
 */
export function InCommonCard({ items, compact = false }: { items: string[]; compact?: boolean }) {
  if (items.length === 0) return null;
  if (compact) {
    return (
      <span className="inline-flex items-center whitespace-nowrap bg-black/40 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full">
        {items.length === 1 ? '1 thing in common' : `${items.length} things in common`}
      </span>
    );
  }
  return (
    <div className="p-3 rounded-2xl bg-[#E8E6F1]/60 border border-[#8574B7]/30 space-y-2">
      <p className="text-xs font-bold text-[#8574B7]">
        {items.length} in common
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="px-2.5 py-1 rounded-full bg-white border border-[#8574B7]/30 text-[11px] font-semibold text-[#8574B7]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Single-choice pill selector for one rhythm field. Tapping the active pill clears it. */
export function RhythmSelector({
  field,
  label,
  value,
  onChange,
}: {
  field: RhythmField;
  label: string;
  value: string | null | undefined;
  onChange: (next: string | null) => void;
}) {
  const options = RHYTHM_FIELDS[field] as readonly RhythmOption[];
  return (
    <div className="w-full min-w-0 space-y-1.5">
      <p className="block w-full text-xs font-semibold leading-snug text-[#413B5E]">{label}</p>
      <div className="flex w-full flex-wrap gap-1.5">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(active ? null : o.value)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition active:scale-95 ${
                active
                  ? 'bg-[#8574B7] border-[#8574B7] text-white'
                  : 'bg-white border-[#D0CDE1] text-[#413B5E] hover:bg-[#E8E6F1]/70'
              }`}
            >
              <o.icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span>{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface RhythmValues {
  reply_pace: string | null;
  relocation_readiness: string | null;
  timeline_intent: string | null;
}

export const EMPTY_RHYTHM: RhythmValues = { reply_pace: null, relocation_readiness: null, timeline_intent: null };

/** The three rhythm selectors used by onboarding, /profile and /profile/edit. */
export function RhythmSelectors({ value, onChange }: { value: RhythmValues; onChange: (next: RhythmValues) => void }) {
  return (
    <div className="space-y-3.5">
      <RhythmSelector
        field="reply_pace"
        label="Your messaging rhythm"
        value={value.reply_pace}
        onChange={(v) => onChange({ ...value, reply_pace: v })}
      />
      <RhythmSelector
        field="relocation_readiness"
        label="Relocation"
        value={value.relocation_readiness}
        onChange={(v) => onChange({ ...value, relocation_readiness: v })}
      />
      <RhythmSelector
        field="timeline_intent"
        label="Timeline"
        value={value.timeline_intent}
        onChange={(v) => onChange({ ...value, timeline_intent: v })}
      />
    </div>
  );
}

/** Pulls the rhythm columns off a profile row (null until the migration adds them). */
export function rhythmFromRow(row: Record<string, unknown> | null | undefined): RhythmValues {
  const pick = (f: RhythmField) => (rhythmOption(f, row?.[f]) ? String(row?.[f]) : null);
  return {
    reply_pace: pick('reply_pace'),
    relocation_readiness: pick('relocation_readiness'),
    timeline_intent: pick('timeline_intent'),
  };
}
