'use client';

import React from 'react';
import { Phone } from 'lucide-react';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { formatDuration, type CallEndReason } from '@/lib/callRules';

/** Centered, muted system pill in the chat timeline: "Voice call · 6m 24s", "Missed voice call", "Voice call declined". */
export function CallLogPill({ reason, durationSec }: { reason: CallEndReason; durationSec: number }) {
  const { t } = useLocale();
  if (reason === 'failed') return null; // a call that never connected leaves no trace in the thread
  const label =
    reason === 'completed'
      ? t('call.pillCompleted', { duration: formatDuration(durationSec) })
      : reason === 'declined'
        ? t('call.pillDeclined')
        : t('call.pillMissed');
  return (
    <div className="my-2.5 flex justify-center select-none">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F6F4FB] px-3.5 py-1.5 text-xs text-[#413B5E]/70">
        <Phone className="h-3.5 w-3.5" aria-hidden />
        {label}
      </span>
    </div>
  );
}

export default CallLogPill;
