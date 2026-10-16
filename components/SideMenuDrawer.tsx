'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  X,
  User,
  SlidersHorizontal,
  ShieldCheck,
  MessageCircle,
  Compass,
  Settings,
  Bell,
  HelpCircle,
  FileText,
  UserX,
  LogOut,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface SideMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFilters?: () => void;
}

interface UserProfileSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  reputationScore: number;
  isVerified: boolean;
  city: string;
}

export function SideMenuDrawer({ isOpen, onClose, onOpenFilters }: SideMenuDrawerProps) {
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  const [profile, setProfile] = useState<UserProfileSummary>({
    id: '',
    username: 'your_handle',
    displayName: 'Member',
    avatarUrl: '/placeholder-avatar.svg',
    reputationScore: 100,
    isVerified: false,
    city: '',
  });
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (isOpen) {
        onClose();
      }
    }
  }, [pathname, isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    let mounted = true;
    async function loadUserProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, username, display_name, full_name, avatar_url, reputation_score, is_verified, location_verified, city')
        .eq('id', user.id)
        .maybeSingle();

      if (prof && mounted) {
        const cleanHandle = (prof.username || user.email?.split('@')[0] || 'your_handle').replace(/^@/, '');
        const cleanName = prof.display_name || prof.full_name || cleanHandle;
        setProfile({
          id: prof.id,
          username: cleanHandle,
          displayName: cleanName,
          avatarUrl: prof.avatar_url || '/placeholder-avatar.svg',
          reputationScore: typeof prof.reputation_score === 'number' ? prof.reputation_score : 100,
          isVerified: Boolean(prof.is_verified || prof.location_verified),
          city: prof.city || '',
        });
      }
    }
    if (isOpen) {
      loadUserProfile();
    }
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await supabase.auth.signOut();
    } finally {
      window.location.href = '/';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="relative z-10 w-[84%] max-w-[330px] bg-white h-full shadow-2xl border-l border-[#EAE5F2] flex flex-col justify-between overflow-y-auto select-none"
        aria-label="Navigation and Settings Menu"
      >
        <div>
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <span
              className="text-base font-bold tracking-tight lowercase inline-flex items-baseline"
              style={{ fontFamily: 'var(--font-logo), var(--font-brand), sans-serif', fontWeight: 700 }}
            >
              <span className="text-[#1C1924] tracking-[-0.05em]">asians</span>
              <span className="text-[#6555B8] tracking-[-0.05em]">inlove</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-2 text-[#6C637B] hover:text-[#1C1924] hover:bg-[#F3EFFC] rounded-full transition cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 py-3 border-b border-[#EFEBF5]">
            <Link
              href="/profile"
              onClick={onClose}
              className="group flex items-center justify-between p-2.5 -mx-2.5 rounded-2xl hover:bg-[#F8F7FA] transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#DDD7E5] bg-[#F3EFFC] shrink-0">
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                  <span
                    className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"
                    title="Online"
                  />
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#1C1924] truncate">
                      {profile.displayName}
                    </span>
                  </div>
                  <span className="text-xs text-[#6C637B] truncate">
                    @{profile.username}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F3EFFC] text-[#6555B8] border border-[#E2D9F3]">
                      🛡️ {profile.reputationScore}% Rep
                    </span>
                    {profile.isVerified && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <MapPin className="w-2.5 h-2.5" /> GPS
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8C849B] group-hover:text-[#6555B8] group-hover:translate-x-0.5 transition shrink-0" />
            </Link>
          </div>

          <div className="px-5 py-4 space-y-6">
            <div>
              <p className="text-[11px] font-bold tracking-wider uppercase text-[#8C849B] mb-2">
                Account &amp; Profile
              </p>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/profile"
                    onClick={onClose}
                    className="flex items-center gap-3 py-2 text-[14px] font-medium text-[#1C1924] hover:text-[#6555B8] transition"
                  >
                    <User className="w-4 h-4 text-[#6C637B]" />
                    <span>View My Profile</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile/edit"
                    onClick={onClose}
                    className="flex items-center gap-3 py-2 text-[14px] font-medium text-[#1C1924] hover:text-[#6555B8] transition"
                  >
                    <Settings className="w-4 h-4 text-[#6C637B]" />
                    <span>Edit Profile &amp; Vitals</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    onClick={onClose}
                    className="flex items-center gap-3 py-2 text-[14px] font-medium text-[#1C1924] hover:text-[#6555B8] transition"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-[#6C637B]" />
                    <span>Account Settings</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-bold tracking-wider uppercase text-[#8C849B] mb-2">
                Discover &amp; Connect
              </p>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/discover"
                    onClick={onClose}
                    className="flex items-center gap-3 py-2 text-[14px] font-medium text-[#1C1924] hover:text-[#6555B8] transition"
                  >
                    <Compass className="w-4 h-4 text-[#6C637B]" />
                    <span>Discover Feed</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/messages"
                    onClick={onClose}
                    className="flex items-center gap-3 py-2 text-[14px] font-medium text-[#1C1924] hover:text-[#6555B8] transition"
                  >
                    <MessageCircle className="w-4 h-4 text-[#6C637B]" />
                    <span>Messages</span>
                  </Link>
                </li>
                {onOpenFilters && (
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenFilters();
                      }}
                      className="w-full flex items-center gap-3 py-2 text-[14px] font-medium text-[#1C1924] hover:text-[#6555B8] transition text-left cursor-pointer"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-[#6C637B]" />
                      <span>Search Filters</span>
                    </button>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-bold tracking-wider uppercase text-[#8C849B] mb-2">
                Safety &amp; Trust
              </p>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/profile/edit#verification"
                    onClick={onClose}
                    className="flex items-center justify-between py-2 text-[14px] font-medium text-[#1C1924] hover:text-[#6555B8] transition"
                  >
                    <span className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-[#6555B8]" />
                      <span>GPS &amp; Photo Verification</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#F3EFFC] text-[#6555B8]">
                      Core
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings#blocked"
                    onClick={onClose}
                    className="flex items-center gap-3 py-2 text-[14px] font-medium text-[#1C1924] hover:text-[#6555B8] transition"
                  >
                    <UserX className="w-4 h-4 text-[#6C637B]" />
                    <span>Blocked Users</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/safety"
                    onClick={onClose}
                    className="flex items-center gap-3 py-2 text-[14px] font-medium text-[#1C1924] hover:text-[#6555B8] transition"
                  >
                    <HelpCircle className="w-4 h-4 text-[#6C637B]" />
                    <span>Safety Guide &amp; Rep Scoring</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-bold tracking-wider uppercase text-[#8C849B] mb-2">
                More
              </p>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/notifications"
                    onClick={onClose}
                    className="flex items-center gap-3 py-2 text-[14px] font-medium text-[#1C1924] hover:text-[#6555B8] transition"
                  >
                    <Bell className="w-4 h-4 text-[#6C637B]" />
                    <span>Notifications</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    onClick={onClose}
                    className="flex items-center gap-3 py-2 text-[14px] font-medium text-[#1C1924] hover:text-[#6555B8] transition"
                  >
                    <FileText className="w-4 h-4 text-[#6C637B]" />
                    <span>About, Terms &amp; Privacy</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#EFEBF5] bg-[#FAF9FC]">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
          >
            <span className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4" />
              <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
            </span>
            <span className="text-[11px] text-[#8C849B] font-normal">@{profile.username}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

export default SideMenuDrawer;