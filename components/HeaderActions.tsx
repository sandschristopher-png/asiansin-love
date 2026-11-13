'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Settings, LogOut, ShieldAlert, Megaphone, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { hardSignOut } from '@/lib/hardSignOut';
import { isPlusProfile } from '@/lib/plus';
import { ANNOUNCEMENTS_READ_EVENT, NON_ANNOUNCEMENT_FILTER } from '@/lib/announcements';
import { hasUnreadBroadcast } from '@/lib/broadcasts';
import { ADMIN_TYPE_LIKE, adminRoleOf, isStaff } from '@/lib/adminRoles';
import { AVATAR_IMAGE, supabaseImage } from '@/lib/images/supabaseImage';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { CountChip, useAdminPendingCount } from '@/components/admin/AdminPendingChip';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { cachedHeaderProfile, clearHeaderProfile, loadHeaderProfile } from '@/lib/headerProfileStore';


export type HeaderAction = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
};

/**
 * The signed-in header's right-edge cluster, defined once and used by every signed-in header
 * (components/Navbar.tsx, the Settings page header). Fixed order, right-aligned:
 *   [optional page action] -> NotificationBell -> circular account avatar (account menu).
 * The unread chip lives only on the bell. The cluster is the positioning context for both
 * dropdowns, so the bell panel and the account menu share the same right edge on every screen.
 */
export function HeaderActions({ action }: { action?: HeaderAction }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasUnreadAnnouncements, setHasUnreadAnnouncements] = useState(false);
  const adminPending = useAdminPendingCount(isStaff(adminRoleOf(profile)), menuOpen);
  const menuRef = useRef<HTMLDivElement>(null);

  // Last known avatar before first paint (no flicker on remounts or reloads); the session read is
  // local (getSession), the profile refresh is shared with Navbar (lib/headerProfileStore).
  useLayoutEffect(() => {
    const hit = cachedHeaderProfile();
    if (hit) setProfile(hit);
  }, []);
  useEffect(() => {
    let cancelled = false;
    const load = async (u: { id: string } | null) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        return;
      }
      const hit = cachedHeaderProfile(u.id);
      if (hit && !cancelled) setProfile(hit);
      const fresh = await loadHeaderProfile(u.id);
      if (fresh && !cancelled) setProfile(fresh);
    };
    supabase.auth.getSession().then(({ data: { session } }) => load(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') void load(session?.user ?? null);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Unread system announcements -> dot beside "Announcements" in the menu.
  useEffect(() => {
    if (!user) {
      setHasUnreadAnnouncements(false);
      return;
    }
    let cancelled = false;
    const check = async () => {
      // Unread = a personal notice not yet read, or an admin broadcast newer than the member's
      // read marker (lib/broadcasts.ts).
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

  // Account menu: close on outside tap and Escape.
  useEffect(() => {
    const onDown = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    clearHeaderProfile();
    await hardSignOut();
    window.location.href = '/';
  };

  const displayName = profile?.username || 'Member';
  const ActionIcon = action?.icon;
  const rowCls = 'flex items-center gap-3 px-4 h-11 text-sm text-[#413B5E] hover:bg-[#E8E6F1]/40 transition-colors';

  return (
    <div className="relative flex items-center gap-1">
      {action && ActionIcon && (
        <button
          type="button"
          onClick={action.onClick}
          aria-label={action.label}
          title={action.label}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#8574B7] hover:bg-[#E8E6F1]/70 transition-colors"
        >
          <ActionIcon className="w-5 h-5" />
        </button>
      )}
      <NotificationBell />
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Open account menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#E8E6F1]/70 text-[#8574B7] transition-opacity hover:opacity-90"
        >
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={supabaseImage(profile.avatar_url, AVATAR_IMAGE)} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <User className="w-5 h-5" aria-hidden />
          )}
        </button>
        {menuOpen && (
          // Account actions only; notifications live in the bell panel.
          <div role="menu" className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#D0CDE1] shadow-xl overflow-hidden z-[200] animate-[notifDropdownIn_0.2s_cubic-bezier(0.16,1,0.3,1)_both]">
            <div className="px-4 py-3 border-b border-[#D0CDE1] flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-semibold text-[#413B5E] truncate">{displayName.replace(/^@/, '')}</span>
              {isPlusProfile(profile) && <PlusBadge size="profile" />}
            </div>
            <div className="py-1">
              <Link href="/plus" role="menuitem" onClick={() => setMenuOpen(false)} className={`${rowCls} justify-between`}>
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
              <Link href="/profile" role="menuitem" onClick={() => setMenuOpen(false)} className={rowCls}>
                <User className="w-4 h-4 text-slate-600" />
                My Profile
              </Link>
              <Link href="/settings" role="menuitem" onClick={() => setMenuOpen(false)} className={rowCls}>
                <Settings className="w-4 h-4 text-slate-600" />
                Settings
              </Link>
              <Link href="/announcements" role="menuitem" onClick={() => setMenuOpen(false)} className={rowCls}>
                <Megaphone className="w-4 h-4 text-slate-600" />
                <span>Announcements</span>
                {hasUnreadAnnouncements && <span aria-label="New announcements" className="w-2 h-2 rounded-full bg-[#9A93BC]" />}
              </Link>
              {isStaff(adminRoleOf(profile)) && (
                // Staff only: never rendered for members.
                <Link href="/admin" role="menuitem" onClick={() => setMenuOpen(false)} className={rowCls}>
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
    </div>
  );
}

export default HeaderActions;
