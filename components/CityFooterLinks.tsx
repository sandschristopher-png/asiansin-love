import React from 'react';
import Link from 'next/link';

/** The understated legal line at the foot of the public city pages (/cities, /cities/[slug], /manila and the other hubs). */
export function CityFooterLinks({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[11px] text-slate-600 ${className}`}>
      Members must be 18 or older. <Link href="/terms" className="underline underline-offset-4">Terms</Link> ·{' '}
      <Link href="/privacy" className="underline underline-offset-4">Privacy</Link> ·{' '}
      <Link href="/terms#refunds" className="underline underline-offset-4">Refund Policy</Link> ·{' '}
      <Link href="/terms#cancellation" className="underline underline-offset-4">Cancellation</Link> ·{' '}
      <Link href="/safety" className="underline underline-offset-4">Safety</Link>
    </p>
  );
}
