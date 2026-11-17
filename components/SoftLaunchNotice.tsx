'use client';

import React from 'react';
import { useLocale } from '@/components/i18n/LocaleProvider';

/**
 * Understated early-access note for the landing page and the login/signup card: a purple pill and
 * one short paragraph, in the page's own column (no bar, banner or popup). Text comes from the
 * active dictionary (launch.badge, launch.sub).
 */
export function SoftLaunchNotice({ className = '' }: { className?: string }) {
  const { t } = useLocale();
  return (
    <div className={`flex flex-col items-center gap-2 text-center ${className}`}>
      <span className="inline-flex items-center rounded-full border border-[#8574B7]/25 bg-[#8574B7]/10 px-3 py-1.5 text-[11px] font-semibold leading-snug text-[#8574B7]">
        {t('launch.badge')}
      </span>
      <p className="max-w-[320px] text-xs leading-relaxed text-slate-600">{t('launch.sub')}</p>
    </div>
  );
}

export default SoftLaunchNotice;
