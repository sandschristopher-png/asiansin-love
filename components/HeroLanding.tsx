'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Heart, Sparkles, ChevronRight, Flag, Check } from 'lucide-react';

export function HeroLanding() {
  return (
    <div className="min-h-screen bg-white text-[#1C1924] selection:bg-[#6555B8]/15 selection:text-[#6555B8]">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#F1EDF9]">
        <div className="max-w-md mx-auto px-5 h-14 flex items-center justify-between">
          <span
            className="text-lg font-bold lowercase inline-flex items-baseline select-none"
            style={{ fontFamily: 'var(--font-logo), sans-serif', fontWeight: 700 }}
          >
            <span className="text-[#1C1924] tracking-[-0.05em]">asians</span>
            <span className="text-[#6555B8] tracking-[-0.05em]">inlove</span>
          </span>
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-full border border-[#DDD5EE] bg-[#FAF8FE] text-[#6555B8] text-xs font-semibold hover:bg-[#F3EFFC] hover:border-[#6555B8]/40 active:scale-95 transition"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* ===== Hero (Tightened for Above-the-Fold CTA & Grounded Illustration) ===== */}
      <section className="overflow-hidden">
        <div className="max-w-md mx-auto px-5 pt-7 pb-10 text-center relative">
          {/* Soft ambient with.is background aura */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-gradient-to-b from-[#F4F0FC] to-transparent -z-10 blur-2xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F6F3FC] border border-[#E9E2F6] text-[#6555B8] text-[11px] font-semibold tracking-tight mb-3.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6555B8]" />
            <span>Southeast Asia &amp; Worldwide</span>
          </div>

          <h1 className="text-[27px] sm:text-[29px] leading-[1.2] font-extrabold tracking-tight text-[#1C1924]">
            Real connection,
            <br />
            <span className="text-[#6555B8]">without the guesswork.</span>
          </h1>

          <p className="mt-3 text-[14px] text-[#6C637B] leading-relaxed max-w-[330px] mx-auto">
            Genuine singles across Southeast Asia. Verified profiles, honest intentions, and a community built for something real.
          </p>

          {/* Grounded Illustration Pedestal (No floating torso cutoff) */}
          <div className="mt-5 relative mx-auto max-w-[290px]">
            <div
              className="mx-auto w-[224px] h-[205px] rounded-t-full bg-gradient-to-b from-[#F5F1FC] to-[#FAF8FE] border-x border-t border-[#ECE6F7] relative overflow-hidden flex items-end justify-center"
            >
              <div className="relative w-[210px] h-[200px] translate-y-[2px]">
                <Image
                  src="/hero-woman.png"
                  alt="A woman using asiansinlove"
                  fill
                  sizes="210px"
                  className="object-contain object-bottom"
                  priority
                />
              </div>
            </div>
            {/* Crisp baseline anchor */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#DFD7F0] to-transparent" />
          </div>

          <div className="mt-5">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center w-full max-w-[300px] mx-auto py-3.5 rounded-full bg-[#6555B8] text-white text-sm font-semibold hover:bg-[#5545A8] active:scale-[0.99] transition shadow-[0_8px_20px_-4px_rgba(101,85,184,0.38)]"
            >
              <span>Join for Free</span>
              <ChevronRight className="ml-1 w-4 h-4" />
            </Link>
            <p className="mt-2.5 text-[11px] text-[#8C849B]">
              Free to join. By joining you agree to our Terms &amp; Privacy Policy.
            </p>
          </div>
        </div>
      </section>

      {/* ===== How it works (with.is Editorial Card Stack) ===== */}
      <section className="bg-[#F9F7FD] py-12 border-y border-[#F0EBF8]">
        <div className="max-w-md mx-auto px-5">
          <div className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#6555B8]">
              Simple &amp; Intentional
            </span>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#1C1924]">
              How asiansinlove works
            </h2>
            <p className="mt-1.5 text-[13.5px] text-[#6C637B]">
              Match on intention, not luck. Three steps to meeting someone real.
            </p>
          </div>

          {/* Unified Illustration + Steps Container */}
          <div className="mt-6 bg-white rounded-3xl border border-[#EAE4F4] shadow-[0_4px_20px_rgba(28,25,36,0.03)] overflow-hidden">
            {/* Couple illustration anchored flush to the step divider */}
            <div className="relative w-full h-[230px] bg-gradient-to-b from-[#F6F2FC]/70 to-white border-b border-[#EFEAF7] flex items-end justify-center overflow-hidden pt-4">
              <div className="relative w-[240px] h-[215px] translate-y-[2px]">
                <Image
                  src="/hero-couple.png"
                  alt="A couple who met on asiansinlove"
                  fill
                  sizes="240px"
                  className="object-contain object-bottom"
                />
              </div>
            </div>

            {/* Connected 3-Step List */}
            <ol className="divide-y divide-[#F2EEF9]">
              {[
                {
                  title: 'Share what you want',
                  desc: 'Create your profile and state what you are genuinely looking for.',
                },
                {
                  title: 'Browse verified locals',
                  desc: 'Meet verified members in Manila, Bangkok, Phnom Penh, and beyond.',
                },
                {
                  title: 'Chat with confidence',
                  desc: 'Match, talk, and connect with people who want the same things you do.',
                },
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3.5 p-4 hover:bg-[#FAF9FE] transition">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-[#6555B8] text-white text-xs font-bold flex items-center justify-center mt-0.5 shadow-2xs">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold text-[#1C1924] leading-snug">
                      {step.title}
                    </p>
                    <p className="text-[12.5px] text-[#6C637B] leading-relaxed mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ===== Feature 1: Verified (secured.png) ===== */}
      <section className="py-12 bg-white">
        <div className="max-w-md mx-auto px-5 flex flex-col items-center text-center">
          <div className="relative flex flex-col items-center">
            <div className="w-[210px] h-[195px] rounded-t-full bg-[#FAF8FE] border-x border-t border-[#ECE6F7] flex items-end justify-center overflow-hidden">
              <div className="relative w-[195px] h-[185px] translate-y-[2px]">
                <Image
                  src="/secured.png"
                  alt="Verified and protected profiles"
                  fill
                  sizes="195px"
                  className="object-contain object-bottom"
                />
              </div>
            </div>
            <div className="w-[240px] h-px bg-[#E5DDF3]" />
            <div className="-mt-3.5 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F3EFFC] border border-[#E2DAF3] text-[#6555B8] text-[11px] font-bold tracking-wide shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED PROFILES
            </div>
          </div>

          <h2 className="mt-4 text-xl font-extrabold tracking-tight text-[#1C1924]">
            Know who you&apos;re talking to
          </h2>
          <p className="mt-2 text-[13.5px] text-[#6C637B] leading-relaxed max-w-[320px]">
            GPS and photo verification keep fakes out. Every profile you see is a real person, where they say they are.
          </p>
        </div>
      </section>

      {/* Subtle inset divider */}
      <div className="max-w-[120px] mx-auto h-px bg-[#F0EBF8]" />

      {/* ===== Feature 2: Intent (intention.png) ===== */}
      <section className="py-12 bg-white">
        <div className="max-w-md mx-auto px-5 flex flex-col items-center text-center">
          <div className="relative flex flex-col items-center">
            <div className="w-[210px] h-[195px] rounded-t-full bg-[#FAF8FE] border-x border-t border-[#ECE6F7] flex items-end justify-center overflow-hidden">
              <div className="relative w-[195px] h-[185px] translate-y-[2px]">
                <Image
                  src="/intention.png"
                  alt="Matching on shared intentions"
                  fill
                  sizes="195px"
                  className="object-contain object-bottom"
                />
              </div>
            </div>
            <div className="w-[240px] h-px bg-[#E5DDF3]" />
            <div className="-mt-3.5 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F3EFFC] border border-[#E2DAF3] text-[#6555B8] text-[11px] font-bold tracking-wide shadow-2xs">
              <Heart className="w-3.5 h-3.5" /> REAL INTENTIONS
            </div>
          </div>

          <h2 className="mt-4 text-xl font-extrabold tracking-tight text-[#1C1924]">
            Match on what matters
          </h2>
          <p className="mt-2 text-[13.5px] text-[#6C637B] leading-relaxed max-w-[320px]">
            State what you&apos;re looking for up front, dating or a serious relationship, and meet people whose goals line up with yours.
          </p>
        </div>
      </section>

      {/* Subtle inset divider */}
      <div className="max-w-[120px] mx-auto h-px bg-[#F0EBF8]" />

      {/* ===== Feature 3: Red flags / safety (red-flags.png) ===== */}
      <section className="py-12 bg-white">
        <div className="max-w-md mx-auto px-5 flex flex-col items-center text-center">
          <div className="relative flex flex-col items-center">
            <div className="w-[210px] h-[195px] rounded-t-full bg-[#FAF8FE] border-x border-t border-[#ECE6F7] flex items-end justify-center overflow-hidden">
              <div className="relative w-[195px] h-[185px] translate-y-[2px]">
                <Image
                  src="/red-flags.png"
                  alt="Community standards and scam protection"
                  fill
                  sizes="195px"
                  className="object-contain object-bottom"
                />
              </div>
            </div>
            <div className="w-[240px] h-px bg-[#E5DDF3]" />
            <div className="-mt-3.5 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F3EFFC] border border-[#E2DAF3] text-[#6555B8] text-[11px] font-bold tracking-wide shadow-2xs">
              <Flag className="w-3.5 h-3.5" /> SCAM &amp; SPAM PROTECTION
            </div>
          </div>

          <h2 className="mt-4 text-xl font-extrabold tracking-tight text-[#1C1924]">
            A community you can trust
          </h2>
          <p className="mt-2 text-[13.5px] text-[#6C637B] leading-relaxed max-w-[320px]">
            Reputation scoring, message screening, and easy blocking keep scammers out and real conversations going.
          </p>
        </div>
      </section>

      {/* ===== Closing CTA ===== */}
      <section className="px-4 pb-10 pt-2 bg-white">
        <div className="max-w-md mx-auto rounded-3xl bg-[#6555B8] px-6 py-10 text-center shadow-[0_12px_32px_-8px_rgba(101,85,184,0.45)] relative overflow-hidden">
          <div
            className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-white/10 pointer-events-none"
            aria-hidden="true"
          />
          <Sparkles className="w-6 h-6 text-white/85 mx-auto" />
          <h2 className="mt-3 text-2xl font-extrabold text-white tracking-tight">
            Someone real is waiting.
          </h2>
          <p className="mt-2 text-[13.5px] text-white/85 max-w-[260px] mx-auto leading-relaxed">
            Join free and start meeting genuine singles across Southeast Asia today.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-flex items-center justify-center w-full max-w-[260px] py-3.5 rounded-full bg-white text-[#6555B8] text-sm font-bold hover:bg-[#F3EFFC] active:scale-95 transition shadow-md"
          >
            <span>Join for Free</span>
            <ChevronRight className="ml-1 w-4 h-4" />
          </Link>
          <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-white/80 font-medium">
            <span className="inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Free to join
            </span>
            <span className="inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Verified members
            </span>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-white py-8 border-t border-[#F3EFFC]">
        <div className="max-w-md mx-auto px-5 text-center space-y-1.5">
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