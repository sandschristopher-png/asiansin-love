'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Plus, Loader2 } from 'lucide-react';

export default function OnboardingPhotoPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('isPrimary', 'true');
      const res = await fetch('/api/photos/upload', { method: 'POST', body: fd });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload failed');
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
      setPreview(null);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const finish = async (browseOnly: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      await supabase.from('profiles').update({
        browse_only: browseOnly,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
    } catch { /* proceed to discover regardless; flags are best-effort */ }
    router.push('/discover');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Add a photo</h1>
          <p className="text-xs text-slate-500 mt-1">Profiles with photos get far more responses.</p>
        </div>

        {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">{error}</div>}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-900 bg-slate-50 flex flex-col items-center justify-center transition overflow-hidden"
        >
          {preview ? (
            <img src={preview} alt="Selected" className="w-full h-full object-cover" />
          ) : uploading ? (
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                <Plus className="w-6 h-6 text-slate-400" />
              </div>
              <span className="text-xs font-medium text-slate-500 mt-3">Tap to upload</span>
            </>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

        <button type="button" disabled={!preview || uploading} onClick={() => finish(false)}
          className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition active:scale-[0.99] disabled:opacity-40">
          {uploading ? 'Uploading...' : 'Complete Profile'}
        </button>

        <button type="button" onClick={() => finish(true)}
          className="w-full text-center text-xs text-slate-500 hover:text-slate-900 font-medium">
          Skip for now (Browse only)
        </button>
      </div>
    </div>
  );
}