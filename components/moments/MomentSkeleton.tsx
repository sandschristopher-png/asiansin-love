import React from 'react';

/**
 * Cold-load placeholder for the Moments feed: two cards shaped like the real ones (author header bars
 * and a 4:5 photo), tinted in the brand lavender and shimmering (.ail-shimmer stops for reduced motion).
 * Decorative: the feed container carries aria-busy while it shows.
 */
export function MomentSkeleton({ count = 2 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} aria-hidden className="rounded-[20px] border border-[#E6E2F0] bg-white p-3">
          <div className="flex items-center gap-3 px-1 pb-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-[#EAE9F2]/40 ail-shimmer" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-32 rounded-full bg-[#EAE9F2]/40 ail-shimmer" />
              <div className="h-2.5 w-20 rounded-full bg-[#EAE9F2]/40 ail-shimmer" />
            </div>
          </div>
          <div className="aspect-[4/5] w-full rounded-2xl bg-[#EAE9F2]/40 ail-shimmer" />
          <div className="mt-3 flex items-center gap-2.5 px-1">
            <div className="h-10 w-16 rounded-full bg-[#EAE9F2]/40 ail-shimmer" />
            <div className="h-10 flex-1 rounded-full bg-[#EAE9F2]/40 ail-shimmer" />
          </div>
        </div>
      ))}
    </>
  );
}

export default MomentSkeleton;
