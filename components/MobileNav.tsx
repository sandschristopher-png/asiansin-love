'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Heart, MessageCircle, User } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();

  if (pathname && pathname.startsWith('/chat/')) {
    return null;
  }

  const navItems = [
    { label: 'Discover', href: '/discover', icon: Compass },
    { label: 'Likes', href: '/likes', icon: Heart },
    { label: 'Messages', href: '/chat', icon: MessageCircle },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-rose-100 bg-white/95 px-2 backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/' && Boolean(pathname && pathname.startsWith(item.href)));
        const activeCls = 'text-rose-600 font-semibold dark:text-rose-400';
        const inactiveCls = 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100';
        return (
          <Link
            key={item.href}
            href={item.href}
            className={'flex flex-1 flex-col items-center justify-center py-1 transition-colors ' + (isActive ? activeCls : inactiveCls)}
          >
            <Icon className={'h-5 w-5 ' + (isActive ? 'stroke-[2.5px]' : 'stroke-2')} />
            <span className="mt-1 text-[11px] leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}