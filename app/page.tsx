import { Footer } from '@/components/Footer';
﻿import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Users, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#181126] flex flex-col font-sans selection:bg-[#6555b8]/10 selection:text-[#6555b8]">
      {/* Main Single Column */}
      <main className="flex-1 w-full max-w-md mx-auto px-5 pt-4 pb-14 flex flex-col space-y-12">
        
        {/* Slide 1: Main Hero */}
        <section className="flex flex-col items-center text-center">
          <div className="space-y-2 max-w-sm mx-auto">
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-[#181126]">
              Real Partnership, <br />
              <span className="bg-gradient-to-r from-[#5a48ab] via-[#6555b8] to-[#8d75e0] bg-clip-text text-transparent">
                No Hookup Culture
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#5B5569] leading-relaxed">
              Tired of swipe apps built for vacation flings and transactional games? A respectful space connecting sincere women across Southeast Asia with partners looking for genuine long-term companionship.
            </p>
          </div>

          <div className="relative w-80 h-64 sm:w-96 sm:h-72 flex items-end justify-center">
            <Image
              src="/hero-couple.png"
              alt="Authentic courtship couple"
              fill
              priority
              className="object-contain object-bottom"
            />
          </div>

          <span className="text-[10px] font-bold tracking-widest uppercase text-[#6555b8] mt-2 block">
            Grounded Courtship • Real Commitment
          </span>
        </section>

        {/* Minimal Stats Strip */}
        <section className="flex items-center justify-around py-3.5 bg-[#FAF9FD] rounded-2xl border border-[#F0ECF5]">
          <div className="text-center px-4">
            <div className="text-xl font-black text-[#6555b8]">100%</div>
            <div className="text-[11px] font-medium text-[#5B5569] mt-0.5">Pose-Verified Members</div>
          </div>
          <div className="h-7 w-px bg-[#E8E2F2]" />
          <div className="text-center px-4">
            <div className="text-xl font-black text-[#6555b8]">Zero Flings</div>
            <div className="text-[11px] font-medium text-[#5B5569] mt-0.5">Committed Courtship</div>
          </div>
        </section>

        {/* Pillar 1: Clear Intentions */}
        <section className="flex flex-col items-center text-center">
          <div className="relative w-56 h-48 flex items-end justify-center">
            <Image
              src="/intention.png"
              alt="Hand over heart intention"
              fill
              className="object-contain object-bottom"
            />
          </div>

          <div className="space-y-1 max-w-xs mt-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#6555b8] block">
              Clear Intentions
            </span>
            <h2 className="text-lg font-bold text-[#181126]">
              Connect on What Truly Matters
            </h2>
            <p className="text-xs text-[#5B5569] leading-relaxed">
              Whether you envision marriage, raising children, or simply finding a loyal partner for life, every profile states relationship goals upfront so nobody wastes time guessing.
            </p>
          </div>
        </section>

        {/* Pillar 2: Community Boundaries */}
        <section className="flex flex-col items-center text-center">
          <div className="relative w-56 h-48 flex items-end justify-center">
            <Image
              src="/woman-no.png"
              alt="Community safety and boundaries"
              fill
              className="object-contain object-bottom"
            />
          </div>

          <div className="space-y-1 max-w-xs mt-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-rose-600 block">
              Community Boundaries
            </span>
            <h2 className="text-lg font-bold text-[#181126]">
              Not Another Hookup Portal
            </h2>
            <p className="text-xs text-[#5B5569] leading-relaxed">
              We proactively filter out casual sex tourists, commercial agencies, and bad actors looking for vacation entertainment. This is a sanctuary where women are treated with dignity and conversations are sincere.
            </p>
          </div>
        </section>

        {/* Pillar 3: Mutual Reputation */}
        <section className="flex flex-col items-center text-center">
          <div className="relative w-56 h-48 flex items-end justify-center">
            <Image
              src="/red-flags.png"
              alt="Community reputation and red flag protection"
              fill
              className="object-contain object-bottom"
            />
          </div>

          <div className="space-y-1 max-w-xs mt-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#6555b8] block">
              Mutual Reputation
            </span>
            <h2 className="text-lg font-bold text-[#181126]">
              Zero Sob Stories & Scams
            </h2>
            <p className="text-xs text-[#5B5569] leading-relaxed">
              Accountability goes both ways. We actively screen and remove financial sob stories, money requests, allowance scams, and fake profiles—protecting sincere members from transactional games.
            </p>
          </div>
        </section>

        {/* Pillar 4: Safety & Verification */}
        <section className="flex flex-col items-center text-center">
          <div className="relative w-44 h-36 flex items-end justify-center">
            <Image
              src="/verified-nobg.png"
              alt="Verified badge"
              fill
              className="object-contain object-bottom"
            />
          </div>

          <div className="space-y-1 max-w-xs mt-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 block">
              Safety First
            </span>
            <h2 className="text-lg font-bold text-[#181126]">
              Real People. Hand-Verified.
            </h2>
            <p className="text-xs text-[#5B5569] leading-relaxed">
              No catfishes, bots, or stolen photo sets. Every member completes dynamic pose verification before entering conversations, ensuring mutual trust from the first message.
            </p>
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 pt-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Pose-Verified Standard</span>
            </div>
          </div>
        </section>

        {/* Bottom Conversion Block */}
        <section className="pt-2 text-center space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-tight text-[#181126]">
              Ready for a genuine connection?
            </h3>
            <p className="text-xs text-[#5B5569]">
              Join a community built for lasting respect and real partnership.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 w-full pt-1">
            <Link
              href="/login"
              className="w-full py-3.5 rounded-full bg-[#6555b8] hover:bg-[#52449e] text-sm font-semibold text-white transition active:scale-95 shadow-md flex items-center justify-center gap-2"
            >
              <span>Start with Intention</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/discover"
              className="w-full py-3.5 rounded-full bg-[#FAF9FD] hover:bg-[#F2EFF8] border border-[#DDD7E5] text-sm font-semibold text-[#1C1924] transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 text-[#6555b8]" />
              <span>Discover Who&apos;s Here</span>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#716A82] pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Gesture Verification • Zero Coin Paywalls</span>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
