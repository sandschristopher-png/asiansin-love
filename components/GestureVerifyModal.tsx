'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { validateAndCompressVerificationImage } from '@/lib/verification';
import { Camera, RefreshCw, X, ShieldCheck } from 'lucide-react';

interface GestureVerifyModalProps {
  isOpen: boolean;
  userId: string;
  userFullName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface GestureOption {
  text: string;
  image: string;
}

// Exactly matches backend route ALLOWED_POSES whitelist
const VERIFICATION_GESTURES: GestureOption[] = [
  { text: 'Touch your left index finger to your chin', image: '/chin.png' },
  { text: 'Make a peace sign next to your right eye', image: '/peace.png' },
  { text: 'Hold 3 fingers up beside your left ear', image: '/three-fingers.png' },
  { text: 'Touch your thumb to the tip of your nose', image: '/palm.png' }
];

export function GestureVerifyModal({
  isOpen,
  userId,
  userFullName,
  onClose,
  onSuccess,
}: GestureVerifyModalProps) {
  const [selectedGesture] = useState<GestureOption>(() => 
    VERIFICATION_GESTURES[Math.floor(Math.random() * VERIFICATION_GESTURES.length)]
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setValidationError(null);
    }
  };

  const handleRetake = () => {
    setFile(null);
    setPreview(null);
    setValidationError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please take or upload a photo matching the pose.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      // 1. Client-side quality & luminance validation + compression
      const validation = await validateAndCompressVerificationImage(file);
      if (!validation.valid || !validation.blob) {
        setValidationError(validation.error || 'Image does not meet quality requirements.');
        setIsSubmitting(false);
        return;
      }

      // 2. Upload compressed image directly to Supabase avatars bucket
      const filePath = `verifications/${userId}/${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, validation.blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadErr) {
        throw new Error(`Upload failed: ${uploadErr.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const selfieUrl = publicUrlData.publicUrl;

      // 3. Post JSON payload to backend verification submission route
      const res = await fetch('/api/verify/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poseRequested: selectedGesture.text,
          selfieUrl,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Submission failed.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error submitting verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      {/* Constrained Dialog Shell */}
      <div className="relative w-full max-w-sm rounded-3xl bg-[#1F2036] border border-[#3E4066] shadow-2xl flex flex-col max-h-[88dvh] overflow-hidden text-white">
        
        {/* Pinned Header */}
        <div className="shrink-0 px-6 pt-5 pb-3 border-b border-[#303354] flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#A798D6]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Verification</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Confirm Your Identity
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Midsection */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          
          {/* Pose Instruction Card with Illustration */}
          <div className="p-3.5 rounded-2xl bg-[#292B48] border border-[#3E426D] flex items-center gap-3">
            <div className="relative w-14 h-14 shrink-0 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
              <Image
                src={selectedGesture.image}
                alt={selectedGesture.text}
                fill
                className="object-contain p-1"
              />
            </div>
            <div className="flex-1">
              <span className="text-[10px] uppercase font-semibold text-[#A798D6] block">
                Match This Pose
              </span>
              <p className="text-xs font-medium text-white leading-snug mt-0.5">
                {selectedGesture.text}
              </p>
            </div>
          </div>

          {/* Selfie Capture Box */}
          <div className="relative w-full h-44 rounded-2xl bg-[#171828] border border-dashed border-[#474A75] overflow-hidden flex flex-col items-center justify-center">
            {preview ? (
              <>
                <img
                  src={preview}
                  alt="Selfie preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRetake}
                  className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-[11px] font-medium text-white backdrop-blur-md flex items-center gap-1.5 border border-white/20 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retake</span>
                </button>
              </>
            ) : (
              <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-4 hover:bg-white/5 transition text-center">
                <div className="w-11 h-11 rounded-full bg-[#6555b8]/20 flex items-center justify-center text-[#9B89D8] mb-2 border border-[#6555b8]/40">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-white block">
                  Tap to Take Live Selfie
                </span>
                <span className="text-[10px] text-white/50 block mt-0.5">
                  Ensure your face and hand pose are clear
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {validationError && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs text-center leading-relaxed">
              {validationError}
            </div>
          )}
        </div>

        {/* Pinned Action Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-[#303354] bg-[#1F2036] flex flex-col gap-2">
          <button
            onClick={handleUpload}
            disabled={!file || isSubmitting}
            className="w-full py-3 rounded-xl bg-[#6555b8] hover:bg-[#52449e] disabled:opacity-40 disabled:hover:bg-[#6555b8] text-white font-semibold text-xs transition active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying & Uploading...</span>
              </>
            ) : (
              <span>Submit Verification</span>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-2 text-center text-xs font-medium text-white/50 hover:text-white transition"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
