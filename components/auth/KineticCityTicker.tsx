'use client';

import React, { useEffect, useRef, useState } from 'react';
import { HERO_PREFIX, heroRoster, type HeroAudience } from '@/lib/geoCities';

const CYCLE_MS = 3200;
/** One new letter locks in every 3 frames at 60 Hz (about 50 ms), as in the original spec. */
const LOCK_MS = 50;
/** Random glyphs keep each position's case, so the scramble is never wider than the real name. */
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const LOWER = 'abcdefghijklmnopqrstuvwxyz0123456789';
const pick = (set: string) => set[Math.floor(Math.random() * set.length)];

/** Frame text: the first `locked` letters are final, the rest are random glyphs. */
function scrambled(target: string, locked: number): string {
  return target
    .split('')
    .map((ch, i) => {
      if (ch === ' ' || i < locked) return ch;
      return pick(ch === ch.toUpperCase() && ch !== ch.toLowerCase() ? UPPER : LOWER);
    })
    .join('');
}

/**
 * "Meet someone in {city}" / "Meet someone from {country}" auth hero (login and signup): the name
 * decodes letter by letter from random glyphs, with a brief chromatic offset while it scrambles.
 * Layout never moves: a fixed-height line, and an invisible copy of the longest name reserves the
 * width. The animated text is hidden from screen readers; they get the real name once, with no
 * live announcements. Reduced motion: the name swaps without the scramble.
 */
export function KineticCityTicker({ audience = 'western' }: { audience?: HeroAudience }) {
  const pool = heroRoster(audience);
  const [target, setTarget] = useState(pool[0]);
  const [shown, setShown] = useState(pool[0]);
  const [glitching, setGlitching] = useState(false);
  const indexRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // The pool is fixed for the page's lifetime (audience comes from the server), so state starts
    // at pool[0] and only the cycle below changes it.
    indexRef.current = 0;
    if (pool.length < 2) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const stop = () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };

    const cycle = window.setInterval(() => {
      indexRef.current = (indexRef.current + 1) % pool.length;
      const next = pool[indexRef.current];
      setTarget(next);
      stop();
      if (reduceMotion) {
        setShown(next);
        return;
      }
      setGlitching(true);
      const started = performance.now();
      const frame = (now: number) => {
        const locked = Math.floor((now - started) / LOCK_MS);
        if (locked >= next.length) {
          setShown(next);
          setGlitching(false);
          frameRef.current = null;
          return;
        }
        setShown(scrambled(next, locked));
        frameRef.current = requestAnimationFrame(frame);
      };
      frameRef.current = requestAnimationFrame(frame);
    }, CYCLE_MS);

    return () => {
      window.clearInterval(cycle);
      stop();
    };
  }, [pool]);

  const longest = pool.reduce((a, b) => (a.length >= b.length ? a : b), '');
  const word = 'text-2xl sm:text-3xl font-semibold tracking-tight leading-tight whitespace-nowrap';

  return (
    <div className="flex flex-col items-center justify-center text-center mt-6 mb-8 select-none">
      <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-600 mb-1.5">{HERO_PREFIX[audience]}</p>
      <div className="relative h-12 flex items-center justify-center max-w-full">
        <span aria-hidden="true" className={`invisible ${word}`}>
          {longest}
        </span>
        <span className="sr-only">{target}</span>
        <span
          aria-hidden="true"
          className={`absolute inset-0 flex items-center justify-center text-[#8574B7] transition-[transform,filter] duration-75 ${word} ${
            glitching ? 'drop-shadow-[1.5px_0_0_#413B5E] skew-x-[-1.5deg] -translate-x-[0.5px]' : 'drop-shadow-none skew-x-0 translate-x-0'
          }`}
        >
          {shown}
        </span>
      </div>
    </div>
  );
}

export default KineticCityTicker;
