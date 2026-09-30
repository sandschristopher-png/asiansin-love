'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  User, Settings, LogOut, Bell, Heart, MessageCircle, 
  ChevronDown 
} from 'lucide-react';
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

        channel = supabase
          .channel(`user-notifications-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              checkUnread(user.id);
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
    <header className="sticky top-0 z-50 w-full bg-[#F3F2F7]/90 backdrop-blur-md border-b border-[#DDD7E5] shadow-[0_1px_4px_rgba(28,25,36,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link 
          href={user ? "/discover" : "/"} 
          className="flex items-center active:scale-95 transition-transform py-1"
        >
          <img src="/ail-logo.png" alt="asiansin.love" className="h-10 sm:h-11 w-auto object-contain block shrink-0" />
        </Link>

        {/* Action cluster */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {user ? (
            <>


              {/* Notifications */}
              <Link
                href="/notifications"
                className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-white hover:bg-[#EAE6F2] border border-[#DDD7E5] flex items-center justify-center text-[#524B5E] hover:text-[#1C1924] transition-all shadow-sm active:scale-95"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {hasUnread && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#6555B8] ring-2 ring-white" />
                )}
              </Link>

              {/* Account Dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`h-10 sm:h-11 flex items-center gap-2 pl-1.5 pr-3 rounded-full bg-white border transition-all shadow-sm focus:outline-none ${
                    menuOpen 
                      ? 'border-[#6555B8] ring-2 ring-[#6555B8]/20 text-[#1C1924]' 
                      : 'border-[#DDD7E5] text-[#524B5E] hover:border-[#6555B8]/50 hover:text-[#1C1924]'
                  }`}
                  title="Account Menu"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-[#EDE7F6] border border-[#DDD7E5] flex items-center justify-center shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-[#6555B8]" />
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#6B627A] transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2.5 w-56 rounded-2xl bg-white border border-[#DDD7E5] shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-[#F0EDF5]">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[#6B627A]">Signed In As</p>
                      <p className="text-xs font-semibold text-[#1C1924] truncate mt-0.5">@{profile?.username || displayName}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-[#524B5E] hover:bg-[#F3F2F7] hover:text-[#1C1924] transition-colors"
                      >
                        <User className="w-4 h-4 text-[#6555B8]" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        href="/favorites"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-[#524B5E] hover:bg-[#F3F2F7] hover:text-[#1C1924] transition-colors"
                      >
                        <Heart className="w-4 h-4 text-[#6555B8]" />
                        <span>My Favorites</span>
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-[#524B5E] hover:bg-[#F3F2F7] hover:text-[#1C1924] transition-colors"
                      >
                        <Settings className="w-4 h-4 text-[#6555B8]" />
                        <span>Settings</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-[#F0EDF5]">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-600 hover:bg-rose-50 transition-colors font-medium"
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
              className="px-4 py-2 rounded-full bg-[#6555B8] hover:bg-[#5343A3] text-white text-xs font-semibold tracking-wide transition shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}