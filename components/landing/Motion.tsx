'use client';

import React from 'react';
import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';

/**
 * Landing-page motion, kept tiny: framer-motion's LazyMotion with only the DOM animation
 * features, and four wrappers that render the same element, classes and layout they replace.
 * Visitors who prefer reduced motion get a zero duration, so everything lands in place at once.
 */
const EASE = 'easeOut' as const;

/** Loads the animation features once for the landing page. */
export function LandingMotion({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}

type BoxProps = { children: React.ReactNode; className?: string };

/** Hero entrance on first load: fade in while rising 10px. */
export function FadeIn({ children, className, delay = 0 }: BoxProps & { delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.4, ease: EASE, delay: reduce ? 0 : delay }}
    >
      {children}
    </m.div>
  );
}

/** Card entrance when it scrolls into view (once): fade in while rising 12px. */
export function Reveal({ children, className }: BoxProps) {
  const reduce = useReducedMotion();
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
    >
      {children}
    </m.div>
  );
}

/** Wraps a full-width button link: a light press (scale 0.98). A flex box keeps the button's size. */
export function TapButton({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <m.div className="flex w-full" whileTap={reduce ? undefined : { scale: 0.98 }} transition={{ duration: 0.12, ease: EASE }}>
      {children}
    </m.div>
  );
}
