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
      <div className="sm:hidden fixed bottom-3 left-0 right-0 z-40 px-4 pointer-events-none flex justify-center">
        {/* Curvature calibrated to rounded-[28px] matching application modal standards */}
        <nav className="pointer-events-auto bg-[#241E2F]/95 backdrop-blur-xl border border-[#725A7A]/40 rounded-[28px] px-3.5 py-1.5 shadow-2xl shadow-black/70 w-full max-w-sm transition-transform">
          <div className="grid grid-cols-4 items-center">
            
            {/* DISCOVER */}
            <Link
              href="/discover"
              className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-[0.88] ${
                isActive('/discover') ? 'text-[#E6D7FA]' : 'text-[#A8A2AB] hover:text-[#E6D7FA]'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 ${isActive('/discover') ? 'bg-[#653C87] text-[#E6D7FA] shadow-md shadow-[#653C87]/40' : ''}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/discover') ? 2.5 : 2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className={`text-[10px] tracking-wide font-extrabold mt-0.5 ${isActive('/discover') ? 'text-[#E6D7FA]' : 'text-[#A8A2AB]'}`}>
                Discover
              </span>
            </Link>

            {/* SAVED */}
            <Link
              href="/favorites"
              className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-[0.88] ${
                isActive('/favorites') ? 'text-[#E6D7FA]' : 'text-[#A8A2AB] hover:text-[#E6D7FA]'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 ${isActive('/favorites') ? 'bg-[#653C87] text-[#E6D7FA] shadow-md shadow-[#653C87]/40' : ''}`}>
                <svg className="w-5 h-5" fill={isActive('/favorites') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/favorites') ? 2 : 2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <span className={`text-[10px] tracking-wide font-extrabold mt-0.5 ${isActive('/favorites') ? 'text-[#E6D7FA]' : 'text-[#A8A2AB]'}`}>
                Saved
              </span>
            </Link>

            {/* INBOX */}
            <Link
              href="/messages"
              className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-[0.88] relative ${
                isActive('/messages') ? 'text-[#E6D7FA]' : 'text-[#A8A2AB] hover:text-[#E6D7FA]'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 relative ${isActive('/messages') ? 'bg-[#653C87] text-[#E6D7FA] shadow-md shadow-[#653C87]/40' : ''}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/messages') ? 2.5 : 2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#9A79BA] border border-[#241E2F]" />
              </div>
              <span className={`text-[10px] tracking-wide font-extrabold mt-0.5 ${isActive('/messages') ? 'text-[#E6D7FA]' : 'text-[#A8A2AB]'}`}>
                Inbox
              </span>
            </Link>

            {/* YOU */}
            <button
              type="button"
              onClick={() => setAccountSheetOpen(true)}
              className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-[0.88] ${
                accountSheetOpen ? 'text-[#E6D7FA]' : 'text-[#A8A2AB] hover:text-[#E6D7FA]'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 ${accountSheetOpen ? 'bg-[#653C87] text-[#E6D7FA] shadow-md shadow-[#653C87]/40' : ''}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={accountSheetOpen ? 2.5 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className={`text-[10px] tracking-wide font-extrabold mt-0.5 ${accountSheetOpen ? 'text-[#E6D7FA]' : 'text-[#A8A2AB]'}`}>
                You
              </span>
            </button>

          </div>
        </nav>
      </div>

      <AccountBottomSheet
        isOpen={accountSheetOpen}
        onClose={() => setAccountSheetOpen(false)}
      />
    </>
  );
}