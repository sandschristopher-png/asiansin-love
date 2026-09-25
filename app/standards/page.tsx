'use client';

import React from 'react';
import Link from 'next/link';

export default function CourtshipStandardsPage() {
  return (
    <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center">
      
      {/* Title */}
      <div className="border-b border-[#725A7A]/25 pb-4 mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-[family-name:var(--font-nunito)]">
          Our Community Values
        </h1>
        <p className="text-xs sm:text-sm text-[#DDD8D4] mt-1 max-w-md mx-auto">
          Built for sincere conversation, mutual kindness, and real companionship.
        </p>
      </div>

      {/* Editorial Card */}
      <div className="rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 p-6 sm:p-9 shadow-2xl space-y-6 text-sm text-[#DDD8D4] leading-relaxed">
        
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white mb-1.5">
            Dating Designed for Real People (Not 2005)
          </h2>
          <p>
            If you've spent any time on cross-border dating sites, you've probably noticed they often feel transactional, clunky, or just plain exhausting. We built asiansin.love to be different: a dignified, modern community where both international men and Southeast Asian ladies can get to know each other with mutual respect, zero games, and zero pressure.
          </p>
        </div>

        <div className="border-t border-[#725A7A]/20 pt-5 space-y-4">
          <div className="flex gap-3">
            <span className="text-[#978FA8] font-bold text-base">•</span>
            <div>
              <strong className="text-white block font-bold">Mutual Respect Above All</strong>
              Kindness and good manners never go out of style. We treat every conversation with dignity, recognizing that great relationships grow from shared values, curiosity, and genuine care.
            </div>
          </div>

          <div className="flex gap-3">
            <span className="text-[#978FA8] font-bold text-base">•</span>
            <div>
              <strong className="text-white block font-bold">Real Smiles, Real Humans</strong>
              Nobody likes talking to bots or outdated pictures from a decade ago. Our quick gesture verification helps confirm that everyone here is real, present, and sincere.
            </div>
          </div>

          <div className="flex gap-3">
            <span className="text-[#978FA8] font-bold text-base">•</span>
            <div>
              <strong className="text-white block font-bold">A Safe, Pressure-Free Space for Everyone</strong>
              True courtship is built on trust, not financial requests or gifts. Keeping money out of early conversations protects everyone involved and keeps the focus where it belongs: on each other.
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#725A7A]/20 text-center">
          <Link
            href="/discover"
            className="inline-block px-7 py-3 rounded-2xl bg-[#653C87] hover:bg-[#7A49A2] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98]"
          >
            Explore Profiles
          </Link>
        </div>

      </div>

    </main>
  );
}
