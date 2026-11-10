'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

/** Educational reminder under a first message that mentions an outside app or number. */
export function FirstMessageShield({ senderName }: { senderName: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-left shadow-2xs my-2 max-w-sm mx-auto">
      <div className="flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <p className="text-xs font-bold text-amber-900">Safety Reminder: Off-Platform Contact</p>
          <p className="mt-0.5 text-[11px] leading-snug text-amber-800">
            {senderName} mentioned an external app or number. Commercial accounts and scammers often rush to move
            conversations off-platform. For your safety, we recommend getting to know each other on asiansin.love first.
          </p>
          <Link href="/safety" className="mt-1 inline-block text-[11px] font-semibold text-[#8574B7] hover:underline">
            Read Safety Blueprint &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FirstMessageShield;
