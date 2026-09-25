'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, CheckCircle, RotateCcw, Heart, Star, MessageCircle, X } from 'lucide-react';

export interface ProfileCardProps {
  profile: {
    id: string;
    name?: string;
    age?: number;
    city?: string;
    country?: string;
    location?: string;
    avatarUrl?: string;
    image_url?: string;
    photo_url?: string;
    repScore?: number;
    headline?: string;
    isVerified?: boolean;
    isOnline?: boolean;
  };
  isPassed?: boolean;
  onPass?: (id: string) => void;
  onUndoPass?: (id: string) => void;
  isLiked?: boolean;
  onLike?: (id: string) => void;
  isSaved?: boolean;
  onSave?: (id: string) => void;
}

export function ProfileCard({
  profile,
  isPassed = false,
  onPass,
  onUndoPass,
  isLiked = false,
  onLike,
  isSaved = false,
  onSave,
}: ProfileCardProps) {
  const displayName = profile.name || 'Member';
  const displayAge = profile.age ? `, ${profile.age}` : '';
  const displayAvatar = profile.avatarUrl || profile.image_url || profile.photo_url || '/dummy-1.jpg';

  const locationLabel = profile.city && profile.country
    ? `${profile.city}, ${profile.country}`
    : profile.location || profile.city || profile.country || 'International';

  if (isPassed) {
    return (
      <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#15101C] border border-[#241E2F] flex items-center justify-center">
        <Image
          src={displayAvatar}
          alt={displayName}
          fill
          className="object-cover object-[50%_20%] opacity-20 grayscale"
        />
        <button
          onClick={() => onUndoPass?.(profile.id)}
          className="relative z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-[#241E2F]/90 border border-[#653C87]/60 text-xs font-semibold text-[#E6D7FA] hover:bg-[#653C87]/40 transition shadow-lg backdrop-blur-md"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Undo Pass
        </button>
      </div>
    );
  }

  return (
    <div className="group relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#15101C] border border-[#241E2F] hover:border-[#653C87]/50 transition duration-300 shadow-md flex flex-col justify-end">
      <Link href={`/profile/${profile.id}`} className="absolute inset-0 z-0">
        <Image
          src={displayAvatar}
          alt={displayName}
          fill
          className="object-cover object-[50%_20%] transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#15101C] via-[#15101C]/40 to-transparent" />
      </Link>

      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {profile.isOnline ? (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#15101C]/80 border border-emerald-500/40 text-[10px] font-medium text-emerald-400 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        ) : <div />}

        {profile.repScore !== undefined && (
          <span className="px-2 py-0.5 rounded-full bg-[#241E2F]/80 border border-[#653C87]/50 text-[10px] font-semibold text-[#E6D7FA] backdrop-blur-md">
            {profile.repScore}% Rep
          </span>
        )}
      </div>

      <div className="relative z-10 p-3 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <Link href={`/profile/${profile.id}`} className="pointer-events-auto">
            <h3 className="text-base font-semibold text-[#E6D7FA] leading-tight hover:underline flex items-center gap-1">
              {displayName}{displayAge}
              {profile.isVerified && (
                <CheckCircle className="w-3.5 h-3.5 text-[#9A79BA] shrink-0" />
              )}
            </h3>
          </Link>
        </div>

        <div className="flex items-center gap-1 text-xs text-[#9A79BA]">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{locationLabel}</span>
        </div>

        {profile.headline && (
          <p className="text-[11px] text-[#7D7E92] line-clamp-1 italic">
            "{profile.headline}"
          </p>
        )}

        <div className="mt-1 pt-2 border-t border-[#241E2F]/80 flex items-center justify-around pointer-events-auto">
          <button
            onClick={() => onPass?.(profile.id)}
            title="Pass"
            className="p-2 rounded-full text-[#7D7E92] hover:text-rose-400 hover:bg-rose-500/10 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <button
            onClick={() => onLike?.(profile.id)}
            title="Like"
            className={`p-2 rounded-full transition ${
              isLiked 
                ? 'text-rose-400 bg-rose-500/10' 
                : 'text-[#E6D7FA] hover:text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-400' : ''}`} />
          </button>

          <button
            onClick={() => onSave?.(profile.id)}
            title="Save / Pin"
            className={`p-2 rounded-full transition ${
              isSaved 
                ? 'text-amber-400 bg-amber-500/10' 
                : 'text-[#E6D7FA] hover:text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <Star className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
          </button>

          <Link
            href={`/chat/${profile.id}`}
            title="Message"
            className="p-2 rounded-full text-[#E6D7FA] hover:text-[#9A79BA] hover:bg-[#653C87]/20 transition"
          >
            <MessageCircle className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;