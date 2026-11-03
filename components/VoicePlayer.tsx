'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Pause, Play } from 'lucide-react';
import { formatSeconds } from '@/lib/audio';

const BAR_COUNT = 20;

/** Stable pseudo-waveform per clip (same bars every render), 0.3..1. */
function barsFor(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    h = Math.imul(h ^ (i + 1), 2246822507) >>> 0;
    return 0.3 + ((h % 1000) / 1000) * 0.7;
  });
}

/**
 * Voice intro player card: tap-to-play only (never autoplays, no UI sounds), a static 20-bar
 * waveform that fills with brand purple as it plays, and an elapsed / total readout.
 * The <audio> element is created on first tap, so nothing downloads until the member asks.
 */
/** Keyed by clip so a re-recorded intro starts from a fresh player (no stale position). */
export function VoicePlayer(props: React.ComponentProps<typeof VoicePlayerCard>) {
  return <VoicePlayerCard key={props.src} {...props} />;
}

function VoicePlayerCard({
  src,
  title = 'Voice intro',
  subtitle,
  durationMs,
  className = '',
  children,
}: {
  src: string;
  title?: string;
  subtitle?: string;
  /** Known length (from the recorder); WebM files often report no duration until fully read. */
  durationMs?: number | null;
  className?: string;
  /** Extra controls on the right (e.g. re-record on your own profile). */
  children?: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [mediaMs, setMediaMs] = useState<number | null>(null);

  // Stop playback when the card unmounts (route change, re-record).
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
    if (!audioRef.current) {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.onplay = () => setPlaying(true);
      audio.onpause = () => setPlaying(false);
      audio.onwaiting = () => setLoading(true);
      audio.onplaying = () => setLoading(false);
      audio.ontimeupdate = () => setPositionMs(audio.currentTime * 1000);
      audio.onloadedmetadata = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) setMediaMs(audio.duration * 1000);
      };
      audio.onended = () => {
        setPlaying(false);
        setPositionMs(0);
      };
      audio.onerror = () => {
        setPlaying(false);
        setLoading(false);
        setFailed(true);
      };
      audioRef.current = audio;
    }
    try {
      setFailed(false);
      setLoading(true);
      await audioRef.current.play();
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const totalMs = mediaMs ?? durationMs ?? 0;
  const progress = totalMs > 0 ? Math.min(1, positionMs / totalMs) : 0;
  const bars = barsFor(src.split('?')[0]);

  return (
    <section className={`bg-[#2D264B]/5 border border-[#2D264B]/10 rounded-2xl p-3 flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        className="w-10 h-10 rounded-full bg-[#6555B8] text-white flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : playing ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current translate-x-[1px]" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-bold text-[#2D264B] truncate">{title}</p>
          <span className="text-[11px] font-medium text-[#6C637B] tabular-nums shrink-0">
            {/* WebM from MediaRecorder reports no length until played: show elapsed only then */}
            {totalMs > 0 ? `${formatSeconds(positionMs)} / ${formatSeconds(totalMs)}` : formatSeconds(positionMs)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-[3px] h-6" aria-hidden>
          {bars.map((h, i) => {
            const filled = (i + 1) / BAR_COUNT <= progress || (progress > 0 && i / BAR_COUNT < progress);
            return (
              <span
                key={i}
                className={`flex-1 rounded-full transition-colors duration-150 ${filled ? 'bg-[#6555B8]' : 'bg-[#2D264B]/15'}`}
                style={{ height: `${Math.round(h * 100)}%` }}
              />
            );
          })}
        </div>
        {(subtitle || failed) && (
          <p className={`mt-1 text-[11px] truncate ${failed ? 'text-rose-600' : 'text-[#6C637B]'}`}>
            {failed ? 'Could not play this clip.' : subtitle}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

export default VoicePlayer;
