'use client';

import React, { useState } from 'react';

interface GestureVerifyModalProps {
  isOpen: boolean;
  userId: string;
  userFullName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const VERIFICATION_GESTURES = [
  'Touch your left index finger to your chin',
  'Make a peace sign next to your right eye',
  'Hold 3 fingers up beside your left ear',
  'Touch your thumb to the tip of your nose'
];

export function GestureVerifyModal({
  isOpen,
  userId,
  userFullName,
  onClose,
  onSuccess,
}: GestureVerifyModalProps) {
  const [selectedGesture] = useState(() => 
    VERIFICATION_GESTURES[Math.floor(Math.random() * VERIFICATION_GESTURES.length)]
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please take or upload a photo matching the pose.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('userFullName', userFullName);
      formData.append('gestureInstruction', selectedGesture);
      formData.append('file', file);

      const res = await fetch('/api/verify/submit', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Submission failed.');
      }
    } catch {
      alert('Network error submitting verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl bg-[#2D2F4C] border border-[#9A8CC3]/30 p-6 sm:p-8 shadow-2xl text-[#1C1924]">
        
        {/* Header */}
        <div className="mb-6">
          <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-[#9A8CC3] block mb-1">
            Live Verification
          </span>
          <h2 className="text-xl font-medium text-white ">
            Confirm Your Identity
          </h2>
          <p className="text-xs text-[#B2A4D7] mt-1 leading-relaxed">
            Take a quick selfie doing the pose below so we can confirm you are the person in your photos.
          </p>
        </div>

        {/* Gesture Prompt Box */}
        <div className="p-4 rounded-2xl bg-[#2D2F4C] border border-[#9A8CC3]/25 mb-6 text-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#9A8CC3] block mb-1">
            Required Pose
          </span>
          <p className="text-sm font-medium text-white">
            "{selectedGesture}"
          </p>
        </div>

        {/* Upload Frame */}
        <div className="relative aspect-[4/3] w-full rounded-2xl bg-[#2D2F4C] border border-[#9A8CC3]/20 flex flex-col items-center justify-center overflow-hidden mb-6">
          {preview ? (
            <img src={preview} alt="Pose preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-4">
              <span className="text-xs text-[#B2A4D7] block mb-2">No photo selected</span>
              <label className="cursor-pointer px-4 py-2 rounded-xl bg-[#6555B8] hover:bg-[#7D4B9F] text-xs font-semibold text-white transition-colors inline-block">
                Take Photo / Upload
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={handleUpload}
            disabled={!file || isSubmitting}
            className="w-full py-3 rounded-xl bg-[#6555B8] hover:bg-[#7D4B9F] disabled:opacity-50 text-[#F3EBF9] font-semibold text-xs transition-all shadow-lg shadow-[#3B3D60]/50"
          >
            {isSubmitting ? 'Sending for Review...' : 'Submit Verification'}
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#2D2F4C] hover:bg-[#2D2F4C] text-[#B2A4D7] text-xs font-medium transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}

