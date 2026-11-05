'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Pause, Play } from 'lucide-react';
import { formatSeconds, probeDurationMs } from '@/lib/audio';
import { AnimatedWaveform } from '@/components/audio/AnimatedWaveform';
import { MotionConfig } from 'framer-motion';

/**
 * Voice intro player card: tap-to-play only (never autoplays, no UI sounds), an animated waveform
 * that dances while playing and fills with the brand gradient as it plays (AnimatedWaveform), tap /
 * arrow-key seeking, and an elapsed / total readout. The <audio> element is created on first interaction, so nothing downloads until then.
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

  const ensureAudio = (): HTMLAudioElement => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.onplay = () => setPlaying(true);
    audio.onpause = () => setPlaying(false);
    audio.onwaiting = () => setLoading(true);
    audio.onplaying = () => setLoading(false);
    audio.ontimeupdate = () => setPositionMs(audio.currentTime * 1000);
    // MediaRecorder WebM reports duration = Infinity at loadedmetadata and only reveals the real
    // length in a later durationchange: listen to both, or the progress fill never moves.
    const readDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) setMediaMs(audio.duration * 1000);
    };
    audio.onloadedmetadata = readDuration;
    audio.ondurationchange = readDuration;
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
    // Exact length up front (WebM intros only report it midway through playback). Not awaited:
    // play() must stay in the tap's call stack for iOS.
    if (mediaMs === null && !durationMs) {
      probeDurationMs(src).then((ms) => ms && setMediaMs((prev) => prev ?? ms));
    }
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
      <section className="bg-white/95 border border-[#D5C6EC] rounded-2xl p-4 shadow-[0_2px_8px_rgba(81,55,109,0.03)] flex items-center gap-3.5">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause ${title}` : `Play ${title}`}
          className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#72519A] to-[#9474C3] text-white flex items-center justify-center shadow-brand-sm hover:shadow-brand-glow transition-shadow active:scale-95"
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
            <span className="text-xs font-semibold text-[#51376D] truncate">{title}</span>
            <span className="text-xs font-semibold text-[#51376D]/50 tabular-nums shrink-0">
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
            className={`mt-1 w-fit rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#72519A]/40 ${
              totalMs > 0 ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            {/* Bars always animate: never suppressed by the OS / browser reduce-motion setting. */}
            <MotionConfig reducedMotion="never">
              <AnimatedWaveform isPlaying={playing} progress={progress / 100} />
            </MotionConfig>
          </div>
        </div>

        {children}
      </section>
      {(subtitle || failed) && (
        <p className={`text-[11px] mt-1.5 px-1 ${failed ? 'text-red-600' : 'text-[#51376D]/55'}`}>{failed ? 'Could not play this clip.' : subtitle}</p>
      )}
    </div>
  );
}

export default VoicePlayer;
