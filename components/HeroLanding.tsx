'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, LayoutGroup, MotionConfig, motion, type Variants } from 'framer-motion';
import { BadgeCheck, Camera, ChevronDown, Compass, Flag, MapPin, Plane, ShieldCheck, X } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { LANDING_SHELL, SignInPrompt } from '@/components/Hero';
import { PhonePreview } from '@/components/landing/PhonePreview';
import { LocaleProvider, useLocale } from '@/components/i18n/LocaleProvider';
import { LanguagePill } from '@/components/i18n/LanguageSheet';
import { HTML_LANG, type Locale } from '@/lib/i18n/config';
import type { Messages } from '@/lib/i18n/messages';
import { format } from '@/lib/i18n';
import { hapticLight } from '@/lib/haptics';

/** Shared easing across the app (dropdowns, toasts): cubic-bezier(0.16, 1, 0.3, 1). */
const EASE = [0.16, 1, 0.3, 1] as const;

/** Scroll reveal: fades up once when the block is 80px inside the viewport. */
const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease: EASE },
} as const;

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const rise: Variants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } };

type CountryKey = 'ph' | 'th' | 'vn' | 'id' | 'kh';
/** City hubs per country. `slug` = an existing city page (lib/seo/citySlugs); others link to sign-up. */
const HUBS: Record<CountryKey, { name: string; slug?: string }[]> = {
  ph: [{ name: 'Manila', slug: 'manila' }, { name: 'Cebu', slug: 'cebu' }],
  th: [{ name: 'Bangkok', slug: 'bangkok' }, { name: 'Chiang Mai' }],
  vn: [{ name: 'Ho Chi Minh City' }, { name: 'Hanoi' }],
  id: [{ name: 'Jakarta' }, { name: 'Bali' }],
  kh: [{ name: 'Phnom Penh', slug: 'phnom-penh' }, { name: 'Siem Reap' }],
};
const COUNTRIES = Object.keys(HUBS) as CountryKey[];

type TabKey = 'discover' | 'travel' | 'verified';
const TABS: TabKey[] = ['discover', 'travel', 'verified'];

const STEPS = [
  { n: '01', key: 'one', src: '/intention.webp' },
  { n: '02', key: 'two', src: '/secured.webp' },
  { n: '03', key: 'three', src: '/Meeting.png' },
] as const;

/**
 * Signed-out landing page (app/page.tsx renders it only without a session, with the visitor's
 * locale and dictionary). One centred phone-width column on every screen, light canvas, brand
 * palette (#8574B7 / #534377 / #413B5E, #F3F0FF tint). Framer Motion reveals honour
 * prefers-reduced-motion (MotionConfig reducedMotion="user"). Copy: messages/<locale>.json `landing`.
 */
