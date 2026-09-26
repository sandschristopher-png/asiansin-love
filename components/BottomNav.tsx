'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart as LucideHeart, ChevronRight, XCircle, UserCircle2 } from 'lucide-react';
import { AccountBottomSheet } from '@/components/AccountBottomSheet';

export function BottomNav() {
  const pathname = usePathname();
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [listsOpen, setListsOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  // Don't show on individual profile deep dives or chat rooms
  if (pathname.startsWith('/chat/') || pathname.startsWith('/profile/')) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-3 left-0 right-0 z-50 px-4 pointer-events-none flex justify-center">
        <nav className="pointer-events-auto bg-[#241E2F]/95 backdrop-blur-xl border border-[#7D7E92]/40 rounded-[28px] px-3 py-1.5 shadow-2xl shadow-black/80 w-full max-w-sm transition-transform">
          <div className="grid grid-cols-5 items-center">
            
            {/* 1. DISCOVER */}
            <Link
              href="/discover"
              onClick={() => setListsOpen(false)}
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

            {/* 2. SAVED */}
            <Link
              href="/favorites"
              onClick={() => setListsOpen(false)}
              className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-[0.88] ${
                isActive('/favorites') ? 'text-[#E6D7FA]' : 'text-[#A8A2AB] hover:text-[#E6D7FA]'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 ${isActive('/favorites') ? 'bg-[#653C87] text-[#E6D7FA] shadow-md shadow-[#653C87]/40' : ''}`}>
                <svg className="w-5 h-5" fill={isActive('/favorites') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className={`text-[10px] tracking-wide font-extrabold mt-0.5 ${isActive('/favorites') ? 'text-[#E6D7FA]' : 'text-[#A8A2AB]'}`}>
                Saved
              </span>
            </Link>

            {/* 3. INBOX */}
            <Link
              href="/messages"
              onClick={() => setListsOpen(false)}
              className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-[0.88] relative ${
                isActive('/messages') ? 'text-[#E6D7FA]' : 'text-[#A8A2AB] hover:text-[#E6D7FA]'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 relative ${isActive('/messages') ? 'bg-[#653C87] text-[#E6D7FA] shadow-md shadow-[#653C87]/40' : ''}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/messages') ? 2.5 : 2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className={`text-[10px] tracking-wide font-extrabold mt-0.5 ${isActive('/messages') ? 'text-[#E6D7FA]' : 'text-[#A8A2AB]'}`}>
                Inbox
              </span>
            </Link>

            {/* 4. LISTS (Menu Sheet) */}
            <button
              type="button"
              onClick={() => setListsOpen(!listsOpen)}
              className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-[0.88] ${
                listsOpen ? 'text-[#E6D7FA]' : 'text-[#A8A2AB] hover:text-[#E6D7FA]'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 ${listsOpen ? 'bg-[#653C87] text-[#E6D7FA] shadow-md shadow-[#653C87]/40' : ''}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <span className={`text-[10px] tracking-wide font-extrabold mt-0.5 ${listsOpen ? 'text-[#E6D7FA]' : 'text-[#A8A2AB]'}`}>
                Lists
              </span>
            </button>

            {/* 5. YOU */}
            <button
              type="button"
              onClick={() => {
                setListsOpen(false);
                setAccountSheetOpen(true);
              }}
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

      {/* Lists Dropdown Sheet */}
      {listsOpen && (
        <div className="sm:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end justify-center pb-20 px-4" onClick={() => setListsOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-[#241E2F] border border-[#7D7E92]/35 p-4 space-y-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs font-bold uppercase tracking-wider text-[#B6AEC7] px-2 pb-1">
              Member Lists
            </div>
            
            <Link
              href="/favorites"
              onClick={() => setListsOpen(false)}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#17131F] hover:bg-[#653C87]/30 text-white font-semibold text-sm transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <LucideHeart className="w-4 h-4 text-[#C9A4E8]" /> <span>My Favorites</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#7D7E92]" />
            </Link>

            <Link
              href="/discover?filter=passed"
              onClick={() => setListsOpen(false)}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#17131F] hover:bg-[#653C87]/30 text-white font-semibold text-sm transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <XCircle className="w-4 h-4 text-[#8E849C]" /> <span>Disliked / Passed</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#7D7E92]" />
            </Link>

            <Link
              href="/profile"
              onClick={() => setListsOpen(false)}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#17131F] hover:bg-[#653C87]/30 text-white font-semibold text-sm transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <UserCircle2 className="w-4 h-4 text-[#C9A4E8]" /> <span>My Bio</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#7D7E92]" />
            </Link>
          </div>
        </div>
      )}

      <AccountBottomSheet
        isOpen={accountSheetOpen}
        onClose={() => setAccountSheetOpen(false)}
      />
    </>
  );
}