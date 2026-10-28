'use client';
import { BrandLogo } from '@/components/BrandLogo';
import NotificationsSection from '@/components/NotificationsSection';
import { notifyUser } from '@/components/InAppToast';
import { notificationService } from '@/lib/notificationService';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User, Settings, LogOut, ArrowLeft, Share2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { PlusBadge } from './PlusBadge';
export function Navbar() {
  const [user, setUser] = useState<any>(null);
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
      title: `asiansinlove`,
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
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);
  const handleSignOut = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setHasUnread(false);
    window.location.href = '/';
  };
  const displayName = profile?.username || 'Member';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
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
  if (isChatThread) return null;
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md backdrop-saturate-150 border-b border-[#DDD7E5]/40 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all border-[#ECE8F4]/80">
      <div className="w-full px-4 h-12 flex items-center justify-between relative">
        <div className="flex items-center gap-2 min-w-0">
          <div
            key={pageTitle || 'brand-home'}
            className="transition-all duration-200 ease-out flex items-center"
            style={{ animation: 'fadeInTitle 220ms ease-out forwards' }}
          >
            {!pageTitle ? (
              <BrandLogo href={user ? "/discover" : "/"} size="lg" />
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => { if (typeof window !== "undefined" && window.history.length > 1) router.back(); else router.push("/discover"); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#4C3B75] hover:bg-black/5 transition-colors -ml-1 sm:hidden"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
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
<div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-8 h-8 rounded-full overflow-hidden bg-purple-100 border border-black/10 flex items-center justify-center transition-transform active:scale-95"
                  title="Account Menu"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-[#6555B8]" />
                  )}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2.5 w-80 rounded-2xl bg-white border border-[#DDD7E5]/40 shadow-xl py-2 z-[200] animate-[notifDropdownIn_0.2s_cubic-bezier(0.16,1,0.3,1)_both]">
                    <div className="px-4 py-2 border-b border-[#DDD7E5]/40 bg-white/95 backdrop-blur-md backdrop-saturate-150 rounded-t-2xl">
                      <p className="text-[11px] uppercase font-medium tracking-wider text-gray-400">Signed In As</p>
                      <p className="text-sm font-semibold text-gray-900 truncate inline-flex items-center gap-1.5">{(profile?.username || displayName).replace(/^@/, '')}{profile?.is_plus && <PlusBadge size="sm" />}</p>
                    </div>
                  <NotificationsSection initial={prefetchedNotifs} onNavigate={() => setMenuOpen(false)} />
                    <div className="py-1">
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
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-full bg-[#6555B8] hover:bg-[#5343A3] text-white text-xs font-semibold tracking-wide transition shadow-sm"
            >
              Sign In
            </Link>
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
                      title: `${targetUserName || 'Profile'} on asiansin.love`,
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
