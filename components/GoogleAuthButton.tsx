'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

/**
 * Full-width "Continue with Google" button plus the "or with email" divider, for the top of the
 * /login and /signup cards. New Google accounts land on /onboarding (the callback sends onboarded
 * members to Discover instead), where Step 1 asks for a handle: the Google name is never shown.
 */
export function GoogleAuthButton({ onError }: { onError?: (message: string) => void }) {
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
    if (error) {
      onError?.(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className="w-full py-3.5 px-4 rounded-2xl bg-white border border-[#DDD7E5] text-[#1C1924] text-xs font-bold flex items-center justify-center gap-2.5 shadow-xs hover:bg-[#FAF8FD] hover:border-[#6555B8]/40 active:scale-[0.99] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#6555B8]" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
            <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
          </svg>
        )}
        <span>{loading ? 'Redirecting...' : 'Continue with Google'}</span>
      </button>

      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-[#F0EDF5]" />
        <span className="absolute bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-[#9E97A9]">
          or with email
        </span>
      </div>
    </div>
  );
}

export default GoogleAuthButton;
