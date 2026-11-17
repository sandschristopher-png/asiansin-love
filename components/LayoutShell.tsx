'use client';

import React, { useLayoutEffect, useRef } from 'react';
import HeartbeatProvider from "./HeartbeatProvider";
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { isCityPagePath } from '@/lib/seo/citySlugs';
import { RealtimeNotifier } from '@/components/RealtimeNotifier';
import { PushPromptOnce } from '@/components/PushPromptOnce';
import { ActionToastProvider } from '@/components/ActionToast';
import { DesktopQrHandoff } from '@/components/DesktopQrHandoff';
import { AppShell } from '@/components/layout/AppShell';
import { CallProvider } from '@/components/calls/CallProvider';

/** Wraps the in-app frame in the call provider; marketing, auth and admin routes get no calling. */
function CallShell({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  return enabled ? <CallProvider>{children}</CallProvider> : <>{children}</>;
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The scrolling column outlives every route, so it would carry one tab's scroll position into the next.
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRoot = '/' + (pathname?.split('/')[1] ?? '');
  const lastTabRoot = useRef(tabRoot);
  useLayoutEffect(() => {
    if (lastTabRoot.current === tabRoot) return;
    lastTabRoot.current = tabRoot;
    scrollRef.current?.scrollTo({ top: 0, left: 0 }); // before paint: the new tab opens at its top, with no jump
  }, [tabRoot]);
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
  // route keeps the same 480px AppShell column. <body> is overflow-hidden for the app; the landing page
  // flows instead, so the browser window scrolls (no inner scrollbar) and globals.css un-clips <body>.
  if (pathname === '/') {
    return (
      <ActionToastProvider>
        <AppShell flow>{children}</AppShell>
      </ActionToastProvider>
    );
  }

  return (
    <ActionToastProvider>
    <AppShell>
      {/* Voice calls: an incoming call reaches every in-app page; the call screen lives inside this 480px frame. */}
      <CallShell enabled={!isMarketingOrAuth && !isAdmin}>
      {!isMarketingOrAuth && !isPublicProfile && !isChat && !isAdmin && (
        // One wrapper in one place for every route, so the header is never torn down and rebuilt when a tab is
        // tapped. Discover floats it over the feed (cards scroll behind the frosted glass instead of being cut
        // off at its bottom edge); everywhere else it sits in the flow above the page.
        <div className={overlayNav ? 'absolute inset-x-0 top-0 z-50' : 'shrink-0'}>
          <Navbar />
        </div>
      )}
      <div
        ref={scrollRef}
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
        {/* One-time push permission prompt (after sign-in / onboarding, never on those pages) */}
        {!isMarketingOrAuth && !isAdmin && <PushPromptOnce />}
      </div>
      {!isMarketingOrAuth && !isChat && !isAdmin && <BottomNav />}
      </CallShell>
    </AppShell>
    {/* Outside the 480px frame (fixed, xl screens only); /verify shows its own QR card. */}
    {!isMarketingOrAuth && !isAdmin && <DesktopQrHandoff />}
    </ActionToastProvider>
  );
}

export default LayoutShell;