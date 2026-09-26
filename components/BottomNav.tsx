'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Heart as LucideHeart, 
  ChevronRight, 
  XCircle, 
  UserCircle2, 
  Search, 
  MessageSquare, 
  Layers, 
  User 
} from 'lucide-react';
import { AccountBottomSheet } from '@/components/AccountBottomSheet';
import { createClient } from '@/lib/supabase/client';

export function BottomNav() {
  const pathname = usePathname();
  const [supabase] = useState(() => createClient());
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [listsOpen, setListsOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    async function loadUserAvatar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        setAvatarUrl(data?.avatar_url || user.user_metadata?.avatar_url || null);
      }
    }
    loadUserAvatar();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single();
        setAvatarUrl(data?.avatar_url || session.user.user_metadata?.avatar_url || null);
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
        <nav className="pointer-events-auto bg-[#261F33]/95 backdrop-blur-xl border border-[#9A79BA]/35 rounded-[28px] px-3 py-1.5 shadow-2xl shadow-black/80 w-full max-w-sm transition-transform">
          <div className="grid grid-cols-5 items-center">
            
            {/* 1. DISCOVER */}
            <Link
              href="/discover"
              onClick={() => setListsOpen(false)}
              className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-[0.88] ${
                isActive('/discover') ? 'text-[#E6D7FA]' : 'text-[#9A79BA] hover:text-[#E6D7FA]'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 ${isActive('/discover') ? 'bg-[#653C87] text-[#E6D7FA] shadow-md shadow-[#653C87]/40' : ''}`}>
                <Search className="w-5 h-5" strokeWidth={isActive('/discover') ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] tracking-wide font-extrabold mt-0.5 ${isActive('/discover') ? 'text-[#E6D7FA]' : 'text-[#9A79BA]'}`}>
                Discover
              </span>
            </Link>

            {/* 2. SAVED */}
            <Link
              href="/favorites"
              onClick={() => setListsOpen(false)}
              className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-[0.88] ${
                isActive('/favorites') ? 'text-[#E6D7FA]' : 'text-[#9A79BA] hover:text-[#E6D7FA]'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 ${isActive('/favorites') ? 'bg-[#653C87] text-[#E6D7FA] shadow-md shadow-[#653C87]/40' : ''}`}>
                <LucideHeart className="w-5 h-5" fill={isActive('/favorites') ? 'currentColor' : 'none'} strokeWidth={2} />
              </div>
              <span className={`text-[10px] tracking-wide font-extrabold mt-0.5 ${isActive('/favorites') ? 'text-[#E6D7FA]' : 'text-[#9A79BA]'}`}>
                Saved
              </span>
            </Link>

            {/* 3. INBOX */}
            <Link
              href="/messages"
              onClick={() => setListsOpen(false)}
              className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-[0.88] ${
                isActive('/messages') ? 'text-[#E6D7FA]' : 'text-[#9A79BA] hover:text-[#E6D7FA]'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 relative ${isActive('/messages') ? 'bg-[#653C87] text-[#E6D7FA] shadow-md shadow-[#653C87]/40' : ''}`}>
                <MessageSquare className="w-5 h-5" strokeWidth={isActive('/messages') ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] tracking-wide font-extrabold mt-0.5 ${isActive('/messages') ? 'text-[#E6D7FA]' : 'text-[#9A79BA]'}`}>
                Inbox
              </span>
            </Link>

            {/* 4. LISTS */}
            <button
              type="button"
              onClick={() => setListsOpen(!listsOpen)}
              className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-[0.88] ${
                listsOpen ? 'text-[#E6D7FA]' : 'text-[#9A79BA] hover:text-[#E6D7FA]'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 ${listsOpen ? 'bg-[#653C87] text-[#E6D7FA] shadow-md shadow-[#653C87]/40' : ''}`}>
                <Layers className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className={`text-[10px] tracking-wide font-extrabold mt-0.5 ${listsOpen ? 'text-[#E6D7FA]' : 'text-[#9A79BA]'}`}>
                Lists
              </span>
            </button>

            {/* 5. YOU (Avatar Trigger with micro-indicator) */}
            <button
              type="button"
              onClick={() => {
                setListsOpen(false);
                setAccountSheetOpen(true);
              }}
              className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-[0.88] ${
                accountSheetOpen ? 'text-[#E6D7FA]' : 'text-[#9A79BA] hover:text-[#E6D7FA]'
              }`}
            >
              <div className="relative">
                <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition-all duration-200 ${
                  accountSheetOpen 
                    ? 'ring-2 ring-[#E6D7FA] bg-[#653C87]' 
                    : 'border border-[#9A79BA]/50 bg-[#1D1726]'
                }`}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="You" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-[#C9A4E8]" />
                  )}
                </div>
                {/* Mini indicator badge on the avatar rim */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#653C87] border border-[#261F33] flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-[#E6D7FA]" />
                </span>
              </div>
              <span className={`text-[10px] tracking-wide font-extrabold mt-0.5 ${accountSheetOpen ? 'text-[#E6D7FA]' : 'text-[#9A79BA]'}`}>
                You
              </span>
            </button>

          </div>
        </nav>
      </div>

      {/* Lists Dropdown / Slide Sheet */}
      {listsOpen && (
        <div 
          className="sm:hidden fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-end justify-center pb-20 px-4 animate-in fade-in duration-200" 
          onClick={() => setListsOpen(false)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 p-4 space-y-2 shadow-2xl animate-in slide-in-from-bottom-6 duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs font-bold uppercase tracking-wider text-[#9A79BA] px-2 pb-1">
              Member Lists
            </div>
            
            <Link
              href="/favorites"
              onClick={() => setListsOpen(false)}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#130F18] hover:bg-[#653C87]/30 text-white font-semibold text-sm transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <LucideHeart className="w-4 h-4 text-[#9A79BA]" /> <span>My Favorites</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#9A79BA]" />
            </Link>

            <Link
              href="/discover?filter=passed"
              onClick={() => setListsOpen(false)}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#130F18] hover:bg-[#653C87]/30 text-white font-semibold text-sm transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <XCircle className="w-4 h-4 text-[#9A79BA]" /> <span>Disliked / Passed</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#9A79BA]" />
            </Link>

            <Link
              href="/profile"
              onClick={() => setListsOpen(false)}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#130F18] hover:bg-[#653C87]/30 text-white font-semibold text-sm transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <UserCircle2 className="w-4 h-4 text-[#9A79BA]" /> <span>My Bio</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#9A79BA]" />
            </Link>
          </div>
        </div>
      )}

      <AccountBottomSheet
        isOpen={accountSheetOpen}
        onClose={() => setAccountSheetOpen(false)}
      />
    </>
  );
}
