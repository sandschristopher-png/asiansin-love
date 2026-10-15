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
import { supabase } from '@/lib/supabase/client';

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
        .eq('receiver_id', uid)
        .eq('is_read', false);

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
            filter: `receiver_id=eq.${uid}`,
          },
          async () => {
            if (isCancelled) return;
            const { count: freshCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('receiver_id', uid)
              .eq('is_read', false);
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

  const navItems = [
    { href: '/discover', label: 'Discover', icon: Compass },
    { href: '/favorites', label: 'Sparks', icon: Heart },
    { href: '/messages', label: 'Messages', icon: MessageCircle, badge: unreadCount },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div 
      className={`fixed bottom-3.5 left-1/2 -translate-x-1/2 w-[calc(100%-1.75rem)] max-w-[390px] z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isKeyboardOpen ? 'translate-y-24 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      <nav className="bg-white/92 backdrop-blur-2xl border border-[#E5E1EC]/80 shadow-[0_12px_36px_rgba(101,85,184,0.14),0_2px_8px_rgba(0,0,0,0.04)] rounded-full px-2 py-1.5 flex items-center justify-around select-none">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 ease-out active:scale-95 select-none cursor-pointer ${
                active 
                  ? 'text-[#6555B8]' 
                  : 'text-[#8C849B] hover:text-[#524B5E]'
              }`}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon 
                  className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} 
                  strokeWidth={active ? 2.3 : 1.75} 
                />
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#E05375] text-[10px] font-bold text-white flex items-center justify-center shadow-xs pointer-events-none">
                    {item.badge! > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 leading-tight transition-colors duration-200 ${
                active ? 'font-bold text-[#6555B8]' : 'font-medium text-[#8C849B]'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default BottomNav;
