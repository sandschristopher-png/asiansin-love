'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, ChevronRight, BadgeCheck, Mic, HeartHandshake } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { InstallAppCard } from '@/components/InstallAppCard';

const BTN_PRIMARY =
  'inline-flex items-center justify-center h-12 px-8 rounded-full bg-[#9A93BC] hover:bg-[#7D75A0] text-white text-sm font-bold tracking-tight transition-colors active:scale-95 shadow-[0_8px_20px_-4px_rgba(154,147,188,0.35)]';
const BTN_SECONDARY =
  'inline-flex items-center justify-center h-12 px-8 rounded-full border border-[#D0CDE1] bg-white text-[#413B5E] text-sm font-semibold hover:bg-[#E8E6F1]/40 transition-colors active:scale-95';
const SECTION = 'py-20 md:py-28';
const CONTAINER = 'max-w-6xl mx-auto px-6 sm:px-8 lg:px-12';

const TRUST_BADGES = [
  { Icon: BadgeCheck, label: 'Photo Verified' },
  { Icon: Mic, label: 'Audio Voice Intros' },
  { Icon: ShieldCheck, label: '100% Reputation' },
  { Icon: HeartHandshake, label: 'Shared Lifestyle Habits' },
];

const STEPS = [
  { step: '01', title: 'Share what you want', desc: 'Set your intentions and communication rhythm up front.' },
  { step: '02', title: 'Browse verified members', desc: 'Genuine profiles screened with photo verification and reputation scores.' },
  { step: '03', title: 'Connect with confidence', desc: 'Sparks, voice notes, and contact-reveal safety guards that protect your privacy.' },
];

const FEATURES = [
  {
    title: 'Zero Bots. Real People.',
    body: 'Every profile goes through photo screening before it earns a verified badge. Public reputation scores keep conversations genuine.',
    src: '/secured.png',
    alt: 'Illustrated member holding a verification shield',
  },
  {
    title: 'Clear Relationship Intent',
    body: 'Meet singles who share your life milestones and cross-border future. No endless casual guessing.',
    src: '/intention.png',
    alt: 'Illustrated member with a hand on her heart',
  },
  {
    title: 'Real Voices, Real Sparks.',
    body: 'Hear a member\'s real voice before you connect, then send a thoughtful Spark that starts a real conversation.',
    src: '/hero-couple.png',
    alt: 'Illustrated couple smiling together',
  },
  {
    title: 'Red Flags, Handled.',
    body: 'Scam scripts, catfish behavior, and early asks for money or off-app chats get flagged by message screening and one-tap reports. Bad actors don\'t last long here.',
    src: '/red-flags.png',
    alt: 'Illustrated member spotting red flags on his phone',
  },
];

