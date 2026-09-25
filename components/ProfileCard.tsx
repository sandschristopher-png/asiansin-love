'use client';

import React, { useState } from 'react';
import Link from 'next/link';

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

interface ProfileCardProps {
  profile: ProfileSummary;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const [saved, setSaved] = useState(false);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(!saved);
    // In production, wire to Supabase favorites table
  };

  return (
    <div className="rounded-2xl bg-[#241E2F] border border-[#725A7A]/35 overflow-hidden shadow-lg hover:border-[#978FA8] transition-all duration-200 flex flex-col justify-between group">
      
      {/* Photo Frame */}
      <div className="relative aspect-[4/3.2] w-full bg-[#17131F] overflow-hidden">
        <img
          src={profile.avatarUrl}
          alt={profile.fullName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#241E2F] via-transparent to-black/25" />

        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 pointer-events-none">
          {profile.isVerified && (
            <span className="px-1.5 py-0.5 rounded-md bg-[#653C87] border border-[#978FA8]/40 text-white text-[10px] font-bold shadow-sm">
              ✓ Verified
            </span>
          )}
          {profile.isOnline && (
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold flex items-center gap-1 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          )}
        </div>

        {/* Bookmark / Favorite Quick Button */}
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label="Save Profile"
          className={`absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center text-xs transition-all shadow-md ${
            saved 
              ? 'bg-amber-400 text-[#17131F] scale-110' 
              : 'bg-[#17131F]/70 text-[#DDD8D4] hover:bg-[#17131F] hover:text-white'
          }`}
        >
          {saved ? '★' : '☆'}
        </button>

        {/* Location Subtitle */}
        <div className="absolute bottom-1.5 left-2 right-2 pointer-events-none">
          <p className="text-[11px] font-semibold text-white drop-shadow-md truncate">
            📍 {profile.city}, {profile.country}
          </p>
        </div>
      </div>

      {/* Info Body */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
            {profile.fullName}, <span className="text-[#DDD8D4] font-normal">{profile.age}</span>
          </h3>

          {profile.jobTitle && (
            <p className="text-[11px] text-[#B8AAC3] font-medium truncate">
              {profile.jobTitle}
            </p>
          )}

          {/* Courtship Goal Tag */}
          <div className="mt-1.5 py-1 px-2 rounded-lg bg-[#17131F] border border-[#725A7A]/25">
            <p className="text-[10px] font-semibold text-[#DDD8D4] truncate">
              🎯 {profile.relationshipIntent}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-1 flex gap-1.5">
          <Link
            href={`/chat/${profile.id}`}
            className="flex-1 py-2 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] text-white text-xs font-bold text-center shadow-sm transition-all active:scale-[0.98]"
          >
            Message
          </Link>

          <Link
            href={`/profile/${profile.id}`}
            className="px-3 py-2 rounded-xl bg-[#17131F] hover:bg-[#2E263B] border border-[#725A7A]/35 text-white text-xs font-bold text-center transition-colors"
          >
            Bio
          </Link>
        </div>
      </div>

    </div>
  );
}
