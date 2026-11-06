'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, ChevronRight, Target, BadgeCheck, MessageCircleHeart, Mic, HeartHandshake } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { AmbientAurora } from '@/components/ui/AmbientAurora';
import { InstallAppCard } from '@/components/InstallAppCard';

/*
 * Landing page (with.is / Pairs playbook).
 *   Radius scale: 24px (rounded-3xl) on every frame and card; fully rounded on buttons and chips.
 *   Rhythm: every section uses the same vertical padding and container; tints alternate
 *   white / faint wash so sections read as separate without borders or heavy shadows.
 *   Colour: ink #413B5E headlines, #665D96 only for buttons and eyebrows, periwinkle only in the
 *   character auras (.hero-aura).
 *
 * Framing law for illustrations: a deliberate portrait (head to upper chest, art's bottom edge on
 * the frame's bottom edge, headroom above, props fully inside) or a full figure. Never a waist cut.
 */
const BTN_PRIMARY =
  'inline-flex items-center justify-center h-12 px-8 rounded-full bg-[#665D96] hover:bg-[#413B5E] text-white text-sm font-bold tracking-tight transition-colors active:scale-95';
const BTN_SECONDARY =
  'inline-flex items-center justify-center h-12 px-8 rounded-full border border-[#D0CDE1] bg-white text-[#413B5E] text-sm font-semibold hover:bg-[#E8E6F1]/40 transition-colors active:scale-95';
const SECTION = 'py-20 md:py-28';
const CONTAINER = 'max-w-6xl mx-auto px-6 sm:px-8 lg:px-12';
const EYEBROW = 'text-[11px] font-bold tracking-[0.2em] uppercase text-[#665D96]';

/** Trust anchors under the hero CTA. */
const TRUST_BADGES = [
  { Icon: BadgeCheck, label: 'Photo Verified' },
  { Icon: Mic, label: 'Audio Voice Intros' },
  { Icon: ShieldCheck, label: '100% Reputation' },
  { Icon: HeartHandshake, label: 'Shared Lifestyle Habits' },
];

const STEPS = [
  { Icon: Target, title: 'Share what you want', desc: 'Set your intentions and communication rhythm up front.' },
  { Icon: BadgeCheck, title: 'Browse verified members', desc: 'Genuine profiles screened with photo verification and reputation scores.' },
  { Icon: MessageCircleHeart, title: 'Connect with confidence', desc: 'Sparks, voice notes, and contact-reveal safety guards that protect your privacy.' },
];

/**
 * How an illustration sits in its frame.
 *   fit:  the whole bust, scaled to the frame width, bottom edge flush with the frame bottom.
 *         `inset` adds air (used when the art touches its own top or side edge).
 *   crop: explicit framing of a wider scene (sizes and offsets in % of the frame width).
 */
type Framing =
  | { kind: 'fit'; aspect: string; inset?: string }
  | { kind: 'crop'; aspect: string; img: CSSProperties };

interface Illustration {
  src: string;
  width: number;
  height: number;
  alt: string;
  framing: Framing;
}

