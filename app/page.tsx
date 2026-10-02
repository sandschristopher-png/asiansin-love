import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, HeartHandshake, Sparkles, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7FA] text-[#1C1924]">
      {/* Hero Section */}
      <main className="flex-1 w-full px-5 pt-12 pb-16 flex flex-col items-center text-center space-y-7">
        
        {/* Full Headline with Deep Vertical Gradient */}
        <div className="space-y-3.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFC] text-[#6555B8] text-xs font-semibold border border-[#6555B8]/20">
            <Sparkles className="w-3.5 h-3.5" />
            Serious Courtship & Marriage
          </span>

          <h1 className="text-3xl font-extrabold tracking-tight leading-[1.12] bg-gradient-to-b from-[#181126] via-[#3E2F6E] to-[#6555b8] bg-clip-text text-transparent">
            Where Intentional Love Crosses Oceans
          </h1>

          <p className="text-sm text-[#524B5E] leading-relaxed max-w-sm mx-auto font-normal">
            Connecting sincere singles worldwide with family-oriented women across Southeast Asia. Designed for courtship, transparency, and lasting commitment.
          </p>
        </div>

        {/* Call to Actions */}
        <div className="flex flex-col gap-2.5 w-full pt-1">
          <Link
            href="/login"
            className="w-full py-3.5 rounded-full bg-[#6555b8] hover:bg-[#52449e] text-sm font-bold text-white transition active:scale-95 shadow-md flex items-center justify-center gap-2"
          >
            <span>Create Your Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/discover"
            className="w-full py-3.5 rounded-full bg-white hover:bg-[#F2EFF8] border border-[#DDD7E5] text-sm font-semibold text-[#1C1924] transition active:scale-95 shadow-xs flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4 text-[#6555b8]" />
            <span>Discover Who's Here</span>
          </Link>
        </div>

        {/* Feature Highlights - Clean Vertical Stack for 430px */}
        <div className="flex flex-col gap-2.5 text-left w-full pt-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E8E4EF] shadow-xs flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#F3EFFC] flex items-center justify-center text-[#6555b8] shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C1924]">Always Free for Women</h3>
              <p className="text-xs text-[#524B5E] leading-relaxed mt-0.5">
                Southeast Asian members browse, match, and message with completely open inboxes.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8E4EF] shadow-xs flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C1924]">Direct & Uncluttered</h3>
              <p className="text-xs text-[#524B5E] leading-relaxed mt-0.5">
                No coin packs, micro-transactions, or third-party ad clutter. Just honest profiles.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8E4EF] shadow-xs flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#F3EFFC] flex items-center justify-center text-[#6555b8] shrink-0 mt-0.5">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C1924]">Intentional Courtship</h3>
              <p className="text-xs text-[#524B5E] leading-relaxed mt-0.5">
                Built exclusively for singles seeking marriage, family, and lifelong commitment.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}