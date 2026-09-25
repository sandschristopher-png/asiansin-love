'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function VerifyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMsg('Please snap or select a selfie first.');
      return;
    }

    setUploading(true);
    setErrorMsg(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be signed in to submit verification.');
      }

      const fileExt = selectedFile.name.split('.').pop() || 'jpg';
      const filePath = `${user.id}/selfie_${Date.now()}.${fileExt}`;

      // Upload directly to Supabase storage bucket
      const { error: uploadError } = await supabase.storage
        .from('verifications')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Update profile record with pending verification status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          verification_status: 'pending',
          verification_image_path: filePath,
          verification_submitted_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/discover');
      }, 2400);
    } catch (err: any) {
      console.error('Verification upload failed:', err);
      setErrorMsg(err.message || 'Failed to upload photo. Please check network.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto w-full px-4 py-6 pb-28 space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#725A7A]/25">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-9 w-9 rounded-2xl bg-[#241E2F] border border-[#725A7A]/35 text-[#E6D7FA] flex items-center justify-center text-sm active:scale-90 transition-transform"
        >
          ←
        </button>
        <h1 className="text-xl font-black text-[#E6D7FA] tracking-tight">
          Identity Verification
        </h1>
        <div className="w-9" />
      </div>

      {success ? (
        <div className="rounded-[28px] bg-[#241E2F] border border-[#653C87]/60 p-8 text-center space-y-4 shadow-2xl">
          <div className="h-16 w-16 mx-auto rounded-full bg-[#653C87]/30 border border-[#9A79BA] flex items-center justify-center text-3xl">
            ✓
          </div>
          <h2 className="text-xl font-black text-[#E6D7FA]">Photo Submitted</h2>
          <p className="text-xs text-[#A8A2AB] leading-relaxed">
            Your gesture selfie has been uploaded securely. Our team verifies submissions within a few hours to grant your profile the verified badge.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          
          {/* Instructions Card */}
          <div className="p-4 rounded-[24px] bg-[#241E2F] border border-[#725A7A]/30 space-y-2 shadow-lg">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#9A79BA]">
              Gesture Match Pose
            </h2>
            <p className="text-xs text-[#E6D7FA] leading-relaxed">
              Hold up <strong className="text-white">two fingers (peace sign ✌️)</strong> beside your face in bright lighting. This confirms you are the actual person in your profile photos.
            </p>
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
            onClick={() => fileInputRef.current?.click()}
            className="relative aspect-[3/4] w-full rounded-[28px] bg-[#17131F] border-2 border-dashed border-[#725A7A]/50 hover:border-[#9A79BA] flex flex-col items-center justify-center overflow-hidden cursor-pointer active:scale-[0.99] transition-all shadow-inner"
          >
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Verification Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="px-4 py-2 rounded-xl bg-[#241E2F] text-xs font-bold text-[#E6D7FA]">
                    Tap to retake
                  </span>
                </div>
              </>
            ) : (
              <div className="p-6 text-center space-y-3 pointer-events-none">
                <div className="h-14 w-14 mx-auto rounded-full bg-[#241E2F] border border-[#725A7A]/40 flex items-center justify-center text-[#9A79BA]">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-[#E6D7FA]">
                    Tap to Open Camera
                  </p>
                  <p className="text-[11px] text-[#A8A2AB] mt-0.5">
                    Selfie with peace sign pose
                  </p>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-300 font-bold text-center">
              {errorMsg}
            </p>
          )}

          {/* Upload Button */}
          <button
            type="button"
            disabled={uploading || !selectedFile}
            onClick={handleUpload}
            className={`w-full py-4 rounded-[22px] font-black text-xs uppercase tracking-wider shadow-xl transition-all active:scale-[0.98] ${
              selectedFile && !uploading
                ? 'bg-[#653C87] hover:bg-[#9A79BA] text-white shadow-[#653C87]/40'
                : 'bg-[#241E2F] text-[#A8A2AB]/60 cursor-not-allowed border border-[#725A7A]/30'
            }`}
          >
            {uploading ? 'Encrypting & Uploading...' : 'Submit Verification Photo'}
          </button>

        </div>
      )}

    </main>
  );
}