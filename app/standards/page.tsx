'use client';

import React from 'react';
import Link from 'next/link';

export default function CourtshipStandardsPage() {
  const standards = [
    {
      title: 'Mutual Respect & Equality',
      summary:
        'Meaningful connections start with seeing each other as equals. We foster genuine conversations rooted in kindness, common interests, and shared values—free from condescension or stereotyping.',
      icon: '🤝',
    },
    {
      title: 'Authentic Self-Representation',
      summary:
        'Every member is encouraged to present their true self. Through gesture photo verification and honest profiles, we ensure conversations are genuine and human.',
      icon: '✨',
    },
    {
      title: 'Safe & Pressure-Free Communication',
      summary:
        'Courtship should unfold naturally. Financial requests, solicitations, or transactional arrangements are strictly prohibited, keeping our community safe and focused on authentic relationships.',
      icon: '🛡️',
    },
    {
      title: 'Intentional & Thoughtful Connections',
      summary:
        'Our members are here with purpose—seeking genuine partnership, meaningful companionship, and shared futures. We prioritize quality conversations over endless swiping.',
      icon: '🌱',
    },
  ];

  return (
    <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 flex flex-col justify-center">
      
      {/* Header */}
      <div className="border-b border-[#725A7A]/25 pb-4 mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Community Values & Standards
        </h1>
        <p className="text-xs sm:text-sm text-[#DDD8D4] mt-1 max-w-xl mx-auto">
          Our shared principles for fostering genuine, respectful, and dignified cross-border relationships.
        </p>
      </div>

      {/* Standards Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {standards.map((s, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-[#241E2F] border border-[#725A7A]/35 shadow-lg space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">{s.icon}</span>
                <h2 className="text-base font-bold text-white">{s.title}</h2>
              </div>
              <p className="text-xs sm:text-sm text-[#DDD8D4] leading-relaxed">
                {s.summary}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Action */}
      <div className="mt-8 text-center">
        <Link
          href="/discover"
          className="inline-block px-6 py-2.5 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98]"
        >
          Return to Discovery
        </Link>
      </div>

    </main>
  );
}
