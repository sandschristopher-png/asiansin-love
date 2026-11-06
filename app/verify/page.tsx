'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, ShieldCheck, Loader2, AlertCircle, X, RotateCcw, ScanFace, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getPoseById, type VerificationPose } from '@/lib/poses';
import type { FaceGateResult } from '@/lib/faceGate';
import { FACE_GATE_MESSAGES, FACE_MIN_CONFIDENCE, type FaceGateStatus } from '@/lib/faceGateMessages';
import { hapticError, hapticPhotoSnap } from '@/lib/utils/haptics';

/** Sent with the selfie; the server rejects anything that isn't exactly one confident face. */
interface FaceCheck {
  detector: 'mediapipe_face_landmarker';
  face_count: number;
  min_confidence: number;
  width_ratio: number | null;
  checked_at: number;
}

const GATE_TICK_MS = 150;

const MAX_DIM = 1200; // longest edge of the uploaded selfie
const JPEG_QUALITY = 0.85;

interface Snapshot {
  blob: Blob;
  previewUrl: string;
  faceCheck: FaceCheck;
}

/**
 * Grabs the current video frame (un-mirrored: the CSS flip is display-only), scales it to
 * MAX_DIM and rejects frames that are too dark or blown out to be reviewable.
 */
async function snapshotFromVideo(video: HTMLVideoElement): Promise<{ snap?: Omit<Snapshot, 'faceCheck'>; error?: string }> {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return { error: 'Camera is still starting. Try again in a moment.' };

  const scale = Math.min(1, MAX_DIM / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return { error: 'Photo could not be processed.' };
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let total = 0;
  let samples = 0;
  for (let i = 0; i < data.length; i += 40) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    samples++;
  }
  const brightness = samples > 0 ? total / samples : 0;
  if (brightness < 40) return { error: 'Photo is too dark. Move somewhere with better lighting.' };
  if (brightness > 235) return { error: 'Photo is overexposed. Try again in softer light.' };

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
  if (!blob) return { error: 'Could not capture photo. Please try again.' };
  return { snap: { blob, previewUrl: URL.createObjectURL(blob) } };
}

