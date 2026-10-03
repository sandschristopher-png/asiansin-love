'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChat = pathname?.startsWith('/chat/');

  if (isChat) {
    return (
      <div className="w-full max-w-[430px] h-[100dvh] mx-auto bg-white flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.08)] relative border-x border-black/[0.04] overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[430px] min-h-screen mx-auto bg-white flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.08)] relative border-x border-black/[0.04]">
      <div className="flex-1 pb-20">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
