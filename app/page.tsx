import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7FA] text-[#1C1924]">
      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-16 sm:pb-24 flex flex-col items-center text-center space-y-9">
        
        {/* Full Headline with Deep Vertical Gradient */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] bg-gradient-to-b from-[#181126] via-[#3E2F6E] to-[#6555b8] bg-clip-text text-transparent pb-1">
            Where Intentional Love <br className="hidden sm:inline" />
            Crosses Oceans
          </h1>

          <p className="text-base sm:text-lg text-[#524B5E] leading-relaxed max-w-2xl mx-auto font-normal">
            Asians in Love is an intentional platform connecting international singles with sincere women across Southeast Asia. Designed for meaningful dialogue, family values, and genuine long-term relationships.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left w-full pt-2">
          <div className="p-5 rounded-2xl bg-white border border-[#DDD7E5] shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#F3EFFC] flex items-center justify-center text-[#6555b8]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#1C1924]">
              Always Free for Women
            </h3>
            <p className="text-xs text-[#524B5E] leading-relaxed">
              Southeast Asian members browse, match, and message with completely open inboxes.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#DDD7E5] shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#F3EFFC] flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-[#1C1924]">
              Direct & Uncluttered
            </h3>
            <p className="text-xs text-[#524B5E] leading-relaxed">
              No coin packs, micro-transactions, or third-party ad clutter. Just honest profiles.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#DDD7E5] shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#F3EFFC] flex items-center justify-center text-[#6555b8]">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#1C1924]">
              Intentional Courtship
            </h3>
            <p className="text-xs text-[#524B5E] leading-relaxed">
              Built exclusively for singles seeking marriage, family, and lifelong commitment.
            </p>
          </div>
        </div>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto pt-2">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#6555b8] hover:bg-[#52449e] text-sm font-bold text-white transition active:scale-95 shadow-md flex items-center justify-center gap-2"
          >
            <span>Create Your Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/discover"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white hover:bg-[#F3EFFC] border border-[#DDD7E5] text-sm font-bold text-[#1C1924] hover:border-[#6555b8]/50 transition active:scale-95 shadow-xs"
          >
            Discover Who’s Here
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
}
