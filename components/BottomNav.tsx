'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Heart as LucideHeart, 
  Search, 
  MessageCircle 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/terms',
  '/privacy',
  '/standards',
  '/pricing'
];

export function BottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auto-hide bottom nav when mobile virtual keyboard expands
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      if (!window.visualViewport) return;
      const isKeyboard = window.visualViewport.height < window.innerHeight * 0.82;
      setIsKeyboardOpen(isKeyboard);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  // Suppress when logged out or on public / auth / onboarding pages
  if (!user || PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/onboarding')) {
    return null;
  }

  // Suppress on individual profile deep dives or chat rooms
  if (pathname.startsWith('/chat/') || pathname.startsWith('/profile/')) {
    return null;
  }

  return (
    <nav 
      className={`sm:hidden fixed bottom-0 inset-x-0 w-full z-50 bg-white/95 backdrop-blur-md border-t border-[#E5E1EC] pb-[env(safe-area-inset-bottom)] transition-all duration-300 ease-out ${
        isKeyboardOpen ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="max-w-md mx-auto grid grid-cols-3 items-center h-14 px-4">
        
        {/* 1. DISCOVER */}
        <Link
          href="/discover"
          className={`flex flex-col items-center justify-center py-1 transition-colors active:scale-95 ${
            isActive('/discover') ? 'text-[#6555B8]' : 'text-[#756D82] hover:text-[#1C1924]'
          }`}
        >
          <div className={`p-1 rounded-full transition-colors ${isActive('/discover') ? 'bg-[#F3EFFC]' : ''}`}>
            <Search className="w-5 h-5" strokeWidth={isActive('/discover') ? 2.3 : 1.9} />
          </div>
          <span className={`text-[10px] mt-0.5 ${isActive('/discover') ? 'font-bold' : 'font-medium'}`}>
            Discover
          </span>
        </Link>

        {/* 2. SAVED */}
        <Link
          href="/favorites"
          className={`flex flex-col items-center justify-center py-1 transition-colors active:scale-95 ${
            isActive('/favorites') ? 'text-[#6555B8]' : 'text-[#756D82] hover:text-[#1C1924]'
          }`}
        >
          <div className={`p-1 rounded-full transition-colors ${isActive('/favorites') ? 'bg-[#F3EFFC]' : ''}`}>
            <LucideHeart className="w-5 h-5" fill={isActive('/favorites') ? 'currentColor' : 'none'} strokeWidth={1.9} />
          </div>
          <span className={`text-[10px] mt-0.5 ${isActive('/favorites') ? 'font-bold' : 'font-medium'}`}>
            Saved
          </span>
        </Link>

        {/* 3. INBOX */}
        <Link
          href="/messages"
          className={`flex flex-col items-center justify-center py-1 transition-colors active:scale-95 ${
            isActive('/messages') ? 'text-[#6555B8]' : 'text-[#756D82] hover:text-[#1C1924]'
          }`}
        >
          <div className={`p-1 rounded-full transition-colors relative ${isActive('/messages') ? 'bg-[#F3EFFC]' : ''}`}>
            <MessageCircle className="w-5 h-5" strokeWidth={isActive('/messages') ? 2.3 : 1.9} />
          </div>
          <span className={`text-[10px] mt-0.5 ${isActive('/messages') ? 'font-bold' : 'font-medium'}`}>
            Inbox
          </span>
        </Link>

      </div>
    </nav>
  );
}
