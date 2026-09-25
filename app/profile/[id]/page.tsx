'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function PublicProfileView(props: ProfilePageProps) {
  const [activePhoto, setActivePhoto] = useState(0);

  const profile = {
    fullName: 'Camille',
    age: 26,
    city: 'Makati, Metro Manila',
    country: 'Philippines',
    jobTitle: 'Software QA Lead',
    relationshipIntent: 'Marriage & Long-Term Partner',
    bio: `Hello! I am a Software Quality Assurance lead living in Metro Manila.

I value honest communication, family-first traditions, and genuine companionship. On weekends, I enjoy acoustic live sets, coastal day trips, and home cooking.

Looking for a mature, sincere gentleman ready for a real, committed relationship leading to marriage.`,
    isVerified: true,
    languages: ['English (Fluent)', 'Tagalog (Native)'],
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=800&auto=format&fit=crop'
    ]
  };

  return (
    <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col justify-center">
      
      {/* Back Link */}
      <div className="mb-3.5">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#DDD8D4] hover:text-white transition-colors"
        >
          ← Back to Discovery Feed
        </Link>
      </div>

      {/* Split Dossier Layout - Fitted for single screen view */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        
        {/* Left: Compact Photo Stage & Thumbnails (5 cols) */}
        <div className="md:col-span-5 space-y-2.5">
          <div className="relative aspect-[4/4] max-h-[440px] w-full rounded-2xl overflow-hidden bg-[#17131F] border border-[#725A7A]/35 shadow-xl">
            <img
              src={profile.photos[activePhoto]}
              alt={profile.fullName}
              className="w-full h-full object-cover"
            />
            {profile.isVerified && (
              <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-[#653C87] border border-[#978FA8]/40 text-white text-[11px] font-bold shadow-md">
                ✓ Identity Verified
              </span>
            )}
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {profile.photos.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePhoto(idx)}
                className={`relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                  activePhoto === idx ? 'border-[#978FA8] scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={url} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Info, Courtship Goal & Direct Action (7 cols) */}
        <div className="md:col-span-7">
          <div className="p-5 sm:p-6 rounded-2xl bg-[#241E2F] border border-[#725A7A]/35 shadow-xl space-y-4">
            
            {/* Header Identity */}
            <div className="border-b border-[#725A7A]/20 pb-3">
              <div className="flex items-baseline justify-between">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-[family-name:var(--font-nunito)]">
                  {profile.fullName}, <span className="text-[#DDD8D4] font-normal">{profile.age}</span>
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                  Online
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#DDD8D4] mt-0.5">
                📍 {profile.city}, {profile.country} • <span className="text-[#B8AAC3] font-normal">{profile.jobTitle}</span>
              </p>
            </div>

            {/* Courtship Goal */}
            <div className="py-2 px-3 rounded-xl bg-[#17131F] border border-[#725A7A]/30 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8AAC3]">
                Courtship Goal
              </span>
              <p className="text-xs sm:text-sm font-bold text-white">
                🎯 {profile.relationshipIntent}
              </p>
            </div>

            {/* Bio Text */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8AAC3]">
                About Camille
              </span>
              <p className="text-xs sm:text-sm text-[#DDD8D4] leading-relaxed whitespace-pre-line font-normal">
                {profile.bio}
              </p>
            </div>

            {/* Spoken Languages */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8AAC3] shrink-0">
                Languages:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.languages.map((lang) => (
                  <span
                    key={lang}
                    className="px-2.5 py-0.5 rounded-lg bg-[#17131F] border border-[#725A7A]/25 text-[11px] text-[#DDD8D4]"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            {/* Primary Action Target */}
            <div className="pt-3 border-t border-[#725A7A]/25 space-y-2">
              <Link
                href="/chat/demo-1"
                className="w-full py-3.5 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] text-white font-bold text-sm sm:text-base text-center block shadow-lg shadow-[#41384E]/50 transition-all active:scale-[0.98]"
              >
                Send Direct Message
              </Link>
              
              <p className="text-center text-[10px] text-[#978FA8]">
                🔒 100% scam-free messaging. Financial requests are strictly prohibited.
              </p>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
