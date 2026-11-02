import React from 'react';
import { rhythmOption, RHYTHM_FIELDS, type RhythmField, type RhythmOption } from '@/lib/rhythm';
import { reputationTier } from '@/lib/reputation';

const REP_TIER_CLASS = {
  good: 'bg-[#F3EFFC] border-[#E2DBF0] text-[#6555B8]',
  fair: 'bg-amber-50 border-amber-200 text-amber-800',
  low: 'bg-rose-50 border-rose-200 text-rose-700',
} as const;

/** 90-100 "9X% Rep" (lilac), 70-89 "Fair Rep" (amber), under 70 "Low Rep / Under Review" (red). */
export function RepBadge({
  score,
  onClick,
  className = '',
}: {
  score: number;
  onClick?: () => void;
  className?: string;
}) {
  const { tier, label } = reputationTier(score);
  const cls = `inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-semibold whitespace-nowrap ${REP_TIER_CLASS[tier]} ${className}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} transition active:scale-95 cursor-pointer`}>
      {label}
    </button>
  ) : (
    <span className={cls}>{label}</span>
  );
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
      ? 'bg-white/20 border-white/30 text-white backdrop-blur-xs'
      : 'bg-[#F3EFFC] border-[#E2DBF0] text-[#6555B8]';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold whitespace-nowrap ${tone} ${className}`}
    >
      <span aria-hidden>{opt.emoji}</span>
      <span>{opt.label}</span>
    </span>
  );
}

/** "✨ N in common" card (full) or a one-line chip row (compact) for Discover cards. */
export function InCommonCard({ items, compact = false }: { items: string[]; compact?: boolean }) {
  if (items.length === 0) return null;
  if (compact) {
    return (
      <span className="inline-flex max-w-full items-center px-2 py-0.5 rounded-full bg-[#F3EFFC] border border-[#6555B8]/30 text-[10px] text-[#6555B8]">
        <span className="truncate">
          <span className="font-bold">✨ {items.length} in common:</span> {items.slice(0, 2).join(', ')}
        </span>
      </span>
    );
  }
  return (
    <div className="p-3 rounded-2xl bg-[#F3EFFC] border border-[#6555B8]/30 space-y-2">
      <p className="text-xs font-bold text-[#6555B8]">
        ✨ {items.length} in common
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="px-2.5 py-1 rounded-full bg-white border border-[#6555B8]/30 text-[11px] font-semibold text-[#6555B8]"
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
      <p className="block w-full text-xs font-semibold leading-snug text-[#1C1924]">{label}</p>
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
                  ? 'bg-[#6555B8] border-[#6555B8] text-white'
                  : 'bg-white border-[#DDD7E5] text-[#1C1924] hover:bg-[#F3EFFC]'
              }`}
            >
              <span aria-hidden>{o.emoji}</span>
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
