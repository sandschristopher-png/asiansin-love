'use client';
import { Navbar } from '@/components/Navbar';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  ShieldCheck, 
  RefreshCw, 
  Loader2, 
  SunMedium, 
  AlertCircle 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { 

  VERIFICATION_CHALLENGES, 
  VerificationChallenge, 
  validateAndCompressVerificationImage 
} from '@/lib/verification';

export default function VerifyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [challenge, setChallenge] = useState<VerificationChallenge>(VERIFICATION_CHALLENGES[0]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lightingScore, setLightingScore] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);

  // Pick a random challenge on initial load
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * VERIFICATION_CHALLENGES.length);
    setChallenge(VERIFICATION_CHALLENGES[randomIndex]);
  }, []);

  const handleRollChallenge = () => {
    setErrorMsg(null);
    const available = VERIFICATION_CHALLENGES.filter((c) => c.id !== challenge.id);
    const nextChallenge = available[Math.floor(Math.random() * available.length)];
    setChallenge(nextChallenge);
  };

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setLightingScore(null);

    if (e.target.files && e.target.files[0]) {
      const rawFile = e.target.files[0];
      setAnalyzing(true);

      const result = await validateAndCompressVerificationImage(rawFile);
      setAnalyzing(false);

      if (!result.valid || !result.blob || !result.previewUrl) {
        setErrorMsg(result.error || 'Photo could not be processed. Please try again.');
        return;
      }

      setCompressedBlob(result.blob);
      setPreviewUrl(result.previewUrl);
      if (typeof result.brightness === 'number') {
        setLightingScore(result.brightness);
      }
    }
  };

  const handleUpload = async () => {
    if (!compressedBlob) {
      setErrorMsg('Please capture a photo matching the pose first.');
      return;
    }

    setUploading(true);
    setErrorMsg(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be signed in to submit verification.');
      }

      const filePath = `${user.id}/selfie_${Date.now()}.jpg`;

      // Upload compressed JPEG to Supabase storage bucket
      const { error: uploadError } = await supabase.storage
        .from('verifications')
        .upload(filePath, compressedBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Generate a private, 48-hour signed URL for the Telegram moderation alert
      const { data: signedData, error: signedErr } = await supabase.storage
        .from('verifications')
        .createSignedUrl(filePath, 172800);

      if (signedErr || !signedData?.signedUrl) {
        throw new Error(signedErr?.message || 'Failed to generate secure verification link');
      }

      const selfieUrl = signedData.signedUrl;

      // Submit verification attempt with the exact challenge issued
      const response = await fetch('/api/verify/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          poseRequested: `${challenge.badge} - ${challenge.instruction}`,
          selfieUrl,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to submit verification');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/discover');
      }, 2400);
    } catch (err: any) {
      console.error('Verification upload failed:', err);
      setErrorMsg(err.message || 'Failed to upload photo. Please check your connection.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F7FA] text-[#1C1924] flex flex-col justify-start">
      <div className="max-w-md mx-auto w-full px-4 py-8 pb-28 space-y-6">
      <Navbar />

        
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
            <h1 className="text-xl font-medium text-[#1C1924] ">
              Profile Verification
            </h1>
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
              Your gesture selfie was analyzed and securely submitted. Once verified by our moderation team, your profile will display the verified trust badge.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            
            {/* Pose Challenge Card */}
            <div className="p-5 rounded-3xl bg-white border border-[#DDD7E5] space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#6555b8]">
                  Assigned Gesture Challenge
                </span>
                <button
                  type="button"
                  onClick={handleRollChallenge}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6555b8] hover:text-[#52449e] transition"
                  title="Switch to another gesture challenge"
                >
                  <RefreshCw className="w-3 h-3" />
                  Try different pose
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8F7FA] border border-[#E5E1EC] space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1C1924]">{challenge.badge}</span>
                </div>
                <p className="text-xs text-[#6C637B] leading-relaxed">
                  {challenge.instruction}
                </p>
              </div>

              {challenge.id === 'three_fingers' && (
                <div className="flex flex-col items-center justify-center pt-1">
                  <div className="w-28 h-36 rounded-xl overflow-hidden border border-[#DDD7E5] bg-[#F8F7FA] shadow-xs">
                    <img
                      src="/three-fingers.jpg"
                      alt="Gesture Reference"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] text-[#8C849B] mt-1 font-medium">
                    Sample reference pose
                  </span>
                </div>
              )}
            </div>

            {/* Hidden Native File/Camera Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleCapture}
              className="hidden"
            />

            {/* Photo Capture / Preview Box */}
            <div
              onClick={() => !analyzing && fileInputRef.current?.click()}
              className="relative aspect-[3/4] w-full rounded-3xl bg-white border-2 border-dashed border-[#DDD7E5] hover:border-[#6555b8] flex flex-col items-center justify-center overflow-hidden cursor-pointer active:scale-[0.99] transition shadow-xs"
            >
              {analyzing ? (
                <div className="p-6 text-center space-y-3 pointer-events-none">
                  <Loader2 className="w-8 h-8 text-[#6555b8] animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-[#6C637B]">
                    Checking lighting and image resolution...
                  </p>
                </div>
              ) : previewUrl ? (
                <>
                  <img
                    src={previewUrl}
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
                    <p className="text-sm font-medium text-[#1C1924]">
                      Take Verification Selfie
                    </p>
                    <p className="text-xs text-[#6C637B] mt-0.5">
                      Ensure your face and hands are clearly lit
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Lighting Feedback Indicator */}
            {lightingScore !== null && !errorMsg && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl py-2 px-3">
                <SunMedium className="w-4 h-4 text-emerald-600" />
                <span>Lighting and resolution verified</span>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              disabled={uploading || analyzing || !compressedBlob}
              onClick={handleUpload}
              className={`w-full py-3.5 rounded-2xl font-medium text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2 ${
                compressedBlob && !uploading && !analyzing
                  ? 'bg-[#6555b8] hover:bg-[#52449e] text-white shadow-[#6555b8]/30'
                  : 'bg-white text-[#8C849B] cursor-not-allowed border border-[#DDD7E5]'
              }`}
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
              {uploading ? 'Encrypting & Submitting...' : 'Submit Verification Photo'}
            </button>

          </div>
        )}

      </div>
    </main>
  );
}
