'use client';

import React from 'react';
import HeartbeatProvider from "./HeartbeatProvider";
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { RealtimeNotifier } from '@/components/RealtimeNotifier';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMarketingOrAuth =
    pathname === '/' ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/signup') ||
    pathname?.startsWith('/onboarding') ||
    pathname?.startsWith('/verify');

  const cleanPath = pathname?.replace(/\/+$/, '') || '';
  const isPublicProfile =
    cleanPath.startsWith('/profile/') &&
    !['/profile/edit', '/profile/reputation'].includes(cleanPath);

  const isChat = pathname?.startsWith('/chat');

  return (
    <div className="w-full max-w-[430px] h-screen h-[100dvh] mx-auto bg-white flex flex-col sm:shadow-[0_0_48px_rgba(101,85,184,0.10)] relative sm:border-x sm:border-[#ECE8F4] overflow-hidden">
      {!isMarketingOrAuth && !isPublicProfile && !isChat && <Navbar />}
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
      {!isMarketingOrAuth && !isChat && <BottomNav />}
    </div>
  );
}

export default LayoutShell;