'use client';
import { BrandLogo } from '@/components/BrandLogo';
import NotificationsSection from '@/components/NotificationsSection';
import { notifyUser } from '@/components/InAppToast';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User, Settings, LogOut, ArrowLeft, Share2, Check, Zap, Menu } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { hardSignOut } from '@/lib/hardSignOut';
import { AilBadge } from './AilBadge';
/** Signed-in areas: the header never offers "Sign In" here (middleware already requires a session). */
const IN_APP_PREFIXES = ['/discover', '/messages', '/favorites', '/profile', '/notifications', '/chat', '/settings', '/plus', '/verify'];

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  // True until the first auth check resolves: render a placeholder, never a flash of "Sign In".
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [prefetchedNotifs, setPrefetchedNotifs] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isChatThread = pathname?.startsWith('/chat');
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  const handleInviteShare = async () => {
    const shareData = {
      title: 'asiansin.love',
      text: 'Find meaningful connections on Asians in Love:',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://asiansin.love',
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        setMenuOpen(false);
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareData.url);
      setInviteCopied(true);
      setTimeout(() => {
        setInviteCopied(false);
        setMenuOpen(false);
      }, 1500);
    } catch {}
  };
  async function checkUnread(userId: string) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    setHasUnread((count ?? 0) > 0);
  }
  useEffect(() => {
    let channel: any;
    async function loadUser() {
      // Prefetch notifications immediately (parallel with auth) so the dropdown renders instantly on open
      fetch('/api/notifications').then(r => r.ok ? r.json() : null).then(d => { if (d) setPrefetchedNotifs({ notifications: d.notifications, unread_count: d.unread_count }); }).catch(() => {});
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
      if (user) {
        checkUnread(user.id);
        const { data } = await supabase
          .from('profiles')
          .select('username, display_name, avatar_url, is_plus')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
        const channelTopic = `user-notifications-${user.id}`;
        const existingChannel = supabase.getChannels().find((c: any) => c.topic === `realtime:${channelTopic}`);
        if (existingChannel) {
          await supabase.removeChannel(existingChannel);
        }
        channel = supabase.channel(channelTopic)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload: any) => {
              checkUnread(user.id);

              if ((payload.eventType === 'INSERT' || payload.event === 'INSERT') && payload.new) {
          // Toasts/chimes are handled by GlobalNotificationListener (single source)
          // Here we only keep the dropdown list and unread state fresh:
          checkUnread(user.id);
          fetch('/api/notifications').then(r => r.ok ? r.json() : null).then(d => { if (d) setPrefetchedNotifs({ notifications: d.notifications, unread_count: d.unread_count }); }).catch(() => {});
        }
        }
          )
          .subscribe();
      }
    }
    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        checkUnread(currentUser.id);
        const { data } = await supabase
          .from('profiles')
          .select('username, display_name, avatar_url, is_plus')
          .eq('id', currentUser.id)
          .single();
        if (data) setProfile(data);
      } else {
        setProfile(null);
        setHasUnread(false);
      }
    });
    return () => {
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
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
    setHasUnread(false);
    window.location.href = '/';
  };
  const displayName = profile?.username || 'Member';
  const getPageTitle = () => {
    if (!pathname || pathname === '/' || pathname === '/discover') return null;
    if (pathname.startsWith('/favorites') || pathname.startsWith('/saved')) return 'Sparks';
    if (pathname.startsWith('/chat') || pathname.startsWith('/messages')) return 'Messages';
    if (pathname === '/notifications') return 'Notifications';
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
        <div className="flex items-center gap-2 min-w-0">
          <div
            key={pageTitle || 'brand-home'}
            className="transition-all duration-200 ease-out flex items-center"
            style={{ animation: 'fadeInTitle 220ms ease-out forwards' }}
          >
            {!pageTitle ? (
              <BrandLogo href={user ? "/discover" : "/"} size="header" />
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
        <div className="flex items-center gap-2">
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
                  aria-label={hasUnread ? 'Open menu (unread notifications)' : 'Open menu'}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F3EFFC] text-[#2D264B] transition-colors relative"
                >
                  <Menu className="w-5 h-5" />
                  {hasUnread && (
                    <span aria-hidden className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EC4899] ring-2 ring-white" />
                  )}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2.5 w-80 rounded-2xl bg-white border border-[#DDD7E5]/40 shadow-xl py-2 z-[200] animate-[notifDropdownIn_0.2s_cubic-bezier(0.16,1,0.3,1)_both]">
                    <div className="px-4 py-2 border-b border-[#DDD7E5]/40 bg-white/95 backdrop-blur-md backdrop-saturate-150 rounded-t-2xl">
                      <p className="text-[11px] uppercase font-medium tracking-wider text-gray-400">Signed In As</p>
                      <p className="text-sm font-semibold text-gray-900 truncate inline-flex items-center gap-1.5">{(profile?.username || displayName).replace(/^@/, '')}{profile?.is_plus && <AilBadge />}</p>
                    </div>
                  <NotificationsSection initial={prefetchedNotifs} onNavigate={() => setMenuOpen(false)} />
                    <div className="py-1">
                      <Link
                        href="/plus"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Zap className="w-4 h-4 text-[#6555B8]" />
                          <span className="font-medium text-[#1C1924]">AIL Plus</span>
                        </div>
                        {profile?.is_plus ? (
                          <span className="text-[10px] font-bold text-[#6555B8] bg-[#F3EFFC] border border-[#DDD7E5]/70 px-2 py-0.5 rounded-full">Active</span>
                        ) : (
                          <span className="text-[10px] font-semibold text-[#6555B8] bg-[#F3EFFC] px-2 py-0.5 rounded-full">Upgrade</span>
                        )}
                      </Link>
                    <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-[#6555B8]" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-[#6555B8]" />
                        <span>Settings</span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleInviteShare}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                      >
                        {inviteCopied ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Share2 className="w-4 h-4 text-[#6555B8]" />
                        )}
                        <span className={inviteCopied ? "text-emerald-600 font-medium" : ""}>
                          {inviteCopied ? "Link Copied!" : "Invite Friends"}
                        </span>
                      </button>
                    </div>
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
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