function PortraitFrame({
  art,
  sizes,
  priority = false,
  className = '',
}: {
  art: Illustration;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const { framing } = art;
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-[#E8E6F1] bg-white hero-aura ${framing.aspect} ${className}`}>
      {framing.kind === 'fit' ? (
        <div className={`absolute ${framing.inset ?? 'inset-0'}`}>
          <Image
            src={art.src}
            alt={art.alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-contain object-bottom select-none pointer-events-none"
          />
        </div>
      ) : (
        <Image
          src={art.src}
          alt={art.alt}
          width={art.width}
          height={art.height}
          sizes={sizes}
          priority={priority}
          className="block select-none pointer-events-none"
          style={{ maxWidth: 'none', height: 'auto', ...framing.img }}
        />
      )}
    </div>
  );
}

/** Hero fold (phone and desktop): head to upper chest, natural headroom in the art. */
const HERO_WOMAN: Illustration = {
  src: '/hero-woman.png', width: 2048, height: 2048, alt: 'Illustrated member smiling',
  framing: { kind: 'fit', aspect: 'aspect-square' },
};

/**
 * Feature story: trust first (verification, intent), then voice and Sparks, and Red Flags closes
 * the trust arc right before the final call to action.
 */
const FEATURES: { eyebrow: string; title: string; body: string; art: Illustration }[] = [
  {
    eyebrow: 'Verified',
    title: 'Zero Bots. Real People.',
    body: 'Every profile goes through photo screening before it earns a verified badge. Public reputation scores keep conversations genuine.',
    art: {
      src: '/secured.png', width: 1000, height: 876, alt: 'Illustrated member holding a verification shield',
      framing: { kind: 'fit', aspect: 'aspect-[8/7]' },
    },
  },
  {
    eyebrow: 'Intentional',
    title: 'Clear Relationship Intent',
    body: 'Meet singles who share your life milestones and cross-border future. No endless casual guessing.',
    art: {
      src: '/intention.png', width: 2048, height: 2048, alt: 'Illustrated member with a hand on her heart',
      framing: { kind: 'fit', aspect: 'aspect-square' },
    },
  },
  {
    eyebrow: 'Presence',
    title: 'Real Voices, Real Sparks.',
    body: 'Hear a member\u2019s real voice before you connect, then send a thoughtful Spark that starts a real conversation.',
    art: {
      // Couple portrait, both heads to upper chest (the art's lower quarter is trimmed). Meeting.png is
      // not used: the file itself ends at the waist and cuts the backpack at its left edge.
      src: '/hero-couple.png', width: 2400, height: 1695, alt: 'Illustrated couple smiling together',
      framing: { kind: 'crop', aspect: 'aspect-[37/20]', img: { width: '100%' } },
    },
  },
  {
    eyebrow: 'Safety',
    title: 'Red Flags, Handled.',
    body: 'Scam scripts, catfish behavior, and early asks for money or off-app chats get flagged by message screening and one-tap reports. Bad actors don\u2019t last long here.',
    art: {
      // The art touches its own top and right edges (hair, flag tip): inset for air on three sides.
      src: '/red-flags.png', width: 688, height: 693, alt: 'Illustrated member spotting red flags on his phone',
      framing: { kind: 'fit', aspect: 'aspect-square', inset: 'inset-x-[7%] top-[7%] bottom-0' },
    },
  },
];

export function HeroLanding() {
  return (
    <div className="w-full bg-white min-h-screen overflow-x-hidden text-[#413B5E] selection:bg-[#665D96]/15 selection:text-[#665D96]">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#E8E6F1]">
        <div className={`${CONTAINER} h-14 flex items-center justify-between`}>
          <BrandLogo href="/" size="header" />
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-full text-[#413B5E] text-sm font-semibold hover:bg-[#E8E6F1]/70 active:scale-95 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* ===== Hero fold ===== */}
      <section className="relative w-full overflow-hidden bg-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <AmbientAurora />
        </div>
        <div className={`relative z-10 ${CONTAINER} pt-12 pb-20 md:pt-20 md:pb-28 grid grid-cols-1 md:grid-cols-2 items-center gap-12 md:gap-16`}>
          <div className="text-center md:text-left">
            <p className={EYEBROW}>Modern Matchmaking</p>
            <h1 className="mt-3 font-brand font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-[#413B5E] tracking-tight leading-[1.15] md:leading-[1.08]">
              Real connection, without the guesswork.
            </h1>
            <p className="mt-4 md:mt-5 text-[15px] md:text-base text-[#413B5E]/75 leading-relaxed max-w-[340px] md:max-w-[460px] mx-auto md:mx-0">
              Photo-verified members, clear intentions up front, and an authentic community built for real relationships.
            </p>

            <div className="mt-8 flex flex-col items-center md:items-start">
              <Link href="/signup" className={`${BTN_PRIMARY} w-full max-w-[300px] md:w-auto`}>
                <span>Join for Free</span>
                <ChevronRight className="ml-1 w-4 h-4" />
              </Link>
              <p className="mt-3 text-[11px] text-[#413B5E]/55">
                Free to join. By joining you agree to our Terms &amp; Privacy Policy.
              </p>
              <InstallAppCard variant="hero" />
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-2.5 max-w-[340px] md:max-w-[440px] mx-auto md:mx-0">
              {TRUST_BADGES.map(({ Icon, label }) => (
                <li key={label} className="flex items-center gap-2 rounded-full bg-white border border-[#E8E6F1] pl-1.5 pr-3 py-1.5 text-left">
                  <span className="w-7 h-7 shrink-0 rounded-full bg-[#E8E6F1]/70 text-[#665D96] flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5" aria-hidden />
                  </span>
                  <span className="text-[12px] font-semibold text-[#413B5E] leading-tight">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full flex justify-center md:justify-end">
            <PortraitFrame art={HERO_WOMAN} sizes="(max-width: 767px) 260px, 440px" priority className="w-[260px] md:w-full md:max-w-[440px]" />
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section className={`${SECTION} bg-[#E8E6F1]/30`}>
        <div className={CONTAINER}>
          <div className="text-center">
            <p className={EYEBROW}>How it works</p>
            <h2 className="mt-3 font-brand text-2xl md:text-3xl font-extrabold tracking-tight text-[#413B5E]">How connections happen</h2>
            <p className="mt-3 text-[15px] text-[#413B5E]/75 max-w-md mx-auto">Match on intention, not luck. Three steps to meeting someone real.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {STEPS.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-3xl p-6 border border-[#E8E6F1] flex items-start gap-4">
                <span className="w-10 h-10 shrink-0 rounded-full bg-[#E8E6F1]/70 text-[#665D96] flex items-center justify-center">
                  <Icon className="w-5 h-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-[#413B5E] leading-snug">{title}</p>
                  <p className="text-[13px] text-[#413B5E]/75 leading-relaxed mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Feature story: alternating rows (phone: illustration on top, text below) ===== */}
      {FEATURES.map(({ eyebrow, title, body, art }, i) => {
        const imageRight = i % 2 === 0; // desktop: text left / art right, then flipped
        return (
          <section key={eyebrow} className={`${SECTION} ${i % 2 === 0 ? 'bg-white' : 'bg-[#E8E6F1]/30'}`}>
            <div className={`${CONTAINER} grid grid-cols-1 md:grid-cols-2 items-center gap-10 md:gap-16`}>
              <div className={`w-full max-w-[420px] mx-auto ${imageRight ? 'md:order-2' : ''}`}>
                <PortraitFrame art={art} sizes="(max-width: 767px) 85vw, 420px" />
              </div>
              <div className={`text-center md:text-left ${imageRight ? 'md:order-1' : ''}`}>
                <p className={EYEBROW}>{eyebrow}</p>
                <h2 className="mt-3 font-brand text-2xl md:text-3xl font-extrabold tracking-tight text-[#413B5E]">{title}</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-[#413B5E]/75 max-w-[440px] mx-auto md:mx-0">{body}</p>
              </div>
            </div>
          </section>
        );
      })}

      {/* ===== Final call to action ===== */}
      <section className="py-24 md:py-32 bg-white">
        <div className={`${CONTAINER} text-center`}>
          <p className={EYEBROW}>Join the community</p>
          <h2 className="mt-3 font-brand text-3xl md:text-4xl font-extrabold tracking-tight text-[#413B5E]">Be one of our first members.</h2>
          <p className="mt-3 text-[15px] text-[#413B5E]/75 max-w-md mx-auto">
            Join free and start meeting genuine singles across Southeast Asia today.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className={`${BTN_PRIMARY} w-full max-w-[300px] sm:w-auto`}>
              <span>Join for Free</span>
              <ChevronRight className="ml-1 w-4 h-4" />
            </Link>
            <Link href="/login" className={`${BTN_SECONDARY} w-full max-w-[300px] sm:w-auto`}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-white py-10 border-t border-[#E8E6F1]">
        <div className={`${CONTAINER} text-center space-y-2`}>
          <BrandLogo href="/" size="md" className="justify-center" />
          <p className="text-xs text-[#413B5E]/55">Real connection for genuine singles across Southeast Asia.</p>
        </div>
      </footer>
    </div>
  );
}

export default HeroLanding;