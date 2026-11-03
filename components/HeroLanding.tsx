'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, ChevronRight, Flag, Check, Zap, Target, BadgeCheck, MessageCircleHeart, Mic, HeartHandshake } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

/** Trust anchors under the hero CTA (no mock profiles or photography on the landing page). */
const TRUST_BADGES = [
  { Icon: BadgeCheck, label: 'Photo Verified' },
  { Icon: Mic, label: 'Audio Voice Intros' },
  { Icon: ShieldCheck, label: '100% Reputation' },
  { Icon: HeartHandshake, label: 'Shared Lifestyle Habits' },
];

/** The two manga mascots, each anchored inside its own elevated card. */
const MASCOT_CARDS = [
  {
    src: '/secured.png',
    alt: 'Illustrated member holding a verification shield',
    Icon: ShieldCheck,
    tag: 'VERIFIED PROFILES',
    title: 'Know who you\u2019re talking to',
    body: 'Every member is checked by a real person before their verified badge goes live, and Reputation guardrails keep conduct in view.',
  },
  {
    src: '/red-flags.png',
    alt: 'Illustrated member noticing a suspicious message on his phone',
    Icon: Flag,
    tag: 'SCAM & SPAM PROTECTION',
    title: 'A community you can trust',
    body: 'Phone numbers, links and handles are masked automatically, and solicitation is never tolerated, so conversations stay real.',
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

      {/* ===== Hero ===== */}
      <section className="overflow-hidden">
        <div className="max-w-md mx-auto px-5 pt-10 pb-12 text-center">
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#8C71F5] mb-3">Modern Matchmaking</p>
          <h1 className="font-brand font-extrabold text-3xl sm:text-4xl text-[#2D264B] tracking-tight leading-[1.15]">
            Real connection, without the guesswork.
          </h1>
          <p className="mt-3 text-[14px] text-[#6C637B] leading-relaxed max-w-[330px] mx-auto">
            Photo-verified members, clear intentions up front, and an authentic community built for real relationships.
          </p>

          <div className="mt-7">
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

          {/* Trust anchors over an ambient violet glow */}
          <div className="relative isolate mt-9">
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[200px] -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(140,113,245,0.22),rgba(236,72,153,0.08)_60%,transparent)] blur-2xl"
            />
            <ul className="grid grid-cols-2 gap-2.5 max-w-[340px] mx-auto">
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

      {/* ===== Mascot cards ===== */}
      <section className="py-12">
        <div className="max-w-md mx-auto px-5 space-y-4">
          {MASCOT_CARDS.map(({ src, alt, Icon, tag, title, body }) => (
            <article
              key={tag}
              className="rounded-3xl border border-[#ECE8F4] bg-gradient-to-b from-[#FAF8FD] to-[#F5F2FC] shadow-[0_10px_30px_-12px_rgba(101,85,184,0.25)] overflow-hidden"
            >
              <div className="relative h-44 flex items-end justify-center pt-5">
                <Image src={src} alt={alt} width={200} height={176} className="h-full w-auto object-contain object-bottom" />
              </div>
              <div className="bg-white border-t border-[#ECE8F4] px-5 py-5 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFC] border border-[#E2DAF3] text-[#6555B8] text-[11px] font-bold tracking-wide">
                  <Icon className="w-3.5 h-3.5" aria-hidden />
                  {tag}
                </span>
                <h2 className="mt-3 font-brand text-lg font-extrabold tracking-tight text-[#2D264B]">{title}</h2>
                <p className="mt-1.5 text-[13px] text-[#6C637B] leading-relaxed">{body}</p>
              </div>
            </article>
          ))}
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