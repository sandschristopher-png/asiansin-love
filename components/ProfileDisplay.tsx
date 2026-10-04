'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShieldCheck, AlertTriangle, Eye, ChevronLeft, ChevronRight, 
  Maximize2, X as CloseIcon, Heart, Sparkles, MessageCircle 
} from 'lucide-react';
import { SafetyGuidelinesModal } from './SafetyGuidelinesModal';
import { InteractionReviewModal } from './InteractionReviewModal';

interface ProfileDisplayProps {
  profile: {
    id: string;
    fullName: string;
    age: number;
    city: string;
    country: string;
    gender: string;
    bio: string;
    avatarUrl: string;
    galleryUrls: string[];
    isVerified: boolean;
    avatarStatus: 'approved' | 'pending_review' | 'rejected';
    relationshipIntent: string;
    languages: string[];
    jobTitle?: string;
    trustStatus?: 'clear' | 'visual_discrepancy' | 'financial_caution' | 'under_review';
    trustPill?: string;
    trustAdvisory?: string;
    interests?: string[];
  };
  currentUserId?: string;
  onInitiateChat: (profileId: string) => void;
  onLike?: (profileId: string) => void;
}

export function ProfileDisplay({ profile, currentUserId, onInitiateChat, onLike }: ProfileDisplayProps) {
  // Consolidate photos into a unified, clean array
  const allPhotos = useMemo(() => {
    const list: string[] = [];
    if (profile.avatarUrl) list.push(profile.avatarUrl);
    if (Array.isArray(profile.galleryUrls)) {
      profile.galleryUrls.forEach((url) => {
        if (url && !list.includes(url)) list.push(url);
      });
    }
    return list.length > 0 ? list : ['/placeholder-avatar.svg'];
  }, [profile.avatarUrl, profile.galleryUrls]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasAcknowledgedSafety, setHasAcknowledgedSafety] = useState(false);

  // Touch & Swipe state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleNextPhoto = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === allPhotos.length - 1 ? 0 : prev + 1));
  };

  const handlePrevPhoto = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? allPhotos.length - 1 : prev - 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next
      handleNextPhoto();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Prev
      handlePrevPhoto();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showLightbox) return;
      if (e.key === 'ArrowRight') handleNextPhoto();
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'Escape') setShowLightbox(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLightbox, allPhotos.length]);

  const handleStartConversation = () => {
    if (!hasAcknowledgedSafety) {
      setShowSafetyModal(true);
    } else {
      onInitiateChat(profile.id);
    }
  };

  const isPendingReview = profile.avatarStatus === 'pending_review';
  const hasAdvisory = profile.trustStatus && profile.trustStatus !== 'clear';
  const hasMultiple = allPhotos.length > 1;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Notice Banner */}
      {hasAdvisory && profile.trustPill && (
        <div className="mb-6 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-medium uppercase tracking-wider">
              {profile.trustPill}
            </span>
            <span className="text-xs text-[#1C1924]">
              {profile.trustAdvisory}
            </span>
          </div>
          <span className="text-[10px] text-amber-400/80 font-mono uppercase tracking-widest hidden sm:inline">
            Notice
          </span>
        </div>
      )}

      {/* Main Architecture Frame */}
      <div className="relative rounded-3xl bg-[#2D2F4C] border border-[#9A8CC3]/25 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Left Column: Visual Showcase (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#9A8CC3]/25">
          <div>
            {/* Hero Photo Container */}
            <div 
              className="relative aspect-[4/5] w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#1E1F33] select-none group cursor-pointer shadow-inner"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={allPhotos[currentIndex]}
                alt={`${profile.fullName} photo ${currentIndex + 1}`}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  isPendingReview ? 'blur-md grayscale' : ''
                }`}
                onClick={() => setShowLightbox(true)}
              />

              {/* Status Pill on Image */}
              {isPendingReview && (
                <div className="absolute inset-0 bg-[#2D2F4C]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                  <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold uppercase tracking-wider mb-2">
                    Review Queued
                  </span>
                  <p className="text-xs text-[#B2A4D7]">Avatar undergoing identity approval.</p>
                </div>
              )}

              {/* Top Bar Badges */}
              <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 pointer-events-none">
                {profile.isVerified ? (
                  <span className="px-3 py-1 rounded-full bg-[#6555B8]/85 border border-[#9A8CC3]/50 backdrop-blur-md text-xs font-semibold text-white shadow-md flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Identity
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-[#1E1F33]/80 border border-[#9A8CC3]/30 backdrop-blur-md text-xs font-medium text-[#B2A4D7]">
                    Unverified
                  </span>
                )}
              </div>

              {/* Fullscreen Expand Action */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLightbox(true);
                }}
                className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-all shadow-md active:scale-95"
                aria-label="Expand photo"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Instagram/Pairs Story Dashes */}
              {hasMultiple && (
                <div className="absolute top-14 inset-x-4 z-20 flex gap-1.5 pointer-events-none">
                  {allPhotos.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        idx === currentIndex ? 'bg-white shadow-sm' : 'bg-white/30 backdrop-blur-xs'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Left / Right Tap Edge Hotspots */}
              {hasMultiple && (
                <>
                  <div
                    onClick={handlePrevPhoto}
                    className="absolute inset-y-16 left-0 w-1/3 z-10 cursor-pointer"
                    aria-label="Previous photo edge"
                  />
                  <div
                    onClick={handleNextPhoto}
                    className="absolute inset-y-16 right-0 w-1/3 z-10 cursor-pointer"
                    aria-label="Next photo edge"
                  />
                  
                  {/* Desktop Hover Arrows */}
                  <div className="hidden sm:flex items-center justify-between absolute inset-x-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={handlePrevPhoto}
                      className="pointer-events-auto p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition shadow-md"
                      aria-label="Previous"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPhoto}
                      className="pointer-events-auto p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition shadow-md"
                      aria-label="Next"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Row Reel (Japanese App Style) */}
            <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1 scrollbar-none snap-x">
              {allPhotos.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all snap-start ${
                    currentIndex === idx 
                      ? 'border-[#9A8CC3] ring-4 ring-[#6555b8]/30 scale-100 shadow-md' 
                      : 'border-transparent opacity-60 hover:opacity-100 hover:scale-95'
                  }`}
                >
                  <img src={url} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-[#B2A4D7]/70 text-center sm:text-left mt-3">
            Swipe or tap photo to flip through &bull; Tap photo to zoom
          </p>
        </div>

        {/* Right Column: Information Hierarchy (5 cols) */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {profile.fullName}, <span className="text-[#B2A4D7] font-normal">{profile.age}</span>
              </h1>
              <p className="text-xs text-[#B2A4D7] font-medium mt-1">
                {profile.city}, {profile.country}
              </p>
              {profile.jobTitle && (
                <p className="text-xs text-[#9A8CC3] font-mono mt-1">{profile.jobTitle}</p>
              )}
            </div>

            {/* Seeking Intent */}
            <div className="pt-4 border-t border-[#9A8CC3]/25">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#9A8CC3] block mb-1">
                Relationship Goal
              </span>
              <p className="text-xs font-semibold text-white">{profile.relationshipIntent}</p>
            </div>

            {/* Languages */}
            <div className="pt-4 border-t border-[#9A8CC3]/25">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#9A8CC3] block mb-2">
                Languages
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.languages?.map((lang) => (
                  <span key={lang} className="px-2.5 py-0.5 bg-[#1E1F33] border border-[#9A8CC3]/30 rounded-full text-[11px] text-[#E0DBEC] font-medium">
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            {/* Bio / Statement */}
            <div className="pt-4 border-t border-[#9A8CC3]/25">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#9A8CC3] block mb-2">
                Statement
              </span>
              <p className="text-xs sm:text-sm text-[#D7CEEC] leading-relaxed font-normal whitespace-pre-line">
                {profile.bio || "No personal introduction written yet."}
              </p>
            </div>
          </div>

          {/* Action Module */}
          <div className="mt-8 pt-6 border-t border-[#9A8CC3]/25 space-y-3">
            <button
              onClick={handleStartConversation}
              disabled={profile.trustStatus === 'under_review'}
              className="w-full py-3.5 rounded-2xl bg-[#6555B8] hover:bg-[#52449E] text-white shadow-xl shadow-[#6555b8]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold text-sm flex items-center justify-center gap-2 active:scale-98"
            >
              <MessageCircle className="w-4 h-4" />
              Direct Message
            </button>

            <button
              onClick={() => setShowReviewModal(true)}
              className="w-full py-2.5 rounded-2xl bg-[#1E1F33]/60 hover:bg-[#1E1F33] border border-[#9A8CC3]/25 text-[11px] font-medium text-[#C6CBD1] transition-all text-center"
            >
              Feedback on This Member
            </button>
          </div>
        </div>

      </div>

      {/* Lightbox / Zoom Modal */}
      {showLightbox && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6"
          onClick={() => setShowLightbox(false)}
        >
          {/* Lightbox Topbar */}
          <div className="flex items-center justify-between text-white z-10" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-medium text-white/80">
              {profile.fullName} &bull; {currentIndex + 1} of {allPhotos.length}
            </div>
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Main Stage */}
          <div 
            className="relative flex-1 flex items-center justify-center my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={allPhotos[currentIndex]}
              alt={profile.fullName}
              className="max-h-full max-w-full object-contain rounded-xl select-none"
            />

            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition shadow-lg"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition shadow-lg"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Strip */}
          <div 
            className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {allPhotos.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-12 w-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                  currentIndex === idx ? 'border-white ring-2 ring-white/50 scale-105' : 'border-transparent opacity-40 hover:opacity-100'
                }`}
              >
                <img src={url} alt="Strip" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <SafetyGuidelinesModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        onAcknowledge={() => {
          setHasAcknowledgedSafety(true);
          onInitiateChat(profile.id);
        }}
      />

      <InteractionReviewModal
        isOpen={showReviewModal}
        reviewerId={currentUserId || ""}
        targetUserId={profile.id}
        targetUserName={profile.fullName}
        onClose={() => setShowReviewModal(false)}
        onSuccess={() => {
          alert('Thank you. Your feedback helps keep the platform safe.');
          setShowReviewModal(false);
        }}
      />
    </div>
  );
}
