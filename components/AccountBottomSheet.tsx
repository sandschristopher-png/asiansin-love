'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface AccountBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountBottomSheet({ isOpen, onClose }: AccountBottomSheetProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ drawerOpen: true }, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setDragY(0);
      return;
    }

    async function fetchAccountData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          setProfile(data || { full_name: 'Member', email: user.email });
        }
      } catch (err) {
        console.error('Account sheet fetch note:', err);
      }
    }

    fetchAccountData();
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 110) {
      onClose();
    }
    setDragY(0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onClose();
    router.push('/login');
    router.refresh();
  };

  if (!isOpen) return null;

  const initials = profile?.full_name
    ? profile.full_name.slice(0, 2).toUpperCase()
    : 'ME';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-overlay-fade transition-opacity"
        aria-hidden="true"
      />

      <div
        ref={sheetRef}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative w-full max-w-lg bg-[#241E2F] border-t border-[#725A7A]/40 rounded-t-[32px] p-5 pb-8 shadow-2xl z-10 animate-sheet-up max-h-[85dvh] flex flex-col justify-between overflow-y-auto"
      >
        <div className="space-y-4">
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full py-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
          >
            <div className="w-14 h-1.5 bg-[#725A7A]/60 rounded-full" />
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#725A7A]/25">
            <h2 className="text-xl font-black text-white tracking-tight">
              Your Account
            </h2>
            <span className="text-[11px] font-bold text-[#B8AAC3] uppercase tracking-wider">
              Swipe down to close
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#17131F] border border-[#725A7A]/30 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[#653C87] text-white flex items-center justify-center font-black text-base border border-[#978FA8]/40 shadow-inner flex-shrink-0">
                {initials}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {profile?.full_name || 'Your Profile'}
                  {profile?.age ? `, ${profile.age}` : ''}
                </h3>
                <p className="text-xs text-[#DDD8D4] flex items-center gap-1">
                  <span>📍</span>
                  {profile?.city ? `${profile.city}, ${profile.country}` : 'Profile Incomplete'}
                </p>
              </div>
            </div>

            <Link
              href="/profile"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-[#241E2F] hover:bg-[#2E263B] border border-[#725A7A]/35 text-white text-xs font-bold transition-all active:scale-95"
            >
              Edit
            </Link>
          </div>

          <div className="space-y-2">
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#17131F]/80 hover:bg-[#17131F] border border-[#725A7A]/30 text-white font-bold text-sm transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">📝</span>
                <span>Edit Profile & Photos</span>
              </div>
              <span className="text-xs text-[#725A7A]">→</span>
            </Link>

            <Link
              href="/favorites"
              onClick={onClose}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#17131F]/80 hover:bg-[#17131F] border border-[#725A7A]/30 text-white font-bold text-sm transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">⭐</span>
                <span>Saved Profiles</span>
              </div>
              <span className="text-xs text-[#725A7A]">→</span>
            </Link>

            <Link
              href="/settings"
              onClick={onClose}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#17131F]/80 hover:bg-[#17131F] border border-[#725A7A]/30 text-white font-bold text-sm transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">⚙️</span>
                <span>Settings & Preferences</span>
              </div>
              <span className="text-xs text-[#725A7A]">→</span>
            </Link>
          </div>
        </div>

        <div className="pt-4 mt-3 border-t border-[#725A7A]/25">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full py-3 rounded-2xl bg-[#17131F] hover:bg-[#201A2B] border border-rose-500/30 text-rose-300 font-extrabold text-xs tracking-wider uppercase active:scale-[0.98] transition-all"
          >
            Sign Out / Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}