'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';

export default function GestureVerifyPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleCaptureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <main className="max-w-lg mx-auto w-full px-4 py-8 pb-20">
      
      <div className="text-center mb-6 space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Identity Pose Verification
        </h1>
        <p className="text-xs sm:text-sm text-[#DDD8D4]">
          Earn your verified profile badge to establish genuine trust with sincere members.
        </p>
      </div>

      <div className="rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 p-6 shadow-2xl space-y-6">
        
        {/* Pose Prompt Box */}
        <div className="text-center space-y-3">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-[#17131F] border border-[#725A7A]/40 flex items-center justify-center text-3xl shadow-inner">
            ✌️
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#B8AAC3] block">
              Your Verification Pose
            </span>
            <h2 className="text-lg font-black text-white">
              Peace Sign Beside Cheek
            </h2>
            <p className="text-xs text-[#DDD8D4] mt-1 leading-relaxed">
              Hold up a clear two-finger peace sign touching your cheek while looking directly at the camera.
            </p>
          </div>
        </div>

        {/* Photo Upload / Camera Preview Frame */}
        <div className="relative aspect-[4/5] w-full rounded-2xl bg-[#17131F] border-2 border-dashed border-[#725A7A]/50 overflow-hidden flex flex-col items-center justify-center p-4">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Verification Preview"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="text-center space-y-2 text-[#DDD8D4]">
              <div className="text-4xl text-[#725A7A]">📷</div>
              <p className="text-xs font-semibold">No photo captured yet</p>
            </div>
          )}
        </div>

        {/* Hidden Camera Input for iOS & Android */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Requirements Box */}
        <div className="rounded-xl bg-[#17131F] border border-[#725A7A]/25 p-3.5 text-xs text-[#DDD8D4] space-y-1">
          <span className="font-bold text-white block">Photo Requirements:</span>
          <p>• Face and hand must be clearly visible and well-lit.</p>
          <p>• No hats, heavy sunglasses, or face-altering filters.</p>
          <p>• Used strictly for verification; never posted publicly.</p>
        </div>

        {submitted ? (
          <div className="rounded-2xl bg-emerald-950/80 border border-emerald-500/50 p-4 text-center space-y-1">
            <span className="text-lg">✓</span>
            <h3 className="text-sm font-extrabold text-white">Verification Submitted</h3>
            <p className="text-xs text-emerald-200">
              Our safety team reviews submissions within 24 hours. Your badge will appear automatically upon approval.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleCaptureClick}
              className="w-full py-3.5 rounded-2xl bg-[#241E2F] border border-[#725A7A]/40 hover:border-[#978FA8] text-white font-extrabold text-sm active:scale-95 transition-all shadow-md"
            >
              {previewUrl ? 'Retake Selfie' : 'Take or Upload Selfie'}
            </button>

            {previewUrl && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-[#653C87] hover:bg-[#7A49A2] text-white font-extrabold text-sm active:scale-95 transition-all shadow-lg shadow-[#653C87]/40"
              >
                {submitting ? 'Submitting...' : 'Submit Verification'}
              </button>
            )}
          </div>
        )}

      </div>
    </main>
  );
}