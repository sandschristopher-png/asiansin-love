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

/**
 * The reaction bar: four small line-art icons that float just above a message. It stays out of the way until
 * wanted: hovering the bubble (pointer devices) or tapping it (touch, `forced`) fades it in. The
 * parent bubble must be `relative group/msg`; nothing here takes up space in the thread.
 */
export function ReactionBar({
  mine,
  forced,
  align,
  onPick,
}: {
  mine: ReactionKey | null;
  /** Tapped open: show it regardless of hover. */
  forced: boolean;
  /** The bar hangs from the bubble's outer edge. */
  align: 'start' | 'end';
  onPick: (key: ReactionKey) => void;
}) {
  const { t } = useLocale();
  return (
    <span
      data-reaction-bar
      className={`absolute bottom-full z-20 pb-1.5 transition duration-150 ${align === 'end' ? 'right-0' : 'left-0'} ${
        forced
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-1 opacity-0 group-hover/msg:pointer-events-auto group-hover/msg:translate-y-0 group-hover/msg:opacity-100 focus-within:pointer-events-auto focus-within:translate-y-0 focus-within:opacity-100'
      }`}
    >
      <span role="group" aria-label={t('chat.react.picker')} className="inline-flex items-center gap-0.5 rounded-full border border-[#E6E2F0] bg-white/95 px-1 py-0.5 shadow-[0_4px_14px_rgba(65,59,94,0.10)] backdrop-blur-sm">
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
                e.stopPropagation();
                onPick(key);
              }}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition active:scale-90 ${
                on ? 'bg-[#F6F4FB] text-[#8574B7]' : 'text-[#413B5E]/60 hover:bg-[#F6F4FB] hover:text-[#8574B7]'
              }`}
            >
              <Icon className={`h-4 w-4 ${on && key === 'heart' ? 'fill-current' : ''}`} strokeWidth={1.75} />
            </button>
          );
        })}
      </span>
    </span>
  );
}

/**
 * Reactions on a message: small soft chips directly beneath the bubble, a lavender surface with a hairline
 * border. A single reaction is just its icon; a count appears once two people used the same one. Yours has the
 * stronger lavender tint. Tapping a chip toggles your own reaction of that kind.
 */
export function ReactionPills({ tally, onToggle }: { tally: ReactionTally[]; onToggle: (key: ReactionKey) => void }) {
  const { t } = useLocale();
  return (
    <span className="inline-flex items-center gap-1">
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
            className={`inline-flex h-[22px] min-w-[22px] items-center justify-center gap-0.5 rounded-full border px-1.5 text-[10.5px] font-semibold tabular-nums transition active:scale-90 ${
              mine ? 'border-[#8574B7]/35 bg-[#EFEBF9] text-[#8574B7]' : 'border-[#E6E2F0] bg-[#F6F4FB] text-[#413B5E]/70 hover:text-[#8574B7]'
            }`}
          >
            <Icon className={`h-3 w-3 ${reaction === 'heart' ? 'fill-current' : ''}`} strokeWidth={2} />
            {count > 1 && count}
          </button>
        );
      })}
    </span>
  );
}
