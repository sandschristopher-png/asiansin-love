'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Camera,
  ShieldCheck,
  Loader2,
  SunMedium,
  AlertCircle,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  getPoseById,
  validateAndCompressVerificationImage,
  type CompressionResult,
} from '@/lib/verification';
import type { BlinkTracker } from '@/lib/poseVerifier';

interface CapturedPhoto {
  blob: Blob;
  previewUrl: string;
}

const HOLD_FRAMES_REQUIRED = 8; // ~1 second at 120ms ticks

export default function VerifyPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const blinkRef = useRef<BlinkTracker>({ eyesClosedSeen: false, blinkPassed: false });
  const streakRef = useRef(0);
  const capturingRef = useRef(false);
  const avatarUrlRef = useRef<string | null>(null);
  const verifierRef = useRef<typeof import('@/lib/poseVerifier') | null>(null);
  const lastStatusRef = useRef<{
    faceDetected: boolean;
    blinkPassed: boolean;
    poseMatched: boolean;
  } | null>(null);
  const [showFullRef, setShowFullRef] = useState(false);
  const [denyPulse, setDenyPulse] = useState(false);
  const [result, setResult] = useState<'approved' | 'denied' | null>(null);

  const [starting, setStarting] = useState(true);
  const [startError, setStartError] = useState<string | null>(null);
  const [attemptToken, setAttemptToken] = useState<string | null>(null);
  const [sequence, setSequence] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [captureTimestamps, setCaptureTimestamps] = useState<number[]>([]);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [cameraOn, setCameraOn] = useState(false);
  const [engineLoading, setEngineLoading] = useState(false);
  const [liveHint, setLiveHint] = useState('');
  const [holdProgress, setHoldProgress] = useState(0);

  // Fetch server-issued pose sequence + the user's avatar for the biometric match
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/verify/start', { method: 'POST' });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setStartError(data.error || 'Could not start verification. Please try again.');
          return;
        }
        setAttemptToken(data.attemptId);
        setSequence(data.sequence);

        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', userData.user.id)
            .maybeSingle();
          if (profile?.avatar_url) avatarUrlRef.current = profile.avatar_url;
        }
      } catch {
        if (!cancelled) setStartError('Network error. Please check your connection.');
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Always release the camera on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const processFile = useCallback(
    async (file: File, forStep: number) => {
      setErrorMsg(null);
      setAnalyzing(true);
      const result: CompressionResult = await validateAndCompressVerificationImage(file);
      setAnalyzing(false);

      if (!result.valid || !result.blob || !result.previewUrl) {
        setErrorMsg(result.error || 'Photo could not be processed. Please try again.');
        capturingRef.current = false;
        setHoldProgress(0);
        streakRef.current = 0;
        return;
      }

      setPhotos((prev) => {
        const next = [...prev];
        if (next.length > forStep) next[forStep] = { blob: result.blob!, previewUrl: result.previewUrl! };
        else next.push({ blob: result.blob!, previewUrl: result.previewUrl! });
        return next;
      });

      // Auto-advance to the next pose shortly after capture
      const total = sequence.length;
      if (forStep + 1 < total) {
        setLiveHint('Pose ' + (forStep + 1) + ' captured! Next pose...');
        streakRef.current = 0;
        setHoldProgress(0);
        setTimeout(() => setStep(forStep + 1), 900);
      } else {
        setTimeout(() => setStep(total), 600);
      }
    },
    [sequence.length]
  );

  const startCamera = useCallback(async () => {
    setErrorMsg(null);
    try {
      setEngineLoading(true);
      if (!verifierRef.current) {
        verifierRef.current = await import('@/lib/poseVerifier');
      }
      await verifierRef.current.initVerifierModels();
      setEngineLoading(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      streakRef.current = 0;
      setHoldProgress(0);
      setCameraOn(true);
      setLiveHint('Getting ready...');
    } catch {
      setEngineLoading(false);
      setErrorMsg('Live camera is required for verification. Please allow camera access and try again.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
    setHoldProgress(0);
    setLiveHint('');
  }, []);

  // Attach the stream once the video element is mounted
  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOn]);

  const captureFrame = useCallback(async () => {
    if (capturingRef.current) return;
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    capturingRef.current = true;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    // Gate 3: biometric match against profile avatar
    if (avatarUrlRef.current && verifierRef.current) {
      const match = await verifierRef.current.verifySelfieAgainstAvatar(canvas, avatarUrlRef.current);
      if (!match.matched) {
        setErrorMsg(match.error || 'Capture does not match your profile photo. Please retake.');
        capturingRef.current = false;
        streakRef.current = 0;
        setHoldProgress(0);
        return;
      }
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    );
    if (!blob) {
      setErrorMsg('Could not capture photo. Please try again.');
      capturingRef.current = false;
      return;
    }

    const ts = Date.now();
    const file = new File([blob], 'pose-' + ts + '.jpg', { type: 'image/jpeg' });
    await processFile(file, step);
    setCaptureTimestamps((prev) => [...prev, ts]);

    // Only shut the camera off after the final pose
    const total = sequence.length;
    if (step + 1 >= total) {
      stopCamera();
    }
    capturingRef.current = false;
  }, [processFile, step, stopCamera, sequence.length]);

  // Live scan loop: evaluates frames, auto-captures when all gates hold
  useEffect(() => {
    if (!cameraOn) return;
    const poseLabel = getPoseById(sequence[step])?.label ?? '';
    let timer: ReturnType<typeof setInterval>;

    timer = setInterval(() => {
      const video = videoRef.current;
      if (!video || capturingRef.current || analyzing || !verifierRef.current) return;

      const status = verifierRef.current.evaluateLiveFrame(video, poseLabel, blinkRef.current);
      lastStatusRef.current = status;
      setLiveHint(status.hint);

      if (status.faceDetected && status.blinkPassed && status.poseMatched) {
        streakRef.current += 1;
      } else {
        streakRef.current = 0;
      }
      setHoldProgress(streakRef.current);

      if (streakRef.current >= HOLD_FRAMES_REQUIRED) {
        streakRef.current = 0;
        setHoldProgress(0);
        captureFrame();
      }
    }, 120);

    return () => clearInterval(timer);
  }, [cameraOn, step, sequence, analyzing, captureFrame]);

  const handleSubmit = useCallback(async () => {
    if (!attemptToken || photos.length < sequence.length) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const form = new FormData();
      form.set('attemptId', attemptToken);
      form.set('blinkVerified', blinkRef.current.blinkPassed ? 'true' : 'false');
      photos.forEach((p, i) => {
      });
      form.set('captureTimestamps', JSON.stringify(captureTimestamps));
      const res = await fetch('/api/verify/submit', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit verification');
      const verified = Boolean(data.verified);
      setResult(verified ? 'approved' : 'denied');
      setSuccess(true);
      if (verified) {
        setTimeout(() => router.push('/discover'), 2400);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit verification.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  }, [attemptToken, photos, captureTimestamps, router, sequence.length]);

  const totalSteps = sequence.length;
  const inReview =
    !starting && !startError && step >= sequence.length && sequence.length > 0;
  const currentPose = !inReview && sequence.length > 0 ? getPoseById(sequence[step]) : null;
  const currentPhoto = photos[step];

  return (
    <main className="min-h-screen bg-[#F8F7FA] text-[#1C1924] flex flex-col justify-start">
      {/* Standard header when camera is off */}
      {!cameraOn && (
        <div className="flex items-center justify-between pb-4 border-b border-[#DDD7E5] px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-10 w-10 rounded-2xl bg-white border border-[#DDD7E5] text-[#1C1924] hover:bg-[#F3EFFC] flex items-center justify-center text-sm active:scale-95 transition shadow-xs"
          >
            <ArrowLeft className="w-5 h-5 text-[#1C1924]" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#6555b8]" />
            <h1 className="text-xl font-medium text-[#1C1924]">Profile Verification</h1>
          </div>
          <div className="w-10" />
        </div>
      )}

      {success ? (
        <div className="rounded-3xl bg-white border border-[#DDD7E5] p-8 text-center space-y-4 shadow-xl mx-4 mt-4">
          {result === 'approved' ? (
            <>
              <div className="w-44 h-44 mx-auto rounded-3xl overflow-hidden border border-emerald-200 shadow-sm bg-[#F8F7FA]">
                <img
                  src="/images/verification/status-approved.png"
                  alt="Approved"
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-xl font-medium text-[#1C1924]">You are verified!</h2>
              <p className="text-sm text-[#6C637B] leading-relaxed">
                Your liveness scan passed and your verified badge is now live on your profile.
                Taking you back to Discover...
              </p>
            </>
          ) : (
            <>
              <div className="w-44 h-44 mx-auto rounded-3xl overflow-hidden border border-rose-200 shadow-sm bg-[#F8F7FA]">
                <img
                  src="/images/verification/status-denied.png"
                  alt="Denied"
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-xl font-medium text-[#1C1924]">Verification not completed</h2>
              <p className="text-sm text-[#6C637B] leading-relaxed">
                We could not confirm a live scan for this session. You can try again now or come
                back tomorrow.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-xs font-semibold text-[#6555b8] hover:text-[#52449e] transition"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      ) : starting ? (
        <div className="p-6 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#6555b8] animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#6C637B]">Preparing your challenge...</p>
        </div>
      ) : startError ? (
        <div className="rounded-3xl bg-white border border-[#DDD7E5] p-8 text-center space-y-4 shadow-sm mx-4 mt-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <p className="text-sm text-[#6C637B] leading-relaxed">{startError}</p>
          <button
            type="button"
            onClick={() => router.push('/discover')}
            className="text-xs font-semibold text-[#6555b8] hover:text-[#52449e] transition"
          >
            Back to Discover
          </button>
        </div>
      ) : inReview ? (
        <div className="mx-4 mt-4 space-y-5 pb-28">
          <div className="p-5 rounded-3xl bg-white border border-[#DDD7E5] space-y-4 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#6555b8]">
              Review your photos
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {photos.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPhotos((prev) => prev.slice(0, i));
                    setStep(i);
                  }}
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-[#DDD7E5] bg-[#F8F7FA] shadow-xs active:scale-[0.98] transition"
                >
                  <img src={p.previewUrl} alt={'Pose ' + (i + 1)} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-black/50 text-white text-[10px] font-medium">
                    {getPoseById(sequence[i])?.label ?? 'Pose ' + (i + 1)}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-[#6C637B]">Tap any photo to retake it.</p>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className={`w-full py-3.5 rounded-2xl font-medium text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2 ${
              !submitting
                ? 'bg-[#6555b8] hover:bg-[#52449e] text-white shadow-[#6555b8]/30'
                : 'bg-white text-[#8C849B] cursor-not-allowed border border-[#DDD7E5]'
            }`}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
            {submitting ? 'Submitting...' : 'Submit Verification'}
          </button>
        </div>
      ) : (
        <div className={`${cameraOn ? 'fixed inset-0 bg-black' : 'mx-4 mt-4 space-y-5 pb-28'}`}>
          {/* Standard card UI when camera is off */}
          {!cameraOn && (
            <>
              {/* Progress */}
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i < step
                        ? 'w-8 bg-[#6555b8]'
                        : i === step
                          ? 'w-8 bg-[#6555b8]/40'
                          : 'w-4 bg-[#DDD7E5]'
                    }`}
                  />
                ))}
              </div>

              {/* Pose Challenge Card */}
              <div className="p-5 rounded-3xl bg-white border border-[#DDD7E5] space-y-3 shadow-sm">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#6555b8]">
                  Pose {step + 1} of {totalSteps}
                </span>
                <div className="p-3 rounded-2xl bg-[#F8F7FA] border border-[#E5E1EC] space-y-1.5">
                  <span className="text-sm font-medium text-[#1C1924]">{currentPose?.label}</span>
                  <p className="text-xs text-[#6C637B] leading-relaxed">
                    Match this exact pose in your photo. The order is random and unique to you.
                  </p>
                </div>
                {currentPose && (
                  <div className="flex flex-col items-center justify-center pt-1">
                    <div className="w-48 h-60 rounded-2xl overflow-hidden border border-[#DDD7E5] bg-[#F8F7FA] shadow-sm">
                      <img
                        src={currentPose.image}
                        alt={currentPose.label + ' reference'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] text-[#8C849B] mt-1 font-medium">
                      Sample reference pose
                    </span>
                  </div>
                )}
              </div>

              {/* Capture / Preview Box */}
              <div
                onClick={() => {
                  if (analyzing || cameraOn) return;
                  startCamera();
                }}
                className={`relative rounded-3xl bg-white border-2 border-dashed border-[#DDD7E5] hover:border-[#6555b8] flex flex-col items-center justify-center overflow-hidden cursor-pointer active:scale-[0.99] transition shadow-xs ${
                  analyzing || currentPhoto || engineLoading
                    ? 'aspect-[3/4] w-full max-w-[300px] mx-auto'
                    : 'w-full max-w-[300px] mx-auto'
                }`}
              >
                {engineLoading ? (
                  <div className="p-6 text-center space-y-3 pointer-events-none">
                    <Loader2 className="w-8 h-8 text-[#6555b8] animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-[#6C637B]">
                      Loading verification engine... (first time takes a few seconds)
                    </p>
                  </div>
                ) : analyzing ? (
                  <div className="p-6 text-center space-y-3 pointer-events-none">
                    <Loader2 className="w-8 h-8 text-[#6555b8] animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-[#6C637B]">
                      Checking lighting and image resolution...
                    </p>
                  </div>
                ) : currentPhoto ? (
                  <>
                    <img
                      src={currentPhoto.previewUrl}
                      alt="Verification Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="px-4 py-2 rounded-2xl bg-white border border-[#DDD7E5] text-xs font-medium text-[#1C1924] shadow-md">
                        Tap to retake
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="px-5 py-4 flex items-center gap-3.5 pointer-events-none w-full">
                    <div className="h-11 w-11 shrink-0 rounded-2xl bg-[#F8F7FA] border border-[#DDD7E5] flex items-center justify-center text-[#6555b8] shadow-xs">
                      <Camera className="w-5 h-5 text-[#6555b8]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1C1924]">Take Verification Photo</p>
                      <p className="text-xs text-[#6C637B] mt-0.5">
                        Live camera with liveness check - auto-captures every pose
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {currentPhoto && !cameraOn && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl py-2 px-3">
                  <SunMedium className="w-4 h-4 text-emerald-600" />
                  <span>Lighting and resolution verified</span>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </>
          )}

          {/* Fullscreen camera takeover when camera is on */}
          {cameraOn && (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="fixed inset-0 w-full h-full object-cover scale-x-[-1]"
              />

              {/* Back button in camera mode */}
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  router.back();
                }}
                className="fixed top-4 left-4 h-10 w-10 rounded-full bg-black/40 backdrop-blur border border-white/30 flex items-center justify-center active:scale-95 transition z-50"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>

              {/* Cancel X button in top-right */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  stopCamera();
                }}
                className="fixed top-4 right-4 h-10 w-10 rounded-full bg-black/40 backdrop-blur border border-white/30 flex items-center justify-center active:scale-95 transition z-50"
                aria-label="Cancel"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Live hint + hold progress bar at top */}
              <div className="fixed top-16 left-4 right-4 space-y-2 pointer-events-none z-40">
                <div className="px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur text-white text-[11px] font-medium text-center">
                  {liveHint}
                </div>
                <div className="h-1 rounded-full bg-white/30 overflow-hidden mx-4">
                  <div
                    className="h-full bg-[#6555b8] transition-all duration-150"
                    style={{ width: (holdProgress / HOLD_FRAMES_REQUIRED) * 100 + '%' }}
                  />
                </div>
              </div>

              {/* Pose reference thumbnail in bottom-left corner */}
              {currentPose && (
                <div className="fixed bottom-20 left-4 z-40">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullRef(true);
                    }}
                    className="relative rounded-xl overflow-hidden border-2 border-white/60 shadow-lg active:scale-95 transition"
                  >
                    <img
                      src={currentPose.image}
                      alt={currentPose.label + ' reference'}
                      className="w-24 h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-medium text-white px-1.5 py-0.5 rounded bg-black/50">
                      {currentPose.label}
                    </span>
                  </button>
                </div>
              )}

              {/* Capture button at bottom center - always tappable, gates checked on tap */}
              <div className="fixed bottom-6 left-0 right-0 flex items-center justify-center z-50">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const s = lastStatusRef.current;
                    if (s && s.faceDetected && s.blinkPassed && s.poseMatched) {
                      captureFrame();
                    } else {
                      setDenyPulse(true);
                      setTimeout(() => setDenyPulse(false), 450);
                    }
                  }}
                  className={`h-20 w-20 rounded-full bg-white border-4 flex items-center justify-center active:scale-95 transition-all duration-150 shadow-lg ${
                    denyPulse ? 'border-rose-400 scale-110' : 'border-[#6555b8]'
                  }`}
                  aria-label="Capture photo"
                >
                  <Camera className="w-7 h-7 text-[#6555b8]" />
                </button>
              </div>

              {/* Expanded reference modal */}
              {showFullRef && currentPose && (
                <div
                  className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
                  onClick={() => setShowFullRef(false)}
                >
                  <div
                    className="relative bg-white rounded-3xl overflow-hidden max-w-sm w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setShowFullRef(false)}
                      className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/30 backdrop-blur border border-white/30 flex items-center justify-center active:scale-95 transition z-10"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                    <div className="aspect-[3/4] w-full">
                      <img
                        src={currentPose.image}
                        alt={currentPose.label + ' reference'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 bg-white">
                      <h3 className="text-lg font-medium text-[#1C1924] mb-1">{currentPose.label}</h3>
                      <p className="text-xs text-[#6C637B]">
                        Match this exact pose. Hold steady until auto-capture.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}