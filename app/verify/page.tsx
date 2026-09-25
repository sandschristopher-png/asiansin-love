'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function VerifyScreen() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Randomized required pose instruction
  const requiredPose = {
    title: 'Peace Sign Beside Cheek',
    instruction: 'Hold up a clear two-finger peace sign touching your right cheek while smiling directly at the camera.',
    icon: '✌️',
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(URL.createObjectURL(file));
      setStep(2);
    }
  };

  const handleConfirmSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setStep(3);
    }, 1200);
  };

  return (
    <main className="max-w-2xl mx-auto w-full px-3 sm:px-6 py-6 flex-1 flex flex-col justify-center">
      
      {/* Header */}
      <div className="border-b border-[#725A7A]/25 pb-3.5 mb-5 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Identity Pose Verification
        </h1>
        <p className="text-xs sm:text-sm text-[#DDD8D4] mt-1">
          Earn your verified profile badge to establish genuine trust with sincere members.
        </p>
      </div>

      <div className="rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 p-5 sm:p-7 shadow-2xl space-y-6">
        
        {step === 1 && (
          <div className="space-y-5 text-center">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-[#17131F] border border-[#725A7A]/40 flex items-center justify-center text-3xl">
              {requiredPose.icon}
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8AAC3]">
                Your Verification Pose
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">{requiredPose.title}</h2>
              <p className="text-xs sm:text-sm text-[#DDD8D4] mt-2 leading-relaxed max-w-md mx-auto">
                {requiredPose.instruction}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#17131F] border border-[#725A7A]/25 text-left space-y-1.5 text-xs text-[#DDD8D4]">
              <p className="font-bold text-white">📸 Photo Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-[#B8AAC3]">
                <li>Face and hand must be clearly visible and well-lit.</li>
                <li>No hats, heavy sunglasses, or face-altering filters.</li>
                <li>This selfie is strictly used by our team for safety verification and will not be posted publicly.</li>
              </ul>
            </div>

            <div>
              <label className="block w-full py-3.5 rounded-2xl bg-[#653C87] hover:bg-[#7A49A2] text-white text-sm sm:text-base font-bold text-center cursor-pointer shadow-lg shadow-[#41384E]/50 transition-all active:scale-[0.98]">
                Take or Upload Selfie
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-lg font-bold text-white">Confirm Your Photo</h2>
              <p className="text-xs text-[#DDD8D4] mt-0.5">
                Does your selfie clearly show your face and the {requiredPose.title.toLowerCase()}?
              </p>
            </div>

            <div className="relative aspect-[4/3.5] max-h-72 w-full rounded-2xl overflow-hidden bg-[#17131F] border border-[#725A7A]/35 mx-auto">
              {selectedFile && (
                <img
                  src={selectedFile}
                  alt="Verification Preview"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl bg-[#17131F] hover:bg-[#2E263B] border border-[#725A7A]/35 text-white text-xs sm:text-sm font-bold transition-colors"
              >
                Retake Photo
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98]"
              >
                {isSubmitting ? 'Uploading...' : 'Submit Verification'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && isSuccess && (
          <div className="py-8 text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-3xl">
              ✓
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Verification Submitted!</h2>
              <p className="text-xs sm:text-sm text-[#DDD8D4] mt-1.5 max-w-sm mx-auto leading-relaxed">
                Thank you! Our safety team will review your pose selfie within 2 to 4 hours. Your purple verified badge will activate automatically once approved.
              </p>
            </div>
            <Link
              href="/discover"
              className="inline-block px-6 py-2.5 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] text-white text-xs sm:text-sm font-bold shadow-md transition-all"
            >
              Return to Discovery
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
