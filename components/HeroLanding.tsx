'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BrandLogo } from '@/components/BrandLogo';
import Hero, { LANDING_SHELL } from '@/components/Hero';

const BTN_PRIMARY =
  'w-full h-12 inline-flex items-center justify-center rounded-full bg-[#8574B7] hover:bg-[#534377] text-white font-bold text-sm shadow-xs active:scale-95 transition-all';
const BTN_SECONDARY =
  'w-full h-12 inline-flex items-center justify-center rounded-full border border-[#D0CDE1] bg-white hover:bg-[#8574B7]/5 text-[#413B5E] font-semibold text-sm active:scale-95 transition-all';
const SECTION = 'py-10';

const STEPS = [
  { step: '01', title: 'Share what you want', desc: 'Set your intentions and communication rhythm up front.' },
  { step: '02', title: 'Browse verified members', desc: 'Genuine profiles screened with photo verification and reputation scores.' },
  { step: '03', title: 'Connect with confidence', desc: 'Sparks, voice notes, and contact-reveal safety guards that protect your privacy.' },
];

const FEATURES = [
  {
    title: 'Proactive Scam & Bot Screening',
    body: 'Every profile goes through photo screening before it earns a verified badge. Public reputation scores keep conversations genuine.',
    src: '/secured.webp',
    alt: 'Illustrated member holding a verification shield',
  },
  {
    title: 'Clear Relationship Intent',
    body: 'Meet singles who share your life milestones and cross-border future. No endless casual guessing.',
    src: '/intention.webp',
    alt: 'Illustrated member with a hand on her heart',
  },
  {
    title: 'Real Voices, Real Sparks.',
    body: "Hear a member's real voice before you connect, then send a thoughtful Spark that starts a real conversation.",
    src: '/hero-couple.webp',
    alt: 'Illustrated couple smiling together',
  },
  {
    title: 'Red Flags, Handled.',
    body: "Scam scripts, catfish behavior, and early asks for money or off-app chats get flagged by message screening and one-tap reports. Bad actors don't last long here.",
    src: '/red-flags.webp',
    alt: 'Illustrated member spotting red flags on his phone',
  },
];

/** Signed-out landing page: one centred mobile column on phones and desktops alike. */
export function HeroLanding() {
  return (
    <div className="w-full bg-white min-h-screen overflow-x-hidden text-[#413B5E] selection:bg-[#8574B7]/15 selection:text-[#8574B7]">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#D0CDE1]">
        <div className={`${LANDING_SHELL} h-14 flex items-center justify-between`}>
          <BrandLogo href="/" size="header" />
          <Link
            href="/login"
            className="px-4 py-2 rounded-full border border-[#D0CDE1] bg-white text-[#413B5E] text-xs font-bold hover:bg-[#E8E6F1]/50 active:scale-95 transition-all"
          >
            Sign In
          </Link>
        </div>
      </header>

      <Hero />

      {/* How Connections Happen: compact horizontal cards */}
      <section className={`${SECTION} bg-[#E8E6F1]/30 border-y border-[#D0CDE1]/50`}>
        <div className={LANDING_SHELL}>
          <div className="text-center">
            <h2 className="font-brand text-xl font-extrabold tracking-tight text-[#413B5E]">How connections happen</h2>
            <p className="mt-2 text-sm text-[#413B5E]/75">Match on intention, not luck. Three steps to meeting someone real.</p>
          </div>
          <div className="mt-6 space-y-3">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-3.5 rounded-2xl bg-white border border-[#D0CDE1] p-4 shadow-xs">
                <span className="w-10 h-10 shrink-0 rounded-2xl bg-[#E8E6F1] text-[#8574B7] font-brand font-bold text-sm flex items-center justify-center">
                  {step}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-[#413B5E] leading-snug">{title}</h3>
                  <p className="mt-1 text-[13px] text-[#413B5E]/75 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature stories: illustration left, copy right */}
      <section className={SECTION}>
        <div className={`${LANDING_SHELL} space-y-3`}>
          {FEATURES.map(({ title, body, src, alt }) => (
            <div key={title} className="flex items-center gap-4 rounded-2xl bg-white border border-[#D0CDE1] p-3.5 shadow-xs">
              <div className="relative w-24 h-24 shrink-0 overflow-hidden rounded-2xl border border-[#D0CDE1] bg-white">
                <Image src={src} alt={alt} fill sizes="96px" className="object-contain object-bottom select-none pointer-events-none" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#413B5E] leading-snug">{title}</h3>
                <p className="mt-1 text-[13px] text-[#413B5E]/75 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-12 bg-white border-t border-[#D0CDE1]/50">
        <div className={`${LANDING_SHELL} text-center`}>
          <h2 className="font-brand text-xl font-extrabold tracking-tight text-[#413B5E]">Be one of our first members.</h2>
          <p className="mt-2 text-sm text-[#413B5E]/75">
            Join free and start meeting genuine singles across Southeast Asia today.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/signup" className={BTN_PRIMARY}>
              Join for Free
            </Link>
            <Link href="/login" className={BTN_SECONDARY}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#E8E6F1]/20 py-8 border-t border-[#D0CDE1]">
        <div className={`${LANDING_SHELL} text-center space-y-3`}>
          <BrandLogo href="/" size="md" className="justify-center" />
          <p className="text-xs font-medium text-[#413B5E]/75">Real connection for genuine singles across Southeast Asia.</p>
        </div>
      </footer>
    </div>
  );
}

export default HeroLanding;
