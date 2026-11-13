'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Camera, ShieldCheck, Loader2, AlertCircle, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getPoseById, type PoseId, type VerificationPose } from '@/lib/poses';
import type { TKey } from '@/lib/i18n';
import type { FaceGateResult, PoseState } from '@/lib/faceGate';
import { FACE_MIN_CONFIDENCE, type FaceGateStatus } from '@/lib/faceGateMessages';
import { hapticError, hapticPhotoSnap } from '@/lib/utils/haptics';
import { QrCode } from '@/components/QrCode';
import { useActionToast } from '@/components/ActionToast';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { localizeError } from '@/lib/i18n/errors';

/**
 * Sent with the pose photo: the live gate's result for that exact frame (exactly one confident
 * face). Both photos are taken automatically; there is no manual shutter.
 */
interface FaceCheck {
  detector: 'mediapipe_face_landmarker';
  face_count: number;
  min_confidence: number;
  width_ratio: number | null;
  checked_at: number;
  face_capture: 'auto';
  pose_capture: 'auto';
}

const GATE_TICK_MS = 100;
/** Both steps: the condition has to hold this long before the frame is taken. */
const HOLD_MS = 1200;
/** Missed frames inside a hold that don't restart it (micro-jitter, a blink, a detector hiccup). */
const JITTER_FRAMES = 2;
/** Step 2: a hand held in view this long counts as the pose, in case recognition struggles. */
const HAND_FALLBACK_MS = 6000;
/** /api/verify/submit rejects attempts finished sooner than 4 s after the pose was issued. */
const MIN_SUBMIT_AFTER_ISSUE_MS = 4500;

const MAX_DIM = 1200; // longest edge of an uploaded photo
const JPEG_QUALITY = 0.85;

/** Step 1 reference tile: the landing photo, cropped to her head and shoulders. */
const PORTRAIT_GUIDE = { src: '/Landing-Woman.png', position: '64% 22%' };

type Step = 'face' | 'pose';
type Phase = 'align' | 'hold' | 'capturing';

/** Snapshot problems, shown in the camera HUD in the member's language. */
type SnapshotError = 'verify.errStarting' | 'verify.errProcess' | 'verify.errDark' | 'verify.errBright' | 'verify.errCapture';

/** Reference-tile caption for each pose (lib/poses.ts ids). */
const POSE_NAME_KEY = {
  peace: 'verify.poseName.peace',
  thumbs_up: 'verify.poseName.thumbs_up',
  chin_touch: 'verify.poseName.chin_touch',
  three_fingers: 'verify.poseName.three_fingers',
} as const satisfies Record<PoseId, TKey>;

interface Shot {
  blob: Blob;
}

/**
 * Grabs the current video frame (un-mirrored: the CSS flip is display-only), scales it to
 * MAX_DIM and rejects frames that are too dark or blown out to be reviewable. Both steps use it.
 */
async function snapshotFromVideo(video: HTMLVideoElement): Promise<{ snap?: Shot; error?: SnapshotError }> {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return { error: 'verify.errStarting' };

  const scale = Math.min(1, MAX_DIM / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return { error: 'verify.errProcess' };
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let total = 0;
  let samples = 0;
  for (let i = 0; i < data.length; i += 40) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    samples++;
  }
  const brightness = samples > 0 ? total / samples : 0;
  if (brightness < 40) return { error: 'verify.errDark' };
  if (brightness > 235) return { error: 'verify.errBright' };

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
  if (!blob) return { error: 'verify.errCapture' };
  return { snap: { blob } };
}

/** Full pose instruction for the intro screen ("Peace sign by your cheek"). */
const POSE_LABEL_KEY = {
  peace: 'verify.poseLabel.peace',
  thumbs_up: 'verify.poseLabel.thumbs_up',
  chin_touch: 'verify.poseLabel.chin_touch',
  three_fingers: 'verify.poseLabel.three_fingers',
} as const satisfies Record<PoseId, TKey>;

function PoseImage({ pose, alt, className = '' }: { pose: VerificationPose; alt: string; className?: string }) {
  // Functional figure: plain white, flat (no aura, border or glow).
  return <img src={pose.image} alt={alt} className={`object-contain bg-white ${className}`} draggable={false} />;
}

function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

/** Friendly guidance for each getUserMedia failure. */
function cameraErrorKey(err: unknown): TKey {
  switch ((err as DOMException)?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'verify.camBlocked';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'verify.camNotFound';
    case 'NotReadableError':
    case 'AbortError':
      return 'verify.camInUse';
    case 'NotSupportedError':
      return 'verify.camUnsupported';
    default:
      return 'verify.camRequired';
  }
}

