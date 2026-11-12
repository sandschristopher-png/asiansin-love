'use client';

import React, { useState } from 'react';
import { BellRing } from 'lucide-react';
import { alertPrefs } from '@/lib/notificationStore';
import { useLocale } from '@/components/i18n/LocaleProvider';

/** Visual twin of components/ui/Switch (the whole row is the switch here): opacity + transform only. */
function Toggle({ on }: { on: boolean }) {
  return (
    <span aria-hidden className="relative inline-flex h-6 w-11 shrink-0 rounded-full overflow-hidden">
      <span className="absolute inset-0 bg-[#D0CDE1]" />
      <span className={`absolute inset-0 bg-[#8574B7] transition-opacity duration-200 motion-reduce:transition-none ${on ? 'opacity-100' : 'opacity-0'}`} />
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-brand-sm transition-transform duration-200 motion-reduce:transition-none ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </span>
  );
}

/**
 * Settings row for this device's browser alerts (shown while the tab is in the background).
 * In-app alerts are silent: toast + haptic only. Web push has its own row (PushDeviceRow).
 */
export function AlertPrefsRows() {
  const { t } = useLocale();
  const [browser, setBrowser] = useState(() =>
    typeof window === 'undefined' || typeof Notification === 'undefined'
      ? false
      : alertPrefs.browserAlertsEnabled() && Notification.permission === 'granted'
  );
  const [note, setNote] = useState<string | null>(null);

  const toggleBrowser = async () => {
    setNote(null);
    if (browser) {
      alertPrefs.setBrowserAlertsEnabled(false);
      setBrowser(false);
      return;
    }
    if (typeof Notification === 'undefined') {
      setNote(t('settings.alertsUnsupported'));
      return;
    }
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    if (permission !== 'granted') {
      setNote(t('settings.alertsBlocked'));
      return;
    }
    alertPrefs.setBrowserAlertsEnabled(true);
    setBrowser(true);
  };

  const rowCls = 'w-full flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-[#E8E6F1]/40 transition cursor-pointer text-left';
  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={browser}
        onClick={toggleBrowser}
        className={rowCls}
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-[#E8E6F1]/60 text-[#8574B7] flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-[#413B5E]">{t('settings.alertsTitle')}</span>
            <span className="block text-[11px] text-[#413B5E]/75">{t('settings.alertsSub')}</span>
          </span>
        </span>
        <Toggle on={browser} />
      </button>
      {note && <p className="mx-3 -mt-1 mb-1 text-[11px] font-medium text-red-600">{note}</p>}

    </>
  );
}

export default AlertPrefsRows;
