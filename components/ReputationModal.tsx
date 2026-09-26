'use client';

import React from 'react';
import { 
  ShieldCheck, 
  MessageSquareHeart, 
  HeartHandshake, 
  CheckCircle2, 
  Sparkles, 
  FileCheck2, 
  ThumbsUp, 
  X 
} from 'lucide-react';

interface ReputationMetric {
  title: string;
  desc: string;
  points: string;
  icon: React.ReactNode;
}

interface ReputationModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  score: number;
}

export default function ReputationModal({
  isOpen,
  onClose,
  name,
  score,
}: ReputationModalProps) {
  if (!isOpen) return null;

  const behavioralMetrics: ReputationMetric[] = [
    {
      title: 'Respectful Courtship Conduct',
      desc: '100% clean safety record with zero behavioral warnings, spam flags, or harassment reports.',
      points: '+35 pts',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    },
    {
      title: 'Conversational Health & Reply Rate',
      desc: 'Thoughtful conversation partner who consistently engages in meaningful, reciprocal dialogue.',
      points: '+25 pts',
      icon: <MessageSquareHeart className="w-4 h-4 text-purple-400" />,
    },
    {
      title: 'Community Endorsements',
      desc: 'Positively endorsed by mutual matches for courtesy, punctuality, and authenticity.',
      points: '+25 pts',
      icon: <HeartHandshake className="w-4 h-4 text-purple-400" />,
    },
    {
      title: 'Profile Sincerity & Effort',
      desc: 'Thoroughly filled out relationship intentions, lifestyle values, and authentic interests.',
      points: '+15 pts',
      icon: <FileCheck2 className="w-4 h-4 text-purple-400" />,
    },
  ];

  const peerTags = [
    'Polite & Respectful',
    'Great Listener',
    'Honest Intentions',
    'Prompt Replies',
    'True to Photos',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#181222] border border-[#9A79BA]/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#653C87] to-[#42225B] border border-[#9A79BA]/40 flex items-center justify-center shadow-lg shadow-[#653C87]/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-white">{name}&apos;s Conduct Index</h3>
              </div>
              <p className="text-xs text-[#D5CEE5]/70">Behavioral Sincerity Score</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#A8A2AB] hover:text-white hover:bg-[#261F33] transition"
            aria-label="Close reputation breakdown"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Score Card */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#20182E] border border-[#9A79BA]/25">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#A8A2AB]">Behavioral Standing</span>
            <p className="text-xs text-[#D5CEE5]">
              {score >= 95 ? 'Exceptional etiquette: exemplary community member.' : 'Respectful member in solid standing.'}
            </p>
          </div>
          <div className="flex items-baseline gap-0.5 bg-[#653C87]/40 px-3 py-1.5 rounded-xl border border-[#9A79BA]/40">
            <span className="text-2xl font-extrabold text-white">{score}</span>
            <span className="text-xs font-semibold text-[#C9A4E8]">%</span>
          </div>
        </div>

        {/* Behavioral Pillars Breakdown */}
        <div className="space-y-2.5">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#A8A2AB] px-0.5">
            How This Score Is Earned
          </h4>
          <div className="space-y-2">
            {behavioralMetrics.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#20182E]/60 border border-[#9A79BA]/15 hover:border-[#9A79BA]/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#2B203C] border border-[#9A79BA]/20 shrink-0">
                    {m.icon}
                  </div>
                  <div className="space-y-0.5 text-left">
                    <p className="text-xs font-semibold text-white leading-tight">{m.title}</p>
                    <p className="text-[10px] text-[#A8A2AB] line-clamp-1">{m.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-[11px] font-mono font-medium text-emerald-400">{m.points}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peer Endorsement Tags */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#A8A2AB] px-0.5">
            <ThumbsUp className="w-3 h-3 text-[#9A79BA]" />
            <span>Community Tags</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {peerTags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-full bg-[#2B203C]/80 border border-[#9A79BA]/25 text-[11px] text-[#E6D7FA]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="pt-2 border-t border-[#7D7E92]/20 flex items-center justify-between text-[11px] text-[#A8A2AB]">
          <span>Updated dynamically based on behavior</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#653C87] hover:bg-[#7D49A8] text-white text-xs font-semibold transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
