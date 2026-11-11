'use client';

import React, { useEffect, useRef, useState } from 'react';
import { HERO_PREFIX, heroRoster, type HeroAudience } from '@/lib/geoCities';

const INTERVAL_MS = 2800;
const EXIT_MS = 300;
const ENTER_MS = 650;

type Phase = 'idle' | 'exiting' | 'entering';

/**
 * "Meet someone in {city}" / "Meet someone from {country}" auth hero (login and signup): a masked
 * vertical roller. The current name slides up with a slight scale-down and motion blur; the next
 * one rises from below on an exponential ease-out (cubic-bezier(0.16, 1, 0.3, 1), 650 ms).
 * Layout never moves: the line has a fixed height, and an invisible copy of the longest name
 * reserves the width, with the animated layer drawn on top. Pure CSS transitions, no animation
 * library. Reduced motion: names swap without movement. Screen readers hear the line once (no
 * announcement on every swap).
 */
export function KineticCityTicker({ audience = 'western' }: { audience?: HeroAudience }) {
  const pool = heroRoster(audience);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (pool.length < 2) return;
    const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
    const interval = window.setInterval(() => {
      setPhase('exiting');
      later(() => {
        // Swap while hidden below the mask, then release on the next frames so the entrance animates.
        setIndex((i) => (i + 1) % pool.length);
        setPhase('entering');
        requestAnimationFrame(() => requestAnimationFrame(() => setPhase('idle')));
      }, EXIT_MS);
    }, INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, [pool.length]);

  const longest = pool.reduce((a, b) => (a.length >= b.length ? a : b), '');
  const name = pool[index % pool.length];

  const motion =
    phase === 'exiting'
      ? '-translate-y-full opacity-0 blur-[3px] scale-95'
      : phase === 'entering'
        ? 'translate-y-full opacity-0 blur-[3px] scale-95 !transition-none'
        : 'translate-y-0 opacity-100 blur-0 scale-100';
  const timing =
    phase === 'exiting'
      ? { transitionDuration: `${EXIT_MS}ms`, transitionTimingFunction: 'cubic-bezier(0.7, 0, 0.84, 0)' }
      : { transitionDuration: `${ENTER_MS}ms`, transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' };

  const word = 'text-2xl sm:text-3xl font-semibold tracking-tight leading-tight whitespace-nowrap';

  return (
    <div className="flex flex-col items-center justify-center text-center mt-6 mb-8 select-none">
      <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-600 mb-1.5">{HERO_PREFIX[audience]}</p>
      <div className="relative h-12 overflow-hidden flex items-center justify-center max-w-full">
        {/* Width reservation: dot + longest name, invisible. */}
        <span aria-hidden="true" className={`invisible flex items-center gap-2 ${word}`}>
          <span className="h-2 w-2 shrink-0" />
          {longest}
        </span>
        <span
          style={timing}
          className={`absolute inset-0 flex items-center justify-center gap-2 will-change-transform transition-[transform,opacity,filter] motion-reduce:!transform-none motion-reduce:!filter-none motion-reduce:!transition-none ${motion}`}
        >
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#8574B7] opacity-60 animate-ping motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8574B7]" />
          </span>
          <span className={`${word} text-[#8574B7]`}>{name}</span>
        </span>
      </div>
    </div>
  );
}

export default KineticCityTicker;
