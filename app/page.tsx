import Footer from '@/components/Footer';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Users, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-full flex flex-col bg-white text-[#1C1924]">
      
      {/* Main Single Column */}
      <main className="flex-1 w-full max-w-md mx-auto px-5 pt-14 pb-12 flex flex-col space-y-6">
        
        {/* Story Slide 1: Hero Header with Gradient Flare */}
        <section className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="space-y-2 max-w-xs mx-auto">
            <h1 className="text-3xl font-bold tracking-tight leading-tight text-[#181126]">
              Real Partnership, <br />
              <span className="bg-gradient-to-r from-[#5a48ab] via-[#6555b8] to-[#8d75e0] bg-clip-text text-transparent">
                No Hookup Culture
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#5B5569] leading-relaxed">
              Tired of swipe apps built for vacation flings and transactional games? A respectful space connecting sincere women across Southeast Asia with partners looking for genuine long-term companionship.
            </p>
          </div>

          <div className="relative w-64 h-52 sm:w-72 sm:h-60 mt-1">
            <Image
              src="/hero-couple.png"
              alt="Authentic courtship couple"
              fill
              priority
              className="object-contain"
            />
          </div>

          <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6555b8]">
            Grounded Courtship • Real Commitment
          </span>
        </section>

        {/* Minimal Stats Strip */}
        <section className="flex items-center justify-around py-3 border-y border-[#F0ECF5]">
          <div className="text-center">
            <div className="text-xl font-bold text-[#6555b8]">100%</div>
            <div className="text-[11px] font-medium text-[#5B5569]">Pose-Verified Members</div>
          </div>
          <div className="h-6 w-px bg-[#E8E2F2]" />
          <div className="text-center">
            <div className="text-xl font-bold text-[#6555b8]">Zero Flings</div>
            <div className="text-[11px] font-medium text-[#5B5569]">Committed Courtship</div>
          </div>
        </section>

        {/* Story Slide 2: Intention Character */}
        <section className="flex flex-col items-center text-center space-y-2 pt-2">
          <div className="relative w-44 h-44">
            <Image
              src="/intention.png"
              alt="Hand over heart intention"
              fill
              className="object-contain"
            />
          </div>

          <div className="space-y-1 max-w-xs">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-[#6555b8] block">
              Clear Intentions
            </span>
            <h2 className="text-lg font-semibold text-[#181126]">
              Connect on What Truly Matters
            </h2>
            <p className="text-xs text-[#5B5569] leading-relaxed">
              Whether you envision marriage, raising children, or simply finding a loyal partner for life, every profile states relationship goals upfront so nobody wastes time guessing.
            </p>
          </div>
        </section>

        {/* Story Slide 3: Standing Woman Stop Illustration */}
        <section className="flex flex-col items-center text-center space-y-2 pt-4 border-t border-[#F0ECF5]">
          <div className="relative w-40 h-52">
            <Image
              src="/woman-stop.png"
              alt="Community safety and boundaries"
              fill
              className="object-contain"
            />
          </div>

          <div className="space-y-1 max-w-xs">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-rose-600 block">
              Community Boundaries
            </span>
            <h2 className="text-lg font-semibold text-[#181126]">
              Not Another Hookup Portal
            </h2>
            <p className="text-xs text-[#5B5569] leading-relaxed">
              We proactively filter out casual sex tourists, commercial agencies, and bad actors looking for vacation entertainment. This is a sanctuary where women are treated with dignity and conversations are sincere.
            </p>
          </div>
        </section>

        {/* Story Slide 4: Verified Badge Character */}
        <section className="flex flex-col items-center text-center space-y-2 pt-4 border-t border-[#F0ECF5]">
          <div className="relative w-44 h-44">
            <Image
              src="/verified-nobg.png"
              alt="Verified badge"
              fill
              className="object-contain"
            />
          </div>

          <div className="space-y-1 max-w-xs">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-600 block">
              Safety First
            </span>
            <h2 className="text-lg font-semibold text-[#181126]">
              Real People. Hand-Verified.
            </h2>
            <p className="text-xs text-[#5B5569] leading-relaxed">
              No catfishes, bots, or stolen photo sets. Every member completes dynamic pose verification before entering conversations, ensuring mutual trust from the first message.
            </p>
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Pose-Verified Standard</span>
            </div>
          </div>
        </section>

        {/* Story Slide 5: Bottom Conversion Block */}
        <section className="pt-6 border-t border-[#F0ECF5] text-center space-y-4">
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
              className="w-full py-3 rounded-full bg-[#6555b8] hover:bg-[#52449e] text-sm font-semibold text-white transition active:scale-95 shadow-md flex items-center justify-center gap-2"
            >
              <span>Start with Intention</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/discover"
              className="w-full py-3 rounded-full bg-[#FAF9FD] hover:bg-[#F2EFF8] border border-[#DDD7E5] text-sm font-semibold text-[#1C1924] transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 text-[#6555b8]" />
              <span>Discover Who&apos;s Here</span>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#716A82] pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Live Gesture Verification • Zero Coin Paywalls</span>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
