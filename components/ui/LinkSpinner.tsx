'use client';

import { Loader2 } from 'lucide-react';
import { useLinkStatus } from 'next/link';

/**
 * A small spinner for a pill-shaped <Link> CTA: it appears on the first frame after the tap, while the next page
 * loads, so there is never a dead moment. Render it inside the Link (which needs `relative`); it sits at the
 * right edge, out of the flow, so the label never shifts.
 */
export function LinkSpinner() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span aria-hidden className="absolute right-4 top-1/2 -translate-y-1/2">
      <Loader2 className="h-4 w-4 animate-spin" />
    </span>
  );
}
