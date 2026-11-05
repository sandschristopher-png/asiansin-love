'use client';

import React, { useEffect, useState, useSyncExternalStore, Suspense } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, CheckCircle2, ChevronDown, Compass, Loader2, Lock, MessageSquare, Settings, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { AmbientAurora } from '@/components/ui/AmbientAurora';
import { isPlusProfile } from '@/lib/plus';
import { getCachedSubscription, setCachedSubscription } from '@/lib/subscriptionStatus';
import { DEFAULT_PLUS_PLAN, FREE_DAILY_SPARKS, PLUS_PLANS, plusPlan, type PlusPlanId } from '@/lib/plusPlans';

type Cell = { text: string; included: boolean | null };

/**
 * Free vs Plus side by side. Every row is wired: keep in sync with /api/spark (daily Sparks),
 * /api/messages (mutual matches), /api/sparks/gated (previews), /api/discover (country filters),
 * the chat read indicators and /api/profile (travel notice). `included: null` = same for both.
 */
const MATRIX: { feature: string; free: Cell; plus: Cell }[] = [
  { feature: 'Identity Verification', free: { text: 'Free for Everyone', included: null }, plus: { text: 'Free for Everyone', included: null } },
  { feature: 'Mutual Match Messaging', free: { text: 'Unlimited', included: null }, plus: { text: 'Unlimited', included: null } },
  { feature: 'Anti-Scam Safety Gate', free: { text: 'Active for All', included: null }, plus: { text: 'Active for All', included: null } },
  { feature: 'Upcoming Travel Notice', free: { text: 'Local Only', included: false }, plus: { text: '"Visiting:" Badge on Discover & Profile', included: true } },
  { feature: 'Cross-Border Country Filters', free: { text: 'Local / Near Me', included: false }, plus: { text: 'All 11 SEA Nations', included: true } },
  { feature: 'Daily Sparks', free: { text: `${FREE_DAILY_SPARKS} / day`, included: false }, plus: { text: 'Unlimited', included: true } },
  { feature: 'See Who Viewed You', free: { text: 'Blurred Count', included: false }, plus: { text: 'Full Unblurred Grid', included: true } },
  { feature: 'See Who Sparked You', free: { text: '1 Preview', included: false }, plus: { text: 'Full Unblurred Grid', included: true } },
  { feature: 'Message Read Receipts', free: { text: 'Timestamps Only', included: false }, plus: { text: 'Delivered & Read Indicators', included: true } },
  { feature: 'Plus Member Badge', free: { text: 'Standard', included: false }, plus: { text: 'Discreet Plus Badge', included: true } },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Is verification really free?',
    a: 'Yes. Selfie and location verification are free for every member, always. Verified profiles keep the community safe, so they are never behind a paywall.',
  },
  {
    q: 'What does the travel notice do?',
    a: 'Add the city and month of an upcoming trip in Edit Profile. A "Visiting:" badge then shows on your Discover card and profile so members there can say hello before you land.',
  },
  {
    q: 'Do women need Plus?',
    a: 'No. Women see who sparked and viewed them for free. Plus adds unlimited Sparks, country filters, the travel notice, read receipts and the Plus badge for anyone who wants them.',
  },
  {
    q: 'What happens to my matches if I stop paying?',
    a: 'Nothing is deleted. Your matches and conversations stay; only the Plus extras switch off at the end of the period you paid for.',
  },
];

const BILLING_TERMS: string[] = [
  'Prices are in US dollars and are charged by Stripe. Taxes may apply.',
  '1 Month renews every month at $14.99. 3 Months renews at $29.99 every 3 months. 6 Months renews at $47.99 every 6 months.',
  'Plans renew automatically until you cancel. Cancel any time in Settings → Manage Subscription; you keep Plus until the end of the paid period.',
  'Unlimited Sparks are subject to fair use to stop automated spam.',
];

function Mark({ cell, plus }: { cell: Cell; plus: boolean }) {
  if (cell.included === true) return <Check className="w-3.5 h-3.5 mt-px shrink-0 text-[#8C71F5]" strokeWidth={2.5} aria-label="Included" />;
  if (cell.included === false) return <X className="w-3.5 h-3.5 mt-px shrink-0 text-[#2D264B]/25" strokeWidth={2.5} aria-label="Not included" />;
  return <Check className={`w-3.5 h-3.5 mt-px shrink-0 ${plus ? 'text-[#8C71F5]' : 'text-[#2D264B]/50'}`} strokeWidth={2.5} aria-hidden />;
}

