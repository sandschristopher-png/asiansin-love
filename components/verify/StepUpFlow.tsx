'use client';

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  CircleHelp,
  Loader2,
  ScanFace,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import Image from 'next/image';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { haptic } from '@/lib/haptics';
import { HOLD_KEEP_SLACK, LOST_GRACE_MS, neutralIsFrontal, poseRatios, poseReached, type PoseRatios, type StepUpPose } from '@/lib/headPose';
import { MIN_HOLD_MS } from '@/lib/verify/stepUpRules';
import { FACE_MIN_CONFIDENCE } from '@/lib/faceGateMessages';
import type { TKey } from '@/lib/i18n';

/** 'unavailable': the identity check is not set up yet (database migration not applied); the server is not enforcing it either. */
export type StepUpResult =
  | { status: 'passed'; challengeId: string }
  // Sent to staff. fastTrack: the pre-screen looked good, so approval is usually quick (the "get verified" check).
  | { status: 'manual_review'; fastTrack?: boolean }
  | { status: 'unavailable' };

interface Props {
  open: boolean;
  /** 'photo_swap' when changing the main photo; otherwise the check follows the account's own restriction. */
  /** 'photo_swap' when changing the main photo; 'verification' for the get-verified check at /verify. */
  reason?: 'photo_swap' | 'verification';
  /** photo_swap: the exact photo about to become primary (it is matched against the live face). */
  photo?: Blob | null;
  onClose: () => void;
  onResult: (r: StepUpResult) => void;
}

type Step = 'intro' | 'tips' | 'camera' | 'reviewing' | 'passed' | 'failed' | 'manual' | 'error';

/** The hold the member sees fill. The server needs >= MIN_HOLD_MS; a margin keeps slow phones above it. */
const HOLD_TARGET_MS = MIN_HOLD_MS + 250;
const NEUTRAL_MS = 700;
const TICK_MS = 66;
/** This many failing ticks in a row (camera or model broken) end the check instead of spinning silently. */
const MAX_FRAME_FAULTS = 8;
const CHECK_TIMEOUT_MS = 75_000;
const FRAME_WIDTH = 480;

const INSTRUCTION: Record<StepUpPose, TKey> = {
  turn_left: 'stepup.turnLeft',
  turn_right: 'stepup.turnRight',
  look_up: 'stepup.lookUp',
  look_down: 'stepup.lookDown',
};
/** The four direction illustrations (public/verify, 320px WebP, about 9 KB each). All four stay mounted and cross-fade, so there is never a load between steps. */
const GUIDE_SRC: Record<StepUpPose, string> = {
  turn_left: '/verify/step-up-left.webp',
  turn_right: '/verify/step-up-right.webp',
  look_up: '/verify/step-up-up.webp',
  look_down: '/verify/step-up-down.webp',
};
const GUIDE_ORDER: StepUpPose[] = ['turn_left', 'turn_right', 'look_up', 'look_down'];
const ARROW = { turn_left: ArrowLeft, turn_right: ArrowRight, look_up: ArrowUp, look_down: ArrowDown } as const;

/** Arc centre angle (degrees, SVG: 0 = right, 90 = down) for the side of the circle each pose uses. */
const ARC_ANGLE: Record<StepUpPose, number> = { turn_left: 180, turn_right: 0, look_up: 270, look_down: 90 };
const ARC_SPAN = 84;
const R = 47;
const polar = (deg: number) => [50 + R * Math.cos((deg * Math.PI) / 180), 50 + R * Math.sin((deg * Math.PI) / 180)] as const;

function arcPath(center: number) {
  const [x0, y0] = polar(center - ARC_SPAN / 2);
  const [x1, y1] = polar(center + ARC_SPAN / 2);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}
const ARC_LEN = (R * Math.PI * ARC_SPAN) / 180;

function frameOf(video: HTMLVideoElement): Promise<Blob | null> {
  const scale = Math.min(1, FRAME_WIDTH / (video.videoWidth || FRAME_WIDTH));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height); // raw frame: the CSS mirror is preview only
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.72));
}

const subscribeNever = () => () => {};

function Illustration() {
  // 16:9 slot for the custom manga art that replaces it later.
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-[#F6F4FB]" aria-hidden>
      <ScanFace className="h-12 w-12 text-[#726E97]/60" strokeWidth={1.5} />
    </div>
  );
}

/**
 * The step-up identity check: Intro sheet -> Tips sheet -> circular 4-direction camera check -> reviewing.
 * The camera is analysed on the device (MediaPipe); the server receives a few still frames, never video.
 * Camera tracks are always stopped when the screen leaves the camera step, closes or unmounts.
 */
