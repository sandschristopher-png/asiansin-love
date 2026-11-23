'use client';

import React from 'react';
import Link from 'next/link';
import { useMemberState } from '@/lib/useMemberState';

/**
 * The way in on /delete-account: signed in, straight to Settings (where Delete Account is); signed out, to sign in first and
 * then Settings. Both work in a browser, with no app installed. Rendered on the server as the signed-out version.
 */
export function DeleteAccountActions() {
  const { status } = useMemberState();
  const signedIn = status === 'in';
  return (
    <Link
      href={signedIn ? '/settings' : '/login?returnTo=%2Fsettings'}
      className="mt-1 inline-flex h-11 items-center justify-center rounded-full bg-[#726E97] px-5 !text-white !no-underline transition-colors hover:bg-[#524E75]"
    >
      {signedIn ? 'Open Settings to delete my account' : 'Sign in to delete my account'}
    </Link>
  );
}

export default DeleteAccountActions;
