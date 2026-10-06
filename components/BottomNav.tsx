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
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === '/discover') return pathname === '/discover';
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  useEffect(() => {
    let channel: any = null;
    let isCancelled = false;

    const fetchAndSubscribeUnread = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || isCancelled) return;
      const uid = session.user.id;
      setUser(session.user);

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', uid)
        .eq('read', false);

      if (isCancelled) return;
      setUnreadCount(count || 0);

      const channelName = `nav-unread-${uid}-${Date.now()}`;
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${uid}`,
          },
          async () => {
            if (isCancelled) return;
            const { count: freshCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('recipient_id', uid)
              .eq('read', false);
            if (!isCancelled) {
              setUnreadCount(freshCount || 0);
            }
          }
        )
        .subscribe();
    };

    fetchAndSubscribeUnread();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAndSubscribeUnread();
      } else {
        setUnreadCount(0);
      }
    });

    return () => {
      isCancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
      subscription.unsubscribe();
    };
  }, []);

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

  if (!user || PUBLIC_ROUTES.includes(pathname) || pathname?.startsWith('/onboarding')) {
    return null;
  }

  return (
    <div 
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isKeyboardOpen ? 'translate-y-24 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      <nav className="bg-white/85 backdrop-blur-2xl border border-[#E5E1EC]/70 shadow-[0_12px_36px_rgba(101,85,184,0.14),0_4px_16px_rgba(0,0,0,0.04)] rounded-full px-3 py-2 flex items-center justify-around select-none">
        <Link
          href="/discover"
          className={`flex flex-col items-center justify-center p-2 rounded-full transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-80 select-none cursor-pointer ${
            isActive('/discover') ? 'text-[#6555B8]' : 'text-gray-400 hover:text-gray-700'
          }`}
          aria-label="Discover"
        >
          <Compass className="w-5 h-5" strokeWidth={isActive('/discover') ? 2.4 : 1.8} />
          {isActive('/discover') && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#6555B8] mt-1 shadow-[0_0_6px_rgba(101,85,184,0.6)] animate-[pairsPageIn_240ms_cubic-bezier(0.16,1,0.3,1)_both]" />
          )}
        </Link>

        <Link
          href="/favorites"
          className={`flex flex-col items-center justify-center p-2 rounded-full transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-80 select-none cursor-pointer ${
            isActive('/favorites') ? 'text-[#6555B8]' : 'text-gray-400 hover:text-gray-700'
          }`}
          aria-label="Saved"
        >
          <Heart 
            className="w-5 h-5" 
            strokeWidth={isActive('/favorites') ? 2.4 : 1.8} 
          />
          {isActive('/favorites') && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#6555B8] mt-1 shadow-[0_0_6px_rgba(101,85,184,0.6)] animate-[pairsPageIn_240ms_cubic-bezier(0.16,1,0.3,1)_both]" />
          )}
        </Link>

        <Link
          href="/messages"
          className={`relative flex flex-col items-center justify-center p-2 rounded-full transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-80 select-none cursor-pointer ${
            isActive('/messages') ? 'text-[#6555B8]' : 'text-gray-400 hover:text-gray-700'
          }`}
          aria-label="Messages"
        >
          <MessageCircle className="w-5 h-5" strokeWidth={isActive('/messages') ? 2.4 : 1.8} />
          {isActive('/messages') && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#6555B8] mt-1 shadow-[0_0_6px_rgba(101,85,184,0.6)] animate-[pairsPageIn_240ms_cubic-bezier(0.16,1,0.3,1)_both]" />
          )}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#E05375] text-[10px] font-bold text-white flex items-center justify-center shadow-xs pointer-events-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center justify-center p-2 rounded-full transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-80 select-none cursor-pointer ${
            isActive('/profile') ? 'text-[#6555B8]' : 'text-gray-400 hover:text-gray-700'
          }`}
          aria-label="Profile"
        >
          <User className="w-5 h-5" strokeWidth={isActive('/profile') ? 2.4 : 1.8} />
          {isActive('/profile') && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#6555B8] mt-1 shadow-[0_0_6px_rgba(101,85,184,0.6)] animate-[pairsPageIn_240ms_cubic-bezier(0.16,1,0.3,1)_both]" />
          )}
        </Link>
      </nav>
    </div>
  );
}

export default BottomNav;
