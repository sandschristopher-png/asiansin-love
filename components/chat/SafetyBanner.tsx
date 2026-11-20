'use client';

import React from 'react';
import { Flag, ShieldAlert } from 'lucide-react';
import { useLocale } from '@/components/i18n/LocaleProvider';
import type { TKey } from '@/lib/i18n';

const TEXT: Record<string, TKey> = {
  financial: 'chat.safety.financial',
  solicitation: 'chat.safety.solicitation',
  adult_content: 'chat.safety.solicitation',
  harassment: 'chat.safety.harassment',
  off_platform: 'chat.safety.offPlatform',
  low_reputation: 'chat.safety.lowReputation',
};

/**
 * Warning under a received message the filters flagged. Only the recipient ever gets the category
 * (message_safety_flags, recipient-only), so a sender cannot learn which wording trips the filter.
 * Carries its own "Report this message" button.
 */
export function SafetyBanner({ kind, onReport }: { kind: string; onReport: () => void }) {
  const { t } = useLocale();
  const key = TEXT[kind];
  if (!key) return null;
  return (
    <div role="note" className="mt-1.5 ml-8 max-w-[84%] rounded-2xl border border-[#726E97]/25 bg-[#FAF9FC] px-3 py-2.5">
      <div className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#726E97]" aria-hidden />
        <p className="text-[11.5px] leading-relaxed text-[#413B5E]">{t(key)}</p>
      </div>
      <button
        type="button"
        onClick={onReport}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#D0CDE1] bg-white px-3 py-1.5 text-[11px] font-medium leading-snug text-[#413B5E] transition-colors hover:bg-[#EAE9F2]/50"
      >
        <Flag className="h-3 w-3 text-[#726E97]" aria-hidden />
        {t('report.messageTitle')}
      </button>
    </div>
  );
}

export default SafetyBanner;
