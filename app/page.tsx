'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, HeartHandshake, Zap, MessageSquareHeart, CheckCircle2, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#15101C] text-[#E6D7FA] pb-24">
      {/* Hero Section */}
      <section className="relative px-6 pt-12 pb-16 max-w-lg mx-auto text-center flex flex-col items-center">
        <span className="px-3.5 py-1 rounded-full bg-[#241E2F] border border-[#653C87]/60 text-xs font-semibold text-[#9A79BA] mb-4">
          A Modern Sanctuary for Cross-Border Courtship
        </span>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#E6D7FA] leading-tight">
          Where Intentional Love Crosses Oceans.
        </h1>
        
        <p className="mt-3 text-sm text-[#7D7E92] leading-relaxed max-w-sm">
          No 2000s forum clutter, no third-party ads, no robotic chat spam. Just authentic singles, verified conduct, and fair communication.
        </p>

        <div className="mt-6 flex flex-col w-full gap-2.5">
          <Link
            href="/discover"
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#653C87] to-[#9A79BA] text-[#15101C] font-bold text-sm shadow-xl flex items-center justify-center gap-2 hover:opacity-95 transition"
          >
            Explore Profiles <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="w-full py-3 rounded-full bg-[#241E2F] border border-[#241E2F] hover:border-[#653C87]/60 text-xs font-semibold text-[#E6D7FA] transition"
          >
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Philosophy / Contrast Section */}
      <section className="px-6 py-8 max-w-lg mx-auto border-t border-[#241E2F]/80">
        <h2 className="text-xs uppercase tracking-widest text-[#9A79BA] font-bold text-center mb-6">
          Why Asians in Love is Different
        </h2>

        <div className="grid gap-3">
          <div className="p-4 rounded-2xl bg-[#241E2F]/50 border border-[#241E2F] flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-[#653C87]/20 text-[#9A79BA] shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#E6D7FA]">Always Free for Sincere Women</h3>
              <p className="text-xs text-[#7D7E92] mt-0.5 leading-relaxed">
                Southeast Asian members message 100% free with no waiting periods or paywalled inboxes.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#241E2F]/50 border border-[#241E2F] flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-[#653C87]/20 text-[#9A79BA] shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#E6D7FA]">Zero Bot Automation</h3>
              <p className="text-xs text-[#7D7E92] mt-0.5 leading-relaxed">
                We ban robotic copy-paste greetings and shoutboxes. Every outreach is typed with real intention.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#241E2F]/50 border border-[#241E2F] flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-[#653C87]/20 text-[#9A79BA] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#E6D7FA]">Reputation Through Conduct</h3>
              <p className="text-xs text-[#7D7E92] mt-0.5 leading-relaxed">
                Trust earned through authentic profile completeness, response consistency, and clean conduct—zero invasive ID uploads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Preview Card */}
      <section className="px-6 py-6 max-w-lg mx-auto">
        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-[#241E2F] shadow-2xl">
          <Image
            src="/dummy-1.jpg"
            alt="Featured profile"
            fill
            className="object-cover object-[50%_20%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#15101C] via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className="px-2.5 py-0.5 rounded-full bg-[#15101C]/80 border border-emerald-500/40 text-[10px] font-medium text-emerald-400 backdrop-blur-md">
              Verified & Active
            </span>
            <h4 className="text-lg font-bold text-[#E6D7FA] mt-1.5 flex items-center gap-1">
              Camille, 28 <CheckCircle2 className="w-4 h-4 text-[#9A79BA]" />
            </h4>
            <p className="text-xs text-[#9A79BA]">Makati, Philippines</p>
            <p className="text-xs text-[#7D7E92] italic mt-1 line-clamp-1">
              "Kind-hearted creative exploring the world, passionate about family."
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}