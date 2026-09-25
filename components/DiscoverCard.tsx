'use client';

import React from 'react';
import Link from 'next/link';
import { ProfileData } from './ProfileDisplay';

export function DiscoverCard({ profile }: { profile: ProfileData }) {
  const isPendingReview = profile.avatarStatus === 'pending_review';

  return (
    <Link 
      href={`/profile/${profile.id}`}
      className="group relative flex flex-col rounded-2xl bg-[#241e2f] border border-[#725A7A]/25 overflow-hidden hover:border-[#9A79BA]/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#41384E]/40"
    >
      {/* Photo Frame */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#1d1827]">
        <img
          src={profile.avatarUrl}
          alt={profile.fullName}
          className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] ${
            isPendingReview ? 'blur-md grayscale' : ''
          }`}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#241e2f] via-transparent to-black/20" />

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {profile.isVerified ? (
            <span className="px-2 py-0.5 rounded-md bg-[#653C87]/70 border border-[#9A79BA]/50 backdrop-blur-md text-[10px] font-semibold text-[#E6D7FA]">
              Verified
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-[#17131f]/80 border border-[#725A7A]/40 backdrop-blur-md text-[10px] font-medium text-[#A8A2AB]">
              Pending
            </span>
          )}

          {profile.trustPill && profile.trustStatus !== 'clear' && (
            <span className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/40 backdrop-blur-md text-[10px] font-semibold text-amber-300">
              {profile.trustPill}
            </span>
          )}
        </div>

        {/* Location Watermark */}
        <div className="absolute bottom-3 left-3 right-3">
          <span className="text-xs text-[#E6D7FA] font-medium tracking-tight drop-shadow-sm">
            {profile.city}, {profile.country}
          </span>
        </div>
      </div>

      {/* Editorial Details */}
      <div className="p-4 flex flex-col justify-between flex-1 gap-2.5">
        <div>
          <h3 className="font-semibold text-white text-sm tracking-tight group-hover:text-[#B8AAC3] transition-colors">
            {profile.fullName}, <span className="text-[#A8A2AB] font-normal">{profile.age}</span>
          </h3>
          <p className="text-[11px] text-[#9A79BA] mt-0.5 line-clamp-1 font-medium">
            {profile.relationshipIntent}
          </p>
        </div>

        {profile.bio && (
          <p className="text-xs text-[#A8A2AB] line-clamp-2 leading-relaxed font-normal">
            {profile.bio}
          </p>
        )}

        {/* Languages Strip */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {profile.languages?.map((lang) => (
            <span key={lang} className="px-2 py-0.5 rounded bg-[#1d1827] border border-[#725A7A]/20 text-[10px] text-[#C6CBD1]">
              {lang}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