export function HeroLanding({ locale, messages }: { locale: Locale; messages: Messages }) {
  return (
    <LocaleProvider locale={locale} messages={messages}>
      <MotionConfig reducedMotion="user">
        <LandingBody />
      </MotionConfig>
    </LocaleProvider>
  );
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function LandingBody() {
  const { locale, m } = useLocale();
  const L = m.landing;
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const [pastHero, setPastHero] = useState(false);
  const [barDismissed, setBarDismissed] = useState(false);
  const [country, setCountry] = useState<CountryKey>('ph');
  const [tab, setTab] = useState<TabKey>('discover');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Floating CTA appears once the hero buttons have scrolled above the viewport.
  useEffect(() => {
    const el = heroCtaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const pill = 'inline-flex items-center justify-center rounded-full font-medium text-sm transition-colors';
  const primary = `${pill} h-12 px-6 bg-[#8574B7] hover:bg-[#534377] text-white shadow-[0_8px_20px_-8px_rgba(133,116,183,0.6)]`;
  const ghost = `${pill} h-12 px-6 border border-[#D0CDE1] bg-white text-[#413B5E] hover:border-[#8574B7]/50 hover:bg-[#F3F0FF]`;
  const h2 = 'font-brand text-[22px] font-semibold tracking-tight text-[#413B5E] text-center';
  const sub = 'mt-2 text-sm text-slate-600 text-center leading-relaxed';

  const faqs = [
    { q: L.faq.q1, a: L.faq.a1 },
    { q: L.faq.q2, a: L.faq.a2 },
    { q: L.faq.q3, a: L.faq.a3 },
  ];

  return (
    <div
      lang={HTML_LANG[locale]}
      className="font-sans w-full min-h-screen bg-[#FAFAFC] overflow-x-clip text-[#413B5E] selection:bg-[#8574B7]/15 selection:text-[#8574B7]"
    >
      {/* 1. Sticky glass header: wordmark, language, Join Free; section links below */}
      <header className="sticky top-0 z-50 w-full bg-white/75 backdrop-blur-md supports-[backdrop-filter]:bg-white/75 border-b border-slate-200/60">
        <div className={`${LANDING_SHELL} h-14 flex items-center justify-between gap-2`}>
          <BrandLogo href="/" size="header" />
          <div className="flex items-center gap-2">
            <LanguagePill />
            <Link href="/signup" className={`${pill} h-8 px-4 text-xs bg-[#8574B7] hover:bg-[#534377] text-white`}>
              {L.nav.join}
            </Link>
          </div>
        </div>
        <nav className={`${LANDING_SHELL} h-9 flex items-center justify-center gap-5 text-xs font-medium text-[#413B5E]/80`} aria-label="Sections">
          <button type="button" onClick={() => scrollToId('how')} className="hover:text-[#8574B7] transition-colors">{L.nav.how}</button>
          <button type="button" onClick={() => scrollToId('cities')} className="hover:text-[#8574B7] transition-colors">{L.nav.cities}</button>
          <button
            type="button"
            onClick={() => {
              setTab('verified');
              scrollToId('safety');
            }}
            className="hover:text-[#8574B7] transition-colors"
          >
            {L.nav.safety}
          </button>
        </nav>
      </header>

      <main className={LANDING_SHELL}>
        {/* 2. Hero: staggered copy, then the floating phone preview */}
        <motion.section variants={stagger} initial="hidden" animate="show" className="pt-8 pb-10 text-center">
          <motion.p variants={rise} className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F0FF] px-3 py-1 text-[11px] font-semibold text-[#8574B7]">
            <MapPin className="w-3 h-3" aria-hidden />
            {L.badge}
          </motion.p>
          <motion.h1 variants={rise} className="mt-4 font-brand text-[32px] leading-[1.1] font-semibold tracking-tight text-[#413B5E] break-words">
            <span className="block">{L.h1a}</span>
            <span className="block">
              <span className="bg-[#F3F0FF] text-[#8574B7] rounded-lg px-1.5 [box-decoration-break:clone]">{L.h1b}</span>
            </span>
            <span className="block">{L.h1c}</span>
          </motion.h1>
          <motion.p variants={rise} className="mt-4 text-[15px] leading-relaxed text-slate-600">
            {L.sub}
          </motion.p>
          <motion.div variants={rise} ref={heroCtaRef} className="mt-6 flex flex-col gap-3">
            <Link href="/signup" className={primary}>
              {L.ctaPrimary}
            </Link>
            <button type="button" onClick={() => scrollToId('cities')} className={ghost}>
              {L.ctaSecondary}
            </button>
          </motion.div>
          <motion.p variants={rise} className="mt-4 text-[12px] font-semibold text-[#8574B7]">
            {L.founding}
          </motion.p>
          <motion.div variants={rise} className="mt-8">
            <PhonePreview />
          </motion.div>
        </motion.section>

        {/* 3. City hubs */}
        <motion.section id="cities" {...reveal} className="py-10 scroll-mt-28">
          <h2 className={h2}>{L.cities.heading}</h2>
          <p className={sub}>{L.cities.sub}</p>
          <LayoutGroup id="countries">
            <div className="mt-5">
              {/* Wraps to a second centred row on narrow phones, so every country stays visible */}
              <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label={L.cities.heading}>
                {COUNTRIES.map((c) => {
                  const active = c === country;
                  return (
                    <button
                      key={c}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        hapticLight();
                        setCountry(c);
                      }}
                      className={`relative shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        active ? 'border-transparent text-white' : 'border-[#D0CDE1] bg-white text-[#413B5E] hover:border-[#8574B7]/40'
                      }`}
                    >
                      {active && (
                        <motion.span layoutId="country-pill" className="absolute inset-0 rounded-full bg-[#8574B7]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                      )}
                      <span className="relative">{L.countries[c]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </LayoutGroup>
          <div className="mt-4 min-h-[148px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={country}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="grid grid-cols-2 gap-3"
              >
                {HUBS[country].map((hub) => (
                  <Link
                    key={hub.name}
                    href={hub.slug ? `/${hub.slug}` : '/signup'}
                    className="group rounded-3xl border border-[#D0CDE1] bg-white p-4 text-left transition-transform hover:-translate-y-0.5"
                  >
                    <span className="w-9 h-9 rounded-2xl bg-[#F3F0FF] text-[#8574B7] flex items-center justify-center">
                      <MapPin className="w-4 h-4" aria-hidden />
                    </span>
                    <p className="mt-3 text-[15px] font-semibold text-[#413B5E] leading-snug">{hub.name}</p>
                    <p className="text-[11px] text-slate-600">{L.countries[country]}</p>
                    <p className="mt-2 text-xs font-medium text-[#8574B7] group-hover:text-[#534377]">
                      {hub.slug ? format(L.cities.explore, { city: hub.name }) : L.cities.join}
                    </p>
                  </Link>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.section>

        {/* 4. Product showcase tabs (also the "Safety" anchor: opens on Verified Profiles) */}
        <motion.section id="safety" {...reveal} className="py-10 scroll-mt-28">
          <h2 className={h2}>{L.showcase.heading}</h2>
          <p className={sub}>{L.showcase.sub}</p>
          <LayoutGroup id="showcase">
            <div className="mt-5 grid grid-cols-3 gap-1 rounded-full bg-white border border-[#D0CDE1] p-1" role="tablist">
              {TABS.map((k) => {
                const active = k === tab;
                return (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      hapticLight();
                      setTab(k);
                    }}
                    className={`relative h-9 rounded-full text-[12px] font-medium transition-colors ${active ? 'text-white' : 'text-[#413B5E] hover:text-[#8574B7]'}`}
                  >
                    {active && (
                      <motion.span layoutId="showcase-tab" className="absolute inset-0 rounded-full bg-[#8574B7]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                    )}
                    <span className="relative">{L.showcase.tabs[k]}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
          <div className="mt-4 min-h-[260px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -8 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="rounded-3xl border border-[#D0CDE1] bg-white p-5"
              >
                <ShowcasePreview tab={tab} />
                <h3 className="mt-5 text-[16px] font-semibold text-[#413B5E]">{L.showcase[tab].title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{L.showcase[tab].body}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.section>

        {/* 5. Three steps */}
        <section id="how" className="py-10 scroll-mt-28">
          <motion.h2 {...reveal} className={h2}>
            {L.how.heading}
          </motion.h2>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className="mt-6 flex flex-col gap-3">
            {STEPS.map(({ n, key, src }) => (
              <motion.div
                key={n}
                variants={rise}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="rounded-3xl border border-[#D0CDE1] bg-white p-5 text-center"
              >
                <div className="relative w-full h-36 rounded-2xl bg-[#F3F0FF] overflow-hidden">
                  <Image src={src} alt="" fill sizes="(max-width: 448px) 100vw, 408px" className="object-contain" />
                </div>
                <p className="mt-4 font-brand text-sm font-semibold tabular-nums text-[#8574B7]">{n}</p>
                <h3 className="mt-1 text-[16px] font-semibold text-[#413B5E]">{L.how[key].title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{L.how[key].desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* 6. FAQ */}
        <motion.section {...reveal} className="py-10">
          <h2 className={h2}>{L.faq.heading}</h2>
          <div className="mt-6 flex flex-col gap-2">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q} className="rounded-2xl border border-[#D0CDE1] bg-white overflow-hidden">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-[#413B5E]"
                  >
                    {f.q}
                    <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease: EASE }} className="shrink-0 text-[#8574B7]">
                      <ChevronDown className="w-4 h-4" aria-hidden />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="a"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                      >
                        <p className="px-4 pb-4 text-[13px] leading-relaxed text-slate-600">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Closing CTA */}
        <motion.section {...reveal} className="py-10">
          <div className="rounded-3xl bg-[#F3F0FF] px-5 py-8 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8574B7]">{L.founding}</p>
            <h2 className="mt-2 font-brand text-[22px] font-semibold tracking-tight text-[#413B5E]">{L.closing.heading}</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{L.closing.sub}</p>
            <div className="mt-6 flex flex-col items-center gap-4">
              <Link href="/signup" className={`${primary} w-full`}>
                {L.closing.cta}
              </Link>
              <SignInPrompt />
            </div>
          </div>
        </motion.section>

        {/* Footer: public landing page only */}
        <footer className="pb-28 pt-4 text-center text-xs text-slate-600">
          <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-medium text-[#413B5E]">
            <Link className="hover:text-[#8574B7] transition-colors" href="/safety">{m.footer.safety}</Link>
            <span className="text-[#D0CDE1]" aria-hidden="true">•</span>
            <Link className="hover:text-[#8574B7] transition-colors" href="/terms">{m.footer.terms}</Link>
            <span className="text-[#D0CDE1]" aria-hidden="true">•</span>
            <Link className="hover:text-[#8574B7] transition-colors" href="/privacy">{m.footer.privacy}</Link>
            <span className="text-[#D0CDE1]" aria-hidden="true">•</span>
            <Link className="hover:text-[#8574B7] transition-colors" href="/contact">{m.footer.contact}</Link>
          </nav>
          <div className="mt-3 flex justify-center">
            <LanguagePill full />
          </div>
          <p className="mt-2 text-[11px] text-slate-600">© {new Date().getFullYear()} Meet in Asia</p>
        </footer>
      </main>

      {/* 1b. Floating CTA bar: slides up after the hero, dismissible */}
      <AnimatePresence>
        {pastHero && !barDismissed && (
          <motion.div
            initial={{ y: 96, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 px-4 pointer-events-none"
          >
            <div className="pointer-events-auto mx-auto max-w-[448px] flex items-center gap-2 rounded-full bg-white/85 backdrop-blur-md border border-[#D0CDE1] p-1.5 shadow-[0_12px_30px_-12px_rgba(65,59,94,0.35)]">
              <Link href="/signup" className={`${pill} flex-1 h-11 bg-[#8574B7] hover:bg-[#534377] text-white`}>
                {L.floating.cta}
              </Link>
              <button
                type="button"
                onClick={() => setBarDismissed(true)}
                aria-label={L.floating.dismiss}
                className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-[#413B5E]/70 hover:bg-[#F3F0FF] transition-colors"
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Small live UI preview per showcase tab. */
function ShowcasePreview({ tab }: { tab: TabKey }) {
  const { m } = useLocale();
  const L = m.landing;
  if (tab === 'discover') {
    return (
      <div className="rounded-2xl bg-[#FAFAFC] p-3">
        <div className="flex items-center gap-2 text-[#8574B7]">
          <Compass className="w-4 h-4" aria-hidden />
          <div className="flex gap-1.5">
            {[L.preview.all, L.preview.online, L.preview.nearMe].map((label, i) => (
              <span key={label} className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${i === 1 ? 'bg-[#8574B7] text-white' : 'border border-[#D0CDE1] bg-white text-[#413B5E]'}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {['/hero-woman.webp', '/intention.webp', '/secured.webp'].map((src) => (
            <div key={src} className="relative aspect-[3/4] rounded-xl bg-[#F3F0FF] overflow-hidden">
              <Image src={src} alt="" fill sizes="120px" className="object-contain" />
              <span className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" aria-hidden />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (tab === 'travel') {
    return (
      <div className="rounded-2xl bg-[#FAFAFC] p-4 flex items-center gap-3">
        <span className="w-11 h-11 rounded-2xl bg-[#F3F0FF] text-[#8574B7] flex items-center justify-center shrink-0">
          <Plane className="w-5 h-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#413B5E]">{L.showcase.visiting}</p>
          <p className="text-xs text-slate-600">{L.showcase.dates}</p>
        </div>
      </div>
    );
  }
  const rows = [
    { Icon: Camera, label: L.showcase.selfie },
    { Icon: BadgeCheck, label: L.showcase.photo },
    { Icon: Flag, label: L.showcase.report },
  ];
  return (
    <div className="rounded-2xl bg-[#FAFAFC] p-3 flex flex-col gap-2">
      {rows.map(({ Icon, label }) => (
        <div key={label} className="flex items-center gap-3 rounded-xl bg-white border border-[#D0CDE1] px-3 py-2">
          <Icon className="w-4 h-4 text-[#8574B7]" aria-hidden />
          <span className="flex-1 text-[13px] font-medium text-[#413B5E]">{label}</span>
          <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden />
        </div>
      ))}
    </div>
  );
}

export default HeroLanding;
