'use client';

import { BrandLogo } from '@/components/BrandLogo';
import { notifyUser } from '@/components/InAppToast';
import { notificationService } from '@/lib/notificationService';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function checkUnread(userId: string) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    setHasUnread((count ?? 0) > 0);
  }

  useEffect(() => {
    let channel: any;

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        checkUnread(user.id);
        const { data } = await supabase
          .from('profiles')
          .select('username, display_name, avatar_url')
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

              if (payload.eventType === 'INSERT' && payload.new) {
                const n = payload.new;
                notifyUser({
                  senderName: n.title || 'Asians in Love',
                  avatarUrl: '',
                  message: n.description || 'You have a new update.',
                  chatUrl: n.link_url || '/notifications',
                });
                notificationService.playChime();
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
          .select('username, display_name, avatar_url')
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
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setHasUnread(false);
    router.push('/login');
    router.refresh();
  };

  const displayName = profile?.username || profile?.display_name || user?.user_metadata?.user_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-black/[0.05] transition-all">
      <div className="w-full px-4 h-16 flex items-center justify-between">
        
        {/* Brand Logo with generous breathing room */}
        <BrandLogo href={user ? "/discover" : "/"} size="md" />

        {/* Minimal Right-side actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Notifications */}
              <Link
                href="/notifications"
                className="relative h-9 w-9 rounded-full bg-transparent hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5 stroke-[1.8]" />
                {hasUnread && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#6555B8] ring-2 ring-white" />
                )}
              </Link>

              {/* Minimal Avatar Menu */}
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
                  <div className="absolute right-0 mt-2.5 w-56 rounded-2xl bg-white border border-black/10 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-[11px] uppercase font-medium tracking-wider text-gray-400">Signed In As</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">@{profile?.username || displayName}</p>
                    </div>

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
    </header>
  );
}