function PoseImage({ pose, className = '' }: { pose: VerificationPose; className?: string }) {
  // Functional figure: plain white, flat (no aura, border or glow).
  return (
    <img
      src={pose.image}
      alt={pose.label}
      className={`object-contain bg-white ${className}`}
      draggable={false}
    />
  );
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

export default function VerifyPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [starting, setStarting] = useState(true);
  const [startError, setStartError] = useState<string | null>(null);
  const [attemptToken, setAttemptToken] = useState<string | null>(null);
  const [pose, setPose] = useState<VerificationPose | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState<{ fastTrack: boolean; message: string } | null>(null);

  // Live single-face gate (MediaPipe, loaded when the camera opens). The shutter only works while
  // the current frame has exactly one confident face, centered in the oval. Nothing advances on a
  // timer: no face, no capture.
  const gateRef = useRef<typeof import('@/lib/faceGate') | null>(null);
  const [gateState, setGateState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [faceStatus, setFaceStatus] = useState<FaceGateStatus>('no_face');
  const lastResultRef = useRef<FaceGateResult | null>(null);

  /** Server issues one random pose in a signed, short-lived token. */
  const requestChallenge = useCallback(async () => {
    setStarting(true);
    setStartError(null);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/verify/start', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setStartError(data.error || 'Could not start verification. Please try again.');
        return;
      }
      const issued = getPoseById(data.sequence?.[0]);
      if (!issued) {
        setStartError('Could not start verification. Please try again.');
        return;
      }
      setAttemptToken(data.attemptId);
      setPose(issued);
    } catch {
      setStartError('Network error. Please check your connection.');
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
          setStartError('Please sign in to verify your profile.');
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
        setStartError('Add a clear main profile photo first - verification matches your face against it.');
        setStarting(false);
        return;
      }
      await requestChallenge();
    })();
    return () => {
      cancelled = true;
    };
  }, [requestChallenge]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  // Always release the camera on unmount
  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = useCallback(async () => {
    setErrorMsg(null);
    setFaceStatus('no_face');
    lastResultRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch {
      setErrorMsg('Live camera is required for verification. Please allow camera access and try again.');
      return;
    }
    setGateState('loading');
    try {
      gateRef.current = gateRef.current ?? (await import('@/lib/faceGate'));
      await gateRef.current.initFaceGate();
      setGateState('ready');
    } catch {
      setGateState('error');
    }
  }, []);

  /** Stuck? Release the stream and start over without reloading the page. */
  const restartCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
    startCamera();
  }, [startCamera]);

  // Gate loop: re-evaluates the live frame; only status changes re-render.
  useEffect(() => {
    if (!cameraOn || gateState !== 'ready') return;
    const timer = window.setInterval(() => {
      const video = videoRef.current;
      const gate = gateRef.current;
      if (!video || !gate) return;
      try {
        const result = gate.evaluateFaceFrame(video, video.clientWidth, video.clientHeight);
        lastResultRef.current = result;
        setFaceStatus((prev) => (prev === result.status ? prev : result.status));
      } catch {
        lastResultRef.current = null;
        setFaceStatus('no_face');
      }
    }, GATE_TICK_MS);
    return () => window.clearInterval(timer);
  }, [cameraOn, gateState]);

  // Attach the stream once the video element is mounted
  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOn]);

  const takeSnapshot = useCallback(async () => {
    const video = videoRef.current;
    const gate = gateRef.current;
    if (!video) return;
    // Synchronous re-check of this exact frame: the shutter never fires on a hand, an object,
    // an empty frame or a second face.
    const check = gate && gateState === 'ready' ? gate.evaluateFaceFrame(video, video.clientWidth, video.clientHeight) : null;
    if (!check || check.status !== 'ok') {
      if (check) setFaceStatus(check.status);
      hapticError();
      setErrorMsg('Face not verified. Please align your face in the oval.');
      return;
    }
    hapticPhotoSnap();
    const { snap, error } = await snapshotFromVideo(video);
    if (!snap) {
      setErrorMsg(error || 'Could not capture photo. Please try again.');
      return;
    }
    setErrorMsg(null);
    setSnapshot({
      ...snap,
      faceCheck: {
        detector: 'mediapipe_face_landmarker',
        face_count: check.faceCount,
        min_confidence: FACE_MIN_CONFIDENCE,
        width_ratio: check.widthRatio,
        checked_at: Date.now(),
      },
    });
    stopCamera();
  }, [stopCamera, gateState]);

  const retake = useCallback(() => {
    if (snapshot) URL.revokeObjectURL(snapshot.previewUrl);
    setSnapshot(null);
    startCamera();
  }, [snapshot, startCamera]);

  const handleSubmit = useCallback(async () => {
    if (!attemptToken || !snapshot) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const form = new FormData();
      form.set('attemptId', attemptToken);
      form.append('selfie', snapshot.blob, 'selfie.jpg');
      form.set('faceCheck', JSON.stringify(snapshot.faceCheck));
      const res = await fetch('/api/verify/submit', { method: 'POST', body: form });
      const data = await res.json();
      if (res.status === 410) {
        // Token expired: issue a fresh pose rather than leaving the member stuck.
        setSnapshot(null);
        await requestChallenge();
        setErrorMsg(data.error || 'Your session expired. Here is a new pose to copy.');
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to submit verification');
      setDone({
        fastTrack: Boolean(data.fastTrack),
        message: data.message || 'Submitted for review.',
      });
      setTimeout(() => router.push('/discover'), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit verification.');
    } finally {
      setSubmitting(false);
    }
  }, [attemptToken, snapshot, requestChallenge, router]);

  return (
    <main className="min-h-screen bg-white text-[#413B5E] flex flex-col justify-start">
      {!cameraOn && (
        <div className="flex items-center justify-between pt-3 pb-4 border-b border-[#D0CDE1] px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-10 w-10 rounded-2xl bg-white border border-[#D0CDE1] text-[#413B5E] hover:bg-[#E8E6F1]/70 flex items-center justify-center text-sm active:scale-95 transition shadow-xs"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-[#413B5E]" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#665D96]" />
            <h1 className="text-xl font-medium text-[#413B5E]">Profile Verification</h1>
          </div>
          <div className="w-10" />
        </div>
      )}

      {done ? (
        <div className="rounded-3xl bg-white border border-[#D0CDE1] p-8 text-center space-y-4 shadow-xl mx-4 mt-4">
          <div className="w-44 h-44 mx-auto rounded-3xl overflow-hidden bg-white">
            <img src="/images/verification/approved.png" alt="Submitted" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-medium text-[#413B5E]">Submitted for review</h2>
          <p className="text-sm text-[#413B5E]/75 leading-relaxed">
            {done.message} Taking you back to Discover...
          </p>
        </div>
      ) : starting ? (
        <div className="p-6 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#665D96] animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#413B5E]/75">Preparing your pose...</p>
        </div>
      ) : startError || !pose ? (
        <div className="rounded-3xl bg-white border border-[#D0CDE1] p-8 text-center space-y-4 shadow-sm mx-4 mt-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <p className="text-sm text-[#413B5E]/75 leading-relaxed">{startError || 'Could not start verification.'}</p>
          <button
            type="button"
            onClick={() => router.push(startError?.includes('profile photo') ? '/profile/edit' : '/discover')}
            className="text-xs font-semibold text-[#665D96] hover:text-[#413B5E] transition"
          >
            {startError?.includes('profile photo') ? 'Add a main photo' : 'Back to Discover'}
          </button>
        </div>
      ) : cameraOn ? (
        <div className="fixed inset-0 bg-black z-[70]">
          {/* Mirrored for display only (selfie view); the snapshot is taken from the raw frame. */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />

          {/* Oval face guide (same geometry as guideOval() in lib/faceGate.ts) + live feedback pill */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-[68%] max-w-[300px] aspect-[3/4]">
              <div
                className={`absolute inset-0 rounded-[50%] border-[3px] shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] transition-colors ${
                  gateState === 'ready' && faceStatus === 'ok' ? 'border-emerald-400' : 'border-white/85'
                }`}
              />
              <div
                role="status"
                aria-live="polite"
                className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#413B5E] text-xs font-semibold shadow-lg"
              >
                <span
                  aria-hidden
                  className={`w-2 h-2 rounded-full ${
                    gateState === 'ready' && faceStatus === 'ok' ? 'bg-emerald-500' : gateState === 'error' ? 'bg-red-500' : 'bg-amber-400'
                  }`}
                />
                {gateState === 'loading' || gateState === 'idle'
                  ? 'Starting face check...'
                  : gateState === 'error'
                    ? "Couldn't start the face check. Tap Restart."
                    : FACE_GATE_MESSAGES[faceStatus]}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={restartCamera}
            className="absolute top-20 right-4 h-10 px-3 rounded-full bg-black/40 backdrop-blur border border-white/30 inline-flex items-center gap-1.5 text-white text-xs font-semibold active:scale-95 transition z-50"
            aria-label="Restart camera"
          >
            <RefreshCw className="w-4 h-4" />
            Restart
          </button>

          <button
            type="button"
            onClick={stopCamera}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/40 backdrop-blur border border-white/30 flex items-center justify-center active:scale-95 transition z-50"
            aria-label="Close camera"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="absolute top-4 left-4 right-16 z-50 flex items-center gap-2.5 px-2.5 py-2 rounded-2xl bg-black/45 backdrop-blur text-white">
            <PoseImage pose={pose} className="w-12 h-12 rounded-xl shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Match this pose</p>
              <p className="text-xs font-semibold leading-snug">{pose.label}</p>
            </div>
          </div>

          {errorMsg && (
            <div className="absolute bottom-32 left-4 right-4 z-50 px-3 py-2 rounded-xl bg-red-600/90 text-white text-xs text-center">
              {errorMsg}
            </div>
          )}

          <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 z-50">
            <button
              type="button"
              onClick={takeSnapshot}
              disabled={gateState !== 'ready' || faceStatus !== 'ok'}
              className="h-20 w-20 rounded-full bg-white border-4 border-[#665D96] flex items-center justify-center active:scale-95 transition shadow-lg disabled:opacity-40 disabled:border-white/60 disabled:active:scale-100"
              aria-label="Take photo"
            >
              <Camera className="w-7 h-7 text-[#665D96]" />
            </button>
            <span className="text-[11px] text-white/85 font-medium">
              {gateState === 'ready' && faceStatus === 'ok' ? 'Do the pose, then tap to capture' : 'Face in the oval, pose clearly visible'}
            </span>
          </div>
        </div>
      ) : snapshot ? (
        <div className="mx-4 mt-4 space-y-4 pb-28">
          <div className="p-4 rounded-3xl bg-white border border-[#D0CDE1] shadow-sm space-y-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#665D96]">Check your photo</span>
            <div className="grid grid-cols-[1fr_88px] gap-3 items-start">
              <img
                src={snapshot.previewUrl}
                alt="Your verification selfie"
                className="w-full aspect-[3/4] object-cover rounded-2xl border border-[#D0CDE1] scale-x-[-1]"
              />
              <figure className="space-y-1">
                <PoseImage pose={pose} className="w-full aspect-square rounded-2xl" />
                <figcaption className="text-[10px] text-center text-[#413B5E]/55 leading-tight">{pose.label}</figcaption>
              </figure>
            </div>
            <p className="text-xs text-[#413B5E]/75">
              Make sure your whole face and the pose are clearly visible.
            </p>
          </div>

          <ErrorNote message={errorMsg} />

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={submitting}
              onClick={retake}
              className="py-3.5 rounded-2xl bg-white border border-[#D0CDE1] text-[#413B5E] text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="py-3.5 rounded-2xl bg-[#665D96] hover:bg-[#413B5E] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-[#665D96]/30 active:scale-95 transition disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanFace className="w-4 h-4" />}
              {submitting ? 'Checking...' : 'Verify with AI'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-4 mt-4 space-y-4 pb-28">
          <div className="p-5 rounded-3xl bg-white border border-[#D0CDE1] space-y-3 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#665D96]">Match this pose:</span>
            <PoseImage pose={pose} className="w-44 h-44 mx-auto rounded-3xl" />
            <p className="text-center text-sm font-medium text-[#413B5E]">{pose.label}</p>
            <p className="text-xs text-[#413B5E]/75 leading-relaxed text-center">
              Take one live selfie copying this pose. We compare it with your main photo, then a member of
              our team approves your badge.
            </p>
          </div>

          <ErrorNote message={errorMsg} />

          <button
            type="button"
            onClick={startCamera}
            className="w-full py-3.5 rounded-2xl bg-[#665D96] hover:bg-[#413B5E] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#665D96]/30 active:scale-95 transition"
          >
            <Camera className="w-4 h-4" />
            Open camera
          </button>
        </div>
      )}
    </main>
  );
}
