'use client';

import React from 'react';
import Link from 'next/link';

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
        className={`w-full max-w-sm rounded-3xl bg-white border border-[#DDD7E5]/70 p-6 shadow-2xl flex flex-col items-center text-center ail-modal-pop transition-all duration-200 ${
          closing ? 'scale-90 opacity-0' : ''
        }`}
      >
        <div className="relative my-3 h-24 w-40 flex items-center justify-center">
          {/* Two 80px avatars overlapping by 12px */}
          <img
            src={myAvatar || '/placeholder-avatar.svg'}
            alt="You"
            className="ail-avatar-left relative z-10 w-20 h-20 rounded-full object-cover border-4 border-white shadow-md -mr-3"
          />
          <img
            src={theirAvatar || '/placeholder-avatar.svg'}
            alt={name}
            className="ail-avatar-right relative z-20 w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
          />
        </div>

        <h3 className="text-xl font-bold text-[#1C1924]">It&apos;s a Mutual Spark!</h3>
        <p className="text-xs text-[#6C637B] mt-1.5">
          You and <span className="font-semibold text-[#1C1924]">{name}</span> sparked each other.
        </p>

        <div className="w-full flex flex-col gap-2 mt-5">
          <Link
            href={chatHref}
            className="w-full py-3 px-4 rounded-full bg-[#6555B8] hover:bg-[#52449e] text-white text-xs font-semibold shadow-md transition flex items-center justify-center"
          >
            Send First Message
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-full text-xs font-semibold text-[#6C637B] hover:text-[#1C1924] hover:bg-[#F3EFFC] transition cursor-pointer"
          >
            Keep Browsing
          </button>
        </div>
      </div>
    </div>
  );
}
