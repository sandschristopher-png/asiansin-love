'use client';

import React, { useState } from 'react';
import { SafetyGuidelinesModal } from './SafetyGuidelinesModal';
import { InteractionReviewModal } from './InteractionReviewModal';

export interface ProfileData {
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
}

interface ProfileDisplayProps {
  profile: ProfileData;
  currentUserId: string;
  onInitiateChat: (targetId: string) => void;
}

export function ProfileDisplay({ profile, currentUserId, onInitiateChat }: ProfileDisplayProps) {
  const [activePhoto, setActivePhoto] = useState(profile.avatarUrl);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasAcknowledgedSafety, setHasAcknowledgedSafety] = useState(false);

  const handleStartConversation = () => {
    if (!hasAcknowledgedSafety) {
      setShowSafetyModal(true);
    } else {
      onInitiateChat(profile.id);
    }
  };

  const isPendingReview = profile.avatarStatus === 'pending_review';
  const hasAdvisory = profile.trustStatus && profile.trustStatus !== 'clear';

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-10">
      
      {/* Notice Banner */}
      {hasAdvisory && profile.trustPill && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-md flex items-center justify-between gap-4">
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
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#9A8CC3]/25">
          <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#2D2F4C]">
            <img
              src={activePhoto}
              alt={profile.fullName}
              className={`w-full h-full object-cover transition-all duration-700 ${
                isPendingReview ? 'blur-md grayscale' : ''
              }`}
            />

            {isPendingReview && (
              <div className="absolute inset-0 bg-[#2D2F4C]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold uppercase tracking-wider mb-2">
                  Review Queued
                </span>
                <p className="text-xs text-[#B2A4D7]">Avatar undergoing identity approval.</p>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4">
              {profile.isVerified ? (
                <span className="px-3 py-1 rounded-full bg-[#6555B8]/80 border border-[#9A8CC3]/50 backdrop-blur-md text-xs font-semibold text-white shadow-md">
                  Verified Identity
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-[#2D2F4C]/80 border border-[#9A8CC3]/40 backdrop-blur-md text-xs font-medium text-[#B2A4D7]">
                  Unverified
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {profile.galleryUrls?.length > 0 && (
            <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActivePhoto(profile.avatarUrl)}
                className={`relative h-16 w-16 rounded-xl overflow-hidden border transition-all ${
                  activePhoto === profile.avatarUrl ? 'border-[#9A8CC3] ring-2 ring-[#9A8CC3]/30' : 'border-[#DDD7E5]/60 opacity-50 hover:opacity-100'
                }`}
              >
                <img src={profile.avatarUrl} alt="Thumb" className="h-full w-full object-cover" />
              </button>
              {profile.galleryUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhoto(url)}
                  className={`relative h-16 w-16 rounded-xl overflow-hidden border transition-all ${
                    activePhoto === url ? 'border-[#9A8CC3] ring-2 ring-[#9A8CC3]/30' : 'border-[#DDD7E5]/60 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="Thumb" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information Hierarchy (5 cols) */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium  text-white">
                {profile.fullName}, <span className="text-[#B2A4D7] font-normal">{profile.age}</span>
              </h1>
              <p className="text-xs text-[#B2A4D7] font-medium mt-1">
                {profile.city}, {profile.country}
              </p>
              {profile.jobTitle && (
                <p className="text-xs text-[#9A8CC3] font-mono mt-1">{profile.jobTitle}</p>
              )}
            </div>

            {/* Seeking */}
            <div className="pt-4 border-t border-[#9A8CC3]/25">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#9A8CC3] block mb-1">
                Seeking
              </span>
              <p className="text-xs font-medium text-[#1C1924]">{profile.relationshipIntent}</p>
            </div>

            {/* Languages */}
            <div className="pt-4 border-t border-[#9A8CC3]/25">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#9A8CC3] block mb-2">
                Languages
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.languages?.map((lang) => (
                  <span key={lang} className="px-2 py-0.5 bg-[#2D2F4C] border border-[#9A8CC3]/20 rounded text-[11px] text-[#C6CBD1]">
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div className="pt-4 border-t border-[#9A8CC3]/25">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#9A8CC3] block mb-2">
                Statement
              </span>
              <p className="text-xs sm:text-sm text-[#B2A4D7] leading-relaxed font-normal whitespace-pre-line">
                {profile.bio || "No personal introduction written yet."}
              </p>
            </div>
          </div>

          {/* Action Module */}
          <div className="mt-8 pt-6 border-t border-[#9A8CC3]/25 space-y-2.5">
            <button
              onClick={handleStartConversation}
              disabled={profile.trustStatus === 'under_review'}
              className="w-full py-3 rounded-xl bg-[#6555B8] hover:bg-[#7D4B9F] text-[#F3EBF9] shadow-lg shadow-[#3B3D60]/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold text-xs "
            >
              Direct Message
            </button>

            <button
              onClick={() => setShowReviewModal(true)}
              className="w-full py-2.5 rounded-xl bg-[#2D2F4C] hover:bg-[#2D2F4C] border border-[#9A8CC3]/25 text-[11px] font-medium text-[#C6CBD1] transition-colors"
            >
              Feedback on This Member
            </button>
          </div>
        </div>

      </div>

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
        reviewerId={currentUserId}
        targetUserId={profile.id}
        targetUserName={profile.fullName}
        onClose={() => setShowReviewModal(false)}
        onSuccess={() => {
          alert('Thank you. Your feedback helps keep the platform safe.');
        }}
      />
    </div>
  );
}

