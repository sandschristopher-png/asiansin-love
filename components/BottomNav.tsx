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
import { useNotificationCounts } from '@/lib/notificationStore';
import { useBottomNavHidden } from '@/lib/bottomNavStore';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  // Legal & safety reading pages: no floating nav over the text.
  '/terms',
  '/privacy',
  '/safety',
  '/standards',
  '/pricing'
];

export function BottomNav() {
  const { unreadMessages: unreadCount, unseenSparks } = useNotificationCounts();
  // A screen (e.g. My Profile while editing) can ask the dock to step aside.
  const hiddenByScreen = useBottomNavHidden();
  const [user, setUser] = useState<any>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const pathname = usePathname();
  const cleanPath = pathname?.replace(/\/+$/, '') || '';
  const isPublicProfile = cleanPath.startsWith('/profile/') && !['/profile/edit', '/profile/reputation'].includes(cleanPath);
  const isChat = pathname.startsWith("/chat");
  // /plus has its own pinned checkout bar and a back arrow (it is a subpage, not a root tab).
  const isPlusRoute = cleanPath === '/plus';



  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === '/discover') return pathname === '/discover';
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // Signed-in state only; unread counts come from RealtimeNotifier via the shared store.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      if (!window.visualViewport) return;
      const activeEl = document.activeElement;
      const isInputActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true');
      const isKeyboard = isInputActive && (window.visualViewport.height < window.innerHeight * 0.75);
      setIsKeyboardOpen(Boolean(isKeyboard));
    };

    window.visualViewport.addEventListener('resize', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!user || hiddenByScreen || isPublicProfile || isChat || isPlusRoute || PUBLIC_ROUTES.includes(pathname) || pathname?.startsWith('/onboarding')) {
    return null;
  }

  const navItems = [
    { href: '/discover', label: 'Discover', icon: Compass },
    { href: '/favorites', label: 'Sparks', icon: Heart, badge: unseenSparks },
    { href: '/messages', label: 'Messages', icon: MessageCircle, badge: unreadCount },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div 
      className={`fixed bottom-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-1.75rem)] max-w-[390px] z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isKeyboardOpen ? 'translate-y-24 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      <nav className="bg-white/95 border border-[#D0CDE1] shadow-[0_12px_36px_rgba(102,93,150,0.14),0_2px_8px_rgba(0,0,0,0.04)] rounded-full px-2 py-1.5 flex items-center justify-around select-none">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;


          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 ease-out active:scale-95 select-none cursor-pointer ${
                active 
                  ? 'text-[#413B5E]'
                  : 'text-[#B8B3D1] hover:text-[#8574B7] transition-colors'
              }`}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon 
                  className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} 
                  strokeWidth={active ? 2.3 : 1.75} 
                />
                {Boolean(item.badge && item.badge > 0) && (() => {
                  // Never clipped: one digit is a circle, "10".."99" and "99+" widen the pill instead.
                  const label = item.badge! > 99 ? '99+' : String(item.badge);
                  return (
                    <span
                      aria-label={`${label} new`}
                      className={`absolute -top-1 -right-2.5 inline-flex items-center justify-center h-4.5 rounded-full bg-[#9A93BC] text-white text-[9px] font-semibold leading-none tabular-nums ring-2 ring-white shadow-xs whitespace-nowrap pointer-events-none select-none ${
                        label.length === 1 ? 'w-4.5 p-0' : 'min-w-[18px] px-1.5'
                      }`}
                    >
                      {label}
                    </span>
                  );
                })()}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 leading-tight transition-colors duration-200 ${
                active ? 'font-semibold text-[#413B5E]' : 'font-medium text-slate-600'
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