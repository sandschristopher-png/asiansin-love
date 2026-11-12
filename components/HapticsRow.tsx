'use client';

import React, { useEffect, useState } from 'react';
import { Vibrate } from 'lucide-react';
import { hapticTap, hapticsEnabled, hapticsSupported, setHapticsEnabled } from '@/lib/utils/haptics';
import { Switch } from '@/components/ui/Switch';
import { useLocale } from '@/components/i18n/LocaleProvider';

/** Settings row: device-local haptic feedback toggle (lib/utils/haptics.ts). */
export function HapticsRow() {
  const { t } = useLocale();
  const [on, setOn] = useState(true);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setOn(hapticsEnabled());
    setSupported(hapticsSupported());
  }, []);

  const toggle = () => {
    const next = !on;
    setHapticsEnabled(next);
    setOn(next);
    if (next) hapticTap();
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#E8E6F1]/40 transition">
      <div className="flex items-center gap-3 pr-4">
        <div className="w-8 h-8 rounded-xl bg-white text-[#413B5E]/85 flex items-center justify-center shrink-0">
          <Vibrate className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#413B5E]">{t('settings.hapticsTitle')}</p>
          <p className="text-[11px] text-[#413B5E]/75">
            {supported ? t('settings.hapticsSub') : t('settings.hapticsUnsupported')}
          </p>
        </div>
      </div>
      <Switch on={on} onClick={toggle} label={t('settings.hapticsTitle')} disabled={!supported} />
    </div>
  );
}

export default HapticsRow;
