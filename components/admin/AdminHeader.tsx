'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { LogOut } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

const TABS = [
  { href: '/admin', label: 'Reports', match: (p: string) => p === '/admin' || p.startsWith('/admin/reports') },
  { href: '/admin/photos', label: 'Photos', match: (p: string) => p.startsWith('/admin/photos') },
  { href: '/admin/members', label: 'Members', match: (p: string) => p.startsWith('/admin/members') },
  { href: '/admin/verifications', label: 'IDs', match: (p: string) => p.startsWith('/admin/verifications') },
  { href: '/admin/moderation', label: 'Chat', match: (p: string) => p.startsWith('/admin/moderation') },
  { href: '/admin/announcements', label: 'News', match: (p: string) => p.startsWith('/admin/announcements') },
];

/** Admin Console mobile header (wordmark, ADMIN pill, staff name, Exit) + pill tab bar. */
export function AdminHeader({ name }: { name: string }) {
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
      <header className="h-14 bg-white/95 backdrop-blur-md border-b border-[#D0CDE1] px-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <BrandLogo size="header" href="/admin" />
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#8574B7]/10 text-[#8574B7]">ADMIN</span>
        </div>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-semibold text-[#413B5E] truncate max-w-[120px]">{name}</span>
          <Link href="/discover" className="shrink-0 text-xs text-[#413B5E]/55 hover:text-[#413B5E]/85 transition-colors flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" aria-hidden />
            Exit
          </Link>
        </div>
      </header>
      <nav
        ref={navRef}
        className="w-full min-w-0 flex items-center justify-between gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar scroll-smooth touch-pan-x overscroll-x-contain px-4 py-2 border-b border-[#D0CDE1] bg-white [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Admin sections"
      >
        {TABS.map(({ href, label, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold border transition-colors ${
                active ? 'bg-[#413B5E] text-white border-[#413B5E] shadow-2xs' : 'bg-white text-[#413B5E]/80 border-[#D0CDE1] hover:bg-[#E8E6F1]/40'
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
