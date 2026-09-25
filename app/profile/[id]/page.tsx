'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { DUMMY_PROFILES, DummyProfile } from '@/lib/dummyProfiles';

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params?.id as string;

  const foundProfile = DUMMY_PROFILES.find((p: DummyProfile) => p.id === profileId);
  const profile: DummyProfile = foundProfile || DUMMY_PROFILES[0];

  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  const photos: string[] =
    profile.galleryUrls && profile.galleryUrls.length > 0
      ? profile.galleryUrls
      : [profile.avatarUrl];

  const bioParagraphs: string[] = Array.isArray(profile.bio)
    ? profile.bio
    : typeof profile.bio === 'string'
    ? [profile.bio]
    : [];

  return (
    <main className="w-full max-w-2xl mx-auto pb-24 sm:py-8 sm:px-4">
      
      {/* Hero Photo Frame */}
      <div className="relative w-full aspect-[4/5] sm:rounded-3xl overflow-hidden bg-[#17131F] shadow-2xl">
        <Image
          src={photos[activePhotoIndex] || profile.avatarUrl}
          alt={profile.fullName}
          fill
          priority
          sizes="(max-width: 640px) 100vw, 640px"
          className="object-cover object-top transition-all duration-300"
          unoptimized
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#17131F] via-transparent to-black/30 pointer-events-none" />

        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="h-10 w-10 rounded-full bg-[#17131F]/80 backdrop-blur-md border border-[#725A7A]/40 text-white flex items-center justify-center text-lg active:scale-90 transition-transform shadow-lg"
          >
            ←
          </button>
          
          {profile.isOnline && (
            <span className="px-3 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          )}
        </div>

        {/* Dots */}
        {photos.length > 1 && (
          <div className="absolute bottom-5 left-4 right-4 flex items-center justify-center gap-2 z-20">
            {photos.map((_: string, idx: number) => (
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
        )}
      </div>

      {/* Details Container */}
      <div className="px-4 pt-5 space-y-5">
        
        {/* Unverified Advisory */}
        {!profile.isVerified && (
          <div className="rounded-2xl bg-amber-950/50 border border-amber-500/40 p-4 flex items-start gap-3 shadow-lg">
            <span className="text-xl leading-none">⚠️</span>
            <div className="text-xs space-y-1">
              <strong className="text-amber-200 block font-black uppercase tracking-wide">
                Community Advisory: Identity Not Yet Verified
              </strong>
              <p className="text-amber-100/90 leading-relaxed">
                This member has not yet completed selfie gesture verification. Never send money, cryptocurrency, or share financial credentials.
              </p>
            </div>
          </div>
        )}

        {/* Header Block */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {profile.fullName}, {profile.age}
            </h1>
            {profile.isVerified ? (
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
            {profile.city}, {profile.country}
            <span className="text-[#725A7A]">•</span>
            {profile.profession}
          </p>
        </div>

        {/* Courtship Goal */}
        <div className="rounded-2xl bg-[#241E2F] border border-[#725A7A]/35 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8AAC3] block">
              Courtship Goal
            </span>
            <span className="text-sm sm:text-base font-extrabold text-white">
              {profile.relationshipGoal}
            </span>
          </div>
          <span className="text-2xl">🎯</span>
        </div>

        {/* Bio */}
        <div className="rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 p-5 space-y-3.5 shadow-xl">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#B8AAC3]">
            About {profile.fullName}
          </h2>
          {bioParagraphs.map((paragraph: string, i: number) => (
            <p key={i} className="text-base text-[#F3EBF9] leading-relaxed font-medium">
              {paragraph}
            </p>
          ))}

          <div className="pt-3 border-t border-[#725A7A]/25 flex flex-wrap gap-2 text-xs">
            {profile.languages?.map((lang: string) => (
              <span key={lang} className="px-3 py-1.5 rounded-xl bg-[#17131F] border border-[#725A7A]/30 text-[#DDD8D4] font-semibold">
                🗣️ {lang}
              </span>
            ))}
            {profile.heightCm && (
              <span className="px-3 py-1.5 rounded-xl bg-[#17131F] border border-[#725A7A]/30 text-[#DDD8D4] font-semibold">
                📏 {profile.heightCm} cm
              </span>
            )}
            {profile.education && (
              <span className="px-3 py-1.5 rounded-xl bg-[#17131F] border border-[#725A7A]/30 text-[#DDD8D4] font-semibold">
                🎓 {profile.education}
              </span>
            )}
          </div>
        </div>

        {/* Direct Action */}
        <div className="space-y-2 pt-2">
          <Link
            href={`/chat/${profile.id}`}
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