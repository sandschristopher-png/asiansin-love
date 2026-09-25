'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
        checkVerification(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        checkVerification(session.user.id);
      } else {
        setCurrentUser(null);
        setIsVerified(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkVerification = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_verified')
        .eq('id', userId)
        .single();
      if (data?.is_verified) {
        setIsVerified(true);
      }
    } catch (e) {
      // quiet fallback
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#725A7A]/25 bg-[#17131F]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex h-[78px] sm:h-[84px] items-center justify-between px-3 sm:px-6 lg:px-10">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <div className="relative h-12 w-48 sm:h-14 sm:w-60 overflow-visible flex items-center">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-full scale-[1.75] sm:scale-[2.15] origin-left">
              <Image
                src="/ail-logo.png"
                alt="asiansin.love"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
          </div>
        </Link>

        {/* Primary Controls */}
        <nav className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          <Link
            href="/discover"
            className="text-xs sm:text-sm font-bold text-[#DDD8D4] hover:text-white transition-colors px-2 py-1.5"
          >
            Discover
          </Link>

          <Link
            href="/messages"
            className="text-xs sm:text-sm font-bold text-[#DDD8D4] hover:text-white transition-colors px-2 py-1.5"
          >
            Messages
          </Link>

          {/* Clean Vector Bell */}
          <div className="relative flex items-center" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotifsOpen(!notifsOpen);
                setMenuOpen(false);
              }}
              aria-label="Notifications"
              className="relative p-2.5 rounded-xl bg-[#241E2F] border border-[#725A7A]/35 text-[#DDD8D4] hover:text-white hover:border-[#978FA8] transition-all flex items-center justify-center focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 sm:w-[18px] sm:h-[18px]"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#653C87] border-2 border-[#17131F]" />
            </button>

            {/* Notification Dropdown */}
            {notifsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-[#241E2F] border border-[#725A7A]/35 shadow-2xl py-2 z-50 text-[#F3EBF9] animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-[#725A7A]/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Alerts</span>
                  <Link
                    href="/notifications"
                    onClick={() => setNotifsOpen(false)}
                    className="text-[11px] font-bold text-[#DDD8D4] hover:text-white"
                  >
                    View All
                  </Link>
                </div>

                <div className="divide-y divide-[#725A7A]/15 max-h-72 overflow-y-auto">
                  <Link
                    href="/chat/demo-1"
                    onClick={() => setNotifsOpen(false)}
                    className="p-3 flex items-start gap-2.5 hover:bg-[#17131F] transition-colors block"
                  >
                    <span className="text-sm">💬</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">New message from Camille</p>
                      <p className="text-[11px] text-[#DDD8D4] truncate mt-0.5">"Good morning! Thank you..."</p>
                    </div>
                    <span className="text-[10px] text-[#978FA8]">15m</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setNotifsOpen(false)}
                    className="p-3 flex items-start gap-2.5 hover:bg-[#17131F] transition-colors block"
                  >
                    <span className="text-sm">🛡️</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">Identity Pose Verified</p>
                      <p className="text-[11px] text-[#DDD8D4] truncate mt-0.5">Your profile is verified</p>
                    </div>
                    <span className="text-[10px] text-[#978FA8]">2h</span>
                  </Link>
                </div>

                <div className="px-3 pt-2 pb-1 border-t border-[#725A7A]/20 text-center">
                  <Link
                    href="/notifications"
                    onClick={() => setNotifsOpen(false)}
                    className="text-xs font-bold text-[#E6D7FA] hover:underline"
                  >
                    Open Notification Center →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Account / Community Dropdown Menu */}
          <div className="relative flex items-center" ref={menuRef}>
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(!menuOpen);
                  setNotifsOpen(false);
                }}
                className="flex items-center gap-2 p-1 rounded-full bg-[#241E2F] border border-[#725A7A]/35 hover:border-[#978FA8] transition-all focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-[#653C87] flex items-center justify-center text-xs font-bold text-white">
                  {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : '👤'}
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(!menuOpen);
                    setNotifsOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#241E2F] border border-[#725A7A]/35 text-xs sm:text-sm font-bold text-[#DDD8D4] hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span>Menu</span>
                  <span className="text-[9px]">▼</span>
                </button>

                <Link
                  href="/login"
                  className="text-xs sm:text-sm font-extrabold px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] text-white shadow-md transition-all active:scale-[0.98]"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Menu Panel */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-[#241E2F] border border-[#725A7A]/35 shadow-2xl py-2 z-50 text-[#F3EBF9] animate-in fade-in slide-in-from-top-2 duration-150">
                {currentUser && (
                  <div className="px-4 py-2 border-b border-[#725A7A]/25">
                    <p className="text-xs font-semibold text-white truncate">{currentUser.email}</p>
                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isVerified ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}>
                      {isVerified ? '✓ Identity Verified' : '⚠️ Pending Verification'}
                    </span>
                  </div>
                )}

                <div className="py-1 text-xs font-semibold">
                  <Link
                    href="/favorites"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[#DDD8D4] hover:bg-[#17131F] hover:text-white transition-colors"
                  >
                    <span>⭐</span> Saved Profiles
                  </Link>

                  <Link
                    href="/notifications"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[#DDD8D4] hover:bg-[#17131F] hover:text-white transition-colors"
                  >
                    <span>🔔</span> Notifications
                  </Link>

                  <Link
                    href="/verify"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[#DDD8D4] hover:bg-[#17131F] hover:text-white transition-colors"
                  >
                    <span>🛡️</span> Gesture Verification
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[#DDD8D4] hover:bg-[#17131F] hover:text-white transition-colors"
                  >
                    <span>👤</span> My Profile & Photos
                  </Link>

                  {currentUser && (
                    <>
                      <div className="my-1 border-t border-[#725A7A]/25" />
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-rose-300 hover:bg-rose-950/40 transition-colors"
                      >
                        <span>🚪</span> Sign Out
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

      </div>
    </header>
  );
}
