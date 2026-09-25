'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [isDisliked, setIsDisliked] = useState(false);

  // Swipe handling
  const touchStartX = useRef<number | null>(null);

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

  // Sync dislike status
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ail_disliked_ids');
      if (stored) {
        const ids = JSON.parse(stored);
        if (Array.isArray(ids) && ids.includes(profile.id)) {
          setIsDisliked(true);
        }
      }
    } catch {
      // Fallback cleanly
    }
  }, [profile.id]);

  const handleNextPhoto = () => {
    if (activePhotoIndex < photos.length - 1) {
      setActivePhotoIndex((prev) => prev + 1);
    }
  };

  const handlePrevPhoto = () => {
    if (activePhotoIndex > 0) {
      setActivePhotoIndex((prev) => prev - 1);
    }
  };

  const handlePhotoAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width * 0.35) {
      handlePrevPhoto();
    } else {
      handleNextPhoto();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (diffX > 40) {
      handleNextPhoto();
    } else if (diffX < -40) {
      handlePrevPhoto();
    }
    touchStartX.current = null;
  };

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

  const handleDislikeToggle = () => {
    const nextState = !isDisliked;
    setIsDisliked(nextState);

    try {
      const stored = localStorage.getItem('ail_disliked_ids');
      let ids: string[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(ids)) ids = [];

      if (nextState) {
        if (!ids.includes(profile.id)) ids.push(profile.id);
      } else {
        ids = ids.filter((item) => item !== profile.id);
      }
      localStorage.setItem('ail_disliked_ids', JSON.stringify(ids));
    } catch {
      // Ignore
    }
  };

  return (
    <main className="w-full max-w-2xl mx-auto pb-32 sm:py-6 sm:px-4">
      {/* Hero Photo Frame with Uncut Aspect Ratio */}
      <div 
        className="relative w-full aspect-[3/4] max-h-[68vh] sm:rounded-3xl overflow-hidden bg-[#17131F] shadow-2xl cursor-pointer select-none"
        onClick={handlePhotoAreaClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={photos[activePhotoIndex] || profile.avatarUrl}
          alt={profile.fullName}
          fill
          priority
          sizes="(max-width: 640px) 100vw, 640px"
          className="object-cover object-[50%_20%] transition-all duration-300"
          unoptimized
        />

        {/* Subtle Bottom Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#15101C] via-transparent to-black/40 pointer-events-none" />

        {/* Top Story Dash Indicators */}
        {photos.length > 1 && (
          <div className="absolute top-3 left-4 right-4 flex gap-1.5 z-30 pointer-events-none">
            {photos.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  idx === activePhotoIndex ? 'bg-white shadow-sm' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* Top Bar Controls */}
        <div className="absolute top-7 left-4 right-4 flex items-center justify-between z-30 pointer-events-auto">
          {/* Back Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.back();
            }}
            aria-label="Back"
            className="h-10 w-10 rounded-full bg-[#17131F]/80 backdrop-blur-md border border-[#7D7E92]/35 text-white flex items-center justify-center active:scale-90 transition-transform shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Reputation Badge */}
          <div 
            className="px-3 py-1 rounded-full bg-[#17131F]/85 border border-[#7D7E92]/40 backdrop-blur-md flex items-center gap-1.5 shadow-lg"
            title={`${rep}% verified community reputation`}
          >
            <span className={`h-2 w-2 rounded-full ${rep >= 80 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-xs font-bold text-[#ECE8F4]">{rep}% Rep</span>
          </div>
        </div>

        {/* Identity Directly on Photo Frame (Reference Style) */}
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              {profile.fullName}, {profile.age}
            </h1>
            {profile.isVerified && (
              <span className="px-2 py-0.5 rounded-lg bg-[#653C87] border border-[#9A79BA]/50 text-white text-xs font-bold shadow-md">
                ✓ Verified
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium text-white/90 drop-shadow mt-0.5">
            {profile.city}, {profile.country} {profile.profession ? `• ${profile.profession}` : ''}
          </p>
        </div>
      </div>

      {/* Main Content Details */}
      <div className="p-4 sm:p-6 space-y-4">
        
        {/* Streamlined Courtship & Status Row */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#241E2F] border border-[#7D7E92]/25">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B6AEC7]">Looking For:</span>
            <span className="text-sm font-extrabold text-[#E6D7FA]">{profile.relationshipGoal}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#B6AEC7]">
            <span className={`h-2 w-2 rounded-full ${profile.isOnline ? 'bg-emerald-400' : 'bg-[#7D7E92]'}`} />
            {profile.isOnline ? 'Active Now' : 'Offline'}
          </div>
        </div>

        {/* Bio Section */}
        <div className="rounded-3xl bg-[#241E2F] border border-[#7D7E92]/25 p-5 space-y-3 shadow-xl">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#B6AEC7]">
            About {profile.fullName}
          </h2>
          {bioParagraphs.map((paragraph: string, i: number) => (
            <p key={i} className="text-base text-[#F3EBF9] leading-relaxed font-medium">
              {paragraph}
            </p>
          ))}

          {/* Vitals */}
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

      {/* Floating Bottom Action Dock: Pass (Dim), Message, Heart */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#17131F]/90 backdrop-blur-lg border-t border-[#7D7E92]/20 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* Pass / Dislike (✕) */}
          <button
            type="button"
            onClick={handleDislikeToggle}
            className={`h-12 w-12 rounded-2xl border flex items-center justify-center active:scale-90 transition-all shrink-0 ${
              isDisliked
                ? 'bg-white/10 border-white/30 text-white'
                : 'bg-[#241E2F] border-[#7D7E92]/30 text-[#7D7E92] hover:text-[#ECE8F4]'
            }`}
            title={isDisliked ? "Un-pass" : "Pass (Dim)"}
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