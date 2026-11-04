'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Pause, Play } from 'lucide-react';
import { formatSeconds } from '@/lib/audio';

const BAR_COUNT = 30;
const BAR_MIN_PX = 6;
const BAR_MAX_PX = 22;

/**
 * Organic voice-like amplitude profile (6..22px), stable per clip: a soft phrase envelope (two
 * "breaths") times seeded jitter, so every intro has its own shape but the same bars every render.
 */
function waveformFor(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    h = Math.imul(h ^ (i + 1), 2246822507) >>> 0;
    const jitter = 0.45 + ((h % 1000) / 1000) * 0.55;
    const t = i / (BAR_COUNT - 1);
    const envelope = 0.35 + 0.65 * Math.abs(Math.sin(t * Math.PI * 2.1 + 0.4));
    return Math.round(BAR_MIN_PX + (BAR_MAX_PX - BAR_MIN_PX) * envelope * jitter);
  });
}

/**
 * Voice intro player card: tap-to-play only (never autoplays, no UI sounds), a 30-bar waveform
 * that fills with the brand gradient as it plays, tap / arrow-key seeking, and an elapsed / total
 * readout. The <audio> element is created on first interaction, so nothing downloads until then.
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
  const bars = useMemo(() => waveformFor(src.split('?')[0]), [src]);

  // Stop playback when the card unmounts (route change, re-record).
  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    []
  );

  const ensureAudio = (): HTMLAudioElement => {
    if (audioRef.current) return audioRef.current;
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
    return audio;
  };

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (playing) {
      audioRef.current?.pause();
      return;
    }
    const audio = ensureAudio();
    try {
      setFailed(false);
      setLoading(true);
      await audio.play();
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const totalMs = mediaMs ?? durationMs ?? 0;
  const progress = totalMs > 0 ? Math.min(100, (positionMs / totalMs) * 100) : 0;

  /** Jump to `ratio` (0..1) of the clip. Before metadata loads, the seek is applied once it does. */
  const seekTo = (ratio: number) => {
    if (totalMs <= 0) return;
    const clamped = Math.min(1, Math.max(0, ratio));
    const targetSec = (clamped * totalMs) / 1000;
    const audio = ensureAudio();
    setPositionMs(targetSec * 1000);
    if (audio.readyState >= 1) {
      audio.currentTime = targetSec;
    } else {
      audio.addEventListener('loadedmetadata', () => (audio.currentTime = targetSec), { once: true });
      audio.load();
    }
  };

  const onWaveClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    seekTo((e.clientX - rect.left) / rect.width);
  };

  const onWaveKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' ? 0.05 : e.key === 'ArrowLeft' ? -0.05 : 0;
    if (e.key === 'Home') seekTo(0);
    else if (e.key === 'End') seekTo(0.999);
    else if (step) seekTo(progress / 100 + step);
    else return;
    e.preventDefault();
  };

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
            role="slider"
            tabIndex={totalMs > 0 ? 0 : -1}
            aria-label={`${title} position`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-valuetext={totalMs > 0 ? `${formatSeconds(positionMs)} of ${formatSeconds(totalMs)}` : undefined}
            onClick={onWaveClick}
            onKeyDown={onWaveKey}
            className={`mt-1.5 h-6 w-full flex items-center justify-between gap-px rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#8C71F5]/40 ${
              totalMs > 0 ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            {bars.map((px, i) => {
              const played = progress > 0 && (i / BAR_COUNT) * 100 <= progress;
              return (
                <span
                  key={i}
                  aria-hidden
                  className={`w-[3px] rounded-full shrink-0 transition-colors duration-150 ${
                    played ? 'bg-gradient-to-b from-[#8C71F5] to-[#EC4899]' : 'bg-[#ECE8F4]'
                  }`}
                  style={{ height: px }}
                />
              );
            })}
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