export function HeroLanding() {
  return (
    <div className="w-full bg-white min-h-screen overflow-x-hidden text-[#413B5E] selection:bg-[#9A93BC]/15 selection:text-[#9A93BC]">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#D0CDE1]">
        <div className={CONTAINER + ' h-16 flex items-center justify-between'}>
          <BrandLogo href="/" size="header"/>
          <Link className="px-5 py-2 rounded-full border border-[#D0CDE1] bg-white text-[#413B5E] text-xs font-bold hover:bg-[#E8E6F1]/50 active:scale-95 transition-colors" href="/login">
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Fold */}
      <section className="relative w-full overflow-hidden bg-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-0"
          style={{ background: 'radial-gradient(600px 360px at 12% 8%, rgba(232,230,241,0.9) 0%, rgba(232,230,241,0) 60%), radial-gradient(520px 340px at 88% 82%, rgba(208,205,225,0.55) 0%, rgba(208,205,225,0) 62%)' }}
        />
        <div className={'relative z-10 ' + CONTAINER + ' pt-12 pb-24 md:pt-20 md:pb-32 grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-16'}>
          <div className="lg:col-span-6 text-center lg:text-left">
            <h1 className="font-brand font-extrabold text-4xl sm:text-5xl lg:text-[56px] text-[#413B5E] tracking-tight leading-[1.12]">
              Real connection, without the guesswork.
            </h1>
            <p className="mt-5 text-base md:text-lg text-[#655E72] leading-relaxed max-w-lg mx-auto lg:mx-0">
              Photo-verified members, clear intentions up front, and an authentic community built for real relationships.
            </p>

            <div className="mt-8 flex flex-col items-center lg:items-start">
              <Link className={BTN_PRIMARY + ' w-full sm:w-auto'} href="/signup">
                <span>Join for Free</span>
                <ChevronRight className="ml-1 w-4 h-4"/>
              </Link>
              <p className="mt-3 text-xs text-[#8E86A0]">
                Free to join. By joining you agree to our Terms &amp; Privacy Policy.
              </p>
                            <InstallAppCard variant="hero"/>
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-3 max-w-md mx-auto lg:mx-0">
              {TRUST_BADGES.map(({ Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 rounded-2xl bg-white border border-[#D0CDE1] px-3.5 py-2.5 text-left shadow-sm">
                  <span className="w-7 h-7 shrink-0 rounded-full bg-[#E8E6F1] text-[#9A93BC] flex items-center justify-center">
                    <Icon aria-hidden className="w-4 h-4"/>
                  </span>
                  <span className="text-xs font-bold text-[#413B5E] leading-tight">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-[420px]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-tr from-[#E8E6F1] via-[#D0CDE1]/60 to-[#E8E6F1]/40 blur-2xl opacity-90"
              />
              <div className="relative flex h-[380px] sm:h-[420px] w-full items-end justify-center overflow-hidden rounded-3xl border border-[#D0CDE1]/80 bg-white px-6 pt-6 shadow-[0_16px_40px_-12px_rgba(154,147,188,0.28)]">
                <Image alt="Illustrated member smiling" className="object-contain object-bottom select-none pointer-events-none" fill priority sizes="(max-width: 767px) 320px, 420px" src="/hero-woman.png"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={SECTION + ' bg-[#E8E6F1]/30 border-y border-[#D0CDE1]/40'}>
        <div className={CONTAINER}>
          <div className="text-center max-w-xl mx-auto">
            <h2 className="font-brand text-2xl md:text-3xl font-extrabold tracking-tight text-[#413B5E]">How connections happen</h2>
            <p className="mt-3 text-base text-[#655E72]">Match on intention, not luck. Three steps to meeting someone real.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-3xl p-8 border border-[#D0CDE1]/80 shadow-sm flex flex-col items-start">
                <span className="w-10 h-10 rounded-2xl bg-[#E8E6F1] text-[#9A93BC] font-brand font-bold text-sm flex items-center justify-center">
                  {step}
                </span>
                <p className="mt-5 text-lg font-bold text-[#413B5E] leading-snug">{title}</p>
                <p className="mt-2 text-sm text-[#655E72] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Stories */}
      {FEATURES.map(({ title, body, src, alt }, i) => {
        const imageRight = i % 2 === 0;
        return (
          <section key={title} className={SECTION + (i % 2 === 0 ? ' bg-white' : ' bg-[#E8E6F1]/20')}>
            <div className={CONTAINER + ' grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-16'}>
              <div className={'lg:col-span-6 text-center lg:text-left ' + (imageRight ? 'lg:order-1' : 'lg:order-2')}>
                <h2 className="font-brand text-3xl md:text-4xl font-extrabold tracking-tight text-[#413B5E] leading-tight">{title}</h2>
                <p className="mt-4 text-base md:text-lg leading-relaxed text-[#655E72] max-w-lg mx-auto lg:mx-0">{body}</p>
              </div>
              <div className={'lg:col-span-6 flex justify-center ' + (imageRight ? 'lg:order-2' : 'lg:order-1')}>
                <div className="relative w-full max-w-[420px]">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-tr from-[#E8E6F1] via-[#D0CDE1]/60 to-[#E8E6F1]/40 blur-2xl opacity-90"
                  />
                  <div className="relative flex h-[340px] sm:h-[380px] w-full items-end justify-center overflow-hidden rounded-3xl border border-[#D0CDE1]/80 bg-white px-6 pt-6 shadow-[0_12px_36px_-12px_rgba(154,147,188,0.28)]">
                    <Image alt={alt} className="object-contain object-bottom select-none pointer-events-none" fill sizes="(max-width: 767px) 85vw, 420px" src={src}/>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Final Call to Action */}
      <section className="py-24 md:py-32 bg-white border-t border-[#D0CDE1]/50">
        <div className={CONTAINER + ' text-center max-w-2xl mx-auto'}>
          <h2 className="font-brand text-3xl md:text-4xl font-extrabold tracking-tight text-[#413B5E]">Be one of our first members.</h2>
          <p className="mt-4 text-base md:text-lg text-[#655E72]">
            Join free and start meeting genuine singles across Southeast Asia today.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link className={BTN_PRIMARY + ' w-full sm:w-auto'} href="/signup">
              <span>Join for Free</span>
              <ChevronRight className="ml-1 w-4 h-4"/>
            </Link>
            <Link className={BTN_SECONDARY + ' w-full sm:w-auto'} href="/login">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#E8E6F1]/20 py-12 border-t border-[#D0CDE1]">
        <div className={CONTAINER + ' text-center space-y-3'}>
          <BrandLogo href="/" size="md" className="justify-center"/>
          <p className="text-xs font-medium text-[#655E72]">Real connection for genuine singles across Southeast Asia.</p>
        </div>
      </footer>
    </div>
  );
}

export default HeroLanding;