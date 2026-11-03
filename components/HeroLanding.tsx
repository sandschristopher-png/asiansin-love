'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Heart, ChevronRight, Flag, Check, Zap, Target, BadgeCheck, MessageCircleHeart, Sparkles, MapPin } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

/** Portrait used in the hero's in-app preview card. Must be an image we have rights to show. */
const HERO_PORTRAIT_SRC = '/jennalyn.png';

const STEPS = [
  {
    Icon: Target,
    title: 'Share what you want',
    desc: 'Set your intentions and communication rhythm up front.',
  },
  {
    Icon: BadgeCheck,
    title: 'Browse verified members',
    desc: 'Genuine profiles screened with photo verification and reputation scores.',
  },
  {
    Icon: MessageCircleHeart,
    title: 'Connect with confidence',
    desc: 'Sparks, voice notes, and contact-reveal safety guards that protect your privacy.',
  },
];

const GLASS_PILL =
  'inline-flex items-center gap-1 bg-black/35 backdrop-blur-md border border-white/20 text-white font-medium text-xs px-2.5 py-1 rounded-full';

export function HeroLanding() {
  return (
    <div className="bg-gradient-to-b from-white via-[#FAF8FD] to-white min-h-screen text-[#1C1924] selection:bg-[#6555B8]/15 selection:text-[#6555B8]">
      {/* ===== Frosted header ===== */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-[#ECE8F4]/80">
        <div className="max-w-[430px] mx-auto px-4 h-14 flex items-center justify-between">
          <BrandLogo href="/" size="header" />
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-full text-[#2D264B] text-sm font-semibold hover:bg-[#F3EFFC] active:scale-95 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="overflow-hidden">
        <div className="max-w-md mx-auto px-5 pt-10 pb-12 text-center">
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#8C71F5] mb-3">Modern Matchmaking</p>
          <h1 className="font-brand font-extrabold text-3xl sm:text-4xl text-[#2D264B] tracking-tight leading-[1.15]">
            Real connection, without the guesswork.
          </h1>
          <p className="mt-3 text-[14px] text-[#6C637B] leading-relaxed max-w-[330px] mx-auto">
            Genuine singles across Southeast Asia and beyond. Verified profiles, clear intentions, and a community built for something real.
          </p>

          {/* In-app preview card */}
          <div className="relative mt-9 mb-2 isolate">
            <div
              aria-hidden
              className="absolute -inset-4 bg-gradient-to-tr from-[#8C71F5]/20 via-[#EC4899]/15 to-transparent blur-2xl -z-10 rounded-full"
            />
            <figure className="relative max-w-[280px] mx-auto rounded-3xl overflow-hidden shadow-xl border border-white/60 bg-white text-left">
              <div className="relative aspect-[4/5]">
                <Image
                  src={HERO_PORTRAIT_SRC}
                  alt="Example member profile in the asiansinlove app"
                  fill
                  sizes="280px"
                  className="object-cover"
                  priority
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span className={`absolute top-3 left-3 ${GLASS_PILL}`}>
                  <Sparkles className="w-3 h-3" aria-hidden /> 2 things in common
                </span>
                <figcaption className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="flex items-center gap-1.5 text-lg font-bold font-brand">
                    Mika, 27
                    <BadgeCheck className="w-4 h-4 text-[#8C71F5] fill-white" aria-label="Photo verified" />
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className={GLASS_PILL}>
                      <MapPin className="w-3 h-3" aria-hidden /> Manila
                    </span>
                    <span className={GLASS_PILL}>
                      <Zap className="w-3 h-3" aria-hidden /> Fast Replier
                    </span>
                  </div>
                </figcaption>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6555B8]">
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden /> 98% Rep
                </span>
                <span className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-[#6555B8] text-white text-xs font-semibold">
                  <Heart className="w-3.5 h-3.5 fill-current" aria-hidden /> Spark
                </span>
              </div>
            </figure>
            <p className="mt-3 text-[11px] text-[#9A93A8]">Example profile</p>
          </div>

          <div className="mt-6">
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

      {/* ===== How connections happen ===== */}
      <section className="py-12 border-y border-[#EFEAF7] bg-[#FAF8FD]/60">
        <div className="max-w-md mx-auto px-5">
          <div className="text-center">
            <h2 className="font-brand text-xl font-extrabold tracking-tight text-[#2D264B]">How connections happen</h2>
            <p className="mt-1.5 text-[13px] text-[#6C637B]">
              Match on intention, not luck. Three steps to meeting someone real.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {STEPS.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-5 border border-[#ECE8F4] shadow-xs flex items-start gap-4">
                <span className="w-10 h-10 shrink-0 rounded-xl bg-[#F3EFFC] text-[#6555B8] flex items-center justify-center">
                  <Icon className="w-5 h-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-[#2D264B] leading-snug">{title}</p>
                  <p className="text-[12.5px] text-[#6C637B] leading-relaxed mt-1">{desc}</p>
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
            style={{ fontFamily: 'var(--font-brand), sans-serif' }}
          >
            Know who you&apos;re talking to
          </h2>
          <p className="mt-1.5 text-[13px] text-[#6C637B] leading-relaxed max-w-[310px]">
            Photo verification and manual profile review help keep fakes out. Report anyone who seems off and our team will act.
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
            style={{ fontFamily: 'var(--font-brand), sans-serif' }}
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
            style={{ fontFamily: 'var(--font-brand), sans-serif' }}
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
            style={{ fontFamily: 'var(--font-brand), sans-serif' }}
          >
            Be one of our first members.
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
          <BrandLogo href="/" size="md" className="justify-center" />
          <p className="text-xs text-[#8C849B]">
            Real connection for genuine singles across Southeast Asia.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default HeroLanding;