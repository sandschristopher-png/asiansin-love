'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Compass, 
  Heart, 
  MessageCircle, 
  User 
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
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        try {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .eq('is_read', false);
          setUnreadMsgCount(count ?? 0);
        } catch (e) {
          // Schema fallback
        }
      }
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

  // Suppress on individual deep dives or chat rooms
  if (pathname.startsWith('/chat/')) {
    return null;
  }

  return (
    <div 
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-50 transition-all duration-300 ease-out ${
        isKeyboardOpen ? 'translate-y-24 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      <nav className="bg-white/90 backdrop-blur-xl border border-black/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full px-3 py-2 flex items-center justify-around">
        
        {/* 1. DISCOVER */}
        <Link
          href="/discover"
          className={`flex flex-col items-center justify-center p-2 rounded-full transition-all active:scale-90 ${
            isActive('/discover') ? 'text-[#6555B8]' : 'text-gray-400 hover:text-gray-700'
          }`}
          aria-label="Discover"
        >
          <Compass className="w-5 h-5" strokeWidth={isActive('/discover') ? 2.4 : 1.8} />
          {isActive('/discover') && (
            <span className="w-1 h-1 rounded-full bg-[#6555B8] mt-1" />
          )}
        </Link>

        {/* 2. SAVED / LIKES */}
        <Link
          href="/favorites"
          className={`flex flex-col items-center justify-center p-2 rounded-full transition-all active:scale-90 ${
            isActive('/favorites') ? 'text-[#6555B8]' : 'text-gray-400 hover:text-gray-700'
          }`}
          aria-label="Saved"
        >
          <Heart 
            className="w-5 h-5" 
            fill={isActive('/favorites') ? 'currentColor' : 'none'} 
            strokeWidth={isActive('/favorites') ? 2.4 : 1.8} 
          />
          {isActive('/favorites') && (
            <span className="w-1 h-1 rounded-full bg-[#6555B8] mt-1" />
          )}
        </Link>

        {/* 3. INBOX */}
        <Link
          href="/messages"
          className={`relative flex flex-col items-center justify-center p-2 rounded-full transition-all active:scale-90 ${
            isActive('/messages') ? 'text-[#6555B8]' : 'text-gray-400 hover:text-gray-700'
          }`}
          aria-label="Messages"
        >
          <MessageCircle className="w-5 h-5" strokeWidth={isActive('/messages') ? 2.4 : 1.8} />
          {unreadMsgCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#6555B8] ring-2 ring-white" />
          )}
          {isActive('/messages') && (
            <span className="w-1 h-1 rounded-full bg-[#6555B8] mt-1" />
          )}
        </Link>

        {/* 4. PROFILE */}
        <Link
          href="/profile"
          className={`flex flex-col items-center justify-center p-2 rounded-full transition-all active:scale-90 ${
            isActive('/profile') ? 'text-[#6555B8]' : 'text-gray-400 hover:text-gray-700'
          }`}
          aria-label="Profile"
        >
          <User className="w-5 h-5" strokeWidth={isActive('/profile') ? 2.4 : 1.8} />
          {isActive('/profile') && (
            <span className="w-1 h-1 rounded-full bg-[#6555B8] mt-1" />
          )}
        </Link>

      </nav>
    </div>
  );
}
