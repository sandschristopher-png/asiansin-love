'use client';

import Link from 'next/link';
import Image from 'next/image';
import { AudioLines } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import Hero, { LANDING_SHELL, SignInPrompt } from '@/components/Hero';
import { LocaleProvider, useLocale } from '@/components/i18n/LocaleProvider';
import { LanguageSelect } from '@/components/i18n/LanguageSelect';
import { HTML_LANG, type Locale } from '@/lib/i18n/config';
import type { Messages } from '@/lib/i18n/messages';

const STEP_KEYS = [
  { step: '01', key: 'one' },
  { step: '02', key: 'two' },
  { step: '03', key: 'three' },
] as const;

// Card art: illustrations fill their tile edge to edge; "voices" uses an audio-wave graphic.
const FEATURES = [
  { key: 'screening', src: '/secured.webp' },
  { key: 'intent', src: '/hero-couple.webp' },
  { key: 'voices', src: null },
  { key: 'protection', src: '/red-flags.webp' },
] as const;

/**
 * Signed-out landing page (app/page.tsx renders it only without a session, with the locale from
 * the NEXT_LOCALE cookie and that locale's dictionary). One centred max-w-md column on every
 * screen and no breakpoints that change the layout. The root carries the lang attribute, so
 * screen readers and the CJK font order in globals.css follow the chosen language from the
 * server render.
 */
export function HeroLanding({ locale, messages }: { locale: Locale; messages: Messages }) {
  return (
    <LocaleProvider locale={locale} messages={messages}>
      <LandingBody />
    </LocaleProvider>
  );
}

function LandingBody() {
  const { locale, m } = useLocale();
  return (
    <div
      lang={HTML_LANG[locale]}
      className="font-sans w-full min-h-screen bg-white overflow-x-clip text-[#413B5E] selection:bg-[#8574B7]/15 selection:text-[#8574B7]"
    >
      {/* Frosted header, same treatment as Discover: content scrolls under the blurred glass. */}
      <header className="sticky top-0 z-50 w-full bg-white/75 backdrop-blur-md supports-[backdrop-filter]:bg-white/75 border-b border-slate-200/60">
        <div className={`${LANDING_SHELL} h-16 flex items-center justify-between`}>
          <BrandLogo href="/" size="header" />
          <LanguageSelect compact />
        </div>
      </header>

      <div className={LANDING_SHELL}>
        <div className="pt-4">
          <Hero />
        </div>

        {/* How connections happen */}
        <section className="py-8">
          <div className="text-center">
            <h2 className="font-brand text-xl font-semibold tracking-tight text-[#413B5E]">{m.steps.heading}</h2>
            <p className="mt-2 text-sm text-slate-600">{m.steps.sub}</p>
          </div>
          <div className="mt-6 space-y-3">
            {STEP_KEYS.map(({ step, key }) => (
              <div key={step} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="w-6 shrink-0 pt-px font-brand text-sm font-semibold tabular-nums text-[#8574B7]">{step}</span>
                <div className="min-w-0 text-left">
                  <h3 className="text-[15px] font-semibold text-[#413B5E] leading-snug">{m.steps[key].title}</h3>
                  <p className="mt-1 text-[13px] text-slate-600 leading-relaxed">{m.steps[key].desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature stories: illustration left, copy right */}
        <section className="py-8 space-y-3">
          {FEATURES.map(({ key, src }) => (
            <div key={key} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3.5">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 overflow-hidden rounded-xl">
                {src ? (
                  <Image src={src} alt={m.features[key].alt} fill sizes="112px" className="w-full h-full object-cover object-center select-none pointer-events-none" />
                ) : (
                  <div className="w-full h-full bg-[#E8E6F1] flex items-center justify-center" role="img" aria-label={m.features[key].alt}>
                    <AudioLines className="w-11 h-11 text-[#8574B7]" strokeWidth={1.75} aria-hidden />
                  </div>
                )}
              </div>
              <div className="min-w-0 text-left">
                <h3 className="text-[15px] font-semibold text-[#413B5E] leading-snug">{m.features[key].title}</h3>
                <p className="mt-1 text-[13px] text-slate-600 leading-relaxed">{m.features[key].body}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Final call to action */}
        <section className="py-10 text-center">
          <h2 className="font-brand text-xl font-semibold tracking-tight text-[#413B5E]">{m.cta.heading}</h2>
          <p className="mt-2 text-sm text-slate-600">{m.cta.sub}</p>
          <div className="mt-6 flex flex-col items-center gap-4">
            <Link
              href="/signup"
              className="w-full h-12 inline-flex items-center justify-center rounded-full bg-[#8574B7] hover:bg-[#534377] text-white font-medium text-sm active:scale-95 transition-all"
            >
              {m.hero.join}
            </Link>
            <SignInPrompt />
          </div>
        </section>

        {/* Footer: rendered by the public landing page only, never inside the signed-in app. */}
        <footer className="pb-8 pt-4 text-center text-xs text-slate-600">
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
            <LanguageSelect />
          </div>
          <p className="mt-2 text-[11px] text-slate-600">© {new Date().getFullYear()} Meet in Asia</p>
        </footer>
      </div>
    </div>
  );
}

export default HeroLanding;
