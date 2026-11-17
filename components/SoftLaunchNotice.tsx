'use client';

import React from 'react';
import { useLocale } from '@/components/i18n/LocaleProvider';

/**
 * Understated early-access pill for the landing hero and the login/signup card: one compact purple
 * badge in the page's own column (no bar, banner or popup). Text comes from the active dictionary
 * (launch.badge).
 */
export function SoftLaunchNotice({ className = '' }: { className?: string }) {
  const { t } = useLocale();
  return (
    <div className={`flex justify-center ${className}`}>
      <span className="inline-flex items-center rounded-full border border-[#8574B7]/25 bg-[#8574B7]/10 px-3 py-1.5 text-[11px] font-semibold leading-snug text-[#8574B7]">
        {t('launch.badge')}
      </span>
    </div>
  );
}

export default SoftLaunchNotice;
