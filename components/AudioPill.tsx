'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Loader2 } from 'lucide-react';
import { formatSeconds } from '@/lib/audio';

const BARS = [0.45, 0.8, 0.55, 1, 0.65, 0.9, 0.5];

/**
 * Compact Play/Pause pill with animated wave bars (brand lilac).
 * `src` may be a URL or a function that resolves one on first play (e.g. a signed URL).
 * Clicks never bubble, so it is safe inside a card <Link>.
 */
export function AudioPill({
  src,
  label = 'Voice intro',
  durationMs,
  size = 'md',
  tone = 'light',
  className = '',
}: {
  src: string | (() => Promise<string | null>);
  label?: string;
  durationMs?: number | null;
  size?: 'sm' | 'md';
  tone?: 'light' | 'onBrand';
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    []
  );

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (playing) {
      audioRef.current?.pause();
      return;
    }
    try {
      if (!audioRef.current) {
        setLoading(true);
        const url = typeof src === 'function' ? await src() : src;
        if (!url) throw new Error('unavailable');
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.onplay = () => setPlaying(true);
        audio.onpause = () => setPlaying(false);
        audio.onended = () => setPlaying(false);
        audio.onerror = () => {
          setPlaying(false);
          setFailed(true);
        };
        audioRef.current = audio;
      }
      setFailed(false);
      await audioRef.current.play();
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const sm = size === 'sm';
  const onBrand = tone === 'onBrand';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? `Pause ${label}` : `Play ${label}`}
      className={`inline-flex items-center gap-2 rounded-full border transition-colors select-none ${
        sm ? 'h-7 pl-1 pr-2.5' : 'h-9 pl-1.5 pr-3.5'
      } ${
        onBrand
          ? 'bg-white/15 border-white/25 text-white'
          : 'bg-[#F3EFFC]/95 border-[#E2DBF0] text-[#6555B8] hover:bg-[#EBE5FA] backdrop-blur-sm'
      } ${className}`}
    >
      <span
        className={`rounded-full flex items-center justify-center shrink-0 ${sm ? 'w-5 h-5' : 'w-6 h-6'} ${
          onBrand ? 'bg-white text-[#6555B8]' : 'bg-[#6555B8] text-white'
        }`}
      >
        {loading ? (
          <Loader2 className={`${sm ? 'w-3 h-3' : 'w-3.5 h-3.5'} animate-spin`} />
        ) : playing ? (
          <Pause className={`${sm ? 'w-2.5 h-2.5' : 'w-3 h-3'} fill-current`} />
        ) : (
          <Play className={`${sm ? 'w-2.5 h-2.5' : 'w-3 h-3'} fill-current translate-x-[0.5px]`} />
        )}
      </span>
      <span className={`flex items-center gap-[2px] ${sm ? 'h-3' : 'h-4'}`} aria-hidden>
        {BARS.map((h, i) => (
          <span
            key={i}
            className={`w-[2.5px] rounded-full ${onBrand ? 'bg-white' : 'bg-[#6555B8]'} ${playing ? 'ail-wave-bar' : ''}`}
            style={{ height: `${h * 100}%`, opacity: playing ? 1 : 0.55, animationDelay: `${i * 90}ms` }}
          />
        ))}
      </span>
      <span className={`font-semibold whitespace-nowrap ${sm ? 'text-[10.5px]' : 'text-xs'}`}>
        {failed ? 'Unavailable' : durationMs ? formatSeconds(durationMs) : label}
      </span>
    </button>
  );
}

export default AudioPill;
