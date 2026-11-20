'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck, ScanFace, ShieldCheck, Zap } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { LANDING_SHELL } from '@/components/Hero';
import { LocaleProvider, useLocale } from '@/components/i18n/LocaleProvider';
import { LanguagePill } from '@/components/i18n/LanguageSheet';
import { FadeIn, LandingMotion, Reveal, TapButton } from '@/components/landing/Motion';
import { LinkSpinner } from '@/components/ui/LinkSpinner';
import { HTML_LANG, type Locale } from '@/lib/i18n/config';
import type { Messages } from '@/lib/i18n/messages';

const PILLARS = [
  { key: 'verified', Icon: ScanFace },
  { key: 'shield', Icon: ShieldCheck },
  { key: 'fast', Icon: Zap },
] as const;

/**
 * Landing page for visitors in the Philippines (app/page.tsx picks it from the edge country header, or
 * from ?country=PH). Same single phone-width column, header and palette as the global landing page
 * (components/HeroLanding.tsx), with the Camille-PH-Landing hero, Philippines copy, three trust pillars,
 * the Founding Member note and a short footer. One lightweight image, no client data fetching.
 */
export function PhilippinesLanding({ locale, messages }: { locale: Locale; messages: Messages }) {
  return (
    <LocaleProvider locale={locale} messages={messages}>
      <Body />
    </LocaleProvider>
  );
}

