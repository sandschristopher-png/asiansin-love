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
      <nav 
        className={`sm:hidden fixed bottom-0 inset-x-0 w-full z-50 bg-white/95 backdrop-blur-md border-t border-[#E5E1EC] pb-[env(safe-area-inset-bottom)] transition-all duration-300 ease-out ${
          isKeyboardOpen ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="max-w-md mx-auto grid grid-cols-4 items-center h-14 px-2">
          
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

          {/* 4. YOU */}
          <button
            type="button"
            onClick={() => setAccountSheetOpen(true)}
            className={`flex flex-col items-center justify-center py-1 transition-colors active:scale-95 ${
              accountSheetOpen ? 'text-[#6555B8]' : 'text-[#756D82] hover:text-[#1C1924]'
            }`}
          >
            <div className="relative">
              <div className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center transition-all ${
                accountSheetOpen 
                  ? 'ring-2 ring-[#6555B8] bg-[#F3EFFC]' 
                  : 'border border-[#E5E1EC] bg-[#FAFAFC]'
              }`}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-[#756D82]" />
                )}
              </div>
              {hasNotifications && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#6555B8] border border-white" />
              )}
            </div>
            <span className={`text-[10px] mt-0.5 ${accountSheetOpen ? 'font-bold' : 'font-medium'}`}>
              You
            </span>
          </button>

        </div>
      </nav>
      <AccountBottomSheet
        isOpen={accountSheetOpen}
        onClose={() => setAccountSheetOpen(false)}
      />
    </>
  );
}
