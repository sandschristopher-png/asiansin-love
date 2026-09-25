'use client';

import React from 'react';
import Link from 'next/link';

export default function CommunityStandardsPage() {
  const standards = [
    {
      title: 'Human Verification & Honest Photos',
      description:
        'Everyone deserves to know they are speaking with a real person. Members complete live gesture pose selfies to earn a verified profile badge. Stock photos, AI avatars, third-party agency reps, and outdated images are not permitted.',
    },
    {
      title: 'Zero Financial Solicitations',
      description:
        'This platform exists for personal relationships, not transactions. Soliciting money, remittances, emergency funds, bills, travel allowances, or cryptocurrency—from either side—triggers our automated safety interceptors and results in immediate account suspension.',
    },
    {
      title: 'Mutual Dignity & Respectful Communication',
      description:
        'Every member is expected to communicate courteously and politely. Harassment, condescending behavior, vulgarity, or unsolicited explicit photos will not be tolerated. Treat conversational partners as equals.',
    },
    {
      title: 'Direct, Member-to-Member Messaging',
      description:
        'All interactions must be directly between the account holder and their matches. We prohibit shared profiles, translators posing as members, and managers handling messages on behalf of others.',
    },
  ];

  return (
    <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center">
      
      {/* Editorial Card */}
      <div className="rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 p-6 sm:p-9 shadow-2xl space-y-6 text-sm text-[#DDD8D4] leading-relaxed">
        
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8AAC3]">
            Platform Guidelines
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1 mb-2 font-[family-name:var(--font-nunito)]">
            Community Standards
          </h1>
          <p className="text-xs sm:text-sm text-[#DDD8D4] leading-relaxed">
            These standards apply equally to every member—international gentlemen and Southeast Asian ladies alike. They are built directly into our verification systems and chat protections to ensure a safe, honest, and comfortable environment for everyone.
          </p>
        </div>

        <div className="border-t border-[#725A7A]/20 pt-5 space-y-4">
          {standards.map((s, idx) => (
            <div key={idx} className="flex gap-3">
              <span className="text-[#978FA8] font-bold text-base">•</span>
              <div>
                <strong className="text-white block font-bold mb-0.5">{s.title}</strong>
                <span className="text-xs sm:text-sm text-[#DDD8D4] leading-relaxed">
                  {s.description}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[#725A7A]/20 text-center">
          <Link
            href="/discover"
            className="inline-block px-7 py-3 rounded-2xl bg-[#653C87] hover:bg-[#7A49A2] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98]"
          >
            Back to Profiles
          </Link>
        </div>

      </div>

    </main>
  );
}
