'use client';

import React, { useState } from 'react';
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
  const [imgError, setImgError] = useState(false);

  // High-reliability plum fallback avatar if user image fails to load
  const fallbackAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    profile.fullName
  )}&backgroundColor=241E2F&textColor=F3EBF9`;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({
      id: profile.id,
      fullName: profile.fullName,
      age: profile.age,
      city: profile.city,
      country: profile.country,
      avatarUrl: profile.avatarUrl,
      isVerified: profile.isVerified,
      relationshipIntent: profile.relationshipIntent,
    } as any);
  };

  return (
    <div className="group relative rounded-2xl bg-[#241E2F] border border-[#725A7A]/30 overflow-hidden flex flex-col justify-between profile-card-lift shadow-lg">
      
      {/* Photo Frame */}
      <div className="relative aspect-[3/4] w-full bg-[#17131F] overflow-hidden">
        <Image
          src={imgError || !profile.avatarUrl ? fallbackAvatar : profile.avatarUrl}
          alt={profile.fullName}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          onError={() => setImgError(true)}
          unoptimized
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#241E2F] via-transparent to-transparent opacity-90" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1 z-10">
          {profile.isVerified && (
            <span className="px-1.5 py-0.5 rounded-md bg-[#653C87]/90 backdrop-blur-md border border-[#978FA8]/40 text-white text-[9px] font-black tracking-wide">
              ✓ Verified
            </span>
          )}
          {profile.isOnline && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[9px] font-bold">
              <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleToggle}
          aria-label={favorited ? 'Remove favorite' : 'Save profile'}
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-[#17131F]/80 backdrop-blur-md border border-[#725A7A]/40 text-white hover:scale-110 active:scale-95 transition-all flex items-center justify-center z-10"
        >
          <span className={`text-xs ${favorited ? 'text-amber-400' : 'text-[#B8AAC3]'}`}>
            {favorited ? '★' : '☆'}
          </span>
        </button>

        {/* Location Tag */}
        <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center gap-1 text-[10px] font-bold text-[#DDD8D4] truncate">
          <span>📍</span>
          <span className="truncate">{profile.city}, {profile.country}</span>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-2.5 sm:p-3 flex flex-col gap-1.5">
        <div>
          <h3 className="text-sm font-extrabold text-white truncate">
            {profile.fullName}, {profile.age}
          </h3>
          {profile.jobTitle && (
            <p className="text-[10px] text-[#DDD8D4] truncate">{profile.jobTitle}</p>
          )}
          <span className="inline-block mt-1 text-[9px] font-semibold text-[#B8AAC3] bg-[#17131F] px-1.5 py-0.5 rounded border border-[#725A7A]/20 truncate max-w-full">
            {profile.relationshipIntent}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-1 pt-1">
          <Link
            href={`/chat/${profile.id}`}
            className="py-1.5 px-1 rounded-lg bg-[#653C87] hover:bg-[#7A49A2] text-white text-[11px] font-bold text-center transition-all active:scale-95"
          >
            Message
          </Link>
          <Link
            href={`/profile/${profile.id}`}
            className="py-1.5 px-1 rounded-lg bg-[#17131F] hover:bg-[#2E263B] border border-[#725A7A]/35 text-[#DDD8D4] text-[11px] font-bold text-center transition-all active:scale-95"
          >
            Bio
          </Link>
        </div>
      </div>

    </div>
  );
}