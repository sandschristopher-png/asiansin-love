'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, HeartHandshake, Ban, Users, ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function CommunityStandardsPage() {
  const standards = [
    {
      icon: ShieldCheck,
      title: 'Human Verification & Honest Photos',
      description:
        'Everyone deserves to know they are speaking with a real person. Members complete live gesture pose selfies to earn a verified profile badge. Stock photos, AI avatars, third-party agency reps, and outdated images are not permitted.',
    },
    {
      icon: Ban,
      title: 'Zero Financial Solicitations',
      description:
        'This platform exists for personal relationships, not transactions. Soliciting money, remittances, emergency funds, bills, travel allowances, or cryptocurrency—from either side—triggers automated safety interceptors and results in immediate account suspension.',
    },
    {
      icon: HeartHandshake,
      title: 'Mutual Dignity & Respectful Communication',
      description:
        'Every member is expected to communicate courteously and politely. Harassment, condescending behavior, vulgarity, or unsolicited explicit photos will not be tolerated. Treat conversational partners as equals.',
    },
    {
      icon: Users,
      title: 'Direct, Member-to-Member Messaging',
      description:
        'All interactions must be directly between the account holder and their matches. We prohibit shared profiles, translators posing as members, and managers handling messages on behalf of others.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#130F18] text-[#E6D7FA]">
      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        
        {/* Navigation */}
        <div className="mb-4">
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A79BA] hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discover</span>
          </Link>
        </div>

        {/* Editorial Card */}
        <div className="rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 p-6 sm:p-9 shadow-2xl space-y-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A79BA]">
              Platform Guidelines
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 mb-2 tracking-tight">
              Community Standards
            </h1>
            <p className="text-xs sm:text-sm text-[#E6D7FA] leading-relaxed">
              These standards apply equally to every member—international gentlemen and Southeast Asian ladies alike. They are built directly into our verification systems and chat protections to ensure a safe, honest, and comfortable environment for everyone.
            </p>
          </div>

          <div className="border-t border-[#9A79BA]/20 pt-6 space-y-5">
            {standards.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-[#181222] border border-[#9A79BA]/35 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-[#C9A4E8]" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-white">{s.title}</h2>
                    <p className="text-xs sm:text-sm text-[#E6D7FA] leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[#9A79BA]/20 text-center">
            <Link
              href="/discover"
              className="inline-block px-8 py-3.5 rounded-2xl bg-[#653C87] hover:bg-[#7D49A8] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#653C87]/40 transition active:scale-[0.98]"
            >
              Back to Profiles
            </Link>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
