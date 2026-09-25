'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { DUMMY_PROFILES, DummyProfile } from '@/lib/dummyProfiles';
import { useFavorites, SavedProfile } from '@/lib/favoritesContext';

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params?.id as string;
  const { isFavorite, toggleFavorite } = useFavorites();

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

  const favorited = isFavorite(profile.id);
  const rep = profile.reputationScore ?? 100;

  const handleToggleFavorite = () => {
    const savedObj: SavedProfile = {
      id: profile.id,
      fullName: profile.fullName,
      age: profile.age,
      city: profile.city.split(',')[0].replace(/\s+City$/i, '').trim(),
      country: profile.country,
      avatarUrl: profile.avatarUrl,
      isVerified: profile.isVerified,
      isOnline: profile.isOnline,
      relationshipIntent: profile.relationshipGoal,
    };
    toggleFavorite(savedObj);
  };

  const handlePass = () => {
    router.push('/discover');
  };

  return (
    <main className="w-full max-w-2xl mx-auto pb-32 sm:py-8 sm:px-4">
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

        {/* Top Controls: Back button and Rep pill */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="h-10 w-10 rounded-full bg-[#17131F]/80 backdrop-blur-md border border-[#7D7E92]/35 text-white flex items-center justify-center active:scale-90 transition-transform shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div 
            className="px-3 py-1 rounded-full bg-[#17131F]/85 border border-[#7D7E92]/40 backdrop-blur-md flex items-center gap-1.5 shadow-lg"
            title={`${rep}% verified community reputation`}
          >
            <span className={`h-2 w-2 rounded-full ${rep >= 80 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-xs font-bold text-[#ECE8F4]">{rep}% Rep</span>
          </div>
        </div>

        {/* Multi-Photo Dots */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
            {photos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePhotoIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === activePhotoIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'
                }`}
                aria-label={`View photo ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Details Body */}
      <div className="p-4 sm:p-6 space-y-5">
        
        {/* Unverified Advisory if not verified */}
        {!profile.isVerified && (
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs space-y-1">
            <strong className="text-amber-200 block font-black uppercase tracking-wide">
              Community Advisory: Identity Not Yet Verified
            </strong>
            <p className="text-amber-100/90 leading-relaxed">
              This member has not yet completed selfie verification. Never send money or share financial credentials.
            </p>
          </div>
        )}

        {/* Identity & Presence Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              {profile.isOnline && (
                <span className="h-3 w-3 rounded-full bg-emerald-400 inline-block shrink-0" title="Online now" />
              )}
              {profile.fullName}, {profile.age}
            </h1>
            {profile.isVerified ? (
              <span className="px-2.5 py-0.5 rounded-lg bg-[#653C87] border border-[#9A79BA]/40 text-white text-xs font-bold shadow-sm">
                Verified
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-lg bg-[#241E2F] border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-sm">
                Unverified
              </span>
            )}
          </div>

          <p className="text-sm font-semibold text-[#DDD8D4] flex items-center gap-1.5">
            <span>{profile.city}, {profile.country}</span>
            {profile.profession && (
              <>
                <span className="text-[#7D7E92]">-</span>
                <span className="text-[#B6AEC7]">{profile.profession}</span>
              </>
            )}
          </p>
        </div>

        {/* Trust & Relationship Goal Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#241E2F] border border-[#7D7E92]/25 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B6AEC7] block">
              Reputation
            </span>
            <span className="text-sm sm:text-base font-extrabold text-[#ECE8F4] flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {rep}% Community Trust
            </span>
          </div>

          <div className="rounded-2xl bg-[#241E2F] border border-[#7D7E92]/25 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B6AEC7] block">
              Looking For
            </span>
            <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 block truncate">
              {profile.relationshipGoal}
            </span>
          </div>
        </div>

        {/* Bio Section */}
        <div className="rounded-3xl bg-[#241E2F] border border-[#7D7E92]/25 p-5 space-y-3.5 shadow-xl">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#B6AEC7]">
            About {profile.fullName}
          </h2>
          {bioParagraphs.map((paragraph: string, i: number) => (
            <p key={i} className="text-base text-[#F3EBF9] leading-relaxed font-medium">
              {paragraph}
            </p>
          ))}

          {/* Vitals: Languages, Height, Education */}
          <div className="pt-3 border-t border-[#7D7E92]/20 flex flex-wrap gap-2 text-xs">
            {profile.languages?.map((lang: string) => (
              <span key={lang} className="px-3 py-1.5 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-[#DDD8D4] font-semibold">
                {lang}
              </span>
            ))}
            {profile.heightCm && (
              <span className="px-3 py-1.5 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-[#DDD8D4] font-semibold">
                {profile.heightCm} cm
              </span>
            )}
            {profile.education && (
              <span className="px-3 py-1.5 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-[#DDD8D4] font-semibold">
                {profile.education}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Floating Bottom Action Dock: Pass, Heart, and Message */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#17131F]/90 backdrop-blur-lg border-t border-[#7D7E92]/20 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* Pass (X) */}
          <button
            type="button"
            onClick={handlePass}
            className="h-12 w-12 rounded-2xl bg-[#241E2F] border border-[#7D7E92]/30 flex items-center justify-center text-[#7D7E92] hover:text-[#ECE8F4] active:scale-90 transition-all shrink-0"
            title="Pass"
          >
            <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Message Link */}
          <Link
            href={`/chat/${profile.id}`}
            className="flex-1 py-3.5 rounded-2xl bg-[#653C87] hover:bg-[#7D48A5] border border-[#9A79BA]/35 text-white font-extrabold text-sm text-center shadow-lg active:scale-[0.98] transition-all"
          >
            Send Message
          </Link>

          {/* Favorite */}
          <button
            type="button"
            onClick={handleToggleFavorite}
            className="h-12 w-12 rounded-2xl bg-[#241E2F] border border-[#7D7E92]/30 flex items-center justify-center active:scale-90 transition-all shrink-0"
            title={favorited ? "Favorited" : "Like"}
          >
            <svg
              className={`w-6 h-6 transition-colors ${
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
    </main>
  );
}