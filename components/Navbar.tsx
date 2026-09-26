'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, Settings, LogOut, Bell, Heart, 
  EyeOff, ShieldCheck, Sparkles 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
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
            <Bell className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Brand Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          <Link href={user ? "/discover" : "/"} className="flex items-center active:scale-95 transition-transform">
            <img
              src="/ail-logo.png"
              alt="asiansin.love"
              className="w-44 sm:w-52 h-auto object-contain shrink-0"
            />
          </Link>
        </div>

        {/* Right: Squircle Profile Dropdown matching mobile "You" options */}
        <div className="flex items-center">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className={`h-9 w-9 rounded-2xl bg-gradient-to-b from-[#282035] to-[#1D1726] border flex items-center justify-center transition-colors shadow-sm focus:outline-none ${
                  menuOpen 
                    ? 'border-[#9A79BA] text-white ring-1 ring-[#9A79BA]/50' 
                    : 'border-[#7D7E92]/30 text-[#9A79BA] hover:text-white hover:border-[#9A79BA]/50'
                }`}
                title="Account Menu"
              >
                <User className="w-4 h-4 stroke-[1.75]" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2.5 w-56 rounded-2xl bg-[#1D1726] border border-[#7D7E92]/30 shadow-2xl py-2 z-50 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-[#241E2F]">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-[#7D7E92]">Signed In As</p>
                    <p className="text-xs font-semibold text-[#E6D7FA] truncate mt-0.5">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[#E6D7FA] hover:bg-[#241E2F] hover:text-white transition-colors"
                    >
                      <User className="w-4 h-4 text-[#9A79BA]" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      href="/favorites"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[#E6D7FA] hover:bg-[#241E2F] hover:text-white transition-colors"
                    >
                      <Heart className="w-4 h-4 text-[#9A79BA]" />
                      <span>Favorites</span>
                    </Link>

                    <Link
                      href="/discover?filter=passed"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[#E6D7FA] hover:bg-[#241E2F] hover:text-white transition-colors"
                    >
                      <EyeOff className="w-4 h-4 text-[#9A79BA]" />
                      <span>Passed Profiles</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[#E6D7FA] hover:bg-[#241E2F] hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#9A79BA]" />
                      <span>Account Settings</span>
                    </Link>
                  </div>

                  <div className="border-t border-[#241E2F] my-1" />

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-rose-400 hover:bg-[#3B1E42]/50 hover:text-rose-300 transition-colors text-left font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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