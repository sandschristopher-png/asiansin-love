'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string; reputation_score?: number } | null>(null);

  useEffect(() => {
    async function getSessionUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, reputation_score')
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile(data);
        }
      }
    }

    getSessionUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, reputation_score')
          .eq('id', currentUser.id)
          .single();
        setProfile(data || null);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/login');
    router.refresh();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const rep = profile?.reputation_score ?? 100;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#7D7E92]/25 bg-[#17131F]/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Identity with Clean Minimal SVG */}
        <Link href="/" className="flex items-center gap-2.5 active:scale-95 transition-transform">
          <div className="w-8 h-8 rounded-xl bg-[#653C87] flex items-center justify-center text-white shadow-md border border-[#9A79BA]/30">
            <svg className="w-4 h-4 text-[#ECE8F4]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
            asiansin<span className="text-[#9A79BA]">.love</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden sm:flex items-center gap-6">
          <Link href="/discover" className="text-sm font-semibold text-[#ECE8F4] hover:text-white transition-colors">
            Discover
          </Link>
          <Link href="/messages" className="text-sm font-semibold text-[#B6AEC7] hover:text-white transition-colors">
            Messages
          </Link>
          <Link href="/standards" className="text-sm font-semibold text-[#B6AEC7] hover:text-white transition-colors">
            Standards
          </Link>
        </nav>

        {/* Auth / Squircle Avatar & Rep */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Rep Badge */}
              <div 
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                  rep >= 90
                    ? 'bg-[#241E2F] border-[#653C87] text-[#ECE8F4]'
                    : rep >= 75
                    ? 'bg-[#241E2F] border-[#7D7E92]/50 text-[#B6AEC7]'
                    : 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                }`}
                title="Your platform reputation standing"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{rep}% Rep</span>
              </div>

              {/* Squircle Avatar */}
              <Link
                href="/profile"
                className="relative h-10 w-10 rounded-2xl overflow-hidden bg-[#241E2F] border border-[#9A79BA]/50 flex items-center justify-center hover:ring-2 hover:ring-[#653C87] transition-all shadow-md shrink-0 active:scale-95"
                title="View Profile"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-[#ECE8F4]">
                    {getInitials(profile?.full_name)}
                  </span>
                )}
              </Link>

              <button
                onClick={handleSignOut}
                className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-[#241E2F] border border-[#7D7E92]/30 hover:bg-[#3B1E42] text-xs font-semibold text-[#ECE8F4] transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-[#653C87] hover:bg-[#9A79BA] text-xs sm:text-sm font-bold text-white shadow-lg transition-all active:scale-95"
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
