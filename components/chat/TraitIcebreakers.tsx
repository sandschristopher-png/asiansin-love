'use client';

import React from 'react';

function cleanTraits(traits: unknown): string[] {
  if (!Array.isArray(traits)) return [];
  const byKey = new Map<string, string>();
  for (const t of traits) {
    if (typeof t !== 'string' || !t.trim()) continue;
    const key = t.trim().toLowerCase();
    if (!byKey.has(key)) byKey.set(key, t.trim());
  }
  return Array.from(byKey.values());
}

/** Shared-interest pills on an empty thread; one tap drafts an opener. Renders nothing without traits. */
export function TraitIcebreakers({
  myTraits,
  theirTraits,
  theirName,
  onSelectPrompt,
}: {
  myTraits: string[];
  theirTraits: string[];
  theirName: string;
  onSelectPrompt: (messageText: string) => void;
}) {
  const theirs = cleanTraits(theirTraits);
  const mine = new Set(cleanTraits(myTraits).map((t) => t.toLowerCase()));
  const common = theirs.filter((t) => mine.has(t.toLowerCase()));
  const hasCommon = common.length > 0;
  const shown = hasCommon ? common.slice(0, 3) : theirs.slice(0, 2);
  if (shown.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#D0CDE1] bg-[#E8E6F1]/30 backdrop-blur-md p-4 text-center shadow-xs">
      <p className="text-xs font-semibold text-[#413B5E]">
        {hasCommon ? 'You Both Have in Common' : `Ask ${theirName?.trim() || 'Them'} About`}
      </p>
      <p className="mt-1 text-[11px] text-slate-600">Tap one to start the conversation.</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {shown.map((trait) => (
          <button
            key={trait}
            type="button"
            onClick={() =>
              onSelectPrompt(
                hasCommon
                  ? `I noticed we both love ${trait}! How long have you been into that?`
                  : `I saw on your profile that you enjoy ${trait}. What got you into it?`
              )
            }
            className="inline-flex items-center gap-1.5 border border-[#D0CDE1] bg-white px-3 py-1.5 text-xs font-medium text-[#413B5E] shadow-2xs hover:border-[#8574B7] hover:bg-[#8574B7]/5 active:scale-95 transition-all cursor-pointer rounded-full"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8574B7]" aria-hidden />
            {trait}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TraitIcebreakers;
