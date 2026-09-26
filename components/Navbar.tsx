'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, Settings, LogOut, Bell, Heart, 
  EyeOff, ChevronDown 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function Navbar() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ name?: string; display_name?: string; avatar_url?: string; photos?: string[] } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('name, display_name, avatar_url, photos')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      }
    }
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase
          .from('profiles')
          .select('name, display_name, avatar_url, photos')
          .eq('id', currentUser.id)
          .single();
        if (data) setProfile(data);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Close dropdown on outside click
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
    router.push('/login');
    router.refresh();
  };

  const displayName = profile?.name || profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';
  const avatarUrl = profile?.avatar_url || (Array.isArray(profile?.photos) && profile.photos.length > 0 ? profile.photos[0] : null) || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#7D7E92]/20 bg-[#17131F]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 relative flex items-center justify-between">
        
        {/* Left: Squircle Bell Icon */}
        <div className="flex items-center">
          <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 sm:pl-1.5 sm:pr-2.5 rounded-full bg-[#261F33] hover:bg-[#322842] border border-[#9A79BA]/30 transition-all shadow-sm focus:outline-none active:scale-95"
                  title="Account Menu"
                  aria-expanded={menuOpen}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#653C87]/40 border border-[#9A79BA]/40 flex items-center justify-center shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#3D2554] text-[#C9A4E8] font-bold text-xs uppercase">
                        {displayName ? displayName.charAt(0) : <User className="w-4 h-4 text-[#C9A4E8]" />}
                      </div>
                    )}
                  </div>
                  <span className="hidden sm:inline-block text-xs font-semibold max-w-[110px] truncate text-white">
                    {displayName}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#9A79BA] transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2.5 w-56 rounded-2xl bg-[#1D1726] border border-[#7D7E92]/30 shadow-2xl py-2 z-50 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-[#241E2F]">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-[#7D7E92]">Signed In As</p>
                    <p className="text-xs font-semibold text-[#E6D7FA] truncate mt-0.5">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[#E6D7FA] hover:bg-[#241E2F] hover:text-white transition-colors"
                    >
                      <User className="w-4 h-4 text-[#9A79BA]" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      href="/favorites"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[#E6D7FA] hover:bg-[#241E2F] hover:text-white transition-colors"
                    >
                      <Heart className="w-4 h-4 text-[#9A79BA]" />
                      <span>Favorites</span>
                    </Link>

                    <Link
                      href="/discover?filter=passed"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[#E6D7FA] hover:bg-[#241E2F] hover:text-white transition-colors"
                    >
                      <EyeOff className="w-4 h-4 text-[#9A79BA]" />
                      <span>Passed Profiles</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[#E6D7FA] hover:bg-[#241E2F] hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#9A79BA]" />
                      <span>Account Settings</span>
                    </Link>
                  </div>

                  <div className="border-t border-[#241E2F] my-1" />

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#653C87] text-white hover:bg-[#7b49a5] transition shadow-md"
            >
              Sign In
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
