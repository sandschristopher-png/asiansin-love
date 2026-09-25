'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AccountBottomSheet } from '@/components/AccountBottomSheet';

export function BottomNav() {
  const pathname = usePathname();
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  if (pathname.startsWith('/chat/')) {
    return null;
  }

  return (
    <>
      <nav className="sm:hidden flex-shrink-0 z-40 bg-[#17131F]/95 backdrop-blur-md border-t border-[#725A7A]/35 px-4 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2">
        <div className="max-w-md mx-auto grid grid-cols-4 h-12 items-center">
          
          {/* DISCOVER */}
          <Link
            href="/discover"
            className={`flex flex-col items-center justify-center gap-1 active:scale-90 transition-all ${
              isActive('/discover') ? 'text-white font-black' : 'text-[#725A7A] hover:text-[#DDD8D4]'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[10px] tracking-wider uppercase font-extrabold">Discover</span>
          </Link>

          {/* SAVED */}
          <Link
            href="/favorites"
            className={`flex flex-col items-center justify-center gap-1 active:scale-90 transition-all ${
              isActive('/favorites') ? 'text-white font-black' : 'text-[#725A7A] hover:text-[#DDD8D4]'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="text-[10px] tracking-wider uppercase font-extrabold">Saved</span>
          </Link>

          {/* INBOX */}
          <Link
            href="/messages"
            className={`flex flex-col items-center justify-center gap-1 active:scale-90 transition-all relative ${
              isActive('/messages') ? 'text-white font-black' : 'text-[#725A7A] hover:text-[#DDD8D4]'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-[10px] tracking-wider uppercase font-extrabold">Inbox</span>
            <span className="absolute top-0 right-5 h-3.5 w-3.5 rounded-full bg-[#653C87] text-white text-[8px] font-black flex items-center justify-center border border-[#17131F]">
              1
            </span>
          </Link>

          {/* YOU */}
          <button
            type="button"
            onClick={() => setAccountSheetOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 active:scale-90 transition-all ${
              accountSheetOpen ? 'text-white font-black' : 'text-[#725A7A] hover:text-[#DDD8D4]'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] tracking-wider uppercase font-extrabold">You</span>
          </button>

        </div>
      </nav>

      <AccountBottomSheet
        isOpen={accountSheetOpen}
        onClose={() => setAccountSheetOpen(false)}
      />
    </>
  );
}