'use client';

import React from 'react';
import HeartbeatProvider from "./HeartbeatProvider";
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { isCityPagePath } from '@/lib/seo/citySlugs';
import { RealtimeNotifier } from '@/components/RealtimeNotifier';
import { ActionToastProvider } from '@/components/ActionToast';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMarketingOrAuth =
    pathname === '/' ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/signup') ||
    pathname?.startsWith('/onboarding') ||
    pathname?.startsWith('/verify') ||
    isCityPagePath(pathname); // SEO city landing pages (/cebu, /manila, ...)

  const cleanPath = pathname?.replace(/\/+$/, '') || '';
  const isPublicProfile =
    cleanPath.startsWith('/profile/') &&
    !['/profile/edit', '/profile/reputation'].includes(cleanPath);

  const isChat = pathname?.startsWith('/chat');
  // Admin Console renders its own header / tabs inside the same mobile frame.
  const isAdmin = pathname === '/admin' || pathname?.startsWith('/admin/');

  // The marketing landing page spans the full viewport (responsive desktop layout). Every other
  // route keeps the 430px app frame. <body> is overflow-hidden, so this wrapper is the page's
  // scroll container (its sticky header sticks within it).
  if (pathname === '/') {
    return (
      <ActionToastProvider>
        <div className="w-full h-[100dvh] overflow-y-auto overflow-x-hidden overscroll-y-contain bg-white">
          {children}
        </div>
      </ActionToastProvider>
    );
  }

  return (
    <ActionToastProvider>
    <div className={`w-full max-w-[430px] h-[100dvh] min-h-[100dvh] mx-auto bg-white flex flex-col sm:shadow-[0_0_48px_rgba(114,81,154,0.10)] relative sm:border-x sm:border-[#D5C6EC] overflow-hidden`}>
      {!isMarketingOrAuth && !isPublicProfile && !isChat && !isAdmin && <Navbar />}
      <div
        className={`flex-1 flex flex-col min-h-0 relative ${
          isChat
            ? 'overflow-hidden'
            : 'overflow-y-auto overscroll-y-contain smooth-scroll no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
        }`}
      >
        
        <main className="flex-1 flex flex-col w-full min-h-0">
          {children}
        </main>
        <HeartbeatProvider />
        {/* Messages, Sparks, mutual Sparks and visits: toasts + badges on every in-app route */}
        {!isMarketingOrAuth && <RealtimeNotifier />}
      </div>
      {!isMarketingOrAuth && !isChat && !isAdmin && <BottomNav />}
    </div>
    </ActionToastProvider>
  );
}

export default LayoutShell;