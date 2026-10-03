'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, ShieldCheck, Heart } from 'lucide-react';
import { PlusBadge } from '@/components/PlusBadge';

interface DiscoverCardProps {
  isPlus?: boolean;
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
  isPlus = false,
}: DiscoverCardProps) {
  const [liked, setLiked] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked((prev) => !prev);
  };

  return (
    <Link
      href={`/profile/${id}`}
      className="group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#F0EDF5] border border-black/[0.06] shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* Full-Bleed Image or Fallback */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-[#ECE7F6] to-[#DDD5EE] flex items-center justify-center">
          <span className="text-3xl font-medium text-[#6555B8]/40">{name?.[0] || '?'}</span>
        </div>
      )}

      {/* Feathered Scrim (only bottom 35% for contrast) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Top Floating Glass Badges */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-1.5">
          {isPlus && <PlusBadge size="sm" />}
          {repScore > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-md text-[10px] font-medium text-white/95 border border-white/20 shadow-sm">
              <ShieldCheck className="h-3 w-3 text-[#D8B4FE]" />
              <span>{repScore}%</span>
            </span>
          )}
        </div>

        {online && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-md text-[10px] font-medium text-emerald-300 border border-white/20 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        )}
      </div>

      {/* Bottom Identity & Tactile Action */}
      <div className="absolute bottom-0 inset-x-0 p-3 flex items-end justify-between gap-2 z-10">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-medium text-white  truncate drop-shadow-sm">
            {name}, {age}
          </h2>

          <p className="flex items-center gap-1 text-[11px] text-white/85 font-medium mt-0.5 truncate drop-shadow-sm">
            <MapPin className="h-3 w-3 text-white/70 shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        </div>

        {/* Circular Heart Button */}
        <button
          type="button"
          onClick={handleLike}
          aria-label={liked ? 'Unlike' : 'Like'}
          className={`h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 active:scale-90 shrink-0 ${
            liked
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
              : 'bg-black/35 border border-white/25 text-white/90 hover:text-white hover:bg-black/50'
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
        </button>
      </div>
    </Link>
  );
}


