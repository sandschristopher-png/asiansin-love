'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { LogOut } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { ADMIN_ROLE_LABEL, type AdminRole } from '@/lib/adminRoles';

const TABS = [
  { href: '/admin', label: 'Reports', match: (p: string) => p === '/admin' || p.startsWith('/admin/reports') },
  { href: '/admin/photos', label: 'Photos', match: (p: string) => p.startsWith('/admin/photos') },
  { href: '/admin/members', label: 'Members', match: (p: string) => p.startsWith('/admin/members') },
  { href: '/admin/verifications', label: 'ID Checks', match: (p: string) => p.startsWith('/admin/verifications') },
  { href: '/admin/moderation', label: 'Messages', match: (p: string) => p.startsWith('/admin/moderation') },
];

const ROLE_BADGE: Record<AdminRole, string> = {
  super_admin: 'bg-gradient-to-r from-[#8C71F5] to-[#EC4899] text-white',
  moderator: 'bg-[#2D264B] text-white',
  member: 'bg-[#F9F8FC] text-[#6C637B] border border-[#ECE8F4]',
};

/** Admin Console mobile header (wordmark, ADMIN pill, staff badge, Exit) + pill tab bar. */
export function AdminHeader({ name, role }: { name: string; role: AdminRole }) {
  const pathname = usePathname() || '/admin';
  const navRef = useRef<HTMLElement>(null);

  // Keep the active pill in view, and let a desktop mouse wheel scroll the row sideways.
  useEffect(() => {
    navRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [pathname]);
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || nav.scrollWidth <= nav.clientWidth) return;
      e.preventDefault();
      nav.scrollLeft += e.deltaY;
    };
    nav.addEventListener('wheel', onWheel, { passive: false });
    return () => nav.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div className="sticky top-0 z-30 w-full min-w-0">
      <header className="h-14 bg-white/95 backdrop-blur-md border-b border-[#ECE8F4] px-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <BrandLogo size="header" href="/admin" />
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#8C71F5]/10 text-[#8C71F5]">ADMIN</span>
        </div>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex items-center gap-1 min-w-0">
            <span className="text-xs font-semibold text-[#2D264B] truncate max-w-[72px]">{name}</span>
            <span className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_BADGE[role]}`}>{ADMIN_ROLE_LABEL[role]}</span>
          </span>
          <Link href="/discover" className="shrink-0 text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" aria-hidden />
            Exit
          </Link>
        </div>
      </header>
      <nav
        ref={navRef}
        className="w-full min-w-0 flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar scroll-smooth touch-pan-x overscroll-x-contain px-4 py-2 border-b border-[#ECE8F4] bg-[#FAF8FD] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden after:content-[''] after:shrink-0 after:w-2"
        aria-label="Admin sections"
      >
        {TABS.map(({ href, label, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active ? 'bg-[#2D264B] text-white' : 'bg-white text-neutral-600 border border-[#ECE8F4] hover:text-[#2D264B]'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default AdminHeader;
