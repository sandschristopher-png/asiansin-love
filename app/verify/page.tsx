'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';

export default function GestureVerificationPage() {
  const [photoSelected, setPhotoSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setPhotoSelected(previewUrl);
    }
  };

  const handleConfirmSubmit = () => {
    setSubmitted(true);
  };

  return (
    <main className="max-w-xl mx-auto w-full px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center text-center">
      
      {/* Hidden Mobile Native Camera Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="user"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-[family-name:var(--font-nunito)]">
          Identity Pose Verification
        </h1>
        <p className="text-xs sm:text-sm text-[#DDD8D4] mt-1 max-w-sm mx-auto">
          Earn your verified profile badge to establish genuine trust with sincere members.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 shadow-2xl space-y-5">
        
        {submitted ? (
          <div className="space-y-4 py-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-2xl text-emerald-300">
              ✓
            </div>
            <h2 className="text-lg font-bold text-white">Pose Submitted for Review</h2>
            <p className="text-xs sm:text-sm text-[#DDD8D4] max-w-xs mx-auto">
              Our moderation team is reviewing your selfie. Your profile check will activate shortly.
            </p>
            <Link
              href="/discover"
              className="inline-block mt-2 px-6 py-2.5 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
            >
              Return to Discovery
            </Link>
          </div>
        ) : (
          <>
            {photoSelected ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="relative aspect-square w-48 mx-auto rounded-2xl overflow-hidden border-2 border-[#653C87] shadow-xl">
                  <img src={photoSelected} alt="Verification selfie preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-xs font-bold text-[#DDD8D4] hover:text-white"
                  >
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSubmit}
                    className="px-5 py-2 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] text-xs font-bold text-white shadow-md active:scale-95 transition-all"
                  >
                    Submit Pose
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="h-16 w-16 mx-auto rounded-2xl bg-[#17131F] border border-[#725A7A]/35 flex items-center justify-center text-3xl shadow-inner">
                  ✌️
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#978FA8]">
                    Your Verification Pose
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Peace Sign Beside Cheek
                  </h2>
                  <p className="text-xs text-[#DDD8D4] max-w-xs mx-auto leading-relaxed">
                    Hold up a clear two-finger peace sign touching your cheek while looking directly at the camera.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#17131F]/70 border border-[#725A7A]/25 text-left text-xs text-[#DDD8D4] space-y-1">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>📷</span> Photo Requirements:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#B8AAC3]">
                    <li>Face and hand must be clearly visible and well-lit.</li>
                    <li>No hats, heavy sunglasses, or face-altering filters.</li>
                    <li>Used strictly for verification; never posted publicly.</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3.5 rounded-2xl bg-[#653C87] hover:bg-[#7A49A2] text-white font-bold text-sm shadow-lg shadow-[#41384E]/50 transition-all active:scale-[0.98]"
                >
                  Take or Upload Selfie
                </button>
              </>
            )}
          </>
        )}

      </div>
    </main>
  );
}
