'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7FA] text-[#1C1924]">
      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center justify-center text-center space-y-10">
        
        {/* Main Headline */}
        <div className="space-y-6 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] text-[#1C1924]">
            Where Intentional Love <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#6555b8] via-[#8571db] to-[#6555b8] bg-clip-text text-transparent">
              Crosses Oceans
            </span>
          </h1>
          <p className="text-base sm:text-lg text-[#524B5E] leading-relaxed max-w-2xl mx-auto font-normal">
            asiansin.love is an intentional platform connecting international singles with sincere women across Southeast Asia. Designed for meaningful dialogue, family values, and genuine long-term relationships.
          </p>
        </div>

        {/* Primary Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto pt-2">
          <Link
            href="/discover"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#6555b8] hover:bg-[#52449e] text-sm font-semibold text-white transition active:scale-95 shadow-md flex items-center justify-center gap-2"
          >
            <span>Explore Profiles</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white hover:bg-[#F3EFFC] border border-[#DDD7E5] text-sm font-semibold text-[#1C1924] hover:border-[#6555b8]/50 transition active:scale-95 shadow-xs"
          >
            Create Your Account
          </Link>
        </div>

        {/* Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8 text-left w-full max-w-5xl">
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs hover:border-[#6555b8]/35 transition-all space-y-3">
            <div className="w-9 h-9 rounded-2xl bg-[#F3EFFC] flex items-center justify-center text-[#6555b8]">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-bold text-[#1C1924] uppercase tracking-wider">
              Always Free for Women
            </h3>
            <p className="text-xs sm:text-sm text-[#524B5E] leading-relaxed">
              Southeast Asian members browse, match, and message completely free with unhindered inboxes.
            </p>
          </div>

          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs hover:border-[#6555b8]/35 transition-all space-y-3">
            <div className="w-9 h-9 rounded-2xl bg-[#F3EFFC] flex items-center justify-center text-[#6555b8]">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <h3 className="text-xs font-bold text-[#1C1924] uppercase tracking-wider">
              Direct & Uncluttered
            </h3>
            <p className="text-xs sm:text-sm text-[#524B5E] leading-relaxed">
              No coin packs, micro-transactions, or third-party ad clutter. Just clean profiles and direct communication.
            </p>
          </div>

          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs hover:border-[#6555b8]/35 transition-all space-y-3">
            <div className="w-9 h-9 rounded-2xl bg-[#F3EFFC] flex items-center justify-center text-[#6555b8]">
              <HeartHandshake className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-bold text-[#1C1924] uppercase tracking-wider">
              Intentional Courtship
            </h3>
            <p className="text-xs sm:text-sm text-[#524B5E] leading-relaxed">
              Built for people seeking marriage, family, and lifelong cross-border commitments.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}