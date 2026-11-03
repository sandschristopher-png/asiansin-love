'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, BadgeCheck, Flag, Image as ImageIcon, MessageSquareWarning, Users } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { ADMIN_ROLE_LABEL, type AdminRole } from '@/lib/adminRoles';

const TABS = [
  { href: '/admin', label: 'Reports', Icon: Flag, match: (p: string) => p === '/admin' || p.startsWith('/admin/reports') },
  { href: '/admin/photos', label: 'Photo Review', Icon: ImageIcon, match: (p: string) => p.startsWith('/admin/photos') },
  { href: '/admin/members', label: 'Members & Roles', Icon: Users, match: (p: string) => p.startsWith('/admin/members') },
  { href: '/admin/verifications', label: 'ID Checks', Icon: BadgeCheck, match: (p: string) => p.startsWith('/admin/verifications') },
  { href: '/admin/moderation', label: 'Messages', Icon: MessageSquareWarning, match: (p: string) => p.startsWith('/admin/moderation') },
];

/** Admin Console top bar: wordmark + Admin badge, section tabs, signed-in staff badge. */
export function AdminHeader({ name, role }: { name: string; role: AdminRole }) {
  const pathname = usePathname() || '/admin';
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#ECE8F4]">
      <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <BrandLogo size="header" href="/admin" />
          <span className="px-2 py-0.5 rounded-full bg-[#F3EFFC] border border-[#E2DBF0] text-[10px] font-bold uppercase tracking-wider text-[#6555B8]">
            Admin
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#6C637B] truncate">
          Signed in as <strong className="text-[#2D264B]">{name}</strong>
          <span className="px-2 py-0.5 rounded-full bg-[#2D264B] text-white text-[10px] font-semibold">{ADMIN_ROLE_LABEL[role]}</span>
        </span>
      </div>
      <nav className="px-2 sm:px-4 flex items-center gap-1 overflow-x-auto no-scrollbar" aria-label="Admin sections">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                active ? 'border-[#6555B8] text-[#6555B8]' : 'border-transparent text-[#6C637B] hover:text-[#2D264B]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden />
              {label}
            </Link>
          );
        })}
        <Link
          href="/discover"
          className="shrink-0 ml-auto inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[#6C637B] hover:text-[#2D264B]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
          Back to App
        </Link>
      </nav>
      <p className="sm:hidden px-4 pb-2 text-[11px] text-[#6C637B]">
        Signed in as <strong className="text-[#2D264B]">{name}</strong> ({ADMIN_ROLE_LABEL[role]})
      </p>
    </header>
  );
}

export default AdminHeader;