function Body() {
  const { locale, m } = useLocale();
  return (
    <LandingMotion>
      <div
        lang={HTML_LANG[locale]}
        className="font-sans w-full min-h-[100dvh] bg-white overflow-x-clip text-[#413B5E] selection:bg-[#8574B7]/15 selection:text-[#8574B7]"
      >
        <header className="sticky top-0 z-50 w-full bg-white/75 backdrop-blur-md supports-[backdrop-filter]:bg-white/75 border-b border-[#E5E0F2]/80 pt-[env(safe-area-inset-top,0px)]">
          <div className={`${LANDING_SHELL} h-16 flex items-center justify-between`}>
            <BrandLogo href="/" size="header" />
            <div className="flex items-center gap-1">
              <LanguagePill />
              <Link href="/login" className="rounded-full px-3 py-1.5 text-sm font-medium text-[#413B5E]/75 transition-colors hover:text-[#8574B7]">
                {m.auth.signIn}
              </Link>
            </div>
          </div>
        </header>

        <div className={LANDING_SHELL}>
          <section className="w-full pb-8 pt-3">
            <div className="flex flex-col items-center text-center">
              {/*
                Camille-PH-Landing-lavender.jpg (2400x1792; the concrete wall recoloured to the same lavender as the main hero) is served by next/image: it serves a resized WebP for the phone's
                width (sizes below), so a 4G handset downloads a small file, not the original. Camille stands in
                the right third of the frame: the 5:4 window trims a little of the empty painted wall on the left,
                and object-[68%_20%] keeps her face, smile and phone inside it.
              */}
              <FadeIn className="relative aspect-[5/4] w-full overflow-hidden rounded-3xl bg-[#E8E6F1]/50 shadow-[0_8px_30px_rgba(65,59,94,0.12)]">
                <Image
                  src="/Camille-PH-Landing-lavender.jpg"
                  alt={m.ph.imageAlt}
                  width={2400}
                  height={1792}
                  preload
                  quality={80}
                  sizes="(max-width: 768px) 100vw, 640px"
                  className="h-full w-full object-cover object-[68%_20%] select-none pointer-events-none"
                />
              </FadeIn>

              <span className="mt-4 inline-flex max-w-full items-center rounded-full border border-[#8574B7]/25 bg-[#F6F4FB] px-3 py-1 text-xs font-medium leading-snug text-[#534377]">
                {m.ph.badge}
              </span>

              <h1 className="mt-3 w-full text-[26px] font-semibold tracking-tight leading-tight text-[#413B5E] break-words">{m.ph.headline}</h1>
              <p className="mt-2 w-full text-sm leading-relaxed text-slate-600 break-words">{m.ph.subtitle}</p>

              <FadeIn delay={0.08} className="mt-4 flex w-full flex-col items-center gap-3">
                <TapButton>
                  <Link
                    href="/signup"
                    className="relative w-full h-12 inline-flex items-center justify-center rounded-full bg-[#8574B7] hover:bg-[#534377] px-4 text-center text-white font-medium text-sm transition-colors duration-200"
                  >
                    {m.ph.join}
                    <LinkSpinner />
                  </Link>
                </TapButton>
                <Link href="/login" className="text-sm font-medium text-[#8574B7] underline-offset-4 transition-colors hover:text-[#534377] hover:underline">
                  {m.ph.haveAccount}
                </Link>
              </FadeIn>
            </div>
          </section>

          {/* Why Meet in Asia is different */}
          <section className="py-8">
            <h2 className="text-center font-brand text-xl font-semibold tracking-tight text-[#413B5E]">{m.ph.whyHeading}</h2>
            <div className="mt-6 space-y-3">
              {PILLARS.map(({ key, Icon }, i) => (
                <Reveal
                  key={key}
                  className={`flex items-start gap-3.5 rounded-3xl border border-[#E6E2F0] p-4 ${i % 2 === 0 ? 'bg-[#F6F4FB]' : 'bg-white'}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#8574B7] ring-1 ring-[#E6E2F0]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="min-w-0 break-words">
                    <h3 className="text-[15px] font-semibold leading-snug text-[#413B5E]">{m.ph[key].title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{m.ph[key].body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Founding Member perks (Philippines early access) */}
          <section className="pb-8">
            <Reveal className="rounded-3xl border border-[#8574B7]/25 bg-[#F6F4FB] p-5 text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#8574B7] ring-1 ring-[#8574B7]/20">
                <BadgeCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </span>
              <h2 className="mt-3 font-brand text-lg font-semibold tracking-tight text-[#413B5E]">{m.ph.founding.title}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#413B5E]/80">{m.ph.founding.body}</p>
              <TapButton>
                <Link
                  href="/signup"
                  className="relative mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#8574B7] px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#534377]"
                >
                  {m.ph.join}
                  <LinkSpinner />
                </Link>
              </TapButton>
            </Reveal>
          </section>

          <footer className="pb-8 pt-2 text-center text-xs text-slate-600">
            <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-medium text-[#413B5E]">
              <Link className="hover:text-[#8574B7] transition-colors" href="/safety">{m.ph.footer.safety}</Link>
              <span className="text-[#D0CDE1]" aria-hidden="true">•</span>
              <Link className="hover:text-[#8574B7] transition-colors" href="/standards">{m.ph.footer.guidelines}</Link>
              <span className="text-[#D0CDE1]" aria-hidden="true">•</span>
              <Link className="hover:text-[#8574B7] transition-colors" href="/privacy">{m.footer.privacy}</Link>
              <span className="text-[#D0CDE1]" aria-hidden="true">•</span>
              <Link className="hover:text-[#8574B7] transition-colors" href="/terms">{m.footer.terms}</Link>
              <span className="text-[#D0CDE1]" aria-hidden="true">•</span>
              <Link className="hover:text-[#8574B7] transition-colors" href="/terms#refunds">{m.footer.refunds}</Link>
              <span className="text-[#D0CDE1]" aria-hidden="true">•</span>
              <Link className="hover:text-[#8574B7] transition-colors" href="/terms#cancellation">{m.footer.cancellation}</Link>
            </nav>
            <p className="mt-2 text-[11px] text-slate-600">© {new Date().getFullYear()} meetin.asia</p>
          </footer>
        </div>
      </div>
    </LandingMotion>
  );
}

export default PhilippinesLanding;
