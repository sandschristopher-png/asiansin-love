'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';

const EXCLUDED_ROUTES = ['/login', '/onboarding'];

export function AppHeader() {
  const pathname = usePathname();

  // Hide the global navigation bar on dedicated authentication & onboarding screens
  if (EXCLUDED_ROUTES.some((route) => pathname.startsWith(route))) {
    return null;
  }

  return <Navbar />;
}
