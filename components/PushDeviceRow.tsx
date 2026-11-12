'use client';

import React, { useEffect, useState } from 'react';
import { BellRing, Loader2 } from 'lucide-react';
import { enablePushNotifications, getPushSupport, isPushSyncPending, onPushSyncChange, syncPushSubscription, type PushSupport } from '@/lib/push';
import { PushPermissionCard } from '@/components/PushPermissionCard';
import { isIosDevice } from '@/lib/pwaInstall';
import { useLocale } from '@/components/i18n/LocaleProvider';
import type { TKey } from '@/lib/i18n';

const COPY: Record<PushSupport | 'error', TKey> = {
  granted: 'settings.pushGranted',
  default: 'settings.pushDefault',
  denied: 'settings.pushDenied',
  'needs-install': 'settings.pushNeedsInstall',
  unsupported: 'settings.pushUnsupported',
  error: 'settings.pushError',
};

/** Settings row: turns on web push notifications for the current device (needs a tap). */
export function PushDeviceRow() {
  const { t } = useLocale();
  const [state, setState] = useState<PushSupport | 'error'>('default');
  const [busy, setBusy] = useState(false);
  const [explaining, setExplaining] = useState(false);
  // Granted, but the last save never reached the server: retried silently on every app open.
  const [syncPending, setSyncPending] = useState(false);
  useEffect(() => {
    const read = () => setSyncPending(isPushSyncPending());
    read();
    return onPushSyncChange(read);
  }, []);

  useEffect(() => setState(getPushSupport()), []);

  const canEnable = state === 'default' || state === 'error';
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#E8E6F1]/40 transition">
      <div className="flex items-center gap-3 pr-4">
        <div className="w-8 h-8 rounded-xl bg-[#E8E6F1]/60 text-[#8574B7] flex items-center justify-center shrink-0">
          <BellRing className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#413B5E]">{t('settings.pushTitle')}</p>
          <p className="text-[11px] text-[#413B5E]/75">
            {/* iPhone web push needs iOS 16.4+ and the Home Screen app; older iOS has no PushManager. */}
            {state === 'unsupported' && isIosDevice() ? t('settings.pushIosOld') : t(COPY[state])}
          </p>
        </div>
      </div>
      {canEnable ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => setExplaining(true)}
          className="h-8 px-3.5 rounded-full bg-[#8574B7] hover:bg-[#8574B7] text-white text-[11px] font-medium shrink-0 inline-flex items-center gap-1.5 disabled:opacity-60"
        >
          {busy && <Loader2 className="w-3 h-3 animate-spin" />}
          {t('settings.turnOn')}
        </button>
      ) : state === 'granted' && syncPending ? (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await syncPushSubscription();
            setBusy(false);
          }}
          className="text-[11px] font-medium text-[#F59E0B] hover:underline shrink-0 disabled:opacity-60"
          title={t('settings.pushPendingHint')}
        >
          {busy ? t('settings.connecting') : t('settings.reconnecting')}
        </button>
      ) : state === 'granted' ? (
        <span className="text-[11px] font-semibold text-emerald-600 shrink-0">{t('settings.enabled')}</span>
      ) : null}
      {explaining && (
        <PushPermissionCard
          onClose={() => setExplaining(false)}
          onAllow={async () => {
            setExplaining(false);
            setBusy(true);
            setState(await enablePushNotifications()); // the browser's own prompt appears here
            setBusy(false);
          }}
        />
      )}
    </div>
  );
}

export default PushDeviceRow;
