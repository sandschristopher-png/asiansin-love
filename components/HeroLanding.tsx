'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Heart, Sparkles, ChevronRight, Flag, Check } from 'lucide-react';

export function HeroLanding() {
  return (
    <div className="min-h-screen bg-white text-[#1C1924]">

      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-[#F3EFFC]">
        <div className="max-w-md mx-auto px-5 h-14 flex items-center justify-between">
          <span
            className="text-lg font-bold lowercase inline-flex items-baseline"
            style={{ fontFamily: 'var(--font-logo), sans-serif', fontWeight: 700 }}
          >
            <span className="text-[#1C1924] tracking-[-0.05em]">asians</span>
            <span className="text-[#6555B8] tracking-[-0.05em]">inlove</span>
          </span>
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-full border border-[#6555B8] text-[#6555B8] text-sm font-semibold hover:bg-[#F3EFFC] transition"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="overflow-hidden">
        <div className="max-w-md mx-auto px-5 pt-12 pb-14 text-center relative">
          {/* soft decorative blobs (with.is style) */}
          <div className="absolute top-8 -left-16 w-44 h-44 rounded-full bg-[#F3EFFC] -z-10" aria-hidden="true" />
          <div className="absolute top-24 -right-20 w-56 h-56 rounded-full bg-[#F8F5FD] -z-10" aria-hidden="true" />

          <h1 className="text-[28px] leading-snug font-extrabold tracking-tight">
            Real connection,<br />
            <span className="text-[#6555B8]">without the guesswork.</span>
          </h1>
          <p className="mt-4 text-[15px] text-[#6C637B] leading-relaxed max-w-sm mx-auto">
            Genuine singles across Southeast Asia. Verified profiles, honest intentions, and a community built for something real.
          </p>

          <div className="mt-7 relative w-[280px] h-[280px] mx-auto">
            <Image
              src="/hero-woman.png"
              alt="A woman using asiansinlove"
              fill
              sizes="(max-width: 768px) 280px, 280px"
              className="object-contain"
              priority
            />
          </div>

          <Link
            href="/login"
            className="mt-7 inline-flex items-center justify-center w-full max-w-xs mx-auto py-3.5 rounded-2xl bg-[#6555B8] text-white font-semibold hover:bg-[#5545A8] transition shadow-lg shadow-[#6555B8]/20"
          >
            Join for Free <ChevronRight className="ml-0.5 w-4 h-4" />
          </Link>
          <p className="mt-3 text-xs text-[#8C849B]">Free to join. By joining you agree to our Terms &amp; Privacy Policy.</p>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section className="bg-[#F8F5FD] py-14">
        <div className="max-w-md mx-auto px-5">
          <h2 className="text-xl font-extrabold text-center">How asiansinlove works</h2>
          <p className="mt-2 text-sm text-[#6C637B] text-center">
            Match on intention, not luck. Three steps to meeting someone real.
          </p>

          <div className="mt-8 relative w-full aspect-square max-w-[320px] mx-auto rounded-3xl overflow-hidden bg-white border border-[#EFEAF7]">
            <Image
              src="/hero-couple.png"
              alt="A couple who met on asiansinlove"
              fill
              sizes="(max-width: 768px) 320px, 320px"
              className="object-cover"
            />
          </div>

          <ol className="mt-8 space-y-3">
            {[
              'Create your profile and share what you are really looking for.',
              'Browse verified members in Manila, Bangkok, Phnom Penh and beyond.',
              'Match, chat, and meet people who want the same things you do.',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 bg-white rounded-2xl p-4 border border-[#EFEAF7]">
                <span className="w-6 h-6 shrink-0 rounded-full bg-[#F3EFFC] text-[#6555B8] text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== Feature: Verified (secured.png) ===== */}
      <section className="py-14">
        <div className="max-w-md mx-auto px-5 flex flex-col items-center text-center">
          <div className="relative w-[240px] h-[240px]">
            <Image
              src="/secured.png"
              alt="Verified and protected profiles"
              fill
              sizes="240px"
              className="object-contain"
            />
          </div>
          <div className="mt-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFC] text-[#6555B8] text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED PROFILES
          </div>
          <h2 className="mt-3 text-xl font-extrabold">Know who you&apos;re talking to</h2>
          <p className="mt-2 text-sm text-[#6C637B] leading-relaxed max-w-sm">
            GPS and photo verification keep fakes out. Every profile you see is a real person, where they say they are.
          </p>
        </div>
      </section>

      {/* ===== Feature: Intent (intention.png) ===== */}
      <section className="py-14 bg-[#F8F5FD]">
        <div className="max-w-md mx-auto px-5 flex flex-col items-center text-center">
          <div className="relative w-[240px] h-[240px]">
            <Image
              src="/intention.png"
              alt="Matching on shared intentions"
              fill
              sizes="240px"
              className="object-contain"
            />
          </div>
          <div className="mt-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFC] text-[#6555B8] text-xs font-bold">
            <Heart className="w-3.5 h-3.5" /> REAL INTENTIONS
          </div>
          <h2 className="mt-3 text-xl font-extrabold">Match on what matters</h2>
          <p className="mt-2 text-sm text-[#6C637B] leading-relaxed max-w-sm">
            State what you&apos;re looking for up front, dating or a serious relationship, and meet people whose goals line up with yours.
          </p>
        </div>
      </section>

      {/* ===== Feature: Red flags / safety (red-flags.png) ===== */}
      <section className="py-14">
        <div className="max-w-md mx-auto px-5 flex flex-col items-center text-center">
          <div className="relative w-[240px] h-[240px]">
            <Image
              src="/red-flags.png"
              alt="Community standards and scam protection"
              fill
              sizes="240px"
              className="object-contain"
            />
          </div>
          <div className="mt-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFC] text-[#6555B8] text-xs font-bold">
            <Flag className="w-3.5 h-3.5" /> SCAM &amp; SPAM PROTECTION
          </div>
          <h2 className="mt-3 text-xl font-extrabold">A community you can trust</h2>
          <p className="mt-2 text-sm text-[#6C637B] leading-relaxed max-w-sm">
            Reputation scoring, message screening, and easy blocking keep scammers out and real conversations going.
          </p>
        </div>
      </section>

      {/* ===== Closing CTA ===== */}
      <section className="bg-[#6555B8] py-14">
        <div className="max-w-md mx-auto px-5 text-center">
          <Sparkles className="w-7 h-7 text-white/80 mx-auto" />
          <h2 className="mt-4 text-2xl font-extrabold text-white">
            Someone real is waiting.
          </h2>
          <p className="mt-2 text-sm text-white/80 max-w-xs mx-auto">
            Join free and start meeting genuine singles across Southeast Asia today.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-flex items-center justify-center w-full max-w-xs py-3.5 rounded-2xl bg-white text-[#6555B8] font-semibold hover:bg-[#F3EFFC] transition"
          >
            Join for Free <ChevronRight className="ml-0.5 w-4 h-4" />
          </Link>
          <div className="mt-5 flex items-center justify-center gap-4 text-xs text-white/70">
            <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Free to join</span>
            <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Verified members</span>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-white py-8 border-t border-[#F3EFFC]">
        <div className="max-w-md mx-auto px-5 text-center space-y-2">
          <span
            className="text-sm font-bold lowercase inline-flex items-baseline"
            style={{ fontFamily: 'var(--font-logo), sans-serif', fontWeight: 700 }}
          >
            <span className="text-[#1C1924]">asians</span>
            <span className="text-[#6555B8]">inlove</span>
          </span>
          <p className="text-xs text-[#8C849B]">
            Real connection for genuine singles across Southeast Asia.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default HeroLanding;