export function StepUpFlow({ open, reason, photo, onClose, onResult }: Props) {
  const { t } = useLocale();
  const [step, setStep] = useState<Step>('intro');
  const [error, setError] = useState<TKey | null>(null);
  const [retriesLeft, setRetriesLeft] = useState(0);
  const [help, setHelp] = useState(false);
  // Camera-step UI state (the loop itself runs from refs, so a re-render never restarts it).
  const [poses, setPoses] = useState<StepUpPose[]>([]);
  const [index, setIndex] = useState(-1); // -1 = neutral capture, 0..2 = poses
  const [progress, setProgress] = useState(0);
  // True on the client only (portals need document.body): no state, so no setState-in-effect.
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [starting, setStarting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelRef = useRef(false);
  // "I can't turn my head": send the straight photo only, to be reviewed by a person (verification only).
  const accessRef = useRef(false);
  const [straight, setStraight] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Closed or unmounted: cancel any running check and release the camera.
  useEffect(() => {
    if (open) return;
    cancelRef.current = true;
    stopCamera();
  }, [open, stopCamera]);
  useEffect(
    () => () => {
      cancelRef.current = true;
      stopCamera();
    },
    [stopCamera]
  );

  const fail = useCallback(
    (key: TKey) => {
      stopCamera();
      setError(key);
      setStep('error');
    },
    [stopCamera]
  );

  const submit = useCallback(
    async (token: string, log: unknown, neutral: Blob, frames: Blob[], accessibility = false) => {
      setStep('reviewing');
      stopCamera();
      const form = new FormData();
      form.append('token', token);
      form.append('log', JSON.stringify(log));
      form.append('faceCheck', JSON.stringify({ detector: 'mediapipe_face_landmarker', face_count: 1, min_confidence: FACE_MIN_CONFIDENCE, checked_at: Date.now() }));
      form.append('center', neutral, 'center.jpg');
      frames.forEach((f, i) => form.append(`pose_${i}`, f, `pose_${i}.jpg`));
      if (reason === 'photo_swap' && photo) form.append('photo', photo, 'photo');
      if (accessibility) form.append('accessibility', '1');
      try {
        const res = await fetch('/api/verify/step-up/finish', { method: 'POST', body: form });
        const data = await res.json().catch(() => ({}));
        if (cancelRef.current) return;
        if (res.ok && data.status === 'passed') {
          setStep('passed');
          haptic.notify();
          onResult({ status: 'passed', challengeId: String(data.challengeId) });
        } else if (res.ok && data.status === 'failed') {
          setRetriesLeft(Number(data.retriesLeft) || 0);
          setStep('failed');
        } else if (res.ok && data.status === 'manual_review') {
          setStep('manual');
          onResult({ status: 'manual_review', fastTrack: data.fastTrack === true });
        } else if (data.code === 'EXPIRED' || data.code === 'USED') fail('stepup.expired');
        else fail('stepup.startFailed');
      } catch {
        if (!cancelRef.current) fail('stepup.startFailed');
      }
    },
    [fail, onResult, photo, reason, stopCamera]
  );

  /** Begins the camera step: camera, face model and signed challenge are requested together, inside the tap. */
  const begin = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    cancelRef.current = false;
    accessRef.current = false;
    setStraight(false);
    setProgress(0);
    setIndex(-1);
    try {
      const [stream, startRes, gate] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }, audio: false }),
        fetch('/api/verify/step-up/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reason ? { reason } : {}),
        }),
        import('@/lib/faceGate').then(async (m) => {
          await m.initFaceGate();
          return m;
        }),
      ]);
      streamRef.current = stream;
      if (cancelRef.current) return stopCamera();
      const start = await startRes.json().catch(() => ({}));
      if (!startRes.ok && startRes.status === 503 && reason === 'photo_swap') {
        // Not set up yet: the photo upload does not enforce it either, so let the swap carry on.
        stopCamera();
        onResult({ status: 'unavailable' });
        onClose();
        return;
      }
      if (!startRes.ok && start.code === 'PENDING' && reason === 'verification') {
        // Submitted from another tab or device: the page shows its under-review screen.
        stopCamera();
        onResult({ status: 'manual_review', fastTrack: false });
        onClose();
        return;
      }
      if (!startRes.ok) return fail(startRes.status === 503 ? 'stepup.unavailable' : 'stepup.startFailed');
      const token = String(start.token);
      const sequence = start.poses as StepUpPose[];
      setPoses(sequence);
      setStep('camera');
      // Let React mount the camera screen (and its <video>) before attaching the stream.
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (cancelRef.current) return stopCamera();

      const video = videoRef.current;
      if (!video) return fail('stepup.startFailed');
      video.srcObject = stream;
      await video.play().catch(() => {});

      // ---- The check loop: neutral capture, then each pose held for HOLD_TARGET_MS --------------------
      const began = performance.now();
      let neutral: PoseRatios | null = null;
      let neutralBlob: Blob | null = null;
      let neutralSince: number | null = null;
      const neutralSamples: PoseRatios[] = [];
      let poseIdx = -1;
      let holdStart: number | null = null;
      let lastReachedAt = 0;
      const log: { pose: StepUpPose; holdMs: number }[] = [];
      const frames: Blob[] = [];
      let busy = false;
      let faults = 0;

      const timer = window.setInterval(async () => {
        if (cancelRef.current || !streamRef.current) return window.clearInterval(timer);
        // The overall timeout is checked before the busy guard, so a frame read that never returns cannot hold the
        // screen forever.
        if (performance.now() - began > CHECK_TIMEOUT_MS) {
          window.clearInterval(timer);
          return fail('stepup.expired');
        }
        if (busy) return;
        busy = true;
        let tickFailed = false;
        try {
          // The straight-photo path: as soon as the straight frame exists, send just that (after the 4 s minimum).
          if (accessRef.current && neutralBlob) {
            window.clearInterval(timer);
            const wait = began + 4600 - performance.now();
            if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
            if (!cancelRef.current) void submit(token, [], neutralBlob, [], true);
            return;
          }
          const { faces, points } = gate.readFaceLandmarks(video);
          const ratios = faces === 1 ? poseRatios(points) : null;
          const now = performance.now();

          if (poseIdx === -1) {
            // Neutral: one face, looking at the camera, steady for NEUTRAL_MS.
            if (!ratios || !neutralIsFrontal(ratios)) {
              neutralSince = null;
              neutralSamples.length = 0;
              return;
            }
            neutralSince ??= now;
            neutralSamples.push(ratios);
            setProgress(Math.min(1, (now - neutralSince) / NEUTRAL_MS));
            if (now - neutralSince >= NEUTRAL_MS) {
              neutral = {
                yaw: neutralSamples.reduce((s, r) => s + r.yaw, 0) / neutralSamples.length,
                pitch: neutralSamples.reduce((s, r) => s + r.pitch, 0) / neutralSamples.length,
              };
              const grabbed = await frameOf(video);
              if (!grabbed) return; // could not grab a frame yet: try again on the next tick
              neutralBlob = grabbed;
              poseIdx = 0;
              holdStart = null;
              setIndex(0);
              setProgress(0);
            }
            return;
          }

          const target = sequence[poseIdx];
          // Once the hold has started, a slightly relaxed threshold keeps it alive (jitter around the line must
          // not restart it) and a brief dropout (a blink, one lost frame) is forgiven for LOST_GRACE_MS.
          const reached = !!ratios && !!neutral && poseReached(target, ratios, neutral, holdStart === null ? 1 : HOLD_KEEP_SLACK);
          if (reached) lastReachedAt = now;
          if (!reached) {
            if (holdStart !== null && now - lastReachedAt <= LOST_GRACE_MS) return;
            holdStart = null;
            setProgress(0);
            return;
          }
          holdStart ??= now;
          const held = now - holdStart;
          setProgress(Math.min(1, held / HOLD_TARGET_MS));
          if (held >= HOLD_TARGET_MS) {
            const blob = await frameOf(video);
            if (!blob) return;
            log.push({ pose: target, holdMs: Math.round(held) });
            frames.push(blob);
            haptic.poseLock(); // a tick as each direction locks in
            poseIdx += 1;
            holdStart = null;
            setProgress(0);
            if (poseIdx >= sequence.length) {
              window.clearInterval(timer);
              if (neutralBlob) void submit(token, log, neutralBlob, frames);
              else fail('stepup.startFailed');
            } else {
              setIndex(poseIdx);
            }
          }
        } catch (frameError) {
          // One bad frame is skipped; a run of them means the camera or the model is broken: stop and say so.
          tickFailed = true;
          console.error('[step-up] frame error', frameError);
          faults += 1;
          if (faults >= MAX_FRAME_FAULTS) {
            window.clearInterval(timer);
            fail('stepup.startFailed');
          }
        } finally {
          if (!tickFailed) faults = 0;
          busy = false;
        }
      }, TICK_MS);
    } catch (err) {
      const name = (err as { name?: string } | null)?.name;
      fail(name === 'NotFoundError' || name === 'OverconstrainedError' ? 'stepup.cameraMissing' : name === 'NotAllowedError' || name === 'SecurityError' ? 'stepup.cameraDenied' : 'stepup.startFailed');
    } finally {
      setStarting(false);
    }
  }, [fail, onClose, onResult, reason, starting, stopCamera, submit]);

  if (!open || !mounted) return null;

  const active: StepUpPose | null = !straight && index >= 0 ? (poses[index] ?? null) : null;
  const Arrow = active ? ARROW[active] : null;
  const close = () => {
    cancelRef.current = true;
    stopCamera();
    onClose();
  };

  const primary = 'flex h-12 w-full items-center justify-center rounded-full bg-[#726E97] text-sm font-semibold text-white transition hover:bg-[#524E75] active:scale-[0.99] disabled:opacity-60';

  const bullets: Array<[React.ComponentType<{ className?: string }>, TKey]> = [
    [ScanFace, 'stepup.introBullet1'],
    [ShieldCheck, 'stepup.introBullet2'],
    [Lock, 'stepup.introBullet3'],
  ];

  let body: React.ReactNode;
  if (step === 'intro' || step === 'tips') {
    const intro = step === 'intro';
    body = (
      <div className="flex h-full flex-col bg-white">
        <div className="flex h-14 shrink-0 items-center px-3">
          <button type="button" onClick={close} aria-label={t('stepup.close')} className="flex h-9 w-9 items-center justify-center rounded-full text-[#413B5E] transition hover:bg-[#F6F4FB]">
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <Illustration />
          <h2 className="mt-6 text-xl font-semibold tracking-tight text-[#413B5E]">{t(intro ? 'stepup.introTitle' : 'stepup.tipsTitle')}</h2>
          <ul className="mt-5 space-y-4">
            {intro
              ? bullets.map(([Icon, key]) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F6F4FB] text-[#726E97]">
                      <Icon className="h-4.5 w-4.5" aria-hidden />
                    </span>
                    <span className="pt-1.5 text-sm leading-snug text-[#413B5E]">{t(key)}</span>
                  </li>
                ))
              : (['stepup.tip1', 'stepup.tip2', 'stepup.tip3'] as const).map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F6F4FB] text-[#726E97]">
                      <Check className="h-4.5 w-4.5" aria-hidden />
                    </span>
                    <span className="pt-1.5 text-sm leading-snug text-[#413B5E]">{t(key)}</span>
                  </li>
                ))}
          </ul>
        </div>
        <div className="shrink-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
          <button type="button" className={primary} disabled={starting} onClick={() => (intro ? setStep('tips') : void begin())}>
            {starting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : t(intro ? 'stepup.next' : 'stepup.start')}
          </button>
        </div>
      </div>
    );
  } else if (step === 'camera') {
    body = (
      <div className="relative flex h-full flex-col bg-white">
        <div className="flex h-14 shrink-0 items-center justify-between px-3">
          <button type="button" onClick={close} aria-label={t('stepup.close')} className="flex h-9 w-9 items-center justify-center rounded-full text-[#413B5E] transition hover:bg-[#F6F4FB]">
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
          <button type="button" onClick={() => setHelp((v) => !v)} aria-expanded={help} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-[#413B5E] transition hover:bg-[#F6F4FB]">
            <CircleHelp className="h-4 w-4" aria-hidden />
            {t('stepup.help')}
          </button>
        </div>
        {help && (
          <div role="status" className="absolute right-3 top-14 z-10 w-[260px] rounded-2xl border border-[#D0CDE1] bg-white p-3.5 text-xs leading-relaxed text-[#413B5E] shadow-[0_12px_30px_rgba(65,59,94,0.16)]">
            {t('stepup.helpBody')}
            {reason === 'verification' && !straight && (
              <button
                type="button"
                onClick={() => {
                  accessRef.current = true;
                  setStraight(true);
                  setHelp(false);
                }}
                className="mt-3 block w-full rounded-xl border-t border-[#E6E2F0] pt-3 text-left text-xs font-semibold text-[#726E97] hover:text-[#524E75]"
              >
                {t('stepup.accessibility')}
              </button>
            )}
          </div>
        )}
        <div className="flex flex-1 flex-col items-center justify-center px-6">
          <div ref={viewRef} className="relative aspect-square w-full max-w-[320px]">
            {/* Front-camera preview, mirrored like a mirror: turning to your left fills the LEFT arc. */}
            <div className="absolute inset-[7%] overflow-hidden rounded-full bg-[#EAE9F2]">
              <video ref={videoRef} playsInline muted autoPlay className="h-full w-full -scale-x-100 object-cover" />
            </div>
            <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
              <circle cx="50" cy="50" r={R} fill="none" stroke="#EAE9F2" strokeWidth="2.2" />
              {active && (
                <>
                  <path d={arcPath(ARC_ANGLE[active])} fill="none" stroke="#D0CDE1" strokeWidth="3.6" strokeLinecap="round" />
                  <path
                    d={arcPath(ARC_ANGLE[active])}
                    fill="none"
                    stroke="#726E97"
                    strokeWidth="3.6"
                    strokeLinecap="round"
                    strokeDasharray={`${ARC_LEN * progress} ${ARC_LEN}`}
                  />
                </>
              )}
              {!active && <circle cx="50" cy="50" r={R} fill="none" stroke="#726E97" strokeWidth="3.6" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * R * progress} ${2 * Math.PI * R}`} transform="rotate(-90 50 50)" />}
            </svg>
            {active && Arrow && (
              <span
                className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#726E97] text-white shadow-md ring-4 ring-white"
                style={{ left: `${polar(ARC_ANGLE[active])[0]}%`, top: `${polar(ARC_ANGLE[active])[1]}%` }}
              >
                <Arrow className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              </span>
            )}
          </div>
          {/* Under the circle: the illustration for the current direction. It fades to the next one as each pose
              locks in, and is empty (space reserved, nothing shifts) during the straight-ahead capture. */}
          <div aria-hidden className="relative mt-5 h-28 w-28 shrink-0">
            {GUIDE_ORDER.map((pose) => (
              <Image
                key={pose}
                src={GUIDE_SRC[pose]}
                alt=""
                width={320}
                height={320}
                unoptimized
                loading="eager"
                draggable={false}
                className={`absolute inset-0 h-full w-full select-none object-contain transition-opacity duration-300 ease-out motion-reduce:transition-none ${active === pose ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
          </div>
          <p aria-live="polite" className="mt-4 text-center text-xl font-bold tracking-tight text-[#413B5E]">
            {active ? t(INSTRUCTION[active]) : t('stepup.lookCenter')}
          </p>
        </div>
      </div>
    );
  } else if (step === 'reviewing') {
    body = (
      <div className="flex h-full flex-col items-center justify-center bg-white px-8 text-center">
        <Loader2 className="h-9 w-9 animate-spin text-[#726E97]" aria-hidden />
        <p className="mt-5 text-base font-semibold text-[#413B5E]">{t('stepup.reviewing')}</p>
      </div>
    );
  } else {
    const result =
      step === 'passed'
        ? { icon: <CheckCircle2 className="h-12 w-12 text-[#726E97]" aria-hidden />, title: t('stepup.passedTitle'), text: t('stepup.passedBody') }
        : step === 'failed'
          ? { icon: <ScanFace className="h-12 w-12 text-[#726E97]" aria-hidden />, title: t('stepup.failedTitle'), text: t('stepup.failedBody', { count: retriesLeft }) }
          : step === 'manual'
            ? { icon: <ShieldCheck className="h-12 w-12 text-[#726E97]" aria-hidden />, title: t('stepup.manualTitle'), text: t('stepup.manualBody') }
            : { icon: <ScanFace className="h-12 w-12 text-[#726E97]" aria-hidden />, title: t('stepup.introTitle'), text: error ? t(error) : '' };
    body = (
      <div className="flex h-full flex-col items-center justify-center bg-white px-8 text-center">
        {result.icon}
        <h2 className="mt-5 text-xl font-semibold tracking-tight text-[#413B5E]">{result.title}</h2>
        {result.text && <p className="mt-2 max-w-[300px] text-sm leading-relaxed text-[#413B5E]/75">{result.text}</p>}
        <div className="mt-8 w-full max-w-[300px] space-y-2.5">
          {(step === 'failed' || step === 'error') && (
            <button type="button" className={primary} onClick={() => setStep('tips')}>
              {t('stepup.tryAgain')}
            </button>
          )}
          <button
            type="button"
            onClick={close}
            className={step === 'passed' || step === 'manual' ? primary : 'flex h-12 w-full items-center justify-center rounded-full border border-[#D0CDE1] bg-white text-sm font-semibold text-[#413B5E] transition hover:bg-[#F6F4FB]'}
          >
            {t('stepup.close')}
          </button>
        </div>
      </div>
    );
  }

  return createPortal(
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[600] flex justify-center bg-black/30">
      <div className="h-full w-full max-w-[480px] bg-white pt-[env(safe-area-inset-top,0px)]">{body}</div>
    </div>,
    document.body
  );
}

export default StepUpFlow;
