'use client';

import React from 'react';
import HeartbeatProvider from "./HeartbeatProvider";
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { isCityPagePath } from '@/lib/seo/citySlugs';
import { RealtimeNotifier } from '@/components/RealtimeNotifier';
import { ActionToastProvider } from '@/components/ActionToast';
import { DesktopQrHandoff } from '@/components/DesktopQrHandoff';
import { AppShell } from '@/components/layout/AppShell';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMarketingOrAuth =
    pathname === '/' ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/signup') ||
    pathname?.startsWith('/onboarding') ||
    pathname?.startsWith('/verify') ||
    pathname?.startsWith('/auth/') ||
    isCityPagePath(pathname); // SEO city landing pages (/cebu, /manila, ...)

  const cleanPath = pathname?.replace(/\/+$/, '') || '';
  const isPublicProfile =
    cleanPath.startsWith('/profile/') &&
    !['/profile/edit', '/profile/reputation'].includes(cleanPath);

  const isChat = pathname?.startsWith('/chat');
  // Admin Console renders its own header / tabs inside the same mobile frame.
  const isAdmin = pathname === '/admin' || pathname?.startsWith('/admin/');
  // Routes whose Navbar (h-14) overlays the scroll area; their sticky bars use top-14.
  const overlayNav = pathname === '/discover';

  // The landing page is a single phone-width column on every screen (no desktop corner cards). Every other
  // route keeps the same 480px AppShell column. <body> is overflow-hidden, so on the landing page
  // the shell is the scroll container (its sticky header sticks within it).
  if (pathname === '/') {
    return (
      <ActionToastProvider>
        <AppShell scroll>{children}</AppShell>
      </ActionToastProvider>
    );
  }

  return (
    <ActionToastProvider>
    <AppShell>
      {!isMarketingOrAuth && !isPublicProfile && !isChat && !isAdmin &&
        (overlayNav ? (
          // Discover: the frosted header floats over the feed, so cards scroll behind the glass
          // instead of being cut off at its bottom edge.
          <div className="absolute inset-x-0 top-0 z-50">
            <Navbar />
          </div>
        ) : (
          <Navbar />
        ))}
      <div
        className={`flex-1 flex flex-col min-h-0 relative ${
          isChat
            ? 'overflow-hidden'
            : 'overflow-y-auto overscroll-y-contain smooth-scroll no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
        }`}
      >
        
        <main className={`flex-1 flex flex-col w-full min-h-0 ${overlayNav ? 'pt-14' : ''}`}>
          {children}
        </main>
        <HeartbeatProvider />
        {/* Messages, Sparks, mutual Sparks and visits: toasts + badges on every in-app route */}
        {!isMarketingOrAuth && <RealtimeNotifier />}
      </div>
      {!isMarketingOrAuth && !isChat && !isAdmin && <BottomNav />}
    </AppShell>
    {/* Outside the 480px frame (fixed, xl screens only); /verify shows its own QR card. */}
    {!isMarketingOrAuth && !isAdmin && <DesktopQrHandoff />}
    </ActionToastProvider>
  );
}

export default LayoutShell;