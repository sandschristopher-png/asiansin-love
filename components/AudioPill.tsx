'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Loader2 } from 'lucide-react';
import { formatSeconds } from '@/lib/audio';
import { motion } from 'framer-motion';

/** Bar bounce while playing (Framer Motion, so it runs regardless of CSS keyframes). */
const barMotion = (playing: boolean, i: number, stepS: number) =>
  playing
    ? {
        animate: { scaleY: [0.35, 1, 0.35] },
        transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' as const, delay: i * stepS },
      }
    : { animate: { scaleY: 1 }, transition: { duration: 0.25, ease: 'easeOut' as const } };

const BARS = [0.45, 0.8, 0.55, 1, 0.65, 0.9, 0.5];

/**
 * Compact Play/Pause pill with animated wave bars (brand lilac).
 * `src` may be a URL or a function that resolves one on first play (e.g. a signed URL).
 * Clicks never bubble, so it is safe inside a card <Link>.
 * `showProgress` swaps the wave bars for a progress track and an elapsed / total readout
 * (in-chat voice notes).
 */
export function AudioPill({
  src,
  label = 'Voice intro',
  durationMs,
  size = 'md',
  tone = 'light',
  showProgress = false,
  className = '',
}: {
  src: string | (() => Promise<string | null>);
  label?: string;
  durationMs?: number | null;
  size?: 'sm' | 'md';
  tone?: 'light' | 'onBrand';
  showProgress?: boolean;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [mediaDurationMs, setMediaDurationMs] = useState<number | null>(null);

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
        audio.onended = () => {
          setPlaying(false);
          setPositionMs(0);
        };
        audio.ontimeupdate = () => setPositionMs(audio.currentTime * 1000);
        audio.onloadedmetadata = () => {
          // WebM from MediaRecorder often reports Infinity until fully read; keep the stored length then.
          if (Number.isFinite(audio.duration) && audio.duration > 0) setMediaDurationMs(audio.duration * 1000);
        };
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
  const totalMs = durationMs || mediaDurationMs || 0;
  const progress = totalMs > 0 ? Math.min(1, positionMs / totalMs) : 0;
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
      {showProgress ? (
        <span className="flex items-center gap-1.5">
        <span className={`flex items-center gap-[2px] h-3.5`} aria-hidden>
          {BARS.slice(0, 5).map((h, i) => (
            <motion.span
              key={i}
              initial={false}
              {...barMotion(playing, i, 0.11)}
              className={`w-[2.5px] rounded-full origin-center ${onBrand ? 'bg-white' : 'bg-[#6555B8]'}`}
              style={{
                height: playing ? `${h * 100}%` : '35%',
                opacity: playing ? 1 : 0.6,
                transition: 'height 150ms ease-out',
              }}
            />
          ))}
        </span>
        <span
          className={`relative h-1 w-16 rounded-full overflow-hidden ${onBrand ? 'bg-white/30' : 'bg-[#6555B8]/20'}`}
          role="progressbar"
          aria-label={`${label} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <span
            className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-200 ease-linear ${onBrand ? 'bg-white' : 'bg-[#6555B8]'}`}
            style={{ width: `${progress * 100}%` }}
          />
        </span>
        </span>
      ) : (
      <span className={`flex items-center gap-[2px] ${sm ? 'h-3' : 'h-4'}`} aria-hidden>
        {BARS.map((h, i) => (
          <motion.span
            key={i}
            initial={false}
            {...barMotion(playing, i, 0.09)}
            className={`w-[2.5px] rounded-full origin-center ${onBrand ? 'bg-white' : 'bg-[#6555B8]'}`}
            style={{ height: `${h * 100}%`, opacity: playing ? 1 : 0.55 }}
          />
        ))}
      </span>
      )}
      <span className={`font-semibold whitespace-nowrap tabular-nums ${sm ? 'text-[10.5px]' : 'text-xs'}`}>
        {failed
          ? 'Unavailable'
          : showProgress && (playing || positionMs > 0)
            ? formatSeconds(positionMs)
            : totalMs
              ? formatSeconds(totalMs)
              : label}
      </span>
    </button>
  );
}

export default AudioPill;
