'use client';

import React from 'react';

interface MenuTriggerProps {
  onClick: () => void;
  isOpen?: boolean;
  avatarUrl?: string | null;
}

export function MenuTrigger({ onClick, isOpen = false, avatarUrl }: MenuTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open navigation menu"
      className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 border overflow-hidden ${
        isOpen
          ? 'bg-[#6555B8] border-[#6555B8] text-white shadow-sm'
          : 'bg-[#F3EFFC] border-[#6555B8]/20 text-[#6555B8] hover:border-[#6555B8]/50'
      }`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <svg
          className="w-4.5 h-4.5 fill-current translate-y-0.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      )}
    </button>
  );
}