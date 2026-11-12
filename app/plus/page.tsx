'use client';

import React, { useEffect, useState, useSyncExternalStore, Suspense } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, CheckCircle2, ChevronDown, Compass, Loader2, Lock, Minus, MessageSquare, Settings, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { isPlusProfile } from '@/lib/plus';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { localizeError } from '@/lib/i18n/errors';
import type { TKey } from '@/lib/i18n';
import { getCachedSubscription, setCachedSubscription } from '@/lib/subscriptionStatus';
import { TRIP_HUBS } from '@/lib/tripHubs';
import { DEFAULT_PLUS_PLAN, FREE_DAILY_INTROS, FREE_DAILY_SPARKS, PLUS_PLANS, plusPlan, type PlusPlanId } from '@/lib/plusPlans';

/**
 * How a cell reads on the Free side:
 *   all      fully included (check)
 *   partial  a limited allowance (dash)
 *   no       not on Free (cross)
 * The Plus side always reads as included; `exclusive` rows are the paid upgrades and are
 * emphasised in purple.
 */
type Mark = 'all' | 'partial' | 'no';
type Cell = { key: TKey; vars?: Record<string, string | number> };
type Row = { id: string; label: TKey; free: Cell; freeMark: Mark; plus: Cell; exclusive: boolean };

/**
 * Free vs Plus side by side. Every row is wired: keep in sync with /api/spark (daily Sparks),
 * /api/messages (new conversations, mutual matches), /api/sparks/gated (previews), /api/discover
 * (country and visiting-hub filters), /api/profile/view (visitors), the chat read indicators and
 * actions/trips.ts (travel notice).
 */
const ROWS: Row[] = [
  { id: 'verify', label: 'plus.page.rowVerify', free: { key: 'plus.page.cellFreeAll' }, freeMark: 'all', plus: { key: 'plus.page.cellFreeAll' }, exclusive: false },
  { id: 'mutual', label: 'plus.page.rowMutual', free: { key: 'plus.page.cellUnlimited' }, freeMark: 'all', plus: { key: 'plus.page.cellUnlimited' }, exclusive: false },
  { id: 'gate', label: 'plus.page.rowGate', free: { key: 'plus.page.cellActiveAll' }, freeMark: 'all', plus: { key: 'plus.page.cellActiveAll' }, exclusive: false },
  { id: 'intro', label: 'plus.page.rowIntro', free: { key: 'plus.page.cellPerDay', vars: { n: FREE_DAILY_INTROS } }, freeMark: 'partial', plus: { key: 'plus.page.cellUnlimited' }, exclusive: true },
  { id: 'travel', label: 'plus.page.rowTravel', free: { key: 'plus.page.cellNotIncluded' }, freeMark: 'no', plus: { key: 'plus.page.cellTravel' }, exclusive: true },
  { id: 'country', label: 'plus.page.rowCountry', free: { key: 'plus.page.cellFreeCountry' }, freeMark: 'partial', plus: { key: 'plus.page.cellPlusCountry' }, exclusive: true },
  { id: 'hub', label: 'plus.page.rowHub', free: { key: 'plus.page.cellNotIncluded' }, freeMark: 'no', plus: { key: 'plus.page.cellPlusHubs', vars: { n: TRIP_HUBS.length } }, exclusive: true },
  { id: 'private', label: 'plus.page.rowPrivate', free: { key: 'plus.page.cellPrivateFree' }, freeMark: 'partial', plus: { key: 'plus.page.cellPrivatePlus' }, exclusive: true },
  { id: 'ghost', label: 'plus.page.rowGhost', free: { key: 'plus.page.cellNotIncluded' }, freeMark: 'no', plus: { key: 'plus.page.cellGhost' }, exclusive: true },
  { id: 'sparks', label: 'plus.page.rowSparks', free: { key: 'plus.page.cellPerDay', vars: { n: FREE_DAILY_SPARKS } }, freeMark: 'partial', plus: { key: 'plus.page.cellUnlimited' }, exclusive: true },
  { id: 'viewed', label: 'plus.page.rowViewed', free: { key: 'plus.page.cellBlurred' }, freeMark: 'partial', plus: { key: 'plus.page.cellFullGrid' }, exclusive: true },
  { id: 'sparked', label: 'plus.page.rowSparked', free: { key: 'plus.page.cellOnePreview' }, freeMark: 'partial', plus: { key: 'plus.page.cellFullGrid' }, exclusive: true },
  { id: 'receipts', label: 'plus.page.rowReceipts', free: { key: 'plus.page.cellTimestamps' }, freeMark: 'partial', plus: { key: 'plus.page.cellReceipts' }, exclusive: true },
  { id: 'badge', label: 'plus.page.rowBadge', free: { key: 'plus.page.cellStandard' }, freeMark: 'partial', plus: { key: 'plus.page.cellBadge' }, exclusive: true },
];

