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
import { useShare } from '@/components/share/useShare';

/** Own-profile fields the header reads: username, Plus status (isPlusProfile) and staff role. */
const NAV_PROFILE_COLUMNS =
  'id, username, is_plus, is_premium, subscription_status, current_period_end, plus_expires_at, admin_role, role, is_admin';
/** Signed-in areas: the header never offers "Sign In" here (middleware already requires a session). */
const IN_APP_PREFIXES = ['/discover', '/messages', '/favorites', '/profile', '/notifications', '/announcements', '/chat', '/settings', '/plus', '/upgrade', '/verify'];

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  // True until the first auth check resolves: render a placeholder, never a flash of "Sign In".
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { share, shareSheet } = useShare();
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
        supabase.from('profiles').select('last_read_announcements_at').eq('id', user.id).maybeSingle(),
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
          .select(NAV_PROFILE_COLUMNS)
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
          .select(NAV_PROFILE_COLUMNS)
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
    // Frosted glass. On Discover it overlays the scrolling feed (LayoutShell) with the frosted filter bar
    // directly below; that bar carries the divider so both read as one surface.
    <header className="sticky top-0 z-50 w-full bg-white/75 backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
      <div className="max-w-[480px] mx-auto px-4 h-14 flex items-center justify-between relative">
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
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#413B5E] hover:bg-black/5 transition-colors -ml-1 sm:hidden"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                )}
                <h1
                  className="text-[19px] sm:text-[21px] font-semibold text-[#413B5E] tracking-[-0.025em] leading-snug pb-0.5 select-none truncate"
                  style={{ fontFamily: 'var(--font-brand)' }}
                >
                  {pageTitle}
                </h1>
                {pathname?.startsWith('/profile/') && (
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen(true)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#413B5E] hover:bg-black/5 transition-colors sm:hidden"
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
            {/* Upgrade: signed-in members without Plus only (is_plus is the webhook-written flag);
                hidden until the profile has loaded so Plus members never see it flash. */}
            {profile && profile.is_plus !== true && pathname !== '/upgrade' && pathname !== '/plus' && (
              <Link
                href="/upgrade"
                className="mr-1 inline-flex h-7 items-center rounded-full border border-[#8574B7] px-3 text-xs font-semibold text-[#8574B7] hover:bg-[#8574B7]/10 transition-colors"
              >
                Upgrade
              </Link>
            )}
            {pathname === '/profile' && (
              <Link
                href="/settings"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#8574B7] hover:bg-[#E8E6F1]/70 transition-colors"
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
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E8E6F1]/70 text-[#413B5E] transition-colors relative"
                >
                  <Menu className="w-5 h-5" />
                </button>
                {menuOpen && (
                  // Account utilities + announcements; dating activity lives on the BottomNav tabs.
                  <div role="menu" className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#D0CDE1] shadow-xl overflow-hidden z-[200] animate-[notifDropdownIn_0.2s_cubic-bezier(0.16,1,0.3,1)_both]">
                    <div className="px-4 py-3 border-b border-[#D0CDE1] flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-semibold text-[#413B5E] truncate">{displayName.replace(/^@/, '')}</span>
                      {isPlusProfile(profile) && <PlusBadge size="profile" />}
                    </div>
                    <div className="py-1">
                      <Link href={profile && profile.is_plus !== true ? '/upgrade' : '/plus'} role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 h-11 text-sm text-[#413B5E] hover:bg-[#E8E6F1]/40 transition-colors justify-between">
                        {/* The header row above already shows the Plus badge: this row says "Membership". */}
                        <span className="flex items-center gap-3">
                          <CreditCard className="w-4 h-4 text-slate-600" aria-hidden />
                          {/* Profile not loaded yet: neutral placeholder, never "Upgrade" to a Plus member. */}
                          {!profile ? (
                            <span aria-hidden className="h-3 w-24 rounded-full bg-[#E8E6F1]/70 animate-pulse" />
                          ) : isPlusProfile(profile) ? 'Membership' : 'Upgrade to Plus'}
                        </span>
                        {!profile ? null : isPlusProfile(profile) ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#8574B7]/10 border border-[#8574B7]/20 text-[#8574B7]">Active</span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#D0CDE1] text-slate-600">Upgrade</span>
                        )}
                      </Link>
                      <Link href="/profile" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 h-11 text-sm text-[#413B5E] hover:bg-[#E8E6F1]/40 transition-colors">
                        <User className="w-4 h-4 text-slate-600" />
                        My Profile
                      </Link>
                      <Link href="/settings" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 h-11 text-sm text-[#413B5E] hover:bg-[#E8E6F1]/40 transition-colors">
                        <Settings className="w-4 h-4 text-slate-600" />
                        Settings
                      </Link>
                      <Link href="/announcements" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 h-11 text-sm text-[#413B5E] hover:bg-[#E8E6F1]/40 transition-colors">
                        <Megaphone className="w-4 h-4 text-slate-600" />
                        <span>Announcements</span>
                        {hasUnreadAnnouncements && <span aria-label="New announcements" className="w-2 h-2 rounded-full bg-[#9A93BC]" />}
                      </Link>
                      {isStaff(adminRoleOf(profile)) && (
                        // Staff only: never rendered for members.
                        <Link href="/admin" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 h-11 text-sm text-[#413B5E] hover:bg-[#E8E6F1]/40 transition-colors">
                          <ShieldAlert className="w-4 h-4 text-slate-600" />
                          Admin Console
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-[#D0CDE1] py-1">
                      <button type="button" role="menuitem" onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 h-11 text-sm text-red-600 hover:bg-red-50 transition-colors text-left">
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
              className="px-4 py-1.5 rounded-full bg-[#8574B7] hover:bg-[#534377] text-white text-xs font-medium tracking-wide transition shadow-sm"
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
      {shareSheet}
      {profileMenuOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setProfileMenuOpen(false)}
        >
          <div
            className="w-full max-w-md p-4 pb-6 rounded-t-3xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E8E6F1]" />
            <div className="space-y-1">
              <button
                onClick={() => setProfileMenuOpen(false)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#E8E6F1]/40 transition-colors text-[#413B5E]"
              >
                Report Profile
              </button>
              <button
                onClick={() => setProfileMenuOpen(false)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#E8E6F1]/40 transition-colors text-[#413B5E]"
              >
                Block User
              </button>
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  // Native share sheet on phones, share drawer on desktop (previously did nothing there).
                  void share({ title: 'Profile on Meet in Asia', text: 'Have a look at this profile on Meet in Asia.' });
                }}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#E8E6F1]/40 transition-colors text-[#413B5E]"
              >
                Share Profile
              </button>
            </div>
            <button
              onClick={() => setProfileMenuOpen(false)}
              className="mt-3 w-full py-3 rounded-xl bg-[#E8E6F1]/60 text-[#413B5E]/80 font-medium hover:bg-[#E8E6F1] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
</header>
  );
}