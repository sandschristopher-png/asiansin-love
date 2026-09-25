'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFavorites } from '@/lib/favoritesContext';

export interface ProfileSummary {
  id: string;
  fullName: string;
  age: number;
  city: string;
  country: string;
  avatarUrl: string;
  isVerified: boolean;
  relationshipIntent: string;
  jobTitle?: string;
  isOnline?: boolean;
}

export function ProfileCard({ profile }: { profile: ProfileSummary }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(profile.id);

  return (
    <div className="group relative rounded-2xl bg-[#241E2F] border border-[#725A7A]/30 overflow-hidden flex flex-col justify-between profile-card-lift">
      
      {/* Photo Frame */}
      <div className="relative aspect-[4/5] w-full bg-[#17131F] overflow-hidden">
        <Image
          src={profile.avatarUrl}
          alt={profile.fullName}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Subtle Bottom Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#241E2F] via-transparent to-transparent opacity-90" />

        {/* Verification & Online Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10">
          {profile.isVerified && (
            <span className="px-2 py-0.5 rounded-md bg-[#653C87]/90 backdrop-blur-md border border-[#978FA8]/40 text-white text-[10px] font-black tracking-wide shadow-md">
              ✓ Verified
            </span>
          )}
          {profile.isOnline && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(profile.id);
          }}
          aria-label={favorited ? 'Remove from saved' : 'Save profile'}
          className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-[#17131F]/80 backdrop-blur-md border border-[#725A7A]/40 text-white hover:scale-110 active:scale-95 transition-all flex items-center justify-center z-10 shadow-md"
        >
          <span className={`text-xs ${favorited ? 'text-amber-400' : 'text-[#B8AAC3]'}`}>
            {favorited ? '★' : '☆'}
          </span>
        </button>

        {/* Location Overlay */}
        <div className="absolute bottom-2 left-2.5 right-2.5 z-10 flex items-center gap-1 text-[11px] font-bold text-[#DDD8D4] truncate">
          <span className="text-rose-400">📍</span>
          <span className="truncate">{profile.city}, {profile.country}</span>
        </div>
      </div>

      {/* Profile Details & Actions */}
      <div className="p-3 sm:p-3.5 flex flex-col gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
            {profile.fullName}, {profile.age}
          </h3>
          {profile.jobTitle && (
            <p className="text-[11px] text-[#DDD8D4] truncate">{profile.jobTitle}</p>
          )}
          <span className="inline-block mt-1 text-[10px] font-semibold text-[#B8AAC3] bg-[#17131F] px-2 py-0.5 rounded-md border border-[#725A7A]/20 truncate max-w-full">
            {profile.relationshipIntent}
          </span>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <Link
            href={`/chat/${profile.id}`}
            className="py-1.5 px-2 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] text-white text-xs font-bold text-center transition-all shadow-md active:scale-95"
          >
            Message
          </Link>
          <Link
            href={`/profile/${profile.id}`}
            className="py-1.5 px-2 rounded-xl bg-[#17131F] hover:bg-[#2E263B] border border-[#725A7A]/35 text-[#DDD8D4] hover:text-white text-xs font-bold text-center transition-all active:scale-95"
          >
            Bio
          </Link>
        </div>
      </div>

    </div>
  );
}
