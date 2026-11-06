'use client';

import React from 'react';
import Link from 'next/link';
import { AmbientAurora } from '@/components/ui/AmbientAurora';
import { AVATAR_LG_IMAGE, supabaseImage } from '@/lib/images/supabaseImage';

/**
 * "It's a Mutual Spark!" celebration: dimmed backdrop, modal pops in (0.92 -> 1), the two
 * avatars slide together into an overlapping pair (no particles or sparkles). The primary
 * action opens the chat, which only exists after a mutual Spark.
 */
export function MutualSparkModal({
  name,
  theirAvatar,
  myAvatar,
  chatHref,
  closing = false,
  onClose,
}: {
  name: string;
  theirAvatar?: string | null;
  myAvatar?: string | null;
  chatHref: string;
  closing?: boolean;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm ail-fade-in transition-opacity duration-200 ${
        closing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="It's a Mutual Spark"
        onClick={(e) => e.stopPropagation()}
        className={`relative isolate overflow-hidden w-full max-w-sm rounded-3xl bg-white border border-[#D0CDE1]/60 p-6 shadow-2xl flex flex-col items-center text-center ail-modal-pop transition-all duration-200 ${
          closing ? 'scale-90 opacity-0' : ''
        }`}
      >
        <AmbientAurora layer="card" />
        <div className="relative my-3 h-24 w-40 flex items-center justify-center">
          {/* Two 80px avatars overlapping by 12px */}
          <img
            src={supabaseImage(myAvatar, AVATAR_LG_IMAGE)}
            alt="You"
            className="ail-avatar-left relative z-10 w-20 h-20 rounded-full object-cover border-4 border-white shadow-md -mr-3"
          />
          <img
            src={supabaseImage(theirAvatar, AVATAR_LG_IMAGE)}
            alt={name}
            className="ail-avatar-right relative z-20 w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
          />
        </div>

        <h3 className="text-xl font-bold text-[#413B5E]">It&apos;s a Mutual Spark!</h3>
        <p className="text-xs text-[#413B5E]/75 mt-1.5">
          You and <span className="font-semibold text-[#413B5E]">{name}</span> sparked each other.
        </p>

        <div className="w-full flex flex-col gap-2 mt-5">
          <Link
            href={chatHref}
            className="w-full py-3 px-4 rounded-full bg-[#665D96] hover:bg-[#413B5E] text-white text-xs font-semibold shadow-md transition flex items-center justify-center"
          >
            Send First Message
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-full text-xs font-semibold text-[#413B5E]/75 hover:text-[#413B5E] hover:bg-[#E8E6F1]/70 transition cursor-pointer"
          >
            Keep Browsing
          </button>
        </div>
      </div>
    </div>
  );
}