/** ?feature= values the locked taps around the app send, mapped to the row they highlight. */
const FEATURE_ROW: Record<string, string> = {
  viewers: 'viewed',
  viewed: 'viewed',
  sparked: 'sparked',
  country: 'country',
  hub: 'hub',
  trips: 'travel',
  sparks: 'sparks',
  receipts: 'receipts',
  intro: 'intro',
  private: 'private',
  ghost: 'ghost',
  badge: 'badge',
};

const FAQ: { q: TKey; a: TKey; vars?: Record<string, string | number> }[] = [
  { q: 'plus.page.faqQ1', a: 'plus.page.faqA1' },
  { q: 'plus.page.faqQ2', a: 'plus.page.faqA2', vars: { n: TRIP_HUBS.length } },
  { q: 'plus.page.faqQ3', a: 'plus.page.faqA3' },
  { q: 'plus.page.faqQ4', a: 'plus.page.faqA4' },
];

const PLAN_LABEL: Record<PlusPlanId, TKey> = { '1m': 'plus.plan1m', '3m': 'plus.plan3m', '6m': 'plus.plan6m' };
const BADGE_LABEL = { 'Most Popular': 'plus.mostPopular', 'Best Value': 'plus.bestValue' } as const;
const BANNER: TKey[] = ['plus.page.banner1', 'plus.page.banner2', 'plus.page.banner3', 'plus.page.banner4'];

function FreeMark({ mark, label }: { mark: Mark; label: string }) {
  if (mark === 'all') return <Check className="w-3.5 h-3.5 mt-px shrink-0 text-slate-600" strokeWidth={2.5} aria-label={label} />;
  if (mark === 'partial') return <Minus className="w-3.5 h-3.5 mt-px shrink-0 text-slate-400" strokeWidth={2.5} aria-hidden />;
  return <X className="w-3.5 h-3.5 mt-px shrink-0 text-[#413B5E]/30" strokeWidth={2.5} aria-label={label} />;
}

