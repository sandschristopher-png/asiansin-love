'use client';

import React from 'react';
import { useMemberState } from '@/lib/useMemberState';

/**
 * The public city pages are rendered once for everyone (so search engines see them), then adjusted for the member
 * looking at them. Both wrappers render their children on the server and for signed-out visitors.
 */

/** Only for visitors who are not signed in: the public header and the Join free / Sign in buttons. */
export function PublicOnly({ children }: { children: React.ReactNode }) {
  const { status } = useMemberState();
  return status === 'in' ? null : <>{children}</>;
}

/** Hidden once the member has Plus (and while a signed-in member's plan is still loading): the Plus upsell. */
export function HideForPlus({ children }: { children: React.ReactNode }) {
  const { status, plus } = useMemberState();
  if (status === 'in' && plus !== false) return null;
  return <>{children}</>;
}
