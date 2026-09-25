'use client';

import React, { useState } from 'react';

interface InteractionReviewModalProps {
  isOpen: boolean;
  reviewerId: string;
  targetUserId: string;
  targetUserName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function InteractionReviewModal({
  isOpen,
  reviewerId,
  targetUserId,
  targetUserName,
  onClose,
  onSuccess,
}: InteractionReviewModalProps) {
  const [interactionType, setInteractionType] = useState<'video_call' | 'in_person' | 'chat_only'>('video_call');
  const [photosMatched, setPhotosMatched] = useState<boolean | null>(null);
  const [identityAccurate, setIdentityAccurate] = useState<boolean | null>(null);
  const [solicitedMoney, setSolicitedMoney] = useState<boolean | null>(null);
  const [wasRespectful, setWasRespectful] = useState<boolean | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (photosMatched === null || identityAccurate === null || solicitedMoney === null || wasRespectful === null) {
      alert('Please complete all confirmation questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/feedback/date-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerId,
          targetUserId,
          interactionType,
          photosMatched,
          identityAccurate,
          solicitedMoney,
          wasRespectful,
          notes,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit report.');
      }
    } catch {
      alert('Network error submitting feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#241e2f] border border-[#725A7A]/30 p-6 sm:p-8 shadow-2xl text-[#E6D7FA] max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="mb-6">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B8AAC3] block mb-1">
            Confidential Feedback
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Accountability Check for {targetUserName}
          </h2>
          <p className="text-xs text-[#A8A2AB] mt-1 leading-relaxed">
            Your answers are completely private and never shown directly to this member. They help our system maintain high community trust.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Interaction Type */}
          <div>
            <label className="text-xs font-semibold text-white block mb-1.5">Interaction Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['video_call', 'in_person', 'chat_only'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setInteractionType(type)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border capitalize transition-all ${
                    interactionType === type
                      ? 'bg-[#653C87] border-[#9A79BA] text-white'
                      : 'bg-[#1d1827] border-[#725A7A]/20 text-[#A8A2AB] hover:text-white'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Question 1 */}
          <div className="p-3.5 rounded-2xl bg-[#1d1827] border border-[#725A7A]/20">
            <span className="text-xs text-white block mb-2">Did their actual appearance match their profile photos?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPhotosMatched(true)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                  photosMatched === true ? 'bg-[#653C87] border-[#9A79BA] text-white' : 'border-[#725A7A]/20 text-[#A8A2AB]'
                }`}
              >
                Yes, matched
              </button>
              <button
                type="button"
                onClick={() => setPhotosMatched(false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                  photosMatched === false ? 'bg-amber-950/80 border-amber-500/50 text-amber-200' : 'border-[#725A7A]/20 text-[#A8A2AB]'
                }`}
              >
                No, discrepancy
              </button>
            </div>
          </div>

          {/* Question 2 */}
          <div className="p-3.5 rounded-2xl bg-[#1d1827] border border-[#725A7A]/20">
            <span className="text-xs text-white block mb-2">Did this person ask for money, gifts, GCash, or emergency support?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSolicitedMoney(false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                  solicitedMoney === false ? 'bg-[#653C87] border-[#9A79BA] text-white' : 'border-[#725A7A]/20 text-[#A8A2AB]'
                }`}
              >
                No solicitation
              </button>
              <button
                type="button"
                onClick={() => setSolicitedMoney(true)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                  solicitedMoney === true ? 'bg-amber-950/80 border-amber-500/50 text-amber-200' : 'border-[#725A7A]/20 text-[#A8A2AB]'
                }`}
              >
                Yes, asked for funds
              </button>
            </div>
          </div>

          {/* Question 3 */}
          <div className="p-3.5 rounded-2xl bg-[#1d1827] border border-[#725A7A]/20">
            <span className="text-xs text-white block mb-2">Were they respectful of personal boundaries?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWasRespectful(true)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                  wasRespectful === true ? 'bg-[#653C87] border-[#9A79BA] text-white' : 'border-[#725A7A]/20 text-[#A8A2AB]'
                }`}
              >
                Yes, respectful
              </button>
              <button
                type="button"
                onClick={() => setWasRespectful(false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                  wasRespectful === false ? 'bg-rose-950/80 border-rose-500/50 text-rose-200' : 'border-[#725A7A]/20 text-[#A8A2AB]'
                }`}
              >
                Disrespectful / inappropriate
              </button>
            </div>
          </div>

          {/* Question 4 */}
          <div className="p-3.5 rounded-2xl bg-[#1d1827] border border-[#725A7A]/20">
            <span className="text-xs text-white block mb-2">Was their background information honest (e.g. single status, intent)?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIdentityAccurate(true)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                  identityAccurate === true ? 'bg-[#653C87] border-[#9A79BA] text-white' : 'border-[#725A7A]/20 text-[#A8A2AB]'
                }`}
              >
                Yes, honest
              </button>
              <button
                type="button"
                onClick={() => setIdentityAccurate(false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                  identityAccurate === false ? 'bg-amber-950/80 border-amber-500/50 text-amber-200' : 'border-[#725A7A]/20 text-[#A8A2AB]'
                }`}
              >
                Dishonest / misleading
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-white block mb-1">Confidential Notes (Staff Only)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any details to help our safety moderation team..."
              className="w-full rounded-xl bg-[#1d1827] border border-[#725A7A]/20 p-3 text-xs text-white placeholder-[#A8A2AB]/40 focus:outline-none focus:border-[#9A79BA]"
            />
          </div>
        </div>

        {/* Action Tray */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-[#653C87] hover:bg-[#7a49a2] disabled:opacity-50 text-[#F3EBF9] font-semibold text-xs transition-all shadow-lg shadow-[#41384E]/50"
          >
            {isSubmitting ? 'Recording...' : 'Submit Confidential Report'}
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#1d1827] hover:bg-[#282136] text-[#A8A2AB] text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
