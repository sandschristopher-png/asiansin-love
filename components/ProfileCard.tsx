'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isDisliked, setIsDisliked] = useState(false);

  const id = profile.id;
  const name = profile.fullName || 'Anonymous';
  const age = profile.age || '';

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ail_disliked_ids');
      if (stored) {
        const ids = JSON.parse(stored);
        if (Array.isArray(ids) && ids.includes(id)) {
          setIsDisliked(true);
        }
      }
    } catch {
      // Fallback cleanly
    }
  }, [id]);

  const cleanCity = (profile.city || '').split(',')[0].replace(/\s+City$/i, '').trim();
  const cleanCountry = (profile.country || '').trim();
  const locationLabel = [cleanCity, cleanCountry].filter(Boolean).join(', ');

  const avatarUrl = profile.avatarUrl || '';
  const isVerified = Boolean(profile.isVerified);
  const isOnline = Boolean(profile.isOnline);
  const rep = profile.reputationScore ?? 100;

  const favorited = isFavorite(id);

  const handleCardClick = () => {
    router.push(`/profile/${id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const savedObj: SavedProfile = {
      id,
      fullName: name,
      age: Number(age) || 0,
      city: cleanCity || cleanCountry,
      country: cleanCountry,
      avatarUrl,
      isVerified,
      isOnline,
      relationshipIntent: profile.relationshipIntent || 'Serious Relationship',
    };
    toggleFavorite(savedObj);
  };

  const handleDislikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isDisliked;
    setIsDisliked(nextState);

    try {
      const stored = localStorage.getItem('ail_disliked_ids');
      let ids: string[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(ids)) ids = [];

      if (nextState) {
        if (!ids.includes(id)) ids.push(id);
      } else {
        ids = ids.filter((item) => item !== id);
      }
      localStorage.setItem('ail_disliked_ids', JSON.stringify(ids));
    } catch {
      // Ignore
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-2xl bg-[#241E2F] border transition-all duration-300 overflow-hidden shadow-sm flex flex-col cursor-pointer select-none ${
        isDisliked
          ? 'opacity-35 grayscale contrast-75 border-transparent'
          : 'border-[#7D7E92]/25 hover:border-[#9A79BA]/50 hover:shadow-lg hover:shadow-black/40'
      }`}
    >
      {/* Photo Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#17131F]">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-[#7D7E92]/40">
            {name ? name[0] : 'A'}
          </div>
        )}

        {/* Top Left: Verified Icon Badge */}
        {isVerified && (
          <div 
            className="absolute top-2.5 left-2.5 h-6 w-6 rounded-full bg-[#653C87] border border-[#9A79BA]/50 flex items-center justify-center shadow-md backdrop-blur-md pointer-events-none z-10"
            title="Verified Member"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Top Right: Reputation Pill */}
        <div 
          className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#17131F]/85 border border-[#7D7E92]/35 backdrop-blur-md flex items-center gap-1 shadow-md pointer-events-none z-10"
          title={`${rep}% verified community reputation`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${rep >= 80 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-[10px] font-bold text-[#ECE8F4]">{rep}% Rep</span>
        </div>

        {/* Desktop Hover Action Overlay */}
        <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-end justify-center pb-5 gap-6 z-20 pointer-events-auto">
          {/* Desktop Pass (✕) */}
          <button
            type="button"
            onClick={handleDislikeToggle}
            className={`h-11 w-11 rounded-full flex items-center justify-center shadow-xl backdrop-blur-md active:scale-90 transition-all border ${
              isDisliked
                ? 'bg-white/25 border-white text-white'
                : 'bg-[#17131F]/90 border-[#7D7E92]/40 text-[#DDD8D4] hover:text-white hover:border-white hover:scale-105'
            }`}
            title={isDisliked ? "Un-pass" : "Pass (Dim)"}
          >
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={2.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Desktop Favorite (♡) */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            className="h-11 w-11 rounded-full bg-[#17131F]/90 border border-[#7D7E92]/40 flex items-center justify-center shadow-xl backdrop-blur-md active:scale-90 transition-all hover:border-rose-400/80 hover:scale-105"
            title={favorited ? "Favorited" : "Like"}
          >
            <svg
              className={`w-5 h-5 transition-colors ${
                favorited
                  ? 'text-rose-500 fill-rose-500'
                  : 'text-[#DDD8D4] hover:text-rose-400 fill-none stroke-current'
              }`}
              viewBox="0 0 24 24"
              strokeWidth={2.4}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </button>
        </div>

        {/* Disliked Status Banner */}
        {isDisliked && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none z-10">
            <span className="px-3.5 py-1 rounded-full bg-[#17131F]/90 border border-white/20 text-white text-xs font-bold tracking-wide">
              ✕ Passed
            </span>
          </div>
        )}
      </div>

      {/* Info Stack Below Photo */}
      <div className="p-3 text-center flex flex-col justify-between flex-1">
        <div>
          {/* Name, Age & Online Indicator */}
          <div className="flex items-center justify-center gap-1.5 truncate">
            {isOnline && !isDisliked && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" title="Online now" />
            )}
            <h3 className="text-sm font-bold text-white tracking-tight truncate">
              {name}, {age}
            </h3>
          </div>

          {/* City, Country */}
          <p className="text-xs text-[#B6AEC7] mt-0.5 truncate">
            {locationLabel}
          </p>
        </div>

        {/* Mobile-Only Action Utility Row (Pass / Like) */}
        <div className="sm:hidden flex items-center justify-center gap-8 pt-2.5 mt-2 border-t border-[#7D7E92]/15">
          {/* Mobile Dismiss / Dislike (✕) */}
          <button
            type="button"
            onClick={handleDislikeToggle}
            className={`h-9 w-9 rounded-full flex items-center justify-center active:scale-90 transition-all ${
              isDisliked
                ? 'bg-white/10 text-white'
                : 'text-[#7D7E92] hover:text-[#ECE8F4] hover:bg-[#17131F]'
            }`}
            title={isDisliked ? "Un-pass" : "Pass (Dim)"}
          >
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Mobile Favorite / Heart (♡) */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            className="h-9 w-9 rounded-full flex items-center justify-center active:scale-90 transition-all hover:bg-[#17131F]"
            title={favorited ? "Favorited" : "Like"}
          >
            <svg
              className={`w-5 h-5 transition-colors ${
                favorited
                  ? 'text-rose-500 fill-rose-500'
                  : 'text-[#7D7E92] hover:text-rose-400 fill-none stroke-current'
              }`}
              viewBox="0 0 24 24"
              strokeWidth={2.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;