'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  SunMedium,
  AlertCircle,
} from 'lucide-react';
import {
  getPoseById,
  validateAndCompressVerificationImage,
  type CompressionResult,
} from '@/lib/verification';

interface CapturedPhoto {
  blob: Blob;
  previewUrl: string;
}

export default function VerifyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [starting, setStarting] = useState(true);
  const [startError, setStartError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [sequence, setSequence] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch the server-issued sequence on entry. Never chosen client-side.
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
        setAttemptId(data.attemptId);
        setSequence(data.sequence);
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

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAnalyzing(true);
    const result: CompressionResult = await validateAndCompressVerificationImage(file);
    setAnalyzing(false);

    if (!result.valid || !result.blob || !result.previewUrl) {
      setErrorMsg(result.error || 'Photo could not be processed. Please try again.');
      return;
    }
    setPhotos((prev) => {
      const next = [...prev];
      if (next.length > step) next[step] = { blob: result.blob!, previewUrl: result.previewUrl! };
      else next.push({ blob: result.blob!, previewUrl: result.previewUrl! });
      return next;
    });
  };

  const retakeCurrent = () => {
    setPhotos((prev) => prev.slice(0, step));
    setErrorMsg(null);
  };

  const handleSubmit = useCallback(async () => {
    if (!attemptId || photos.length < sequence.length) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const form = new FormData();
      form.set('attemptId', attemptId);
      photos.forEach((p, i) => {
        form.set(`pose_${i}`, new File([p.blob], `pose-${i}.jpg`, { type: 'image/jpeg' }));
      });
      const res = await fetch('/api/verify/submit', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit verification');
      setSuccess(true);
      setTimeout(() => router.push('/discover'), 2400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit verification.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, photos, router, sequence.length]);

  const totalSteps = sequence.length || 4;
  const inReview = !starting && !startError && step >= sequence.length && sequence.length > 0;
  const currentPose = sequence.length > 0 ? getPoseById(sequence[step]) : null;
  const currentPhoto = photos[step];

  return (
    <main className="min-h-screen bg-[#F8F7FA] text-[#1C1924] flex flex-col justify-start">
      <div className="max-w-md mx-auto w-full px-4 py-8 pb-28 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DDD7E5]">
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

        {success ? (
          <div className="rounded-3xl bg-white border border-emerald-200 p-8 text-center space-y-4 shadow-xl">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-medium text-[#1C1924]">Verification Submitted</h2>
            <p className="text-sm text-[#6C637B] leading-relaxed">
              Your gesture photos were securely submitted. Once our team confirms they match your
              profile, your profile will display the verified trust badge.
            </p>
          </div>
        ) : starting ? (
          <div className="p-6 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#6555b8] animate-spin mx-auto" />
            <p className="text-xs font-semibold text-[#6C637B]">Preparing your challenge...</p>
          </div>
        ) : startError ? (
          <div className="rounded-3xl bg-white border border-[#DDD7E5] p-8 text-center space-y-4 shadow-sm">
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
          <div className="space-y-5">
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
                      setStep(i);
                      retakeCurrent();
                    }}
                    className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-[#DDD7E5] bg-[#F8F7FA] shadow-xs active:scale-[0.98] transition"
                  >
                    <img src={p.previewUrl} alt={`Pose ${i + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-black/50 text-white text-[10px] font-medium">
                      {getPoseById(sequence[i])?.label ?? `Pose ${i + 1}`}
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
          <div className="space-y-5">
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
                Gesture {step + 1} of {totalSteps}
              </span>
              <div className="p-3.5 rounded-2xl bg-[#F8F7FA] border border-[#E5E1EC] space-y-1.5">
                <span className="text-sm font-medium text-[#1C1924]">{currentPose?.label}</span>
                <p className="text-xs text-[#6C637B] leading-relaxed">
                  Match this exact pose in your photo. The order is random and unique to you.
                </p>
              </div>
              {currentPose && (
                <div className="flex flex-col items-center justify-center pt-1">
                  <div className="w-28 h-36 rounded-xl overflow-hidden border border-[#DDD7E5] bg-[#F8F7FA] shadow-xs">
                    <img
                      src={currentPose.image}
                      alt={`${currentPose.label} reference`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] text-[#8C849B] mt-1 font-medium">
                    Sample reference pose
                  </span>
                </div>
              )}
            </div>

            {/* Hidden Native Camera Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleCapture}
              className="hidden"
            />

            {/* Capture / Preview Box */}
            <div
              onClick={() => !analyzing && !submitting && fileInputRef.current?.click()}
              className="relative aspect-[3/4] w-full rounded-3xl bg-white border-2 border-dashed border-[#DDD7E5] hover:border-[#6555b8] flex flex-col items-center justify-center overflow-hidden cursor-pointer active:scale-[0.99] transition shadow-xs"
            >
              {analyzing ? (
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
                <div className="p-6 text-center space-y-3 pointer-events-none">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-[#F8F7FA] border border-[#DDD7E5] flex items-center justify-center text-[#6555b8] shadow-xs">
                    <Camera className="w-8 h-8 text-[#6555b8]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1C1924]">Take Verification Photo</p>
                    <p className="text-xs text-[#6C637B] mt-0.5">
                      Ensure your face and hands are clearly lit
                    </p>
                  </div>
                </div>
              )}
            </div>

            {currentPhoto && (
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

            {currentPhoto && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => setStep((s) => s + 1)}
                className="w-full py-3.5 rounded-2xl font-medium text-xs uppercase tracking-wider shadow-md transition active:scale-95 bg-[#6555b8] hover:bg-[#52449e] text-white shadow-[#6555b8]/30"
              >
                {step + 1 === totalSteps ? 'Review Photos' : 'Next Gesture'}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}