'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function getSessionUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getSessionUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#7D7E92]/20 bg-[#17131F]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 relative flex items-center justify-between">
        
        {/* Left: Squircle Bell Icon */}
        <div className="flex items-center">
          <button
            type="button"
            className="h-9 w-9 rounded-2xl bg-[#241E2F] border border-[#7D7E92]/30 flex items-center justify-center text-[#B6AEC7] hover:text-white hover:border-[#9A79BA]/50 transition-colors shadow-sm"
            title="Notifications"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>

        {/* Center: Correctly Scaled & Centered Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          <Link href="/" className="flex items-center active:scale-95 transition-transform">
            <img
              src="/ail-logo.png"
              alt="asiansin.love"
              className="w-44 sm:w-52 h-auto object-contain shrink-0"
            />
          </Link>
        </div>

        {/* Right: Clean Single-Account Sign Out Button */}
        <div className="flex items-center">
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="px-3.5 py-1.5 rounded-xl bg-[#241E2F] border border-[#7D7E92]/30 hover:bg-[#3B1E42] text-xs font-semibold text-[#ECE8F4] hover:text-white transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-xl bg-[#653C87] hover:bg-[#9A79BA] text-xs font-semibold text-white transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}

export default Navbar;
