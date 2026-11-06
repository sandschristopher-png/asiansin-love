'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, ChevronRight, Target, BadgeCheck, MessageCircleHeart, Mic, HeartHandshake } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { AmbientAurora } from '@/components/ui/AmbientAurora';
import { InstallAppCard } from '@/components/InstallAppCard';

/** Signature gradient pill for the landing page's primary actions. */
const CTA_PILL =
  'inline-flex items-center justify-center bg-gradient-to-r from-[#72519A] via-[#9474C3] to-[#9474C3] text-white font-bold h-12 px-8 rounded-full shadow-[0_4px_16px_rgba(114,81,154,0.30)] hover:opacity-95 transition-all text-sm tracking-tight';

/** Trust anchors under the hero CTA. */
const TRUST_BADGES = [
  { Icon: BadgeCheck, label: 'Photo Verified' },
  { Icon: Mic, label: 'Audio Voice Intros' },
  { Icon: ShieldCheck, label: '100% Reputation' },
  { Icon: HeartHandshake, label: 'Shared Lifestyle Habits' },
];

/** Three lifestyle pillars, each illustration anchored flush to its card's bottom edge. */
const FEATURE_CARDS = [
  {
    pill: 'INTENTIONAL',
    pillClass: 'bg-[#72519A]/10 text-[#72519A]',
    title: 'Clear Relationship Intent',
    body: 'Connect with singles who share your life milestones and cross-border future. No endless casual guessing.',
    src: '/intention.png',
    width: 2048,
    height: 2048,
    alt: 'Illustrated member with a hand on her heart',
  },
  {
    pill: 'VERIFIED',
    pillClass: 'bg-[#72519A]/10 text-[#72519A]',
    title: 'Zero Bots. Real People.',
    body: 'Every profile undergoes photo and identity screening before receiving a verified badge. Conduct reputation guards keep conversations genuine.',
    src: '/secured.png',
    width: 1000,
    height: 876,
    alt: 'Illustrated member holding a verification shield',
  },
  {
    pill: 'PRESENCE',
    pillClass: 'bg-[#9474C3]/10 text-[#9474C3]',
    title: 'Natural Voice & Real Sparks',
    body: 'Hear a member’s real voice and cadence before you connect. Send thoughtful Sparks that lead to meaningful conversation.',
    src: '/Meeting.png',
    width: 1024,
    height: 765,
    alt: 'Illustrated couple chatting while out together',
  },
];

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

