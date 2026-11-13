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
import { User, Settings, LogOut, ArrowLeft, ShieldAlert, Megaphone, CreditCard } from 'lucide-react';
import { ADMIN_TYPE_LIKE, adminRoleOf, isStaff } from '@/lib/adminRoles';
import { supabase } from '@/lib/supabase/client';
import { hardSignOut } from '@/lib/hardSignOut';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { CountChip, useAdminPendingCount } from '@/components/admin/AdminPendingChip';
import { NOTIFICATIONS_CHANGED_EVENT } from '@/lib/notificationStore';
import { AVATAR_IMAGE, supabaseImage } from '@/lib/images/supabaseImage';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { useShare } from '@/components/share/useShare';

/** Own-profile fields the header reads: username, Plus status (isPlusProfile) and staff role. */
const NAV_PROFILE_COLUMNS =
  'id, username, avatar_url, is_plus, is_premium, subscription_status, current_period_end, plus_expires_at, admin_role, role, is_admin';

type NotifRow = {
  id: string;
  type: string;
  title: string | null;
  description: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
  actor: { id: string; username: string | null; avatar_url: string | null } | null;
};

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

/** Where a dropdown row opens: chats to the thread, visits / sparks to the actor's profile. */
function notifHref(n: NotifRow): string {
  if (n.type === 'message' && n.actor) return `/chat/${n.actor.id}`;
  if ((n.type === 'visit' || n.type === 'favorite' || n.type === 'spark') && n.actor) return `/profile/${n.actor.id}`;
  return n.link_url || '/announcements';
}
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
  const { t } = useLocale();
  // Account-dropdown notifications: unread chip on the avatar + the list at the top of the menu.
  const [notifs, setNotifs] = useState<NotifRow[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const adminPending = useAdminPendingCount(isStaff(adminRoleOf(profile)), menuOpen);
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
          .not('type', 'in', NON_ANNOUNCEMENT_FILTER)
          .not('type', 'like', ADMIN_TYPE_LIKE),
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
  // Unread chip: re-read on sign-in, route changes and whenever RealtimeNotifier sees a new row.
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifs(null);
      return;
    }
    let cancelled = false;
    const load = () =>
      fetch('/api/notifications?scope=all', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (cancelled || !j) return;
          setUnreadCount(Number(j.unread_count) || 0);
        })
        .catch(() => {});
    load();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
    };
  }, [user, pathname]);
  // Opening the menu loads the list, then marks the unread rows it shows as read (the rows keep
  // their tint until the menu closes). Types the member switched off are never listed or marked.
  useEffect(() => {
    if (!menuOpen || !user) return;
    let cancelled = false;
    fetch('/api/notifications?scope=all', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j) return;
        const rows = (j.notifications ?? []) as NotifRow[];
        setNotifs(rows);
        const unreadIds = rows.filter((n) => !n.is_read).map((n) => n.id);
        if (unreadIds.length === 0) return;
        setUnreadCount(0);
        void fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: unreadIds }),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [menuOpen, user]);
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
                href="/plus"
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
                  aria-label={unreadCount > 0 ? `Open account menu, ${unreadCount} unread notifications` : 'Open account menu'}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#E8E6F1]/70 text-[#8574B7] transition-opacity hover:opacity-90 relative"
                >
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={supabaseImage(profile.avatar_url, AVATAR_IMAGE)} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" aria-hidden />
                  )}
                  <CountChip count={unreadCount} label={`${unreadCount} unread`} className="absolute -top-1 -right-1" />
                </button>
                {menuOpen && (
                  // Account utilities + announcements; dating activity lives on the BottomNav tabs.
                  <div role="menu" className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-white border border-[#D0CDE1] shadow-xl overflow-hidden z-[200] animate-[notifDropdownIn_0.2s_cubic-bezier(0.16,1,0.3,1)_both]">
                    <div className="px-4 py-3 border-b border-[#D0CDE1] flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-semibold text-[#413B5E] truncate">{displayName.replace(/^@/, '')}</span>
                      {isPlusProfile(profile) && <PlusBadge size="profile" />}
                    </div>
                    {/* Notifications: newest first, scrolls inside the menu (max ~240px) */}
                    <div className="border-b border-[#D0CDE1]">
                      <p className="px-4 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#8574B7]">{t('nav.notifications')}</p>
                      <div className="max-h-[240px] overflow-y-auto overscroll-contain pb-1">
                        {notifs === null ? (
                          <div aria-hidden className="px-4 py-2 space-y-2">
                            <div className="h-8 rounded-xl bg-[#E8E6F1]/60 animate-pulse" />
                            <div className="h-8 rounded-xl bg-[#E8E6F1]/60 animate-pulse" />
                          </div>
                        ) : notifs.length === 0 ? (
                          <p className="px-4 py-3 text-xs text-[#413B5E]/70">{t('nav.noNotifications')}</p>
                        ) : (
                          notifs.map((n) => (
                            <Link
                              key={n.id}
                              href={notifHref(n)}
                              role="menuitem"
                              onClick={() => setMenuOpen(false)}
                              className={`flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-[#E8E6F1]/40 ${n.is_read ? '' : 'bg-[#8574B7]/10'}`}
                            >
                              {n.actor?.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={supabaseImage(n.actor.avatar_url, AVATAR_IMAGE)} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover shrink-0 bg-[#E8E6F1]/60" />
                              ) : (
                                <span className="w-8 h-8 rounded-full shrink-0 bg-[#E8E6F1]/70 text-[#8574B7] flex items-center justify-center">
                                  <Megaphone className="w-4 h-4" aria-hidden />
                                </span>
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-medium text-[#413B5E] truncate">{n.description || n.title || 'Notification'}</span>
                                <span className="block text-[10px] text-[#413B5E]/60">{timeAgo(n.created_at)}</span>
                              </span>
                              {!n.is_read && <span aria-label="Unread" className="w-2 h-2 rounded-full bg-[#8574B7] shrink-0" />}
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="py-1">
                      <Link href="/plus" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 h-11 text-sm text-[#413B5E] hover:bg-[#E8E6F1]/40 transition-colors justify-between">
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
                          <span className="flex-1">Admin Console</span>
                          <CountChip count={adminPending} />
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