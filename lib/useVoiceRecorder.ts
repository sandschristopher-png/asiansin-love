'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { baseMime, pickRecorderMime } from '@/lib/audio';

export type RecorderState = 'idle' | 'recording' | 'recorded';

const BAR_COUNT = 24;

/**
 * MediaRecorder wrapper: records up to `maxMs`, exposes live input levels for a waveform and
 * returns the clip as a Blob. Always releases the microphone on stop/cancel/unmount.
 */
export function useVoiceRecorder(maxMs: number) {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0.08));
  const [blob, setBlob] = useState<Blob | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const chunksRef = useRef<Blob[]>([]);
  const discardRef = useRef(false);

  const teardown = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }, []);

  useEffect(() => () => {
    discardRef.current = true;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    teardown();
  }, [teardown]);

  /** Mic off now: the system recording indicator should not wait for the async onstop event. */
  const releaseMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const stop = useCallback(() => {
    // stop() first so MediaRecorder flushes the buffered audio, then release the tracks.
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    releaseMic();
  }, [releaseMic]);

  const start = useCallback(async () => {
    setError(null);
    const mime = pickRecorderMime();
    if (!mime || !navigator.mediaDevices?.getUserMedia) {
      setError('Voice recording is not supported in this browser.');
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      setError('Microphone access is needed to record. Allow it in your browser settings.');
      return;
    }
    streamRef.current = stream;
    chunksRef.current = [];
    discardRef.current = false;
    setBlob(null);

    // Live waveform from the input level
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128) / 128);
        setLevels((prev) => [...prev.slice(1), Math.max(0.08, Math.min(1, peak * 1.8))]);
        const elapsed = Date.now() - startedAtRef.current;
        setElapsedMs(elapsed);
        if (elapsed >= maxMs) stop();
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      // Waveform is decorative; recording still works without it.
    }

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 32000 });
    } catch {
      teardown();
      setError('Voice recording is not supported in this browser.');
      return;
    }
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const dur = Math.min(Date.now() - startedAtRef.current, maxMs);
      teardown();
      if (discardRef.current) {
        setState('idle');
        return;
      }
      setDurationMs(dur);
      setElapsedMs(dur);
      setBlob(new Blob(chunksRef.current, { type: baseMime(recorder.mimeType || mime) }));
      setState('recorded');
    };
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    recorder.start(250);
    setState('recording');
    // Hard stop even if the animation loop is throttled (background tab).
    window.setTimeout(() => {
      if (recorderRef.current === recorder && recorder.state === 'recording') {
        recorder.stop();
        releaseMic();
      }
    }, maxMs + 250);
  }, [maxMs, stop, teardown, releaseMic]);

  /** Stop without keeping the clip. */
  const cancel = useCallback(() => {
    discardRef.current = true;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    teardown();
    setBlob(null);
    setElapsedMs(0);
    setState('idle');
  }, [teardown]);

  const reset = useCallback(() => {
    setBlob(null);
    setElapsedMs(0);
    setDurationMs(0);
    setError(null);
    setLevels(Array(BAR_COUNT).fill(0.08));
    setState('idle');
  }, []);

  return { state, elapsedMs, durationMs, levels, blob, error, setError, start, stop, cancel, reset };
}
