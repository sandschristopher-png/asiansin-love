'use client';

import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!isOpen) return;

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
      {/* Blurred Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/65 backdrop-blur-sm animate-overlay-fade transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-Up Sheet Container */}
      <div className="relative w-full max-w-lg bg-[#241E2F] border-t border-[#725A7A]/40 rounded-t-[32px] p-5 pb-8 shadow-2xl z-10 animate-sheet-up max-h-[82dvh] flex flex-col justify-between overflow-y-auto">
        <div className="space-y-5">
          {/* Grab Handle */}
          <div className="w-12 h-1.5 bg-[#725A7A]/50 rounded-full mx-auto mb-1" />

          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-[#725A7A]/25">
            <h2 className="text-xl font-black text-white tracking-tight">
              Your Account
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-[#17131F] border border-[#725A7A]/35 text-[#B8AAC3] hover:text-white flex items-center justify-center text-sm font-bold active:scale-90 transition-transform"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* User Profile Summary Card */}
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

          {/* Verification Status Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1E1929] to-[#241E2F] border border-[#653C87]/50 flex items-center justify-between gap-3 shadow-md">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{profile?.is_verified ? '🛡️' : '⚠️'}</span>
                <span className={`text-[11px] font-black uppercase tracking-wider ${
                  profile?.is_verified ? 'text-emerald-300' : 'text-amber-300'
                }`}>
                  {profile?.is_verified ? 'Identity Verified' : 'Pose Unverified'}
                </span>
              </div>
              <p className="text-xs text-[#DDD8D4]">
                {profile?.is_verified
                  ? 'Your profile carries the verified courtship badge.'
                  : 'Earn the verified badge with a quick selfie pose.'}
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

          {/* Navigation Action Rows */}
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
              href="/standards"
              onClick={onClose}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#17131F]/80 hover:bg-[#17131F] border border-[#725A7A]/30 text-white font-bold text-sm transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">📜</span>
                <span>Community Standards</span>
              </div>
              <span className="text-xs text-[#725A7A]">→</span>
            </Link>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-5 mt-4 border-t border-[#725A7A]/25 space-y-2.5">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full py-3.5 rounded-2xl bg-[#17131F] hover:bg-[#201A2B] border border-rose-500/30 text-rose-300 font-extrabold text-xs tracking-wider uppercase active:scale-[0.98] transition-all"
          >
            Sign Out / Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}