/** A rejected submission, already worded in the member's language. */
class SubmitError extends Error {}

/** The server words its rejections in English; show them in the member's language. */
function submitErrorText(status: number, message: string | undefined, t: (key: TKey) => string): string {
  const m = message || '';
  if (/no valid face/i.test(m)) return t('verify.errNoFace');
  if (/only one person/i.test(m)) return t('verify.statusMultiple');
  if (/too quickly/i.test(m)) return t('verify.errTooFast');
  if (/main profile photo/i.test(m)) return t('verify.needPhoto');
  if (/too many/i.test(m) || status === 429) return t('errors.rateLimit');
  return localizeError({ status, message: m }, t, 'verify.submitFailed');
}

export default function VerifyPage() {
  const router = useRouter();
  const { t } = useLocale();
  // Read inside requestChallenge and the mount effect without making them re-run (and request a new
  // challenge) when the language is adopted after hydration.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [starting, setStarting] = useState(true);
  const [startError, setStartError] = useState<string | null>(null);
  const [attemptToken, setAttemptToken] = useState<string | null>(null);
  const issuedAtRef = useRef(0);
  const [pose, setPose] = useState<VerificationPose | null>(null);

  const showActionToast = useActionToast();
  const [cameraOn, setCameraOn] = useState(false);
  // Step 1 takes the portrait, step 2 the pose photo, which is submitted straight away. The camera
  // stays on throughout.
  const [step, setStep] = useState<Step>('face');
  const faceShotRef = useRef<Shot | null>(null);
  const [phase, setPhase] = useState<Phase>('align');
  const [holdProgress, setHoldProgress] = useState(0);
  /** After a failed submission auto-capture pauses until the member taps Restart. */
  const [halted, setHalted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState<{ fastTrack: boolean } | null>(null);
  /** The start error is "add a main photo first": its button links to the photo editor. */
  const [needPhoto, setNeedPhoto] = useState(false);

  // Live single-face gate (MediaPipe, loaded when the camera opens).
  const gateRef = useRef<typeof import('@/lib/faceGate') | null>(null);
  const [gateState, setGateState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [faceStatus, setFaceStatus] = useState<FaceGateStatus>('no_face');
  const [poseState, setPoseState] = useState<PoseState>('no_hand');
  const holdSinceRef = useRef(0);
  const missesRef = useRef(0);
  const handSinceRef = useRef(0);
  const handMissesRef = useRef(0);
  const busyRef = useRef(false);
  const captureRef = useRef<(check: FaceGateResult) => void>(() => {});

  /** Server issues one random pose in a signed, short-lived token. */
  const requestChallenge = useCallback(async () => {
    setStarting(true);
    setStartError(null);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/verify/start', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        if (/main profile photo/i.test(data.error || '')) {
          setNeedPhoto(true);
          setStartError(tRef.current('verify.needPhoto'));
        } else {
          setStartError(localizeError({ status: res.status, code: data.code, message: data.error }, tRef.current));
        }
        return;
      }
      const issued = getPoseById(data.sequence?.[0]);
      if (!issued) {
        setStartError(tRef.current('errors.generic'));
        return;
      }
      issuedAtRef.current = Date.now();
      setAttemptToken(data.attemptId);
      setPose(issued);
    } catch {
      setStartError(tRef.current('errors.network'));
    } finally {
      setStarting(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // A main profile photo is required: the selfie is compared against it.
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (!cancelled) {
          setStartError(tRef.current('errors.session'));
          setStarting(false);
        }
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userData.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!profile?.avatar_url) {
        setNeedPhoto(true);
        setStartError(tRef.current('verify.needPhoto'));
        setStarting(false);
        return;
      }
      await requestChallenge();
    })();
    return () => {
      cancelled = true;
    };
  }, [requestChallenge]);

  const resetHold = useCallback(() => {
    holdSinceRef.current = 0;
    missesRef.current = 0;
    handSinceRef.current = 0;
    handMissesRef.current = 0;
    setHoldProgress(0);
    setPhase('align');
  }, []);

  /** Back to the start of step 1 (fresh portrait, nothing pending). */
  const resetFlow = useCallback(() => {
    faceShotRef.current = null;
    busyRef.current = false;
    setStep('face');
    setHalted(false);
    setErrorMsg(null);
    resetHold();
  }, [resetHold]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  // A camera prompt answered after the member left this page must not leave the camera running.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopCamera(); // always release the camera on unmount
    };
  }, [stopCamera]);

  // Backgrounded (app switch, lock screen): release the camera; the member opens it again.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && streamRef.current && !busyRef.current) {
        stopCamera();
        resetFlow();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
    };
  }, [stopCamera, resetFlow]);

  const startCamera = useCallback(async () => {
    setErrorMsg(null);
    setFaceStatus('no_face');
    let stream: MediaStream;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new DOMException('No camera API', 'NotSupportedError');
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1280 } },
          audio: false,
        });
      } catch (err) {
        // Some front cameras reject the preferred size: retry with any front camera.
        if ((err as DOMException)?.name !== 'OverconstrainedError') throw err;
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      }
    } catch (err) {
      setCameraOn(false);
      setErrorMsg(t(cameraErrorKey(err)));
      return;
    }
    if (!mountedRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    // A second start (Restart, retry) replaces the first stream instead of leaking it.
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = stream;
    // Unplugged, revoked in settings or taken by another app mid-session.
    stream.getVideoTracks().forEach((track) => {
      track.onended = () => {
        if (streamRef.current !== stream) return;
        stopCamera();
        resetFlow();
        setErrorMsg(t('verify.camStopped'));
      };
    });
    setCameraOn(true);
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
    setGateState('loading');
    try {
      gateRef.current = gateRef.current ?? (await import('@/lib/faceGate'));
      await gateRef.current.initFaceGate();
      setGateState('ready');
    } catch {
      setGateState('error');
    }
  }, [stopCamera, resetFlow, t]);

  /** Restart pill: fresh stream, back to step 1. */
  const restart = useCallback(() => {
    resetFlow();
    startCamera();
  }, [resetFlow, startCamera]);

  /** X: close the camera and return to the instructions. */
  const closeCamera = useCallback(() => {
    stopCamera();
    resetFlow();
  }, [stopCamera, resetFlow]);

  // Attach the live stream whenever the <video> mounts (first open, and again if the camera view
  // remounts while a fresh pose is fetched after an expired session).
  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  // Gate loop. Step 1: one valid face held for HOLD_MS -> portrait. Step 2: one valid face AND the
  // requested pose held for HOLD_MS -> pose photo, submitted at once. Up to JITTER_FRAMES missed
  // frames inside a hold are forgiven.
  const poseId = pose?.id;
  useEffect(() => {
    if (!cameraOn || gateState !== 'ready' || halted) return;
    const timer = window.setInterval(() => {
      const video = videoRef.current;
      const gate = gateRef.current;
      if (!video || !gate || busyRef.current) return;
      let result: FaceGateResult;
      try {
        result = gate.evaluateFaceFrame(video, video.clientWidth, video.clientHeight, step === 'pose' ? poseId : undefined);
      } catch {
        return;
      }
      setFaceStatus((prev) => (prev === result.status ? prev : result.status));
      setPoseState((prev) => (prev === result.pose ? prev : result.pose));
      const now = Date.now();

      let ready = result.status === 'ok';
      if (ready && step === 'pose') {
        const handInView = result.pose === 'match' || result.pose === 'hand';
        if (handInView) {
          handMissesRef.current = 0;
          if (!handSinceRef.current) handSinceRef.current = now;
        } else if (++handMissesRef.current > JITTER_FRAMES) {
          handSinceRef.current = 0;
        }
        ready =
          result.pose === 'match' ||
          result.pose === 'unavailable' ||
          (handSinceRef.current > 0 && now - handSinceRef.current >= HAND_FALLBACK_MS);
      }

      if (ready) {
        missesRef.current = 0;
        if (!holdSinceRef.current) holdSinceRef.current = now;
      } else if (holdSinceRef.current && ++missesRef.current <= JITTER_FRAMES) {
        return; // forgive a frame or two; keep the progress where it is
      } else {
        if (holdSinceRef.current) {
          holdSinceRef.current = 0;
          setHoldProgress(0);
          setPhase('align');
        }
        return;
      }

      const progress = Math.min(1, (now - holdSinceRef.current) / HOLD_MS);
      setHoldProgress(progress);
      setPhase('hold');
      if (progress >= 1 && result.status === 'ok') {
        busyRef.current = true;
        setPhase('capturing');
        captureRef.current(result);
      }
    }, GATE_TICK_MS);
    return () => window.clearInterval(timer);
  }, [cameraOn, gateState, halted, poseId, step]);

  const submit = useCallback(
    async (poseShot: Shot, check: FaceGateResult) => {
      const face = faceShotRef.current;
      if (!attemptToken || !face) {
        busyRef.current = false;
        resetFlow();
        return;
      }
      // The server rejects attempts finished implausibly fast.
      const wait = issuedAtRef.current + MIN_SUBMIT_AFTER_ISSUE_MS - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      const faceCheck: FaceCheck = {
        detector: 'mediapipe_face_landmarker',
        face_count: check.faceCount,
        min_confidence: FACE_MIN_CONFIDENCE,
        width_ratio: check.widthRatio,
        checked_at: Date.now(),
        face_capture: 'auto',
        pose_capture: 'auto',
      };
      try {
        const form = new FormData();
        form.set('attemptId', attemptToken);
        form.append('face', face.blob, 'face.jpg');
        form.append('selfie', poseShot.blob, 'selfie.jpg');
        form.set('faceCheck', JSON.stringify(faceCheck));
        const res = await fetch('/api/verify/submit', { method: 'POST', body: form });
        // A proxy error page (413, 504) is not JSON: show a friendly message, not a parse error.
        const data = await res.json().catch(() => ({}));
        if (!mountedRef.current) return;
        if (res.status === 410) {
          // Token expired: issue a fresh pose and start over with the camera still on.
          const expired = t('verify.expired');
          resetFlow();
          await requestChallenge();
          setErrorMsg(expired);
          showActionToast(expired, 'info');
          return;
        }
        if (!res.ok) throw new SubmitError(submitErrorText(res.status, data.error, t));
        stopCamera();
        setDone({ fastTrack: Boolean(data.fastTrack) });
        setTimeout(() => router.push('/discover'), 4000);
      } catch (err: unknown) {
        // A fetch that never reached the server throws a TypeError: that's a connection problem.
        const failure = err instanceof SubmitError ? err.message : t('errors.network');
        hapticError();
        setErrorMsg(`${failure} ${t('verify.tapRestart')}`);
        setHalted(true);
        resetHold();
        busyRef.current = false;
      }
    },
    [attemptToken, requestChallenge, resetFlow, resetHold, router, showActionToast, stopCamera, t]
  );

  /** Called by the gate loop once a hold completes; re-checks this exact frame before taking it. */
  const capture = useCallback(
    async (held: FaceGateResult) => {
      const video = videoRef.current;
      const gate = gateRef.current;
      if (!video || !gate) {
        busyRef.current = false;
        resetHold();
        return;
      }
      const check = gate.evaluateFaceFrame(video, video.clientWidth, video.clientHeight);
      if (check.status !== 'ok') {
        setFaceStatus(check.status);
        busyRef.current = false;
        resetHold();
        return;
      }
      const { snap, error } = await snapshotFromVideo(video);
      if (!snap) {
        setErrorMsg(t(error || 'verify.errCapture'));
        busyRef.current = false;
        resetHold();
        return;
      }
      hapticPhotoSnap();
      setErrorMsg(null);
      if (step === 'face') {
        faceShotRef.current = snap;
        setStep('pose');
        busyRef.current = false;
        resetHold();
        return;
      }
      await submit(snap, { ...check, widthRatio: check.widthRatio ?? held.widthRatio });
    },
    [step, submit, resetHold, t]
  );
  useEffect(() => {
    captureRef.current = capture;
  }, [capture]);

  // ---- Status pill ---------------------------------------------------------------------------
  let dot = '#F59E0B';
  let statusText: string;
  if (gateState === 'error') {
    dot = '#EF4444';
    statusText = t('verify.statusUnavailable');
  } else if (gateState !== 'ready') {
    statusText = t('verify.statusStarting');
  } else if (phase === 'capturing') {
    dot = '#8574B7';
    statusText = step === 'face' ? t('verify.takingPortrait') : t('verify.statusVerifying');
  } else if (phase === 'hold') {
    dot = '#22C55E';
    statusText = t('verify.statusHold');
  } else if (faceStatus === 'multiple') {
    statusText = t('verify.statusMultiple');
  } else if (faceStatus === 'too_close') {
    statusText = t('verify.statusBack');
  } else if (faceStatus === 'too_far') {
    statusText = t('verify.statusCloser');
  } else if (faceStatus === 'off_center') {
    statusText = t('verify.hudCenter');
  } else if (faceStatus === 'ok' && step === 'pose' && poseState !== 'match') {
    statusText = t('verify.statusMirror');
  } else {
    statusText = t('verify.statusFrame');
  }
  const locked = gateState === 'ready' && (phase === 'hold' || phase === 'capturing');
  const glassBtn = 'bg-[#161422]/75 backdrop-blur-md text-white active:scale-95 transition';

  return (
    <main className="min-h-screen bg-white text-[#413B5E] flex flex-col justify-start">
      {!cameraOn && (
        <div className="flex items-center justify-between pt-3 pb-4 border-b border-[#D0CDE1] px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-10 w-10 rounded-2xl bg-white border border-[#D0CDE1] text-[#413B5E] hover:bg-[#E8E6F1]/70 flex items-center justify-center text-sm active:scale-95 transition shadow-xs"
            aria-label={t('verify.back')}
          >
            <ArrowLeft className="w-5 h-5 text-[#413B5E]" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-5 h-5 text-[#8574B7] shrink-0" />
            <h1 className="text-xl font-medium text-[#413B5E] truncate">{t('verify.title')}</h1>
          </div>
          <div className="w-10" />
        </div>
      )}

      {done ? (
        <div className="rounded-3xl bg-white border border-[#D0CDE1] p-8 text-center space-y-4 shadow-xl mx-4 mt-4">
          <div className="w-44 h-44 mx-auto rounded-3xl overflow-hidden bg-white">
            <img src="/images/verification/approved.png" alt="" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-medium text-[#413B5E]">{t('verify.doneTitle')}</h2>
          <p className="text-sm text-[#413B5E]/75 leading-relaxed">
            {done.fastTrack ? t('verify.doneFast') : t('verify.doneQueued')} {t('verify.doneBack')}
          </p>
        </div>
      ) : starting ? (
        <div className="p-6 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#8574B7] animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#413B5E]/75">{t('verify.preparing')}</p>
        </div>
      ) : startError || !pose ? (
        <div className="rounded-3xl bg-white border border-[#D0CDE1] p-8 text-center space-y-4 shadow-sm mx-4 mt-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <p className="text-sm text-[#413B5E]/75 leading-relaxed">{startError || t('verify.startFailed')}</p>
          <button
            type="button"
            onClick={() => router.push(needPhoto ? '/profile/edit' : '/discover')}
            className="text-xs font-medium text-[#8574B7] hover:text-[#413B5E] transition"
          >
            {needPhoto ? t('verify.addPhoto') : t('verify.backToDiscover')}
          </button>
        </div>
      ) : cameraOn ? (
        // Video-call layout: the member's own feed fills the screen with nothing over the face;
        // the pose to copy sits in a corner tile like the other caller's video.
        <div className="fixed inset-0 z-[70] w-screen h-[100dvh] overflow-hidden bg-black select-none">
          <video ref={attachVideo} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />

          {/* Top HUD: instruction card left, close + Restart right */}
          <div className="fixed top-4 inset-x-4 z-20 mt-[env(safe-area-inset-top,0px)] flex items-start justify-between gap-3">
            <div className="bg-[#161422]/75 backdrop-blur-md text-white rounded-2xl px-4 py-3 shadow-lg max-w-[75%]">
              <p className="text-xs uppercase tracking-wider text-[#D0CDE1] font-semibold">
                {t('verify.step', { n: step === 'face' ? 1 : 2 })}
              </p>
              <p className="mt-0.5 text-sm sm:text-base font-semibold text-white leading-snug">
                {step === 'face' ? t('verify.hudCenter') : t('verify.hudMirror')}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={closeCamera}
                aria-label={t('verify.closeCamera')}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${glassBtn}`}
              >
                <X className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={restart}
                className={`px-3.5 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 ${glassBtn}`}
              >
                <RefreshCw className="w-4 h-4" aria-hidden />
                {t('verify.restart')}
              </button>
            </div>
          </div>

          {/* Floating status pill (+ hold progress) and any error under it */}
          {/* Long translations (Khmer, Thai, the multi-face warning) wrap to a second line inside
              90vw instead of running off a 360px screen; the dot stays centred beside the text. */}
          <div className="fixed top-[104px] left-1/2 -translate-x-1/2 z-20 mt-[env(safe-area-inset-top,0px)] flex flex-col items-center gap-2 w-max max-w-[90vw]">
            <div
              role="status"
              aria-live="polite"
              className="relative overflow-hidden bg-white/95 backdrop-blur-md text-[#413B5E] rounded-[20px] max-w-[90vw] w-max px-4 py-1.5 text-sm font-semibold text-center leading-snug shadow-md flex items-center justify-center gap-2"
            >
              <span aria-hidden className="w-2 h-2 rounded-full shrink-0 transition-colors" style={{ backgroundColor: dot }} />
              <span className="min-w-0 text-balance">{statusText}</span>
              {phase === 'hold' && (
                <span aria-hidden className="absolute left-0 bottom-0 h-[3px] w-full bg-[#22C55E]/15">
                  <span
                    className="block h-full bg-[#22C55E] transition-[width] duration-100 ease-linear"
                    style={{ width: `${Math.round(holdProgress * 100)}%` }}
                  />
                </span>
              )}
            </div>
            {errorMsg && (
              <p className="max-w-[320px] px-3 py-1.5 rounded-xl bg-red-600/90 text-white text-xs font-medium text-center">{errorMsg}</p>
            )}
          </div>

          {/* Picture-in-picture reference tile: what to copy, like the other caller's video */}
          <div
            aria-hidden
            className={`fixed bottom-6 right-5 z-30 mb-[env(safe-area-inset-bottom,0px)] w-[124px] h-[168px] sm:w-[144px] sm:h-[192px] rounded-2xl border-2 bg-[#161422]/90 backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.55)] overflow-hidden pointer-events-none flex flex-col justify-between transition-[border-color,box-shadow] duration-200 ${
              locked ? 'border-[#22C55E] ring-4 ring-[#22C55E]/30' : 'border-white/90'
            }`}
          >
            {step === 'face' ? (
              <Image
                src={PORTRAIT_GUIDE.src}
                alt=""
                fill
                sizes="144px"
                draggable={false}
                className="w-full h-full object-cover"
                style={{ objectPosition: PORTRAIT_GUIDE.position }}
              />
            ) : (
              <Image src={pose.image} alt="" fill sizes="144px" draggable={false} className="w-full h-full object-cover bg-white" />
            )}
            <span className="relative px-2 py-0.5 m-2 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-white w-fit">
              {step === 'face' ? t('verify.pipGuide') : t('verify.pipMatch')}
            </span>
            <span className="relative bg-gradient-to-t from-black/85 via-black/50 to-transparent px-2.5 pt-4 pb-2 text-center font-brand text-xs font-semibold text-white truncate">
              {step === 'face' ? t('verify.pipLook') : t(POSE_NAME_KEY[pose.id])}
            </span>
          </div>
        </div>
      ) : (
        <div className="mx-4 mt-4 space-y-4 pb-28">
          <div className="p-5 rounded-3xl bg-white border border-[#D0CDE1] space-y-3 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#8574B7]">{t('verify.twoQuick')}</span>
            <ol className="space-y-1.5 text-xs text-[#413B5E]/85 leading-relaxed">
              <li>
                <span className="font-semibold text-[#413B5E]">1. {t('verify.portrait')}.</span> {t('verify.centerFace')}.
              </li>
              <li>
                <span className="font-semibold text-[#413B5E]">2. {t('verify.pose')}.</span> {t('verify.holdPose')}:
              </li>
            </ol>
            <PoseImage pose={pose} alt={t(POSE_LABEL_KEY[pose.id])} className="w-36 h-36 mx-auto rounded-3xl" />
            <p className="text-center text-sm font-medium text-[#413B5E]">{t(POSE_LABEL_KEY[pose.id])}</p>
            <p className="text-xs text-[#413B5E]/75 leading-relaxed text-center">{t('verify.introNote')}</p>
          </div>

          {/* Desktop: hand off to the phone camera (front cameras on laptops make poor selfies). */}
          <div className="hidden md:flex items-center gap-4 p-4 rounded-3xl bg-white border border-[#D0CDE1]">
            <QrCode
              value="https://meetin.asia/verify"
              size={112}
              label={t('verify.qrLabel')}
              className="shrink-0 rounded-xl"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#413B5E]">{t('verify.phoneTitle')}</p>
              <p className="mt-1 text-xs text-[#413B5E]/75 leading-relaxed">{t('verify.phoneBody')}</p>
            </div>
          </div>

          <ErrorNote message={errorMsg} />

          <button
            type="button"
            onClick={startCamera}
            className="w-full py-3.5 rounded-full bg-[#8574B7] hover:bg-[#534377] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-[#8574B7]/30 active:scale-95 transition"
          >
            <Camera className="w-4 h-4" />
            {t('verify.openCamera')}
          </button>
        </div>
      )}
    </main>
  );
}
