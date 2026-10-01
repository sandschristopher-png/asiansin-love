'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, ShieldCheck, Heart } from 'lucide-react';

interface DiscoverCardProps {
  id: string;
  name: string;
  age: number;
  location: string;
  avatarUrl: string;
  repScore?: number;
  online?: boolean;
}

export function DiscoverCard({
  id,
  name,
  age,
  location,
  avatarUrl,
  repScore = 100,
  online = true,
}: DiscoverCardProps) {
  const [liked, setLiked] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked((prev) => !prev);
    // Hook into likes API / toast here
  };

  return (
    <Link
      href={`/profile/${id}`}
      className="group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-[#1E1F30] border border-[#9A8CC3]/15 shadow-md hover:shadow-2xl transition-all duration-300"
    >
      {/* Full-Bleed Image or Gradient Fallback */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-[#6555b8] to-[#2D2F4C] flex items-center justify-center">
          <span className="text-3xl font-bold text-white/50">{name?.[0] || '?'}</span>
        </div>
      )}

      {/* Darkening Gradient Scrim */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

      {/* Top Floating Micro-Badges */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
        {online ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-[10px] sm:text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        ) : (
          <span />
        )}

        {repScore > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-[10px] sm:text-[11px] font-medium text-[#E2DCF3] border border-white/10">
            <ShieldCheck className="h-3 w-3 text-[#B2A4D7]" />
            {repScore}%
          </span>
        )}
      </div>

      {/* Bottom Info & Corner Like */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4.5 flex items-end justify-between gap-2 z-10">
        {/* Left: Identity Details */}
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
            {name}, {age}
          </h2>

          <p className="flex items-center gap-1 text-[11px] sm:text-xs text-[#E2DCF3]/90 font-medium mt-0.5 truncate">
            <MapPin className="h-3 w-3 text-[#B2A4D7] shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        </div>

        {/* Right: Tactile Heart Action */}
        <button
          type="button"
          onClick={handleLike}
          aria-label={liked ? "Unlike" : "Like"}
          className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 active:scale-90 shrink-0 ${
            liked
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
              : 'bg-black/40 border border-white/20 text-white/90 hover:text-white hover:bg-black/60'
          }`}
        >
          <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${liked ? 'fill-current' : ''}`} />
        </button>
      </div>
    </Link>
  );
}