export function HeroLanding() {
  return (
    <div className="w-full bg-gradient-to-b from-white via-[#FFFFFF] to-white min-h-screen overflow-x-hidden text-[#51376D] selection:bg-[#72519A]/15 selection:text-[#72519A]">
      {/* ===== Frosted header ===== */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-[#D5C6EC]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 h-14 flex items-center justify-between">
          <BrandLogo href="/" size="header" />
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-full text-[#51376D] text-sm font-semibold hover:bg-[#E8DFF5]/70 active:scale-95 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* ===== Hero fold =====
          Mobile: centered copy, /hero-woman.png grounded flush on the fold's bottom border.
          Desktop (md+): copy left, /hero-couple.png anchored flush bottom-right. */}
      <section className="relative w-full overflow-hidden bg-white min-h-[92vh] flex flex-col justify-between border-b border-[#D5C6EC]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <AmbientAurora />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 pt-8 sm:pt-14 pb-0 w-full flex-1 flex flex-col justify-between">
          <div className="flex-1 flex flex-col md:flex-row md:items-end md:gap-10">
            <div className="text-center md:text-left md:flex-1 md:self-center md:pb-14">
              <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#72519A] mb-3">Modern Matchmaking</p>
              <h1 className="font-brand font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-[#51376D] tracking-tight leading-[1.15] md:leading-[1.08]">
                Real connection, without the guesswork.
              </h1>
              <p className="mt-3 md:mt-5 text-[14px] md:text-base text-[#51376D]/75 leading-relaxed max-w-[330px] md:max-w-[460px] mx-auto md:mx-0">
                Photo-verified members, clear intentions up front, and an authentic community built for real relationships.
              </p>

              <div className="mt-7 md:mt-8 flex flex-col items-center md:items-start">
                <Link href="/signup" className={`${CTA_PILL} w-full max-w-[300px] md:w-auto`}>
                  <span>Join for Free</span>
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Link>
                <p className="mt-2.5 text-[11px] text-[#51376D]/55">
                  Free to join. By joining you agree to our Terms &amp; Privacy Policy.
                </p>
                <InstallAppCard variant="hero" />
              </div>

              <ul className="mt-8 grid grid-cols-2 gap-2.5 max-w-[340px] md:max-w-[440px] mx-auto md:mx-0">
                {TRUST_BADGES.map(({ Icon, label }) => (
                  <li
                    key={label}
                    className="flex items-center gap-2 rounded-2xl bg-white/90 backdrop-blur-sm border border-[#D5C6EC] shadow-[0_4px_14px_rgba(114,81,154,0.08)] px-3 py-2.5 text-left"
                  >
                    <span className="w-7 h-7 shrink-0 rounded-lg bg-[#E8DFF5]/60 text-[#72519A] flex items-center justify-center">
                      <Icon className="w-4 h-4" aria-hidden />
                    </span>
                    <span className="text-[12px] font-semibold text-[#51376D] leading-tight">{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8 md:pt-0 mt-auto md:flex-1 flex items-end justify-center md:justify-end overflow-hidden leading-none">
              <Image
                src="/hero-woman.png"
                alt="Illustrated member smiling"
                width={2048}
                height={2048}
                priority
                sizes="(max-width: 767px) 75vw, 1px"
                className="md:hidden block align-bottom object-bottom w-[75%] max-w-[300px] h-auto select-none pointer-events-none -mb-px"
              />
              <Image
                src="/hero-couple.png"
                alt="Illustrated couple smiling together"
                width={2400}
                height={1695}
                priority
                sizes="(max-width: 767px) 1px, 740px"
                className="hidden md:block align-bottom object-bottom max-h-[520px] w-auto select-none pointer-events-none -mb-px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== How connections happen ===== */}
      <section className="py-12 sm:py-16 border-b border-[#D5C6EC] bg-[#FFFFFF]/60">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center">
            <h2 className="font-brand text-xl font-extrabold tracking-tight text-[#51376D]">How connections happen</h2>
            <p className="mt-1.5 text-[13px] text-[#51376D]/75">
              Match on intention, not luck. Three steps to meeting someone real.
            </p>
          </div>

          <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
            {STEPS.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-5 border border-[#D5C6EC] shadow-xs flex items-start gap-4">
                <span className="w-10 h-10 shrink-0 rounded-xl bg-[#E8DFF5]/60 text-[#72519A] flex items-center justify-center">
                  <Icon className="w-5 h-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-[#51376D] leading-snug">{title}</p>
                  <p className="text-[12.5px] text-[#51376D]/75 leading-relaxed mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Three lifestyle pillars ===== */}
      <section>
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-24 w-full grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {FEATURE_CARDS.map(({ pill, pillClass, title, body, src, width, height, alt }) => (
            <article
              key={pill}
              className="relative flex flex-col justify-between overflow-hidden bg-white/90 backdrop-blur-md border border-[#D5C6EC] rounded-2xl shadow-[0_4px_20px_rgba(81,55,109,0.03)] hover:border-[#72519A]/30 transition-all pt-6 px-6 pb-0"
            >
              <div className="flex flex-col gap-2 pb-4">
                <span className={`self-start text-[11px] font-bold px-2.5 py-0.5 rounded-full ${pillClass}`}>{pill}</span>
                <h2 className="font-brand text-lg font-extrabold tracking-tight text-[#51376D]">{title}</h2>
                <p className="text-[13px] text-[#51376D]/75 leading-relaxed">{body}</p>
              </div>
              <div className="mt-auto w-full flex items-end justify-center overflow-hidden leading-none">
                <Image
                  src={src}
                  alt={alt}
                  width={width}
                  height={height}
                  sizes="260px"
                  className="block align-bottom object-bottom max-h-[180px] w-auto select-none pointer-events-none -mb-px"
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ===== Closing CTA card ===== */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-20 w-full">
        <div className="bg-white/95 backdrop-blur-md border border-[#D5C6EC] rounded-3xl p-8 sm:p-12 text-center shadow-[0_4px_24px_rgba(81,55,109,0.04)]">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-[#D5C6EC] text-[10px] font-bold tracking-[0.18em] text-[#51376D]/60">
            JOIN THE COMMUNITY
          </span>
          <h2 className="mt-4 text-2xl sm:text-3xl font-black text-[#51376D] tracking-tight">Be one of our first members.</h2>
          <p className="text-sm text-[#51376D]/70 max-w-md mx-auto mt-2 mb-6">
            Join free and start meeting genuine singles across Southeast Asia today.
          </p>
          <Link href="/signup" className={CTA_PILL}>
            <span>Join for Free</span>
            <ChevronRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-white py-8 border-t border-[#D5C6EC]/60">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 text-center space-y-2">
          <BrandLogo href="/" size="md" className="justify-center" />
          <p className="text-xs text-[#51376D]/55">
            Real connection for genuine singles across Southeast Asia.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default HeroLanding;
