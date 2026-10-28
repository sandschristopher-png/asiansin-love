'use client';

import { Sparkles, MessageCircle, Check } from 'lucide-react';

export interface InterestItem {
  tag_id: string;
  label: string;
  icon?: string | null;
  is_highlight: boolean;
  highlight_story?: string | null;
  is_common_ground: boolean;
}

interface ProfileHighlightsProps {
  userName: string;
  interests: InterestItem[];
  onOpenMessageWithTopic?: (topic: string) => void;
}

export function ProfileHighlights({
  userName,
  interests,
  onOpenMessageWithTopic,
}: ProfileHighlightsProps) {
  const highlights = interests.filter((i) => i.is_highlight);
  const commonGround = interests.filter((i) => i.is_common_ground && !i.is_highlight);
  const generalInterests = interests.filter((i) => !i.is_highlight && !i.is_common_ground);

  if (interests.length === 0) return null;

  return (
    <div className="space-y-5 py-2">
      {highlights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {userName} — Highlights
            </h4>
            <span className="flex items-center gap-1 text-[11px] font-medium text-[#6555B8]">
              <Sparkles className="h-3 w-3" /> Featured
            </span>
          </div>

          <div className="grid gap-2.5">
            {highlights.map((item) => (
              <button
                key={item.tag_id}
                type="button"
                onClick={() =>
                  onOpenMessageWithTopic?.(item.highlight_story || item.label)
                }
                disabled={!onOpenMessageWithTopic}
                className="group relative w-full rounded-2xl border border-neutral-200/80 bg-white p-3.5 text-left shadow-sm transition hover:border-[#6555B8]/40 disabled:cursor-default disabled:hover:border-neutral-200/80 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {item.label}
                  </span>
                  {item.is_common_ground && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#6555B8]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#6555B8]">
                      <Check className="h-3 w-3" /> Common Ground
                    </span>
                  )}
                </div>

                {item.highlight_story && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl bg-neutral-50 p-2.5 text-xs text-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-300">
                    <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6555B8]" />
                    <p className="italic">{item.highlight_story}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Interests &amp; Common Ground
        </h4>

        <div className="flex flex-wrap gap-2">
          {commonGround.map((item) => (
            <span
              key={item.tag_id}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#6555B8]/30 bg-[#6555B8]/10 px-3 py-1.5 text-xs font-semibold text-[#6555B8]"
            >
              <Check className="h-3.5 w-3.5" />
              {item.label}
            </span>
          ))}

          {generalInterests.map((item) => (
            <span
              key={item.tag_id}
              className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300"
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}