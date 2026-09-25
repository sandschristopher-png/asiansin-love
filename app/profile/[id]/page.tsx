'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params?.id as string;

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Profile data (in production, loaded from supabase via profileId)
  const isVerified = false; // Set to demonstrate the unverified warning

  const photos = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80',
  ];

  return (
    <main className="w-full max-w-2xl mx-auto pb-24 sm:py-8 sm:px-4">
      
      {/* Photo Frame */}
      <div className="relative w-full aspect-[4/5] sm:rounded-3xl overflow-hidden bg-[#17131F] shadow-2xl">
        <Image
          src={photos[activePhotoIndex]}
          alt="Camille"
          fill
          priority
          sizes="(max-width: 640px) 100vw, 640px"
          className="object-cover object-top transition-all duration-300"
          unoptimized
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#17131F] via-transparent to-black/30 pointer-events-none" />

        {/* Header Controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="h-10 w-10 rounded-full bg-[#17131F]/80 backdrop-blur-md border border-[#725A7A]/40 text-white flex items-center justify-center text-lg active:scale-90 transition-transform shadow-lg"
          >
            ←
          </button>
          
          <span className="px-3 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        </div>

        {/* Dots */}
        <div className="absolute bottom-5 left-4 right-4 flex items-center justify-center gap-2 z-20">
          {photos.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActivePhotoIndex(idx)}
              className={`h-2.5 rounded-full transition-all ${
                activePhotoIndex === idx
                  ? 'w-8 bg-[#653C87]'
                  : 'w-2.5 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Photo ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Profile Details Container */}
      <div className="px-4 pt-5 space-y-5">
        
        {/* Unverified Advisory Banner */}
        {!isVerified && (
          <div className="rounded-2xl bg-amber-950/50 border border-amber-500/40 p-4 flex items-start gap-3 shadow-lg">
            <span className="text-xl leading-none">⚠️</span>
            <div className="text-xs space-y-1">
              <strong className="text-amber-200 block font-black uppercase tracking-wide">
                Community Advisory: Identity Not Yet Verified
              </strong>
              <p className="text-amber-100/90 leading-relaxed">
                This member has not yet completed selfie gesture verification. Never send money, cryptocurrency, or share financial credentials with any member.
              </p>
            </div>
          </div>
        )}

        {/* Name and Meta */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Camille, 26
            </h1>
            {isVerified ? (
              <span className="px-2.5 py-1 rounded-lg bg-[#653C87] border border-[#978FA8]/40 text-white text-xs font-black tracking-wide shadow-md">
                ✓ Photo Verified
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-[#241E2F] border border-amber-500/40 text-amber-300 text-xs font-bold shadow-md">
                Unverified
              </span>
            )}
          </div>

          <p className="text-sm sm:text-base font-semibold text-[#DDD8D4] flex items-center gap-1.5">
            <span className="text-rose-400 text-base">📍</span>
            Makati, Metro Manila, Philippines
            <span className="text-[#725A7A]">•</span>
            Software QA Lead
          </p>
        </div>

        {/* Intent Pill */}
        <div className="rounded-2xl bg-[#241E2F] border border-[#725A7A]/35 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8AAC3] block">
              Courtship Goal
            </span>
            <span className="text-sm sm:text-base font-extrabold text-white">
              Marriage & Long-Term Partner
            </span>
          </div>
          <span className="text-2xl">🎯</span>
        </div>

        {/* Bio */}
        <div className="rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 p-5 space-y-3.5 shadow-xl">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#B8AAC3]">
            About Camille
          </h2>
          <p className="text-base text-[#F3EBF9] leading-relaxed font-medium">
            Hello! I am a Software Quality Assurance lead living in Metro Manila.
          </p>
          <p className="text-base text-[#F3EBF9] leading-relaxed font-medium">
            I value honest communication, family-first traditions, and genuine companionship. On weekends, I enjoy acoustic live sets, coastal day trips, and home cooking.
          </p>
          <p className="text-base text-[#F3EBF9] leading-relaxed font-medium">
            Looking for a mature, sincere gentleman ready for a real, committed relationship leading to marriage.
          </p>
        </div>

        {/* Action Button */}
        <div className="space-y-2 pt-2">
          <Link
            href={`/chat/${profileId || 'camille'}`}
            className="w-full py-4 rounded-2xl bg-[#653C87] hover:bg-[#7A49A2] text-white font-extrabold text-base text-center block shadow-xl shadow-[#653C87]/30 active:scale-[0.98] transition-all"
          >
            Send Direct Message
          </Link>
          <p className="text-center text-xs text-[#B8AAC3]">
            🔒 Sincere courtship messaging. Financial requests are strictly prohibited.
          </p>
        </div>

      </div>

    </main>
  );
}