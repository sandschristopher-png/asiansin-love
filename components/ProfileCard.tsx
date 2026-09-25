'use client';

import React from 'react';
import Link from 'next/link';
import { useFavorites, SavedProfile } from '@/lib/favoritesContext';

export interface ProfileSummary {
  id: string;
  fullName: string;
  age: number | string;
  city: string;
  country: string;
  avatarUrl?: string;
  isVerified?: boolean;
  relationshipIntent?: string;
  jobTitle?: string;
  isOnline?: boolean;
  reputationScore?: number;
}

interface ProfileProps {
  profile: ProfileSummary;
}

export function ProfileCard({ profile }: ProfileProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const id = profile.id;
  const name = profile.fullName || 'Anonymous';
  const age = profile.age || '';
  const city = profile.city || '';
  const country = profile.country || '';
  const profession = profile.jobTitle || '';
  const relationshipGoal = profile.relationshipIntent || 'Serious Relationship';
  const avatarUrl = profile.avatarUrl;
  const isVerified = Boolean(profile.isVerified);
  const isOnline = Boolean(profile.isOnline);
  const rep = profile.reputationScore ?? 100;

  const favorited = isFavorite(id);

  const handleFavoriteClick = () => {
    const savedObj: SavedProfile = {
      id,
      fullName: name,
      age: Number(age) || 0,
      city,
      country,
      avatarUrl: avatarUrl || '',
      isVerified,
      isOnline,
      relationshipIntent: relationshipGoal,
    };
    toggleFavorite(savedObj);
  };

  return (
    <div className="group relative rounded-3xl bg-[#241E2F] border border-[#7D7E92]/25 hover:border-[#9A79BA]/50 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Photo Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#17131F]">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-4xl font-bold text-[#7D7E92]/40">
            {name ? name[0] : 'A'}
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {isVerified && (
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#653C87]/90 text-white backdrop-blur-md border border-[#9A79BA]/40 shadow-sm">
              ? Verified
            </span>
          )}
          {isOnline && (
            <span className="px-2 py-1 rounded-xl text-[11px] font-semibold bg-[#17131F]/80 text-[#ECE8F4] backdrop-blur-md border border-[#7D7E92]/30 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Online
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 h-8 w-8 rounded-xl bg-[#17131F]/80 border border-[#7D7E92]/30 flex items-center justify-center text-[#B6AEC7] hover:text-white backdrop-blur-md transition-colors active:scale-90"
          title="Favorite"
        >
          <svg
            className={`w-4 h-4 ${favorited ? 'text-amber-400 fill-amber-400' : 'fill-none stroke-current'}`}
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>

        {/* Location Overlay */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-[11px] font-medium text-[#ECE8F4] bg-[#17131F]/85 px-2.5 py-1 rounded-xl backdrop-blur-md border border-[#7D7E92]/30">
          <svg className="w-3.5 h-3.5 text-[#9A79BA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate max-w-[210px]">{city}, {country}</span>
        </div>
      </div>

      {/* Info Card Body */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Identity Line with Rep Pill */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-white tracking-tight truncate">
              {name}, {age}
            </h3>
            
            {/* Rep Pill */}
            <div 
              className={`shrink-0 px-2 py-0.5 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 ${
                rep >= 90
                  ? 'bg-[#17131F] border-[#7D7E92]/35 text-[#ECE8F4]'
                  : rep >= 75
                  ? 'bg-[#17131F] border-[#7D7E92]/50 text-[#B6AEC7]'
                  : 'bg-amber-950/80 border-amber-500/70 text-amber-200'
              }`}
              title={`${rep}% verified community reputation`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${rep >= 80 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{rep}% Rep</span>
            </div>
          </div>

          <p className="text-xs font-medium text-[#B6AEC7] mt-1 truncate">{profession}</p>

          <div className="mt-2.5">
            <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-[#17131F] text-[#E6D7FA] border border-[#7D7E92]/25">
              {relationshipGoal}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            href={`/chat/${id}`}
            className="py-2.5 text-center rounded-xl bg-[#653C87] hover:bg-[#7D48A5] border border-[#9A79BA]/30 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
          >
            Message
          </Link>
          <Link
            href={`/profile/${id}`}
            className="py-2.5 text-center rounded-xl bg-[#17131F] hover:bg-[#281E35] border border-[#7D7E92]/35 text-xs font-bold text-[#ECE8F4] hover:text-white transition-all active:scale-95"
          >
            Bio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;
