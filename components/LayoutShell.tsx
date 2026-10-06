'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { RealtimeMatchToast } from '@/components/RealtimeMatchToast';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMarketingOrAuth = pathname === '/' || pathname?.startsWith('/login') || pathname?.startsWith('/onboarding');

  return (
    <div className="w-full max-w-[430px] h-screen h-[100dvh] mx-auto bg-white flex flex-col sm:shadow-[0_0_50px_rgba(0,0,0,0.12)] relative sm:border-x sm:border-black/[0.06] overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 relative overflow-y-auto overscroll-y-contain smooth-scroll no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <Navbar />
        <main className="flex-1 flex flex-col w-full min-h-0">
          {children}
        </main>
        <RealtimeMatchToast />
      </div>
      {!isMarketingOrAuth && <BottomNav />}
    </div>
  );
}

export default LayoutShell;