'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, HeartHandshake, Ban, Users, ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';


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
    <div className="min-h-screen flex flex-col bg-[#F8F7FA] text-[#1C1924]">
      <Navbar />

      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        
        {/* Navigation */}
        <div className="mb-4">
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A8CC3] hover:text-[#1C1924] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discover</span>
          </Link>
        </div>

        {/* Editorial Card */}
        <div className="rounded-3xl bg-[#FFFFFF] border border-[#9A8CC3]/35 p-6 sm:p-9 shadow-2xl space-y-6">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#9A8CC3]">
              Platform Guidelines
            </span>
            <h1 className="text-2xl sm:text-3xl font-medium text-[#1C1924] mt-1 mb-2 ">
              Community Standards
            </h1>
            <p className="text-xs sm:text-sm text-[#1C1924] leading-relaxed">
              These standards apply equally to every member—international gentlemen and Southeast Asian ladies alike. They are built directly into our verification systems and chat protections to ensure a safe, honest, and comfortable environment for everyone.
            </p>
          </div>

          <div className="border-t border-[#9A8CC3]/20 pt-6 space-y-5">
            {standards.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-[#B2A4D7]" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-medium text-[#1C1924]">{s.title}</h2>
                    <p className="text-xs sm:text-sm text-[#1C1924] leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[#9A8CC3]/20 text-center">
            <Link
              href="/discover"
              className="inline-block px-8 py-3.5 rounded-2xl bg-[#6555B8] hover:bg-[#7D4B9F] text-white text-xs sm:text-sm font-medium shadow-lg shadow-[#6555B8]/40 transition active:scale-[0.98]"
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

