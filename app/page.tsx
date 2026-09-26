'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#130f18] text-[#E6D7FA]">
      
      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center justify-center text-center space-y-8">
        
        {/* Main Headline with Purple to White Gradient */}
        <div className="space-y-5 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-[#9A79BA] via-[#DDD8D4] to-white bg-clip-text text-transparent">
            Where Intentional Love Crosses Oceans
          </h1>
          <p className="text-sm sm:text-base text-[#E6D7FA] leading-relaxed font-normal max-w-xl mx-auto">
            asiansin.love is an intentional platform connecting international singles with sincere women across Southeast Asia. Designed for meaningful dialogue, family values, and genuine long-term relationships.
          </p>
        </div>

        {/* Primary Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto pt-2">
          <Link
            href="/discover"
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-[#653C87] hover:bg-[#7D49A8] text-xs font-semibold text-white transition active:scale-95 shadow-xl flex items-center justify-center gap-2"
          >
            <span>Explore Profiles</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-[#261F33] hover:bg-[#2F2540] border border-[#9A79BA]/40 text-sm font-semibold text-white hover:border-[#9A79BA] transition active:scale-95"
          >
            Create Your Account
          </Link>
        </div>

        {/* Value Pillars: Focused on Experience & Intent */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 text-left w-full">
          <div className="p-6 rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 shadow-xl space-y-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Always Free for Women
            </h3>
            <p className="text-sm text-[#E6D7FA] leading-relaxed">
              Southeast Asian members browse, match, and message completely free with unhindered inboxes.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 shadow-xl space-y-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Direct & Uncluttered
            </h3>
            <p className="text-sm text-[#E6D7FA] leading-relaxed">
              No coin packs, micro-transactions, or third-party ad clutter. Just clean profiles and direct communication.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 shadow-xl space-y-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Intentional Courtship
            </h3>
            <p className="text-sm text-[#E6D7FA] leading-relaxed">
              Built for people seeking marriage, family, and lifelong cross-border commitments.
            </p>
          </div>
        </div>

      </main>

      {/* Persistent Bottom Footer */}
      <Footer />
    </div>
  );
}