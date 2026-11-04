'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Pause, Play } from 'lucide-react';
import { formatSeconds } from '@/lib/audio';

/**
 * Voice intro player card: tap-to-play only (never autoplays, no UI sounds), a gradient progress
 * track that follows playback, and an elapsed / total readout.
 * The <audio> element is created on first tap, so nothing downloads until the member asks.
 */
/** Keyed by clip so a re-recorded intro starts from a fresh player (no stale position). */
export function VoicePlayer(props: React.ComponentProps<typeof VoicePlayerCard>) {
  return <VoicePlayerCard key={props.src} {...props} />;
}

function VoicePlayerCard({
  src,
  title = 'Voice Intro',
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

  return (
    <div className={className}>
      <section className="bg-white border border-[#ECE8F4] rounded-2xl p-3 flex items-center gap-3 shadow-2xs">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause ${title}` : `Play ${title}`}
          className="w-9 h-9 rounded-full bg-[#8C71F5] text-white flex items-center justify-center shrink-0 shadow-xs active:scale-95 transition"
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
            <span className="text-xs font-semibold text-[#2D264B] truncate">{title}</span>
            <span className="text-xs font-mono text-neutral-400 tabular-nums shrink-0">
              {/* WebM from MediaRecorder reports no length until played: show elapsed only then */}
              {totalMs > 0 ? `${formatSeconds(positionMs)} / ${formatSeconds(totalMs)}` : formatSeconds(positionMs)}
            </span>
          </div>
          <div
            className="mt-2 h-1.5 w-full bg-[#ECE8F4] rounded-full overflow-hidden"
            role="progressbar"
            aria-label={`${title} progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8C71F5] to-[#EC4899] transition-[width] duration-200 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {children}
      </section>
      {(subtitle || failed) && (
        <p className={`text-[11px] mt-1.5 px-1 ${failed ? 'text-rose-600' : 'text-neutral-400'}`}>{failed ? 'Could not play this clip.' : subtitle}</p>
      )}
    </div>
  );
}

export default VoicePlayer;