function Drawer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl bg-white/80 backdrop-blur-md border border-[#ECE8F4] shadow-sm px-4 py-3">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-2 text-sm font-semibold text-[#2D264B]">
        {title}
        <ChevronDown className="w-4 h-4 text-[#2D264B]/40 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

function PlusHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPostCheckoutSuccess = searchParams.get('success') === '1';

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

  async function handleSubscribe() {
    setStarting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/plus/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan, returnPath: '/plus' }),
      });
      const json = await res.json();
      if (res.status === 503) {
        setStatusMsg('Payments are being configured. Please check back shortly.');
        return;
      }
      if (!res.ok || !json.url) {
        setStatusMsg(json.error || 'Could not start checkout.');
        return;
      }
      window.location.href = json.url;
    } catch {
      setStatusMsg('Network error. Please try again.');
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
      const json = await res.json();
      if (!res.ok || !json.url) {
        setStatusMsg(json.error || 'Could not open billing portal.');
        return;
      }
      window.location.href = json.url;
    } catch {
      setStatusMsg('Network error opening billing portal.');
    } finally {
      setOpeningPortal(false);
    }
  }

  const plan = plusPlan(selectedPlan);

  return (
    <div className="relative isolate flex-1 w-full min-h-screen bg-[#FAFAFD] text-[#2D264B] overflow-x-clip">
      {/* Moving aura, same as the login screen: held in a viewport-tall sticky layer so it keeps
          drifting behind the content while the page scrolls. */}
      <div aria-hidden className="pointer-events-none sticky top-0 h-[100dvh] -mb-[100dvh] overflow-hidden">
        <AmbientAurora />
      </div>

      <div className="relative z-10 px-4 pt-3 pb-[calc(8.5rem+env(safe-area-inset-bottom))] space-y-6">
        {/* Subpage header */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push('/discover'))}
            aria-label="Back"
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-xs font-semibold tracking-wider text-[#2D264B]/60 hover:text-[#2D264B] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold tracking-wider text-[#2D264B]/60">PLUS</span>
        </div>

        {isPostCheckoutSuccess && (
          <div className="p-4 rounded-2xl bg-white/90 border border-[#ECE8F4] shadow-sm flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-[#8C71F5]/10 text-[#8C71F5] flex items-center justify-center mb-2">
              {isVerifyingPlus && !isPlus ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <h2 className="text-base font-bold text-[#2D264B]">{isPlus ? 'Welcome to Plus' : 'Confirming your membership...'}</h2>
            <p className="text-xs text-[#2D264B]/60 mt-0.5 mb-3">{isPlus ? 'Everything below is now unlocked.' : 'Finishing up with Stripe.'}</p>
            <div className="flex items-center gap-2 w-full">
              <Link href="/messages" className="flex-1 h-10 rounded-full bg-gradient-to-r from-[#8C71F5] to-[#EC4899] text-white text-xs font-semibold flex items-center justify-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Messages
              </Link>
              <Link href="/discover" className="flex-1 h-10 rounded-full border border-[#ECE8F4] bg-white text-[#2D264B] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#FBFBFE] transition-colors">
                <Compass className="w-3.5 h-3.5" /> Discover
              </Link>
            </div>
          </div>
        )}

        {/* Hero */}
        <header className="text-center space-y-2.5 pt-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#2D264B]">Date across borders.</h1>
          <p className="text-sm leading-relaxed text-[#2D264B]/70 max-w-md mx-auto">
            Plan the trip, filter by country and see everyone who sparked you. Verification and matched messaging stay free for everyone.
          </p>
        </header>

        {statusMsg && (
          <div className="p-3 rounded-2xl bg-white/90 border border-[#ECE8F4] text-xs font-medium text-[#2D264B] text-center">{statusMsg}</div>
        )}

        {/* Plans */}
        {showFreeOffer && (
          <section aria-label="Choose a plan" className="grid grid-cols-3 gap-2 pt-1" role="radiogroup">
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
                      ? 'bg-white border-2 border-[#8C71F5] rounded-2xl p-4 shadow-md relative'
                      : 'relative bg-white/80 backdrop-blur-md border border-[#ECE8F4] rounded-2xl p-4 shadow-sm hover:border-[#8C71F5]/30 transition-all text-[#2D264B]'
                  }`}
                >
                  {p.badge && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold tracking-wider text-white bg-gradient-to-r from-[#8C71F5] to-[#EC4899] px-2.5 py-0.5 rounded-full shadow-sm uppercase">
                      {p.badge}
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-[#2D264B]/80">{p.label}</span>
                  <span className="text-lg font-extrabold leading-none text-[#2D264B]">
                    {p.total}
                    <span className="ml-1 text-[10px] font-medium text-[#2D264B]/50">{p.totalSuffix}</span>
                  </span>
                  <span className="text-[10px] text-[#2D264B]/55">{p.months > 1 ? `${p.perMonth} / mo` : p.billingNote}</span>
                  {p.savings && <span className="text-[11px] font-semibold text-[#8C71F5]">{p.savings}</span>}
                </button>
              );
            })}
          </section>
        )}

        {/* Free vs Plus */}
        <section aria-label="Free and Plus compared" className="rounded-2xl bg-white/80 backdrop-blur-md border border-[#ECE8F4] shadow-sm px-3.5 pt-3.5">
          <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-x-2 text-[11px] font-semibold tracking-wider text-[#2D264B]/50 uppercase border-b border-[#ECE8F4] pb-2">
            <span>Feature</span>
            <span>Free</span>
            <span>Plus</span>
          </div>
          {MATRIX.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-[1.1fr_1fr_1fr] gap-x-2 py-3.5 text-sm text-[#2D264B] ${i < MATRIX.length - 1 ? 'border-b border-[#ECE8F4]/70' : ''}`}
            >
              <span className="text-[12px] font-semibold leading-snug">{row.feature}</span>
              <span className="text-[11.5px] text-[#2D264B]/60 flex items-start gap-1.5 leading-snug">
                <Mark cell={row.free} plus={false} />
                <span>{row.free.text}</span>
              </span>
              <span className="text-[11.5px] font-medium flex items-start gap-1.5 leading-snug">
                <Mark cell={row.plus} plus />
                <span>{row.plus.text}</span>
              </span>
            </div>
          ))}
        </section>

        {/* Drawers */}
        <section className="space-y-2.5">
          <Drawer title="Questions">
            {FAQ.map((f) => (
              <div key={f.q}>
                <p className="text-xs font-semibold text-[#2D264B]">{f.q}</p>
                <p className="mt-1 text-xs text-[#2D264B]/65 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </Drawer>
          <Drawer title="Billing Terms">
            <ul className="space-y-2 list-disc pl-4 text-xs text-[#2D264B]/65 leading-relaxed">
              {BILLING_TERMS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="text-xs text-[#2D264B]/65">
              Full details in our{' '}
              <Link href="/terms" className="font-semibold text-[#8C71F5] underline underline-offset-4">
                Terms of Service
              </Link>
              .
            </p>
          </Drawer>
        </section>

        <p className="flex items-center justify-center gap-1 text-[10px] text-[#2D264B]/45">
          <Lock className="w-3 h-3" /> Encrypted checkout by Stripe
        </p>
      </div>

      {/* Pinned checkout bar: portaled to <body> so the route transition's transform can't trap it */}
      {mounted && createPortal(
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-white/90 backdrop-blur-xl border-t border-[#ECE8F4] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {isLoadingSubscription ? (
          <div aria-hidden className="h-12 w-full rounded-full bg-[#ECE8F4]/60 animate-pulse" />
        ) : isPlus ? (
          <button
            type="button"
            disabled={openingPortal}
            onClick={handlePortal}
            className="w-full h-12 rounded-full border border-[#ECE8F4] bg-white text-sm font-semibold text-[#2D264B] hover:bg-[#FBFBFE] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {openingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4 text-[#8C71F5]" />}
            Manage Subscription
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <Link
              href="/discover"
              className="h-12 px-6 rounded-full border border-[#ECE8F4] bg-white text-sm font-semibold text-[#2D264B] hover:bg-[#FBFBFE] transition-colors flex items-center justify-center shrink-0"
            >
              Keep Free
            </Link>
            <button
              type="button"
              disabled={starting || loading}
              onClick={handleSubscribe}
              className="flex-1 min-w-0 h-12 px-8 rounded-full bg-gradient-to-r from-[#8C71F5] to-[#EC4899] text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70"
            >
              {starting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Opening checkout...
                </>
              ) : (
                <>Upgrade to Plus · {plan.total}</>
              )}
            </button>
          </div>
        )}
        {showFreeOffer && (
          <button
            type="button"
            disabled={openingPortal}
            onClick={handlePortal}
            className="mt-2.5 w-full text-xs text-[#2D264B]/50 hover:text-[#2D264B] underline-offset-4 hover:underline disabled:opacity-50"
          >
            Already subscribed? Manage billing
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
    <Suspense fallback={<div className="flex-1 w-full min-h-screen bg-[#FAFAFD]" />}>
      <PlusHubContent />
    </Suspense>
  );
}
