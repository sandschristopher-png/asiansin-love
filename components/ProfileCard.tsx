'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(profile.id);
  const [imgError, setImgError] = useState(false);

  const fallbackAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    profile.fullName
  )}&backgroundColor=241E2F&textColor=E6D7FA`;

  const handleToggleFavorite = (e: React.MouseEvent) => {
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

  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={() => router.push(`/profile/${profile.id}`)}
      className="group relative rounded-[24px] bg-[#241E2F] border border-[#725A7A]/35 overflow-hidden flex flex-col justify-between profile-card-lift shadow-xl cursor-pointer select-none"
    >
      {/* Photo Frame */}
      <div className="relative aspect-[3/4] w-full bg-[#17131F] overflow-hidden">
        <Image
          src={imgError || !profile.avatarUrl ? fallbackAvatar : profile.avatarUrl}
          alt={profile.fullName}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
          onError={() => setImgError(true)}
          unoptimized
        />

        {/* Cinematic Gradient Shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#241E2F] via-transparent to-black/30 opacity-95 pointer-events-none" />

        {/* Verified / Online Status Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10 pointer-events-none">
          {profile.isVerified && (
            <span className="px-2 py-0.5 rounded-lg bg-[#653C87] border border-[#9A79BA]/50 text-[#E6D7FA] text-[10px] font-black tracking-wide shadow-md">
              ✓ Verified
            </span>
          )}
          {profile.isOnline && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-[#17131F]/80 border border-[#725A7A]/40 text-[#E6D7FA] text-[10px] font-bold backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9A79BA]" />
              Online
            </span>
          )}
        </div>

        {/* Favorite Button (Prevents card click navigation) */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-label={favorited ? 'Remove favorite' : 'Save profile'}
          className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-[#17131F]/80 backdrop-blur-md border border-[#725A7A]/40 hover:scale-110 active:scale-90 transition-all flex items-center justify-center z-10 shadow-md"
        >
          <svg
            className={`w-4 h-4 transition-colors ${
              favorited ? 'text-[#E6D7FA] fill-[#653C87]' : 'text-[#A8A2AB] fill-transparent'
            }`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>

        {/* Location Subtitle */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center gap-1.5 text-xs font-bold text-[#E6D7FA] truncate pointer-events-none">
          <svg className="w-3.5 h-3.5 text-[#9A79BA] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{profile.city}, {profile.country}</span>
        </div>
      </div>

      {/* Card Info Section */}
      <div className="p-3.5 flex flex-col gap-2.5">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#E6D7FA] truncate">
            {profile.fullName}, {profile.age}
          </h3>
          {profile.jobTitle && (
            <p className="text-xs text-[#A8A2AB] truncate font-medium">{profile.jobTitle}</p>
          )}
          <span className="inline-block mt-1 text-[11px] font-bold text-[#9A79BA] bg-[#17131F] px-2 py-0.5 rounded-lg border border-[#725A7A]/25 truncate max-w-full">
            {profile.relationshipIntent}
          </span>
        </div>

        {/* Action Row */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <Link
            href={`/chat/${profile.id}`}
            onClick={handleMessageClick}
            className="py-2 px-1 rounded-xl bg-[#653C87] hover:bg-[#9A79BA] text-white text-xs font-black text-center transition-all shadow-md active:scale-95 flex items-center justify-center"
          >
            Message
          </Link>
          <div className="py-2 px-1 rounded-xl bg-[#17131F] hover:bg-[#2E263B] border border-[#725A7A]/40 text-[#E6D7FA] text-xs font-bold text-center transition-all flex items-center justify-center">
            Bio
          </div>
        </div>
      </div>
    </div>
  );
}