'use client';
import { BrandLogo } from '@/components/BrandLogo';
import { isPlusProfile } from '@/lib/plus';
import { setCachedSubscription } from '@/lib/subscriptionStatus';
import { ANNOUNCEMENTS_READ_EVENT, NON_ANNOUNCEMENT_FILTER } from '@/lib/announcements';
import { hasUnreadBroadcast } from '@/lib/broadcasts';
import { notifyUser } from '@/components/InAppToast';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User, Settings, LogOut, ArrowLeft, Menu, ShieldAlert, Megaphone, CreditCard } from 'lucide-react';
import { adminRoleOf, isStaff } from '@/lib/adminRoles';
import { supabase } from '@/lib/supabase/client';
import { hardSignOut } from '@/lib/hardSignOut';
import { PlusBadge } from '@/components/ui/PlusBadge';
/** Signed-in areas: the header never offers "Sign In" here (middleware already requires a session). */
const IN_APP_PREFIXES = ['/discover', '/messages', '/favorites', '/profile', '/notifications', '/announcements', '/chat', '/settings', '/plus', '/verify'];

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  // True until the first auth check resolves: render a placeholder, never a flash of "Sign In".
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [hasUnreadAnnouncements, setHasUnreadAnnouncements] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isChatThread = pathname?.startsWith('/chat');
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  // Unread system announcements -> pink dot beside "Announcements" in the menu. (Chats and Sparks
  // activity have their own BottomNav badges; see lib/announcements.ts.)
  useEffect(() => {
    if (!user) {
      setHasUnreadAnnouncements(false);
      return;
    }
    let cancelled = false;
    const check = async () => {
      // Unread = a personal notice not yet read, or an admin broadcast newer than the member's
      // read marker (lib/broadcasts.ts). Before the broadcasts migration, only notices count.
      const [{ count }, { data: latest }, { data: me }] = await Promise.all([
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
          .not('type', 'in', NON_ANNOUNCEMENT_FILTER),
        supabase.from('announcements').select('published_at').order('published_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      ]);
      const broadcastUnread = hasUnreadBroadcast(latest?.published_at, me?.last_read_announcements_at);
      if (!cancelled) setHasUnreadAnnouncements((count ?? 0) > 0 || broadcastUnread);
    };
    check();
    const cleared = () => setHasUnreadAnnouncements(false);
    window.addEventListener(ANNOUNCEMENTS_READ_EVENT, cleared);
    return () => {
      cancelled = true;
      window.removeEventListener(ANNOUNCEMENTS_READ_EVENT, cleared);
    };
  }, [user, pathname, menuOpen]);
  // Tracks the signed-in member and their profile.
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) {
          setProfile(data);
          setCachedSubscription(isPlusProfile(data));
        }
      }
    }
    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        if (data) {
          setProfile(data);
          setCachedSubscription(isPlusProfile(data));
        }
      } else {
        setProfile(null);
        setCachedSubscription(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);
  const handleSignOut = async () => {
    setMenuOpen(false);
    await hardSignOut();
    setUser(null);
    setProfile(null);
    window.location.href = '/';
  };
  const displayName = profile?.username || 'Member';
  const getPageTitle = () => {
    if (!pathname || pathname === '/' || pathname === '/discover') return null;
    if (pathname.startsWith('/favorites') || pathname.startsWith('/saved')) return 'Sparks';
    if (pathname.startsWith('/chat') || pathname.startsWith('/messages')) return 'Messages';
    if (pathname === '/announcements') return 'Announcements';
    if (pathname === '/settings') return 'Settings';
    if (pathname === '/profile') return 'My Profile';
    if (pathname.startsWith('/profile/')) return 'Profile';
    return null;
  };
  const pageTitle = getPageTitle();
  // Root bottom-nav tabs never show a back arrow; only subpages do.
  const ROOT_TABS = ['/discover', '/favorites', '/messages', '/profile'];
  const showBack = !ROOT_TABS.includes((pathname || '').replace(/\/+$/, ''));
  if (isChatThread || pathname === '/plus' || (pathname || '').startsWith('/plus/') || pathname === '/profile/edit' || (pathname || '').startsWith('/profile/edit/') || pathname === '/settings' || (pathname || '').startsWith('/settings/')) return null;
  return (
    // On Discover the frosted filter bar sits directly below: drop the divider so both read as one surface.
    <header className={`sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b ${pathname === '/discover' ? 'border-transparent' : 'border-[#ECE8F4]/80'}`}>
      <div className="max-w-[430px] mx-auto px-4 h-14 flex items-center justify-between relative">
        <div className={`flex items-center gap-2 ${pageTitle ? 'min-w-0' : 'shrink-0'}`}>
          <div
            key={pageTitle || 'brand-home'}
            className="transition-all duration-200 ease-out flex items-center"
            style={{ animation: 'fadeInTitle 220ms ease-out forwards' }}
          >
            {!pageTitle ? (
              <div className="flex items-center gap-1.5 shrink-0 min-w-max">
                <BrandLogo href={user ? "/discover" : "/"} size="header" />
                {user && isPlusProfile(profile) && <PlusBadge size="header" />}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                {showBack && (
                <button
                  type="button"
                  onClick={() => { if (typeof window !== "undefined" && window.history.length > 1) router.back(); else router.push("/discover"); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#4C3B75] hover:bg-black/5 transition-colors -ml-1 sm:hidden"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                )}
                <h1
                  className="text-[19px] sm:text-[21px] font-semibold text-[#4C3B75] tracking-[-0.025em] leading-snug pb-0.5 select-none truncate"
                  style={{ fontFamily: 'var(--font-brand)' }}
                >
                  {pageTitle}
                </h1>
                {pathname?.startsWith('/profile/') && (
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen(true)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#4C3B75] hover:bg-black/5 transition-colors sm:hidden"
                    aria-label="More options"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="1.7" />
                      <circle cx="12" cy="12" r="1.7" />
                      <circle cx="12" cy="19" r="1.7" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {user ? (
            <>
            {pathname === '/profile' && (
              <Link
                href="/settings"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6555B8] hover:bg-[#F3EFFC] transition-colors"
                aria-label="Settings"
                title="Settings"
              >
                <Settings className="w-5 h-5 stroke-[2]" />
              </Link>
            )}
            <div className={`relative ${pathname === "/profile" ? "hidden" : ""}`} ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Open menu"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F3EFFC] text-[#2D264B] transition-colors relative"
                >
                  <Menu className="w-5 h-5" />
                </button>
                {menuOpen && (
                  // Account utilities + announcements; dating activity lives on the BottomNav tabs.
                  <div role="menu" className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#ECE8F4] shadow-xl overflow-hidden z-[200] animate-[notifDropdownIn_0.2s_cubic-bezier(0.16,1,0.3,1)_both]">
                    <div className="px-4 py-3 border-b border-[#ECE8F4] flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-bold text-[#2D264B] truncate">{displayName.replace(/^@/, '')}</span>
                      {isPlusProfile(profile) && <PlusBadge size="profile" />}
                    </div>
                    <div className="py-1">
                      <Link href="/plus" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 h-11 text-sm text-[#2D264B] hover:bg-[#FAF8FD] transition-colors justify-between">
                        {/* The header row above already shows the PLUS badge: this row says "Membership". */}
                        <span className="flex items-center gap-3">
                          <CreditCard className="w-4 h-4 text-neutral-500" aria-hidden />
                          {/* Profile not loaded yet: neutral placeholder, never "Upgrade" to a Plus member. */}
                          {!profile ? (
                            <span aria-hidden className="h-3 w-24 rounded-full bg-[#ECE8F4]/50 animate-pulse" />
                          ) : isPlusProfile(profile) ? 'Membership' : 'Upgrade to Plus'}
                        </span>
                        {!profile ? null : isPlusProfile(profile) ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#8C71F5]/10 to-[#EC4899]/10 border border-[#8C71F5]/20 text-[#8C71F5]">Active</span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF8FD] border border-[#ECE8F4] text-neutral-500">Upgrade</span>
                        )}
                      </Link>
                      <Link href="/profile" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 h-11 text-sm text-[#2D264B] hover:bg-[#FAF8FD] transition-colors">
                        <User className="w-4 h-4 text-neutral-500" />
                        My Profile
                      </Link>
                      <Link href="/settings" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 h-11 text-sm text-[#2D264B] hover:bg-[#FAF8FD] transition-colors">
                        <Settings className="w-4 h-4 text-neutral-500" />
                        Settings
                      </Link>
                      <Link href="/announcements" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 h-11 text-sm text-[#2D264B] hover:bg-[#FAF8FD] transition-colors">
                        <Megaphone className="w-4 h-4 text-neutral-500" />
                        <span>Announcements</span>
                        {hasUnreadAnnouncements && <span aria-label="New announcements" className="w-2 h-2 rounded-full bg-[#EC4899]" />}
                      </Link>
                      {isStaff(adminRoleOf(profile)) && (
                        // Staff only: never rendered for members.
                        <Link href="/admin" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 h-11 text-sm text-[#2D264B] hover:bg-[#FAF8FD] transition-colors">
                          <ShieldAlert className="w-4 h-4 text-neutral-500" />
                          Admin Console
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-[#ECE8F4] py-1">
                      <button type="button" role="menuitem" onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 h-11 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : !authLoading && !IN_APP_PREFIXES.some((p) => pathname === p || pathname?.startsWith(p + '/')) ? (
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-full bg-[#6555B8] hover:bg-[#5343A3] text-white text-xs font-semibold tracking-wide transition shadow-sm"
            >
              Sign In
            </Link>
          ) : (
            // Auth still resolving (or an in-app route): hold the Menu button's space, show nothing.
            <div className="w-9 h-9 rounded-full bg-transparent" aria-hidden />
          )}
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeInTitle {
          from {
            opacity: 0;
            transform: translateX(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    
      {/* Profile Options Bottom Sheet */}
      {profileMenuOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setProfileMenuOpen(false)}
        >
          <div
            className="w-full max-w-md p-4 pb-6 rounded-t-3xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />
            <div className="space-y-1">
              <button
                onClick={() => setProfileMenuOpen(false)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-[#1C1924]"
              >
                Report Profile
              </button>
              <button
                onClick={() => setProfileMenuOpen(false)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-[#1C1924]"
              >
                Block User
              </button>
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  if (typeof navigator !== "undefined" && navigator.share) {
                    navigator.share({
                      title: 'Profile on asiansin.love',
                      url: typeof window !== "undefined" ? window.location.href : "",
                    }).catch(() => {});
                  }
                }}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-[#1C1924]"
              >
                Share Profile
              </button>
            </div>
            <button
              onClick={() => setProfileMenuOpen(false)}
              className="mt-3 w-full py-3 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
</header>
  );
}