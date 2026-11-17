'use client';

import React from 'react';
import { Flame, Heart, Laugh, ThumbsUp } from 'lucide-react';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { REACTION_KEYS, type ReactionKey, type ReactionTally } from '@/lib/reactions';
import type { TKey } from '@/lib/i18n';

const ICON: Record<ReactionKey, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  heart: Heart,
  thumbs_up: ThumbsUp,
  laugh: Laugh,
  fire: Flame,
};
const LABEL: Record<ReactionKey, TKey> = {
  heart: 'chat.react.heart',
  thumbs_up: 'chat.react.thumbsUp',
  laugh: 'chat.react.laugh',
  fire: 'chat.react.fire',
};

/** The four line-art reactions in a small white capsule under a tapped bubble. */
export function ReactionPicker({ mine, onPick }: { mine: ReactionKey | null; onPick: (key: ReactionKey) => void }) {
  const { t } = useLocale();
  return (
    <div
      role="group"
      aria-label={t('chat.react.picker')}
      className="inline-flex items-center gap-0.5 rounded-full border border-[#E6E2F0] bg-white px-1.5 py-1 shadow-[0_6px_18px_rgba(65,59,94,0.12)]"
    >
      {REACTION_KEYS.map((key) => {
        const Icon = ICON[key];
        const on = mine === key;
        return (
          <button
            key={key}
            type="button"
            aria-label={t(LABEL[key])}
            aria-pressed={on}
            title={t(LABEL[key])}
            onClick={(e) => {
              e.stopPropagation(); // a tap on the picker must not toggle the bubble's own tap action
              onPick(key);
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition active:scale-90 ${
              on ? 'bg-[#8574B7]/12 text-[#8574B7]' : 'text-[#413B5E]/70 hover:bg-[#F6F4FB] hover:text-[#8574B7]'
            }`}
          >
            <Icon className={`h-[18px] w-[18px] ${on && key === 'heart' ? 'fill-current' : ''}`} strokeWidth={1.9} />
          </button>
        );
      })}
    </div>
  );
}

/** Compact tally pills beside or under the bubble; tapping one toggles the viewer's own reaction of that kind. */
export function ReactionPills({ tally, onToggle }: { tally: ReactionTally[]; onToggle: (key: ReactionKey) => void }) {
  const { t } = useLocale();
  return (
    <div className="flex flex-wrap gap-1">
      {tally.map(({ reaction, count, mine }) => {
        const Icon = ICON[reaction];
        return (
          <button
            key={reaction}
            type="button"
            aria-label={`${t(LABEL[reaction])} ${count}`}
            aria-pressed={mine}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(reaction);
            }}
            className={`inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-semibold tabular-nums transition active:scale-95 ${
              mine ? 'border-[#8574B7]/35 bg-[#8574B7]/10 text-[#8574B7]' : 'border-[#E6E2F0] bg-white text-[#413B5E]/75 hover:bg-[#F6F4FB]'
            }`}
          >
            <Icon className={`h-3 w-3 ${mine && reaction === 'heart' ? 'fill-current' : ''}`} strokeWidth={2} />
            {count}
          </button>
        );
      })}
    </div>
  );
}
