'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import Hero from '@/components/Hero';

const BTN_PRIMARY =
  'inline-flex items-center justify-center h-11 sm:h-12 px-6 sm:px-8 rounded-full bg-[#8574B7] hover:bg-[#534377] text-white text-sm font-bold tracking-tight transition-all active:scale-95 shadow-[0_4px_16px_rgba(154,147,188,0.25)]';
const BTN_SECONDARY =
  'inline-flex items-center justify-center h-11 sm:h-12 px-6 sm:px-8 rounded-full border border-[#D0CDE1] bg-white text-[#413B5E] text-sm font-semibold hover:bg-[#E8E6F1]/50 transition-all active:scale-95';
const SECTION = 'py-10 sm:py-16 md:py-24';
const CONTAINER = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-12';

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
    body: 'Hear a member\'s real voice before you connect, then send a thoughtful Spark that starts a real conversation.',
    src: '/hero-couple.webp',
    alt: 'Illustrated couple smiling together',
  },
  {
    title: 'Red Flags, Handled.',
    body: 'Scam scripts, catfish behavior, and early asks for money or off-app chats get flagged by message screening and one-tap reports. Bad actors don\'t last long here.',
    src: '/red-flags.webp',
    alt: 'Illustrated member spotting red flags on his phone',
  },
];

export function HeroLanding() {
  return (
    <div className="w-full bg-white min-h-screen overflow-x-hidden text-[#413B5E] selection:bg-[#8574B7]/15 selection:text-[#8574B7]">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#D0CDE1]">
        <div className={`${CONTAINER} h-14 sm:h-16 flex items-center justify-between`}>
          <BrandLogo href="/" size="header" />
          <Link
            href="/login"
            className="px-4 sm:px-5 py-2 rounded-full border border-[#D0CDE1] bg-white text-[#413B5E] text-xs font-bold hover:bg-[#E8E6F1]/50 active:scale-95 transition-all"
          >
            Sign In
          </Link>
        </div>
      </header>

      <Hero />

      {/* How Connections Happen */}
      <section className={`${SECTION} bg-[#E8E6F1]/30 border-y border-[#D0CDE1]/50`}>
        <div className={CONTAINER}>
          <div className="text-center max-w-xl mx-auto">
            <h2 className="font-brand text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[#413B5E]">How connections happen</h2>
            <p className="mt-3 text-sm sm:text-base text-[#413B5E]/75">Match on intention, not luck. Three steps to meeting someone real.</p>
          </div>
          <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-3xl p-5 sm:p-8 border border-[#D0CDE1] shadow-xs flex flex-col items-start">
                <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#E8E6F1] text-[#8574B7] font-brand font-bold text-sm flex items-center justify-center">
                  {step}
                </span>
                <p className="mt-4 sm:mt-5 text-base sm:text-lg font-bold text-[#413B5E] leading-snug">{title}</p>
                <p className="mt-2 text-sm text-[#413B5E]/75 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alternating Feature Stories */}
      {FEATURES.map(({ title, body, src, alt }, i) => {
        const imageRight = i % 2 === 0;
        return (
          <section key={title} className={`${SECTION} ${i % 2 === 0 ? 'bg-white' : 'bg-[#E8E6F1]/20'}`}>
            <div className={`${CONTAINER} grid grid-cols-1 lg:grid-cols-12 items-center gap-8 sm:gap-12 lg:gap-16`}>
              {/* Copy Column */}
              <div className={`lg:col-span-6 text-center lg:text-left ${imageRight ? 'lg:order-1' : 'lg:order-2'}`}>
                <h2 className="font-brand text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#413B5E] leading-tight">{title}</h2>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg leading-relaxed text-[#413B5E]/75 max-w-lg mx-auto lg:mx-0">{body}</p>
              </div>

              {/* Illustration Column with Ambient Halo */}
              <div className={`lg:col-span-6 flex justify-center ${imageRight ? 'lg:order-2' : 'lg:order-1'}`}>
                <div className="relative w-full max-w-[280px] sm:max-w-[360px] lg:max-w-[400px]">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-4 sm:-inset-6 -z-10 rounded-[36px] bg-gradient-to-tr from-[#E8E6F1] via-[#D0CDE1]/60 to-[#E8E6F1]/30 blur-2xl opacity-90"
                  />
                  <div className="relative flex h-[240px] sm:h-[320px] md:h-[380px] w-full items-end justify-center overflow-hidden rounded-3xl border border-[#D0CDE1] bg-white px-4 sm:px-6 pt-4 sm:pt-6 shadow-[0_12px_32px_-8px_rgba(154,147,188,0.2)]">
                    <Image
                      src={src}
                      alt={alt}
                      fill
                      sizes="(max-width: 767px) 85vw, 400px"
                      className="object-contain object-bottom select-none pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Final Call to Action */}
      <section className="py-14 sm:py-24 md:py-32 bg-white border-t border-[#D0CDE1]/50">
        <div className={`${CONTAINER} text-center max-w-2xl mx-auto`}>
          <h2 className="font-brand text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#413B5E]">Be one of our first members.</h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-[#413B5E]/75">
            Join free and start meeting genuine singles across Southeast Asia today.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/signup" className={`${BTN_PRIMARY} w-full sm:w-auto`}>
              <span>Join for Free</span>
              <ChevronRight className="ml-1 w-4 h-4" />
            </Link>
            <Link href="/login" className={`${BTN_SECONDARY} w-full sm:w-auto`}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#E8E6F1]/20 py-8 sm:py-12 border-t border-[#D0CDE1]">
        <div className={`${CONTAINER} text-center space-y-3`}>
          <BrandLogo href="/" size="md" className="justify-center" />
          <p className="text-xs font-medium text-[#413B5E]/75">Real connection for genuine singles across Southeast Asia.</p>
        </div>
      </footer>
    </div>
  );
}

export default HeroLanding;