function Drawer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl bg-white border border-[#D0CDE1] shadow-sm px-4 py-3">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-2 text-sm font-semibold text-[#413B5E]">
        {title}
        <ChevronDown className="w-4 h-4 text-slate-600 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

function PlusHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const isPostCheckoutSuccess = searchParams.get('success') === '1';
  const highlightRow = FEATURE_ROW[searchParams.get('feature') ?? ''] ?? null;

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  // null until the profile read resolves (or the cached status from an earlier page in this tab):
  // the checkout bar shows a skeleton, never "Keep Free" to a Plus member.
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(() => getCachedSubscription());
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(() => isPostCheckoutSuccess || getCachedSubscription() === null);
  const isPlus = isSubscribed === true;
  const showFreeOffer = !isLoadingSubscription && isSubscribed === false;
  const [selectedPlan, setSelectedPlan] = useState<PlusPlanId>(DEFAULT_PLUS_PLAN);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isVerifyingPlus, setIsVerifyingPlus] = useState(isPostCheckoutSuccess);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    let mounted = true;
    let pollCount = 0;
    const maxPolls = 5;

    async function checkProfile() {
      // Waiting on Stripe's webhook after checkout: the bar stays a skeleton between polls.
      let polling = false;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (mounted) {
            setIsSubscribed(false);
            setIsLoadingSubscription(false);
            setLoading(false);
          }
          return;
        }
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (mounted && prof) {
          const hasPlus = isPlusProfile(prof);
          // Stripe's webhook can land a moment after the redirect back here.
          if (isPostCheckoutSuccess && !hasPlus && pollCount < maxPolls) {
            pollCount++;
            polling = true;
            setTimeout(checkProfile, 1500);
            return;
          }
          setIsSubscribed(hasPlus);
          setIsLoadingSubscription(false);
          setCachedSubscription(hasPlus);
          if (hasPlus) setIsVerifyingPlus(false);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted && !polling) {
          // A failed read falls back to the free offer rather than a skeleton forever.
          setIsSubscribed((v) => v ?? false);
          setIsLoadingSubscription(false);
          setLoading(false);
          if (pollCount >= maxPolls) setIsVerifyingPlus(false);
        }
      }
    }

    checkProfile();
    return () => {
      mounted = false;
    };
  }, [isPostCheckoutSuccess]);

  // A locked tap elsewhere in the app lands here with ?feature=: bring that row into view.
  useEffect(() => {
    if (!highlightRow) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`plus-row-${highlightRow}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [highlightRow]);

  async function handleSubscribe() {
    setStarting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/plus/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan, returnPath: '/plus' }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 503) {
        setStatusMsg(t('plus.page.paymentsSoon'));
        return;
      }
      if (!res.ok || !json.url) {
        setStatusMsg(localizeError({ status: res.status, code: json.code, message: json.error }, t, 'plus.checkoutFailed'));
        return;
      }
      window.location.href = json.url;
    } catch {
      setStatusMsg(t('errors.network'));
    } finally {
      setStarting(false);
    }
  }

  async function handlePortal() {
    setOpeningPortal(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ return_path: '/plus' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.url) {
        setStatusMsg(localizeError({ status: res.status, code: json.code, message: json.error }, t, 'settings.portalFailed'));
        return;
      }
      window.location.href = json.url;
    } catch {
      setStatusMsg(t('errors.network'));
    } finally {
      setOpeningPortal(false);
    }
  }

  const plan = plusPlan(selectedPlan);
  const savePct = (savings?: string) => {
    const n = Number((savings || '').replace(/[^0-9]/g, ''));
    return n > 0 ? t('plus.page.savePct', { pct: n }) : null;
  };

  return (
    <div className="relative isolate flex-1 w-full min-h-screen bg-white text-[#413B5E] overflow-hidden">
      {/* Layered breathing aura on the white canvas (same as the auth screens). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="w-[30rem] h-[30rem] rounded-full bg-[#E8E6F1]/70 blur-3xl animate-pulse pointer-events-none absolute -top-24 -left-24" />
        <div className="w-[26rem] h-[26rem] rounded-full bg-[#D0CDE1]/45 blur-3xl animate-pulse pointer-events-none absolute top-1/3 -right-20 [animation-delay:1.5s]" />
        <div className="w-96 h-96 rounded-full bg-[#E8E6F1]/50 blur-3xl animate-pulse pointer-events-none absolute -bottom-20 left-1/4 [animation-delay:3s]" />
      </div>

      <div className="relative z-10 px-4 pt-3 pb-[calc(8.5rem+env(safe-area-inset-bottom))] space-y-6">
        {/* Subpage header */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push('/discover'))}
            aria-label={t('plus.page.back')}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-xs font-medium tracking-wider text-slate-600 hover:text-[#413B5E] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {isPostCheckoutSuccess && (
          <div className="p-4 rounded-2xl bg-white/90 border border-[#D0CDE1] shadow-sm flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-[#8574B7]/10 text-[#8574B7] flex items-center justify-center mb-2">
              {isVerifyingPlus && !isPlus ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <h2 className="text-base font-semibold text-[#413B5E]">{isPlus ? t('plus.page.welcomeTitle') : t('plus.page.confirming')}</h2>
            <p className="text-xs text-slate-600 mt-0.5 mb-3">{isPlus ? t('plus.page.unlocked') : t('plus.page.finishing')}</p>
            <div className="flex items-center gap-2 w-full">
              <Link href="/messages" className="flex-1 h-10 rounded-full bg-[#8574B7] hover:bg-[#534377] text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> {t('nav.messages')}
              </Link>
              <Link href="/discover" className="flex-1 h-10 rounded-full border border-[#D0CDE1] bg-white text-[#413B5E] text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#E8E6F1]/40 transition-colors">
                <Compass className="w-3.5 h-3.5" /> {t('nav.discover')}
              </Link>
            </div>
          </div>
        )}

        {/* Hero */}
        <header className="space-y-3.5">
          <PlusBadge />
          <h1 className="text-[34px] leading-[1.15] font-semibold tracking-tight text-[#413B5E]">{t('plus.page.headline')}</h1>
          <p className="text-sm leading-relaxed text-slate-600">{t('plus.page.subtext')}</p>
          <ul className="rounded-2xl bg-[#FAF9FC] border border-[#8574B7]/25 px-4 py-3.5 space-y-2.5">
            {BANNER.map((key) => (
              <li key={key} className="flex items-start gap-2.5 text-[13px] font-medium leading-snug text-[#413B5E]">
                <span className="mt-px w-4 h-4 shrink-0 rounded-full bg-[#8574B7]/15 text-[#8574B7] flex items-center justify-center">
                  <Check className="w-3 h-3" strokeWidth={3} aria-hidden />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </header>

        {statusMsg && (
          <div role="alert" className="p-3 rounded-2xl bg-white/90 border border-[#D0CDE1] text-xs font-medium text-[#413B5E] text-center">{statusMsg}</div>
        )}

        {/* Plans (free members) or the active state (Plus members) */}
        {showFreeOffer && (
          <section aria-label={t('plus.choosePlan')} className="grid grid-cols-3 gap-2 pt-1" role="radiogroup">
            {PLUS_PLANS.map((p) => {
              const active = p.id === selectedPlan;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`text-left flex flex-col gap-1 ${
                    active
                      ? 'bg-white border-2 border-[#8574B7] rounded-2xl p-3.5 shadow-brand-md relative'
                      : 'relative bg-white/90 backdrop-blur-md border border-[#D0CDE1] rounded-2xl p-3.5 shadow-brand-sm hover:border-[#B8B3D1] transition-all text-[#413B5E]'
                  }`}
                >
                  {p.badge && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold leading-none text-white bg-[#8574B7] px-2.5 py-1 rounded-full shadow-brand-sm">
                      {t(BADGE_LABEL[p.badge])}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-[#413B5E]/80">{t(PLAN_LABEL[p.id])}</span>
                  <span className="text-lg font-semibold leading-tight text-[#413B5E]">{p.total}</span>
                  <span className="text-[10px] leading-snug text-slate-600">
                    {p.months > 1 ? t('plus.perMonth', { price: p.perMonth }) : t('plus.billedMonthly')}
                  </span>
                  {savePct(p.savings) && <span className="text-[11px] font-semibold leading-snug text-[#8574B7]">{savePct(p.savings)}</span>}
                </button>
              );
            })}
          </section>
        )}
        {isPlus && (
          <section className="rounded-2xl bg-[#FAF9FC] border border-[#8574B7]/25 px-4 py-4 flex items-start gap-3">
            <span className="w-9 h-9 shrink-0 rounded-full bg-[#8574B7]/15 text-[#8574B7] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#413B5E]">
                {t('plus.page.activeTitle')} <PlusBadge />
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{t('plus.page.activeBody')}</p>
            </div>
          </section>
        )}

        {/* Free vs Plus: the Plus column is one continuous purple track from header to last row */}
        <section aria-label={t('plus.page.compared')} className="rounded-2xl bg-white border border-[#D0CDE1] shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1.1fr_1fr_1.1fr] text-[11px] font-semibold tracking-wider text-slate-600 uppercase border-b border-[#D0CDE1]">
            <span className="px-3.5 py-3 leading-snug">{t('plus.page.colFeature')}</span>
            <span className="px-2 py-3 leading-snug">{t('plus.page.colFree')}</span>
            <span className="px-2.5 py-3 leading-snug bg-[#8574B7]/[0.07] border-l border-[#8574B7]/20 normal-case tracking-normal">
              <PlusBadge />
            </span>
          </div>
          {ROWS.map((row, i) => {
            const hi = highlightRow === row.id;
            const last = i === ROWS.length - 1;
            return (
              <div
                key={row.id}
                id={`plus-row-${row.id}`}
                className={`grid grid-cols-[1.1fr_1fr_1.1fr] text-[#413B5E] ${last ? '' : 'border-b border-[#D0CDE1]/40'}`}
              >
                <span className={`px-3.5 py-3 text-[12px] font-semibold leading-snug ${hi ? 'bg-[#8574B7]/10' : ''}`}>{t(row.label)}</span>
                <span className={`px-2 py-3 text-[11.5px] text-slate-600 flex items-start gap-1.5 leading-snug ${hi ? 'bg-[#8574B7]/10' : ''}`}>
                  <FreeMark mark={row.freeMark} label={row.freeMark === 'no' ? t('plus.page.notIncluded') : t('plus.page.included')} />
                  <span>{t(row.free.key, row.free.vars)}</span>
                </span>
                <span
                  className={`px-2.5 py-3 text-[11.5px] flex items-start gap-1.5 leading-snug bg-[#8574B7]/[0.07] border-l border-[#8574B7]/20 ${
                    row.exclusive ? 'font-semibold text-[#534377]' : 'font-medium'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 mt-px shrink-0 text-[#8574B7]" strokeWidth={2.5} aria-label={t('plus.page.included')} />
                  <span>{t(row.plus.key, row.plus.vars)}</span>
                </span>
              </div>
            );
          })}
        </section>

        {/* Drawers */}
        <section className="space-y-2.5">
          <Drawer title={t('plus.page.faqTitle')}>
            {FAQ.map((f) => (
              <div key={f.q}>
                <p className="text-xs font-semibold text-[#413B5E]">{t(f.q)}</p>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{t(f.a, f.vars)}</p>
              </div>
            ))}
          </Drawer>
          <Drawer title={t('plus.page.billingTitle')}>
            <ul className="space-y-2 list-disc pl-4 text-xs text-slate-600 leading-relaxed">
              <li>{t('plus.page.billing1')}</li>
              <li>{t('plus.page.billing2', { p1: plusPlan('1m').total, p3: plusPlan('3m').total, p6: plusPlan('6m').total })}</li>
              <li>{t('plus.page.billing3')}</li>
              <li>{t('plus.page.billing4')}</li>
            </ul>
            <p className="text-xs text-slate-600">
              {t('plus.page.fullDetails')}{' '}
              <Link href="/terms" className="font-medium text-[#8574B7] underline underline-offset-4">
                {t('settings.terms')}
              </Link>
            </p>
          </Drawer>
        </section>

        <p className="flex items-center justify-center gap-1 text-[10px] text-slate-600">
          <Lock className="w-3 h-3" /> {t('plus.page.encrypted')}
        </p>
      </div>

      {/* Pinned checkout bar: portaled to <body> so the route transition's transform can't trap it */}
      {mounted && createPortal(
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-white/95 backdrop-blur-md border-t border-[#D0CDE1] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {isLoadingSubscription ? (
          <div aria-hidden className="h-12 w-full rounded-full bg-[#E8E6F1] animate-pulse" />
        ) : isPlus ? (
          <button
            type="button"
            disabled={openingPortal}
            onClick={handlePortal}
            className="w-full h-12 rounded-full border border-[#D0CDE1] bg-white text-sm font-medium text-[#413B5E] hover:bg-[#E8E6F1]/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {openingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4 text-[#8574B7]" />}
            {t('settings.manageSub')}
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <Link
              href="/discover"
              className="h-12 px-6 rounded-full border border-[#D0CDE1] bg-white text-[#413B5E] hover:bg-[#E8E6F1]/30 text-sm font-medium transition-colors flex items-center justify-center shrink-0"
            >
              {t('plus.page.keepFree')}
            </Link>
            <button
              type="button"
              disabled={starting || loading}
              onClick={handleSubscribe}
              className="flex-1 min-w-0 h-12 px-6 rounded-full bg-[#8574B7] hover:bg-[#534377] text-white font-medium text-sm shadow-brand-glow transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70"
            >
              {starting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {t('plus.page.opening')}
                </>
              ) : (
                <>{t('plus.upgrade')} · {plan.total}</>
              )}
            </button>
          </div>
        )}
        {showFreeOffer && (
          <button
            type="button"
            disabled={openingPortal}
            onClick={handlePortal}
            className="mt-2.5 w-full text-xs text-slate-600 hover:text-[#413B5E] underline-offset-4 hover:underline disabled:opacity-50"
          >
            {t('plus.page.alreadySubscribed')}
          </button>
        )}
      </div>,
      document.body
      )}
    </div>
  );
}

export default function PlusPage() {
  return (
    <Suspense fallback={<div className="flex-1 w-full min-h-screen bg-white" />}>
      <PlusHubContent />
    </Suspense>
  );
}
