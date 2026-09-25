'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AccountSheet } from '@/components/AccountSheet';

export function BottomDock() {
  const pathname = usePathname();
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);

  // Hide dock inside active chat conversation
  if (pathname.startsWith('/chat/')) return null;

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <div className="md:hidden fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
        <nav className="pointer-events-auto bg-[#17131F]/90 backdrop-blur-xl border border-[#725A7A]/40 rounded-full px-5 py-2.5 shadow-2xl shadow-black/80 flex items-center gap-6">
          
          {/* Discover */}
          <Link
            href="/discover"
            className={`flex flex-col items-center transition-transform active:scale-90 ${
              isActive('/discover') ? 'text-white' : 'text-[#725A7A]'
            }`}
            aria-label="Discover"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-tight mt-0.5">
              Discover
            </span>
          </Link>

          {/* Saved */}
          <Link
            href="/favorites"
            className={`flex flex-col items-center transition-transform active:scale-90 ${
              isActive('/favorites') ? 'text-white' : 'text-[#725A7A]'
            }`}
            aria-label="Saved"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-tight mt-0.5">
              Saved
            </span>
          </Link>

          {/* Messages */}
          <Link
            href="/messages"
            className={`flex flex-col items-center relative transition-transform active:scale-90 ${
              isActive('/messages') ? 'text-white' : 'text-[#725A7A]'
            }`}
            aria-label="Messages"
          >
            <div className="relative">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-[#653C87] text-white text-[8px] font-black rounded-full shadow-md">
                1
              </span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-tight mt-0.5">
              Inbox
            </span>
          </Link>

          {/* You / Account Trigger */}
          <button
            type="button"
            onClick={() => setAccountSheetOpen(true)}
            className="flex flex-col items-center text-[#725A7A] hover:text-white transition-transform active:scale-90"
            aria-label="Account Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-tight mt-0.5">
              You
            </span>
          </button>

        </nav>
      </div>

      <AccountSheet
        isOpen={accountSheetOpen}
        onClose={() => setAccountSheetOpen(false)}
      />
    </>
  );
}