'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Heart as LucideHeart, 
  Search, 
  MessageCircle, 
  User 
} from 'lucide-react';
import { AccountBottomSheet } from '@/components/AccountBottomSheet';
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        setAvatarUrl(data?.avatar_url || user.user_metadata?.avatar_url || null);

        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        setHasNotifications((count ?? 0) > 0);
      }
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', currentUser.id)
          .single();
        setAvatarUrl(data?.avatar_url || currentUser.user_metadata?.avatar_url || null);
      } else {
        setAvatarUrl(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

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
    <>
      {/* Floating Bottom Navigation Bar */}
      <div 
        className={`sm:hidden fixed bottom-3 left-0 right-0 z-50 px-4 pointer-events-none flex justify-center transition-all duration-300 ease-out ${
          isKeyboardOpen ? 'translate-y-24 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        <nav className="pointer-events-auto bg-[#2D2F4C]/95 backdrop-blur-xl border border-[#9A8CC3]/35 rounded-[28px] px-3 py-1.5 shadow-2xl shadow-black/80 w-full max-w-sm transition-transform">
          <div className="grid grid-cols-4 items-center">
            
            {/* 1. DISCOVER */}
            <Link
              href="/discover"
              className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-[0.88] ${
                isActive('/discover') ? 'text-[#1C1924]' : 'text-[#9A8CC3] hover:text-[#1C1924]'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 ${isActive('/discover') ? 'bg-[#6555B8] text-white shadow-md shadow-[#6555B8]/40' : ''}`}>
                <Search className="w-5 h-5" strokeWidth={isActive('/discover') ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] tracking-wide font-extrabold mt-0.5 ${isActive('/discover') ? 'text-[#1C1924]' : 'text-[#9A8CC3]'}`}>
                Discover
              </span>
            </Link>

            {/* 2. SAVED */}
            <Link
              href="/favorites"
              className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-[0.88] ${
                isActive('/favorites') ? 'text-[#1C1924]' : 'text-[#9A8CC3] hover:text-[#1C1924]'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 ${isActive('/favorites') ? 'bg-[#6555B8] text-white shadow-md shadow-[#6555B8]/40' : ''}`}>
                <LucideHeart className="w-5 h-5" fill={isActive('/favorites') ? 'currentColor' : 'none'} strokeWidth={2} />
              </div>
              <span className={`text-[10px] tracking-wide font-extrabold mt-0.5 ${isActive('/favorites') ? 'text-[#1C1924]' : 'text-[#9A8CC3]'}`}>
                Saved
              </span>
            </Link>

            {/* 3. INBOX */}
            <Link
              href="/messages"
              className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-[0.88] ${
                isActive('/messages') ? 'text-[#1C1924]' : 'text-[#9A8CC3] hover:text-[#1C1924]'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 relative ${isActive('/messages') ? 'bg-[#6555B8] text-white shadow-md shadow-[#6555B8]/40' : ''}`}>
                <MessageCircle className="w-5 h-5" strokeWidth={isActive('/messages') ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] tracking-wide font-extrabold mt-0.5 ${isActive('/messages') ? 'text-[#1C1924]' : 'text-[#9A8CC3]'}`}>
                Inbox
              </span>
            </Link>

            

            {/* 5. YOU */}
            <button
              type="button"
              onClick={() => setAccountSheetOpen(true)}
              className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-[0.88] ${
                accountSheetOpen ? 'text-[#1C1924]' : 'text-[#9A8CC3] hover:text-[#1C1924]'
              }`}
            >
              <div className="relative">
                <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition-all duration-200 ${
                  accountSheetOpen 
                    ? 'ring-2 ring-[#E6D7FA] bg-[#6555B8]' 
                    : 'border border-[#9A8CC3]/50 bg-[#2D2F4C]'
                }`}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="You" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-[#B2A4D7]" />
                  )}
                </div>
                {hasNotifications && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#9A8CC3] border border-[#2D2F4C] flex items-center justify-center">
                    <span className="w-1 h-1 rounded-full bg-[#E6D7FA]" />
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-wide font-extrabold mt-0.5 ${accountSheetOpen ? 'text-[#1C1924]' : 'text-[#9A8CC3]'}`}>
                You
              </span>
            </button>

          </div>
        </nav>
      </div>
      <AccountBottomSheet
        isOpen={accountSheetOpen}
        onClose={() => setAccountSheetOpen(false)}
      />
    </>
  );
}