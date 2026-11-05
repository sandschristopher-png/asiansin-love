'use client';

import React from 'react';

/**
 * Optimistic toggle: flips the instant it is tapped (the caller updates state first and saves in
 * the background, rolling back only on failure), so there is never a spinner in its place.
 *
 * Animates only composited properties: the active plum track (#72519A) cross-fades over the
 * lilac one (#D5C6EC) by opacity, and the thumb slides by transform on its own layer. No motion
 * under prefers-reduced-motion.
 */
export function Switch({
  on,
  onClick,
  label,
  disabled = false,
}: {
  on: boolean;
  onClick: () => void;
  /** Accessible name when there is no visible label wired with aria-labelledby. */
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="relative h-6 w-11 shrink-0 rounded-full overflow-hidden cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#72519A]/40 focus-visible:ring-offset-2"
    >
      <span aria-hidden className="absolute inset-0 rounded-full bg-[#D5C6EC]" />
      <span
        aria-hidden
        className={`absolute inset-0 rounded-full bg-[#72519A] transition-opacity duration-200 motion-reduce:transition-none ${on ? 'opacity-100' : 'opacity-0'}`}
      />
      <span
        aria-hidden
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-brand-sm transition-transform duration-200 ease-out motion-reduce:transition-none [will-change:transform] ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default Switch;
