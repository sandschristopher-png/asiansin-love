'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin/verifications', label: 'Verifications' },
  { href: '/admin/moderation', label: 'Messages' },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 p-1 rounded-2xl bg-[#F3EFFC] border border-[#ECE8F4]">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 text-center py-2 rounded-xl text-xs font-semibold transition ${
              active ? 'bg-white text-[#6555B8] shadow-sm' : 'text-[#6C637B] hover:text-[#1C1924]'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
