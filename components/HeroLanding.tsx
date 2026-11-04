'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, ChevronRight, Target, BadgeCheck, MessageCircleHeart, Mic, HeartHandshake } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { AmbientAurora } from '@/components/ui/AmbientAurora';

/** Signature gradient pill for the landing page's primary actions. */
const CTA_PILL =
  'inline-flex items-center justify-center bg-gradient-to-r from-[#8C71F5] via-[#B855F6] to-[#EC4899] text-white font-bold h-12 px-8 rounded-full shadow-[0_4px_16px_rgba(140,113,245,0.30)] hover:opacity-95 transition-all text-sm tracking-tight';

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
    pillClass: 'bg-[#8C71F5]/10 text-[#8C71F5]',
    title: 'Clear Relationship Intent',
    body: 'Connect with singles who share your life milestones and cross-border future. No endless casual guessing.',
    src: '/intention.png',
    width: 2048,
    height: 2048,
    alt: 'Illustrated member with a hand on her heart',
  },
  {
    pill: 'VERIFIED',
    pillClass: 'bg-[#8C71F5]/10 text-[#8C71F5]',
    title: 'Zero Bots. Real People.',
    body: 'Every profile undergoes photo and identity screening before receiving a verified badge. Conduct reputation guards keep conversations genuine.',
    src: '/secured.png',
    width: 1000,
    height: 876,
    alt: 'Illustrated member holding a verification shield',
  },
  {
    pill: 'PRESENCE',
    pillClass: 'bg-[#EC4899]/10 text-[#EC4899]',
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

      {/* ===== Hero: copy + CTA, illustration grounded flush on the fold's bottom edge ===== */}
      <section className="relative overflow-hidden border-b border-[#ECE8F4]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <AmbientAurora />
        </div>
        <div className="relative z-10 max-w-md mx-auto px-5 pt-10 text-center">
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#8C71F5] mb-3">Modern Matchmaking</p>
          <h1 className="font-brand font-extrabold text-3xl sm:text-4xl text-[#2D264B] tracking-tight leading-[1.15]">
            Real connection, without the guesswork.
          </h1>
          <p className="mt-3 text-[14px] text-[#6C637B] leading-relaxed max-w-[330px] mx-auto">
            Photo-verified members, clear intentions up front, and an authentic community built for real relationships.
          </p>

          <div className="mt-7">
            <Link href="/signup" className={`${CTA_PILL} w-full max-w-[300px]`}>
              <span>Join for Free</span>
              <ChevronRight className="ml-1 w-4 h-4" />
            </Link>
            <p className="mt-2.5 text-[11px] text-[#8C849B]">
              Free to join. By joining you agree to our Terms &amp; Privacy Policy.
            </p>
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-2.5 max-w-[340px] mx-auto">
            {TRUST_BADGES.map(({ Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-2xl bg-white/90 backdrop-blur-sm border border-[#ECE8F4] shadow-[0_4px_14px_rgba(101,85,184,0.08)] px-3 py-2.5 text-left"
              >
                <span className="w-7 h-7 shrink-0 rounded-lg bg-[#F3EFFC] text-[#6555B8] flex items-center justify-center">
                  <Icon className="w-4 h-4" aria-hidden />
                </span>
                <span className="text-[12px] font-semibold text-[#2D264B] leading-tight">{label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-end justify-center overflow-hidden leading-none">
            <Image
              src="/hero-woman.png"
              alt="Illustrated member smiling"
              width={2048}
              height={2048}
              priority
              sizes="(max-width: 430px) 75vw, 300px"
              className="block align-bottom object-bottom w-[75%] max-w-[300px] h-auto select-none pointer-events-none -mb-px"
            />
          </div>
        </div>
      </section>

      {/* ===== How connections happen ===== */}
      <section className="py-12 border-b border-[#EFEAF7] bg-[#FAF8FD]/60">
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

      {/* ===== Three lifestyle pillars ===== */}
      <section className="py-12">
        <div className="max-w-md mx-auto px-5 grid grid-cols-1 gap-4">
          {FEATURE_CARDS.map(({ pill, pillClass, title, body, src, width, height, alt }) => (
            <article
              key={pill}
              className="relative flex flex-col justify-between overflow-hidden bg-white/90 backdrop-blur-md border border-[#ECE8F4] rounded-2xl shadow-[0_4px_20px_rgba(45,38,75,0.03)] hover:border-[#8C71F5]/30 transition-all pt-6 px-6 pb-0"
            >
              <div className="flex flex-col gap-2 pb-4">
                <span className={`self-start text-[11px] font-bold px-2.5 py-0.5 rounded-full ${pillClass}`}>{pill}</span>
                <h2 className="font-brand text-lg font-extrabold tracking-tight text-[#2D264B]">{title}</h2>
                <p className="text-[13px] text-[#6C637B] leading-relaxed">{body}</p>
              </div>
              <div className="mt-auto w-full flex items-end justify-center overflow-hidden leading-none">
                <Image
                  src={src}
                  alt={alt}
                  width={width}
                  height={height}
                  sizes="240px"
                  className="block align-bottom object-bottom max-h-[170px] w-auto select-none pointer-events-none -mb-px"
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ===== Closing CTA card ===== */}
      <section className="px-4 pb-12 pt-2">
        <div className="max-w-md mx-auto bg-white/95 backdrop-blur-md border border-[#ECE8F4] rounded-3xl p-8 sm:p-10 text-center shadow-[0_4px_24px_rgba(45,38,75,0.04)]">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-[#ECE8F4] text-[10px] font-bold tracking-[0.18em] text-[#2D264B]/60">
            JOIN THE COMMUNITY
          </span>
          <h2 className="mt-4 text-2xl sm:text-3xl font-black text-[#2D264B] tracking-tight">Be one of our first members.</h2>
          <p className="text-sm text-[#2D264B]/70 max-w-md mx-auto mt-2 mb-6">
            Join free and start meeting genuine singles across Southeast Asia today.
          </p>
          <Link href="/signup" className={CTA_PILL}>
            <span>Join for Free</span>
            <ChevronRight className="ml-1 w-4 h-4" />
          </Link>
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
