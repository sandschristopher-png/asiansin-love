import React from 'react';

/**
 * Route-level loading shapes (shown by app/<route>/loading.tsx the instant a tab is tapped, and by the pages
 * themselves while their data loads). White canvas, soft lavender shimmer blocks that match the real cards and
 * rows, so nothing jumps when the content arrives. No spinners, no "Loading..." text.
 */
const SHIMMER = 'bg-[#F6F4FB] ail-shimmer';

/** Rounded photo cards (Discover grid, Sparks). */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} aria-hidden className={`relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[#E6E2F0] ${SHIMMER}`}>
          <div className="absolute inset-x-0 bottom-0 space-y-2 p-3">
            <div className="h-4 w-2/3 rounded-full bg-white/60" />
            <div className="h-3 w-1/2 rounded-full bg-white/50" />
          </div>
        </div>
      ))}
    </>
  );
}

/** Discover: title row, filter pills, two-column card grid. */
export function DiscoverSkeleton() {
  return (
    <div className="min-h-full w-full bg-white" aria-busy="true" aria-label="Loading discover feed">
      <main className="mx-auto w-full max-w-[480px] px-4 pb-36 pt-2 min-[480px]:px-8">
        <div className="flex items-center justify-between py-2">
          <div className={`h-7 w-32 rounded-lg ${SHIMMER}`} />
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full ${SHIMMER}`} />
            <div className={`h-8 w-8 rounded-full ${SHIMMER}`} />
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-hidden border-b border-black/5 py-2">
          <div className="h-7 w-12 shrink-0 rounded-full bg-[#726E97]/20 ail-shimmer" />
          <div className={`h-7 w-16 shrink-0 rounded-full ${SHIMMER}`} />
          <div className={`h-7 w-20 shrink-0 rounded-full ${SHIMMER}`} />
          <div className={`h-7 w-14 shrink-0 rounded-full ${SHIMMER}`} />
        </div>
        <div className="grid w-full grid-cols-2 gap-3 pt-3 sm:gap-4">
          <CardGridSkeleton count={6} />
        </div>
      </main>
    </div>
  );
}

/** Sparks: tab pills over the same card grid. */
export function SparksSkeleton() {
  return (
    <div className="min-h-[100dvh] w-full bg-white px-4 pt-3" aria-busy="true" aria-label="Loading Sparks">
      <div className="flex items-center gap-2 pb-3">
        <div className="h-8 w-24 rounded-full bg-[#726E97]/20 ail-shimmer" />
        <div className={`h-8 w-24 rounded-full ${SHIMMER}`} />
        <div className={`h-8 w-20 rounded-full ${SHIMMER}`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CardGridSkeleton count={4} />
      </div>
    </div>
  );
}

/** Messages list: avatar, two text lines, time. */
export function MessagesSkeleton() {
  return (
    <div className="min-h-[100dvh] w-full bg-white px-4 pt-3" aria-busy="true" aria-label="Loading messages">
      <div className="space-y-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} aria-hidden className="flex items-center gap-3 py-3">
            <div className={`h-14 w-14 shrink-0 rounded-full ${SHIMMER}`} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className={`h-3.5 rounded-full ${SHIMMER}`} style={{ width: `${48 + ((i * 17) % 30)}%` }} />
              <div className={`h-3 rounded-full ${SHIMMER}`} style={{ width: `${62 + ((i * 11) % 28)}%` }} />
            </div>
            <div className={`h-3 w-8 shrink-0 rounded-full ${SHIMMER}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A conversation: header bar, a few bubbles, the composer. Fills the screen like the real thing. */
export function ChatSkeleton() {
  return (
    <div className="flex h-[100dvh] max-h-[100dvh] w-full flex-col bg-white" aria-busy="true" aria-label="Loading conversation">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#D0CDE1] px-3.5 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top,0px))]">
        <div className={`h-9 w-9 rounded-full ${SHIMMER}`} />
        <div className={`h-10 w-10 rounded-full ${SHIMMER}`} />
        <div className={`h-4 w-28 rounded-full ${SHIMMER}`} />
        <div className="ml-auto flex items-center gap-1.5">
          <div className={`h-9 w-9 rounded-full ${SHIMMER}`} />
          <div className={`h-9 w-9 rounded-full ${SHIMMER}`} />
          <div className={`h-9 w-9 rounded-full ${SHIMMER}`} />
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-hidden px-3.5 py-4">
        <div className="flex items-end gap-2">
          <div className={`h-6 w-6 shrink-0 rounded-full ${SHIMMER}`} />
          <div className={`h-12 w-48 rounded-2xl ${SHIMMER}`} />
        </div>
        <div className="flex justify-end">
          <div className="h-12 w-52 rounded-2xl bg-[#726E97]/15 ail-shimmer" />
        </div>
        <div className="flex items-end gap-2">
          <div className={`h-6 w-6 shrink-0 rounded-full ${SHIMMER}`} />
          <div className={`h-10 w-40 rounded-2xl ${SHIMMER}`} />
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-36 rounded-2xl bg-[#726E97]/15 ail-shimmer" />
        </div>
      </div>
      <div className="shrink-0 border-t border-[#D0CDE1] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5">
        <div className="flex items-end gap-2">
          <div className={`h-11 flex-1 rounded-3xl ${SHIMMER}`} />
          <div className={`h-10 w-10 shrink-0 rounded-full ${SHIMMER}`} />
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#726E97]/20 ail-shimmer" />
        </div>
      </div>
    </div>
  );
}

/** My profile: same shapes as the loaded page (4:5 photo, action bar, rep card, sections). */
export function ProfileSkeleton() {
  return (
    <div className="w-full flex-1 space-y-5 bg-white px-4 pt-4" aria-busy="true" aria-label="Loading profile">
      <div className={`h-14 rounded-3xl ${SHIMMER}`} />
      <div className={`aspect-[4/5] w-full rounded-3xl ${SHIMMER}`} />
      <div className={`h-11 rounded-2xl ${SHIMMER}`} />
      <div className={`h-24 rounded-3xl ${SHIMMER}`} />
      <div className={`h-20 rounded-3xl ${SHIMMER}`} />
      <div className={`h-28 rounded-3xl ${SHIMMER}`} />
    </div>
  );
}

/** Verification: header bar and the intro card. */
export function VerifySkeleton() {
  return (
    <div className="min-h-[100dvh] w-full bg-white" aria-busy="true" aria-label="Loading verification">
      <div className="flex items-center justify-between border-b border-[#D0CDE1] px-4 pb-4 pt-3">
        <div className={`h-10 w-10 rounded-2xl ${SHIMMER}`} />
        <div className={`h-6 w-40 rounded-full ${SHIMMER}`} />
        <div className="w-10" />
      </div>
      <div className="mx-4 mt-4 space-y-4 rounded-3xl border border-[#E6E2F0] p-5">
        <div className={`h-6 w-3/4 rounded-full ${SHIMMER}`} />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`h-9 w-9 shrink-0 rounded-full ${SHIMMER}`} />
            <div className={`h-4 flex-1 rounded-full ${SHIMMER}`} />
          </div>
        ))}
        <div className="h-12 w-full rounded-full bg-[#726E97]/20 ail-shimmer" />
      </div>
    </div>
  );
}
