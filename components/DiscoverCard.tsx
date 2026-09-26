'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, ShieldCheck, Heart, MessageCircle, Star, X } from 'lucide-react';

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
  return (
    <div className="group rounded-3xl bg-[#1D1726] border border-[#9A79BA]/20 hover:border-[#9A79BA]/50 transition-all duration-300 shadow-xl overflow-hidden flex flex-col">
      {/* Framed Image Container */}
      <Link href={`/profile/${id}`} className="relative aspect-[4/5] w-full block overflow-hidden bg-[#130F18]">
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Scrim for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1D1726] via-transparent to-black/40" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {online ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          ) : <span />}

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-[#E6D7FA] border border-[#9A79BA]/30">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C9A4E8]" />
            {repScore}%
          </span>
        </div>
      </Link>

      {/* Card Info Body */}
      <div className="p-4 flex flex-col flex-1 justify-between bg-[#1D1726]">
        <div>
          <Link href={`/profile/${id}`}>
            <h2 className="text-base font-bold text-white hover:text-[#E6D7FA] transition flex items-center gap-1.5">
              {name}, {age}
            </h2>
          </Link>
          
          {/* High-Contrast Location Pop */}
          <p className="text-xs font-medium text-[#E6D7FA] flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-[#9A79BA] shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        </div>

        {/* Action Button Strip */}
        <div className="flex items-center justify-between gap-1.5 pt-3.5 mt-3 border-t border-[#241E2F]">
          <button
            type="button"
            className="w-8 h-8 rounded-xl bg-[#130F18] border border-[#9A79BA]/20 hover:border-rose-500/50 hover:bg-rose-500/10 text-[#A8A2AB] hover:text-rose-400 flex items-center justify-center transition active:scale-95"
            aria-label="Pass"
          >
            <X className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="w-8 h-8 rounded-xl bg-[#130F18] border border-[#9A79BA]/20 hover:border-[#C9A4E8] hover:bg-[#653C87]/20 text-[#A8A2AB] hover:text-[#E6D7FA] flex items-center justify-center transition active:scale-95"
            aria-label="Bookmark"
          >
            <Star className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="w-8 h-8 rounded-xl bg-[#130F18] border border-[#9A79BA]/20 hover:border-pink-500/50 hover:bg-pink-500/20 text-[#A8A2AB] hover:text-pink-400 flex items-center justify-center transition active:scale-95"
            aria-label="Like"
          >
            <Heart className="w-4 h-4" />
          </button>

          <Link
            href={`/profile/${id}`}
            className="flex-1 h-8 rounded-xl bg-[#653C87] hover:bg-[#7D49A8] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat</span>
          </Link>
        </div>
      </div>
    </div>
  );
}