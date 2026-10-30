'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Heart, ChevronRight, Flag, Check, Zap } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export function HeroLanding() {
  return (
    <div className="min-h-screen bg-[#FDFCFE] text-[#1C1924] selection:bg-[#6555B8]/15 selection:text-[#6555B8]">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#F1EDF9]">
        <div className="max-w-md mx-auto px-5 h-14 flex items-center justify-between">
          <BrandLogo href="/" size="md" />
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-full border border-[#DDD5EE] bg-[#FAF8FE] text-[#6555B8] text-xs font-semibold hover:bg-[#F3EFFC] hover:border-[#6555B8]/40 active:scale-95 transition"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* ===== Hero Section ===== */}
      <section className="overflow-hidden">
        <div className="max-w-md mx-auto px-5 pt-8 pb-10 text-center relative">
          <div
            className="absolute top-6 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-gradient-to-b from-[#EFEAFB]/80 via-[#F7F4FD]/50 to-transparent -z-10 blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F1FD] border border-[#E8DFF7] text-[#6555B8] text-[11px] font-semibold tracking-tight mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6555B8]" />
            <span>Southeast Asia &amp; Worldwide</span>
          </div>

          <h1
            className="text-[29px] leading-[1.18] font-bold tracking-tight text-[#1C1924]"
            style={{ fontFamily: 'var(--font-brand, "Comfortaa", sans-serif)' }}
          >
            Real connection,
            <br />
            <span className="text-[#6555B8]">without the guesswork.</span>
          </h1>

          <p className="mt-3 text-[13.5px] text-[#6C637B] leading-relaxed max-w-[325px] mx-auto">
            Genuine singles across Southeast Asia. Verified profiles, honest intentions, and a community built for something real.
          </p>

          <div className="mt-6 relative mx-auto w-[240px]">
            <div className="relative w-[240px] h-[220px] rounded-[52px_24px_52px_24px] bg-gradient-to-b from-[#F3EEFC] via-[#FAF8FE] to-white border border-[#E9E1F7] shadow-[0_10px_28px_-6px_rgba(101,85,184,0.12)] overflow-hidden flex items-end justify-center">
              <div className="relative w-[215px] h-[208px] translate-y-[2px]">
                <Image
                  src="/hero-woman.png"
                  alt="A woman using asiansin.love"
                  fill
                  sizes="215px"
                  className="object-contain object-bottom"
                  priority
                />
              </div>
            </div>

            <div className="absolute -bottom-2 -left-2 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-[#E6DEFB] shadow-[0_4px_12px_rgba(28,25,36,0.06)] text-[10.5px] font-bold text-[#6555B8]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#6555B8]" />
              <span>Photo Verified</span>
            </div>
          </div>

          <div className="mt-8">
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

      {/* ===== How it works ===== */}
      <section className="bg-[#FAF8FE] py-12 border-y border-[#EFEAF7]">
        <div className="max-w-md mx-auto px-5">
          <div className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#6555B8]">
              Simple &amp; Intentional
            </span>
            <h2
              className="mt-1 text-xl font-bold tracking-tight text-[#1C1924]"
              style={{ fontFamily: 'var(--font-brand, "Comfortaa", sans-serif)' }}
            >
              How asiansin.love works
            </h2>
            <p className="mt-1.5 text-[13px] text-[#6C637B]">
              Match on intention, not luck. Three steps to meeting someone real.
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="relative w-[230px] h-[200px] rounded-[36px_36px_20px_20px] bg-gradient-to-b from-[#F3EEFC]/80 to-white/60 border border-[#EAE3F6] p-2 flex items-end justify-center overflow-hidden">
              <div className="relative w-[210px] h-[190px] translate-y-[2px] translate-x-[10px]">
                <Image
                  src="/hero-couple.png"
                  alt="A couple who met on asiansin.love"
                  fill
                  sizes="210px"
                  className="object-contain object-bottom"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            {[
              {
                step: '1',
                title: 'Share what you want',
                desc: 'Create your profile and state what you are genuinely looking for.',
              },
              {
                step: '2',
                title: 'Browse verified locals',
                desc: 'Meet verified members in Manila, Bangkok, Phnom Penh, and beyond.',
              },
              {
                step: '3',
                title: 'Chat with confidence',
                desc: 'Match, talk, and connect with people who want the same things you do.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-[#EDE7F6] shadow-[0_2px_8px_rgba(28,25,36,0.02)]"
              >
                <span className="w-6 h-6 shrink-0 rounded-full bg-[#6555B8] text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {item.step}
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-[#1C1924] leading-snug">
                    {item.title}
                  </p>
                  <p className="text-[12px] text-[#6C637B] leading-relaxed mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Feature 1: Verified ===== */}
      <section className="py-12 bg-white">
        <div className="max-w-md mx-auto px-5 text-center flex flex-col items-center">
          <div className="relative w-[210px] h-[190px] rounded-[44px_20px_44px_20px] bg-gradient-to-b from-[#FAF8FE] to-[#F4EFFC] border border-[#ECE4F8] shadow-xs flex items-end justify-center overflow-hidden">
            <div className="relative w-[190px] h-[180px] translate-y-[2px]">
              <Image
                src="/secured.png"
                alt="Verified and protected profiles"
                fill
                sizes="190px"
                className="object-contain object-bottom"
              />
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFC] border border-[#E2DAF3] text-[#6555B8] text-[11px] font-bold tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>VERIFIED PROFILES</span>
          </div>

          <h2
            className="mt-3 text-lg font-bold tracking-tight text-[#1C1924]"
            style={{ fontFamily: 'var(--font-brand, "Comfortaa", sans-serif)' }}
          >
            Know who you&apos;re talking to
          </h2>
          <p className="mt-1.5 text-[13px] text-[#6C637B] leading-relaxed max-w-[310px]">
            GPS and photo verification keep fakes out. Every profile you see is a real person, where they say they are.
          </p>
        </div>
      </section>

      <div className="max-w-[120px] mx-auto h-px bg-[#F0EBF8]" />

      {/* ===== Feature 2: Shared Intentions ===== */}
      <section className="py-12 bg-white">
        <div className="max-w-md mx-auto px-5 text-center flex flex-col items-center">
          <div className="relative w-[210px] h-[190px] rounded-[20px_44px_20px_44px] bg-gradient-to-b from-[#FAF8FE] to-[#F4EFFC] border border-[#ECE4F8] shadow-xs flex items-end justify-center overflow-hidden">
            <div className="relative w-[190px] h-[180px] translate-y-[2px]">
              <Image
                src="/intention.png"
                alt="Matching on shared intentions"
                fill
                sizes="190px"
                className="object-contain object-bottom"
              />
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFC] border border-[#E2DAF3] text-[#6555B8] text-[11px] font-bold tracking-wide">
            <Heart className="w-3.5 h-3.5" />
            <span>REAL INTENTIONS</span>
          </div>

          <h2
            className="mt-3 text-lg font-bold tracking-tight text-[#1C1924]"
            style={{ fontFamily: 'var(--font-brand, "Comfortaa", sans-serif)' }}
          >
            Match on what matters
          </h2>
          <p className="mt-1.5 text-[13px] text-[#6C637B] leading-relaxed max-w-[310px]">
            State what you&apos;re looking for up front, dating or a serious relationship, and meet people whose goals line up with yours.
          </p>
        </div>
      </section>

      <div className="max-w-[120px] mx-auto h-px bg-[#F0EBF8]" />

      {/* ===== Feature 3: Safety / Reputation ===== */}
      <section className="py-12 bg-white">
        <div className="max-w-md mx-auto px-5 text-center flex flex-col items-center">
          <div className="relative w-[210px] h-[190px] rounded-[44px_20px_44px_20px] bg-gradient-to-b from-[#FAF8FE] to-[#F4EFFC] border border-[#ECE4F8] shadow-xs flex items-end justify-center overflow-hidden">
            <div className="relative w-[190px] h-[180px] translate-y-[2px]">
              <Image
                src="/red-flags.png"
                alt="Community standards and scam protection"
                fill
                sizes="190px"
                className="object-contain object-bottom"
              />
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFC] border border-[#E2DAF3] text-[#6555B8] text-[11px] font-bold tracking-wide">
            <Flag className="w-3.5 h-3.5" />
            <span>SCAM &amp; SPAM PROTECTION</span>
          </div>

          <h2
            className="mt-3 text-lg font-bold tracking-tight text-[#1C1924]"
            style={{ fontFamily: 'var(--font-brand, "Comfortaa", sans-serif)' }}
          >
            A community you can trust
          </h2>
          <p className="mt-1.5 text-[13px] text-[#6C637B] leading-relaxed max-w-[310px]">
            Reputation scoring, message screening, and easy blocking keep scammers out and real conversations going.
          </p>
        </div>
      </section>

      {/* ===== Closing CTA Card ===== */}
      <section className="px-4 pb-12 pt-2 bg-white">
        <div className="max-w-md mx-auto rounded-3xl bg-[#6555B8] px-6 py-10 text-center shadow-[0_12px_32px_-8px_rgba(101,85,184,0.45)] relative overflow-hidden">
          <div
            className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-white/10 pointer-events-none"
            aria-hidden="true"
          />
          <Zap className="w-6 h-6 text-white/90 mx-auto fill-current" />
          <h2
            className="mt-3 text-2xl font-bold text-white tracking-tight"
            style={{ fontFamily: 'var(--font-brand, "Comfortaa", sans-serif)' }}
          >
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
        <div className="max-w-md mx-auto px-5 text-center space-y-2">
          <BrandLogo href="/" size="sm" className="justify-center" />
          <p className="text-xs text-[#8C849B]">
            Real connection for genuine singles across Southeast Asia.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default HeroLanding;