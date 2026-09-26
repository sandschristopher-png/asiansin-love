'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, CheckCircle2, ShieldCheck } from 'lucide-react';
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
    <main className="min-h-screen bg-[#130F18] text-[#E6D7FA] flex flex-col justify-start">
      <div className="max-w-md mx-auto w-full px-4 py-8 pb-28 space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#9A79BA]/25">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-10 w-10 rounded-2xl bg-[#261F33] border border-[#9A79BA]/35 text-[#E6D7FA] hover:text-white flex items-center justify-center text-sm active:scale-90 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#9A79BA]" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Identity Verification
            </h1>
          </div>
          <div className="w-10" />
        </div>

        {success ? (
          <div className="rounded-3xl bg-[#261F33] border border-[#9A79BA]/40 p-8 text-center space-y-4 shadow-2xl">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Photo Submitted</h2>
            <p className="text-sm text-[#E6D7FA] leading-relaxed">
              Your gesture selfie has been uploaded securely. Our team verifies submissions within a few hours to grant your profile the verified badge.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Instructions Card */}
            <div className="p-5 rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 space-y-2 shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9A79BA] block">
                Gesture Match Pose
              </span>
              <p className="text-xs sm:text-sm text-[#E6D7FA] leading-relaxed">
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
              className="relative aspect-[3/4] w-full rounded-3xl bg-[#181222] border-2 border-dashed border-[#9A79BA]/50 hover:border-[#9A79BA] flex flex-col items-center justify-center overflow-hidden cursor-pointer active:scale-[0.99] transition shadow-inner"
            >
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Verification Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="px-4 py-2 rounded-2xl bg-[#261F33] border border-[#9A79BA]/40 text-xs font-bold text-white shadow-lg">
                      Tap to retake
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center space-y-3 pointer-events-none">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-[#261F33] border border-[#9A79BA]/40 flex items-center justify-center text-[#9A79BA] shadow-lg">
                    <Camera className="w-8 h-8 text-[#C9A4E8]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Tap to Open Camera
                    </p>
                    <p className="text-xs text-[#E6D7FA] mt-0.5">
                      Selfie with peace sign pose
                    </p>
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 font-semibold text-center bg-rose-950/40 border border-rose-500/40 rounded-xl py-2 px-3">
                {errorMsg}
              </p>
            )}

            {/* Upload Button */}
            <button
              type="button"
              disabled={uploading || !selectedFile}
              onClick={handleUpload}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg transition active:scale-95 ${
                selectedFile && !uploading
                  ? 'bg-[#653C87] hover:bg-[#7D49A8] text-white shadow-[#653C87]/40'
                  : 'bg-[#261F33] text-[#9A79BA]/50 cursor-not-allowed border border-[#9A79BA]/25'
              }`}
            >
              {uploading ? 'Encrypting & Uploading...' : 'Submit Verification Photo'}
            </button>

          </div>
        )}

      </div>
    </main>
  );
}
