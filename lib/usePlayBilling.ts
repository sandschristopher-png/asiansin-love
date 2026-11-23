'use client';

import { useCallback, useEffect, useState } from 'react';
import { useIsNativeApp } from '@/lib/useNativeApp';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { SUPPORT_EMAIL } from '@/lib/support';
import { clearHeaderProfile } from '@/lib/headerProfileStore';
import { setCachedSubscription } from '@/lib/subscriptionStatus';
import { buyPlus, loadPlusOfferings, restorePurchases, type OfferingsResult, type PlayOffering } from '@/lib/billing/nativePlay';
import type { PlusPlanId } from '@/lib/plusPlans';

/**
 * Google Play Billing for a screen in the Android app: the live Plus prices, the buy action and Restore Purchases, with the
 * message to show after each. In a browser `native` is false and nothing here ever calls Google Play (the website shows
 * "Upgrade in the Meet in Asia Android app" instead). `onActivated` runs once Plus is confirmed by the server.
 */
export function usePlayBilling(onActivated?: () => void) {
  const native = useIsNativeApp();
  const { t } = useLocale();
  const [offers, setOffers] = useState<OfferingsResult | null>(null);
  const [busy, setBusy] = useState<null | 'buy' | 'restore'>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!native) return;
    let cancelled = false;
    void loadPlusOfferings().then((result) => {
      if (!cancelled) setOffers(result);
    });
    return () => {
      cancelled = true;
    };
  }, [native]);

  const activated = useCallback(() => {
    clearHeaderProfile();
    setCachedSubscription(true);
    onActivated?.();
  }, [onActivated]);

  const buy = useCallback(
    async (plan: PlusPlanId) => {
      const offering: PlayOffering | undefined = offers?.status === 'ready' ? offers.offerings[plan] : undefined;
      if (!offering || busy) return;
      setBusy('buy');
      setNotice(null);
      const outcome = await buyPlus(offering);
      setBusy(null);
      switch (outcome.status) {
        case 'active':
          setNotice(t('billing.activated'));
          activated();
          break;
        case 'pending':
          setNotice(t('billing.pending'));
          break;
        case 'other_account':
          setNotice(t('billing.otherAccount'));
          break;
        case 'cancelled':
          break;
        case 'unavailable':
          setNotice(t('billing.unavailable'));
          break;
        default:
          setNotice(t('billing.failed', { email: SUPPORT_EMAIL }));
      }
    },
    [offers, busy, t, activated]
  );

  const restore = useCallback(async () => {
    if (busy) return;
    setBusy('restore');
    setNotice(null);
    const outcome = await restorePurchases();
    setBusy(null);
    switch (outcome.status) {
      case 'restored':
        setNotice(t('billing.restored'));
        activated();
        break;
      case 'nothing':
        setNotice(t('billing.nothingToRestore'));
        break;
      case 'other_account':
        setNotice(t('billing.otherAccount'));
        break;
      case 'pending':
        setNotice(t('billing.pending'));
        break;
      case 'unavailable':
        setNotice(t('billing.unavailable'));
        break;
      default:
        setNotice(t('billing.failed', { email: SUPPORT_EMAIL }));
    }
  }, [busy, t, activated]);

  return {
    native,
    /** Prices are still being read from Google Play. */
    loading: native && offers === null,
    /** Google Play Billing cannot be used here (no Play Store, or the products are not live): buying stays off. */
    unavailable: native && offers?.status === 'unavailable',
    offerings: offers?.status === 'ready' ? offers.offerings : {},
    busy,
    notice,
    buy,
    restore,
  };
}
