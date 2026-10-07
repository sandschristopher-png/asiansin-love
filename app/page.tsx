import Footer from '@/components/Footer';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Users, CheckCircle2, Plane } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-full flex flex-col bg-[#F8F7FA] text-[#1C1924]">
      {/* Hero Section */}
      <div className="flex-1 w-full max-w-md mx-auto px-5 pt-8 pb-12 flex flex-col items-center text-center space-y-6">
        
        {/* Eyebrow & Headline */}
        <div className="space-y-3 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFC] text-[#6555b8] text-[11px] font-semibold tracking-wider uppercase">
            Serious Courtship • Family First
          </div>

          <h1 className="text-3xl font-medium leading-[1.16] bg-gradient-to-b from-[#181126] via-[#3E2F6E] to-[#6555b8] bg-clip-text text-transparent">
            No Tourists. No Pen Pals. Just Real Intent to Marry.
          </h1>

          <p className="text-sm text-[#524B5E] leading-relaxed font-normal">
            Legacy sites are filled with vacation flings and men who never show up. We built a grounded sanctuary connecting family-oriented women across Southeast Asia with sincere partners worldwide who are ready to build a marriage and home together.
          </p>
        </div>

        {/* Spot Illustration: Hero Couple */}
        <div className="relative w-40 sm:w-48 aspect-square my-1">
          <Image
            src="/hero-couple.png"
            alt="Authentic Asian courtship couple"
            fill
            priority
            className="object-contain"
          />
        </div>

        {/* Primary & Secondary Call to Actions */}
        <div className="flex flex-col gap-2.5 w-full pt-1">
          <Link
            href="/login"
            className="w-full py-3.5 rounded-full bg-[#6555b8] hover:bg-[#52449e] text-sm font-medium text-white transition active:scale-95 shadow-md flex items-center justify-center gap-2"
          >
            <span>Start with Intention</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/discover"
            className="w-full py-3.5 rounded-full bg-white hover:bg-[#F2EFF8] border border-[#DDD7E5] text-sm font-semibold text-[#1C1924] transition active:scale-95 shadow-xs flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4 text-[#6555b8]" />
            <span>Discover Who&apos;s Here</span>
          </Link>

          {/* Micro-Trust Indicator */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#716A82] pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Live Photo Verification • No Pay-Per-Message Coins</span>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="flex flex-col gap-2.5 text-left w-full pt-4">
          
          {/* Card 1: Marriage & Family Focus */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E4EF] shadow-xs flex items-start gap-3.5">
            <div className="relative w-12 h-12 rounded-xl bg-[#F3EFFC] overflow-hidden shrink-0 mt-0.5 border border-[#E3DCF5]">
              <Image
                src="/intention.png"
                alt="Values and Intent"
                fill
                className="object-cover scale-110"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#1C1924]">Built for Marriage & Children</h3>
              <p className="text-xs text-[#524B5E] leading-relaxed mt-0.5">
                We filter out casual daters, tourists, and short-term backpackers. Every profile clearly states their timeline for marriage and starting a family.
              </p>
            </div>
          </div>

          {/* Card 2: Travel Readiness & Intent */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E4EF] shadow-xs flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#F3EFFC] flex items-center justify-center text-[#6555b8] shrink-0 mt-0.5 border border-[#E3DCF5]">
              <Plane className="w-5 h-5 text-[#6555b8]" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#1C1924]">No Endless Pen Pals</h3>
              <p className="text-xs text-[#524B5E] leading-relaxed mt-0.5">
                Tired of people chatting for years without ever booking a ticket? We emphasize travel readiness, real timelines, and intentional courtship.
              </p>
            </div>
          </div>

          {/* Card 3: Live Verification */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E4EF] shadow-xs flex items-start gap-3.5">
            <div className="relative w-12 h-12 rounded-xl bg-purple-50 overflow-hidden shrink-0 mt-0.5 border border-purple-100">
              <Image
                src="/approved.png"
                alt="Live photo verified"
                fill
                className="object-cover scale-110"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#1C1924]">Verified Authenticity</h3>
              <p className="text-xs text-[#524B5E] leading-relaxed mt-0.5">
                Every member completes live pose verification to eliminate catfish, agency scammers, and inactive accounts before connecting.
              </p>
            </div>
          </div>

        </div>

      </div>

      <Footer />
    </div>
  );
}
