'use client';

import { AILPlusModal } from '@/components/AILPlusModal';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { FREE_DAILY_SPARKS } from '@/lib/plusPlans';

/** Shown when /api/spark answers 429 QUOTA_EXCEEDED: the Plus sheet, titled for the daily limit. */
export function SparkLimitModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLocale();
  return (
    <AILPlusModal
      open={open}
      onClose={onClose}
      title={t('plus.sparkLimitTitle', { n: FREE_DAILY_SPARKS })}
      returnPath="/discover"
    />
  );
}

export default SparkLimitModal;
