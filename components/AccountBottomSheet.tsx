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

  // Android Pixel gesture back handling
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

  // Load account data
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
    touchStartY.current = e.touches[0].clientY - dragY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;

    // Resistance formula for upward pull, 1:1 for downward pull
    if (diff < 0) {
      setDragY(diff * 0.2);
    } else {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 120) {
      onClose();
    } else {
      setDragY(0);
    }
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

  // Dynamic opacity calculation based on drag progress
  const backdropOpacity = Math.max(0.2, 0.75 - dragY / 600);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
      {/* Dynamic GPU Blurred Backdrop */}
      <div
        onClick={onClose}
        style={{
          backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})`,
          transition: isDragging ? 'none' : 'background-color 0.25s ease-out',
        }}
        className="fixed inset-0 backdrop-blur-sm gpu-overlay"
        aria-hidden="true"
      />

      {/* GPU Accelerated Sheet Container */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translate3d(0, ${dragY}px, 0)`,
          transition: isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative w-full max-w-lg bg-[#241E2F] border-t border-[#725A7A]/40 rounded-t-[32px] p-5 pb-8 shadow-2xl z-10 gpu-sheet max-h-[85dvh] flex flex-col justify-between overflow-y-auto select-none"
      >
        <div className="space-y-4">
          {/* Centered Grab Handle */}
          <div className="w-full py-1.5 flex justify-center cursor-grab active:cursor-grabbing">
            <div className="w-14 h-1.5 bg-[#725A7A]/60 rounded-full" />
          </div>

          <div className="pb-2 border-b border-[#725A7A]/25">
            <h2 className="text-xl font-black text-white tracking-tight">
              Your Account
            </h2>
          </div>

          {/* User Profile Summary */}
          <div className="p-4 rounded-2xl bg-[#17131F] border border-[#725A7A]/30 flex items-center justify-between gap-3 shadow-md transition-transform active:scale-[0.99]">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[#653C87] text-[#F3EBF9] flex items-center justify-center font-black text-base border border-[#978FA8]/40 shadow-inner flex-shrink-0">
                {initials}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {profile?.full_name || 'Your Profile'}
                  {profile?.age ? `, ${profile.age}` : ''}
                </h3>
                <p className="text-xs text-[#DDD8D4] flex items-center gap-1.5 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-[#B8AAC3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {profile?.city ? `${profile.city}, ${profile.country}` : 'Profile Incomplete'}
                </p>
              </div>
            </div>

            <Link
              href="/profile"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-[#241E2F] hover:bg-[#2E263B] border border-[#725A7A]/35 text-[#DDD8D4] hover:text-white text-xs font-bold transition-all active:scale-95"
            >
              Edit
            </Link>
          </div>

          {/* Verification Status Card */}
          <div className="p-4 rounded-2xl bg-[#17131F] border border-[#725A7A]/35 flex items-center justify-between gap-3 shadow-md">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#B8AAC3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-[11px] font-black uppercase tracking-wider text-white">
                  {profile?.is_verified ? 'Identity Verified' : 'Pose Unverified'}
                </span>
              </div>
              <p className="text-xs text-[#DDD8D4] leading-relaxed">
                {profile?.is_verified
                  ? 'Your profile carries the verified courtship badge.'
                  : 'Earn your verified badge with a 10-second selfie pose.'}
              </p>
            </div>

            {!profile?.is_verified && (
              <Link
                href="/verify"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] text-white text-xs font-black shadow-md flex-shrink-0 active:scale-95 transition-all"
              >
                Verify
              </Link>
            )}
          </div>

          {/* Action Links */}
          <div className="space-y-2">
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#17131F]/90 hover:bg-[#17131F] border border-[#725A7A]/30 text-white font-bold text-sm transition-all active:scale-[0.985]"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#B8AAC3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="text-[#DDD8D4]">Edit Profile & Photos</span>
              </div>
              <span className="text-xs text-[#725A7A]">→</span>
            </Link>

            <Link
              href="/favorites"
              onClick={onClose}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#17131F]/90 hover:bg-[#17131F] border border-[#725A7A]/30 text-white font-bold text-sm transition-all active:scale-[0.985]"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#B8AAC3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span className="text-[#DDD8D4]">Saved Profiles</span>
              </div>
              <span className="text-xs text-[#725A7A]">→</span>
            </Link>

            <Link
              href="/settings"
              onClick={onClose}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#17131F]/90 hover:bg-[#17131F] border border-[#725A7A]/30 text-white font-bold text-sm transition-all active:scale-[0.985]"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#B8AAC3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[#DDD8D4]">Settings & Preferences</span>
              </div>
              <span className="text-xs text-[#725A7A]">→</span>
            </Link>
          </div>
        </div>

        <div className="pt-4 mt-3 border-t border-[#725A7A]/25">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full py-3 rounded-2xl bg-[#17131F] hover:bg-[#201A2B] border border-rose-500/30 text-rose-300 font-extrabold text-xs tracking-wider uppercase active:scale-[0.985] transition-transform"
          >
            Sign Out / Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}