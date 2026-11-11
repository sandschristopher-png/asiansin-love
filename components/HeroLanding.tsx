'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BrandLogo } from '@/components/BrandLogo';
import Hero, { LANDING_SHELL } from '@/components/Hero';

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

/**
 * Signed-out landing page (app/page.tsx renders it only without a session). One centred
 * max-w-md column on every screen, white canvas, no borders or shadows on page surfaces, and no
 * breakpoints that change the layout.
 */
export function HeroLanding() {
  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden text-[#413B5E] selection:bg-[#8574B7]/15 selection:text-[#8574B7]">
      <div className={LANDING_SHELL}>
        <header className="h-16 flex items-center justify-center">
          <BrandLogo href="/" size="header" />
        </header>

        <Hero />

        {/* How connections happen */}
        <section className="py-8">
          <div className="text-center">
            <h2 className="font-brand text-xl font-semibold tracking-tight text-[#413B5E]">How connections happen</h2>
            <p className="mt-2 text-sm text-slate-600">Match on intention, not luck. Three steps to meeting someone real.</p>
          </div>
          <div className="mt-6 space-y-3">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="w-6 shrink-0 pt-px font-brand text-sm font-semibold tabular-nums text-[#8574B7]">{step}</span>
                <div className="min-w-0 text-left">
                  <h3 className="text-[15px] font-semibold text-[#413B5E] leading-snug">{title}</h3>
                  <p className="mt-1 text-[13px] text-slate-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature stories: illustration left, copy right */}
        <section className="py-8 space-y-3">
          {FEATURES.map(({ title, body, src, alt }) => (
            <div key={title} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3.5">
              <div className="relative w-24 h-24 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                <Image src={src} alt={alt} fill sizes="96px" className="object-contain object-bottom select-none pointer-events-none" />
              </div>
              <div className="min-w-0 text-left">
                <h3 className="text-[15px] font-semibold text-[#413B5E] leading-snug">{title}</h3>
                <p className="mt-1 text-[13px] text-slate-600 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Final call to action */}
        <section className="py-10 text-center">
          <h2 className="font-brand text-xl font-semibold tracking-tight text-[#413B5E]">Be one of our first members.</h2>
          <p className="mt-2 text-sm text-slate-600">
            Join free and start meeting genuine singles across Southeast Asia today.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4">
            <Link
              href="/signup"
              className="w-full h-12 inline-flex items-center justify-center rounded-full bg-[#8574B7] hover:bg-[#534377] text-white font-medium text-sm active:scale-95 transition-all"
            >
              Join for Free
            </Link>
            <Link href="/login" className="text-sm font-medium text-[#8574B7] hover:text-[#534377] transition-colors">
              Sign In
            </Link>
          </div>
        </section>

        {/* Footer: rendered by the public landing page only, never inside the signed-in app. */}
        <footer className="pb-8 pt-4 text-center text-xs text-slate-600">
          <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-medium text-[#413B5E]">
            <Link className="hover:text-[#8574B7] transition-colors" href="/safety">Safety</Link>
            <span className="text-[#D0CDE1]" aria-hidden="true">•</span>
            <Link className="hover:text-[#8574B7] transition-colors" href="/terms">Terms</Link>
            <span className="text-[#D0CDE1]" aria-hidden="true">•</span>
            <Link className="hover:text-[#8574B7] transition-colors" href="/privacy">Privacy</Link>
            <span className="text-[#D0CDE1]" aria-hidden="true">•</span>
            <Link className="hover:text-[#8574B7] transition-colors" href="/contact">Contact</Link>
          </nav>
          <p className="mt-2 text-[11px] text-slate-600">© {new Date().getFullYear()} Meet in Asia</p>
        </footer>
      </div>
    </div>
  );
}

export default HeroLanding;
