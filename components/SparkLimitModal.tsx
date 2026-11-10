'use client';

import { AILPlusModal } from '@/components/AILPlusModal';
import { FREE_DAILY_SPARKS } from '@/lib/plusPlans';

/** Shown when /api/spark answers 429 QUOTA_EXCEEDED: the Plus sheet, titled for the daily limit. */
export function SparkLimitModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AILPlusModal
      open={open}
      onClose={onClose}
      title={`You've used today's ${FREE_DAILY_SPARKS} Sparks`}
      returnPath="/discover"
    />
  );
}

export default SparkLimitModal;
