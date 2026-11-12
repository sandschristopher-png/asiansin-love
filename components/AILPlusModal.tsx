'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Heart, Loader2, Plane, X, Zap } from 'lucide-react';
import { AmbientAurora } from '@/components/ui/AmbientAurora';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { useLocale } from '@/components/i18n/LocaleProvider';
import type { TKey } from '@/lib/i18n';
import { localizeError } from '@/lib/i18n/errors';
import { FREE_DAILY_INTROS, FREE_DAILY_SPARKS, PLUS_PLANS, type PlusPlanId } from '@/lib/plusPlans';

type PlanId = PlusPlanId;

/** Mirrors the Stripe prices used by /api/plus/checkout and the /plus page (lib/plusPlans.ts). */
const PLAN_LABEL: Record<PlanId, TKey> = { '1m': 'plus.plan1m', '3m': 'plus.plan3m', '6m': 'plus.plan6m' };
const BADGE_LABEL = { 'Most Popular': 'plus.mostPopular', 'Best Value': 'plus.bestValue' } as const;

// Accurate to the app: free members start FREE_DAILY_INTROS new conversations and send FREE_DAILY_SPARKS Sparks a day.
const PERKS: { Icon: typeof Eye; title: TKey; text: TKey; n?: number }[] = [
  { Icon: EyeOff, title: 'plus.perkPrivateTitle', text: 'settings.privateModeSub' },
  { Icon: Eye, title: 'plus.perkVisitorsTitle', text: 'plus.perkVisitorsText' },
  // Visiting Soon is the shipped travel feature (actions/trips.ts); there is no separate roaming mode.
  { Icon: Plane, title: 'plus.page.rowTravel', text: 'plus.page.cellTravel' },
  { Icon: Zap, title: 'plus.perkIntrosTitle', text: 'plus.perkIntrosText', n: FREE_DAILY_INTROS },
  { Icon: Heart, title: 'plus.perkSparksTitle', text: 'plus.perkSparksText', n: FREE_DAILY_SPARKS },
];

/**
 * Contextual Plus upgrade drawer (z-[70], above the BottomNav). `title` names the feature the
 * member just tapped, e.g. "Unlock Private Mode with Plus".
 */
export function AILPlusModal({
  open,
  onClose,
  title,
  returnPath = '/settings',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  returnPath?: string;
}) {
  const { t } = useLocale();
  const heading = title ?? t('plus.unlockMore');
  const [plan, setPlan] = useState<PlanId>('3m');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const checkout = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/plus/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan, returnPath }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw Object.assign(new Error(data.error || 'checkout'), { status: res.status, code: data.code });
      window.location.href = data.url;
    } catch (err) {
      setError(localizeError(err instanceof Error ? err : null, t, 'plus.checkoutFailed'));
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm ail-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={heading}
    >
      <div
        className="relative isolate w-full max-w-[480px] max-h-[90dvh] overflow-y-auto rounded-t-3xl bg-white shadow-xl ail-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <AmbientAurora layer="card" />
        <div className="pt-2.5" aria-hidden>
          <div className="w-10 h-1 rounded-full bg-[#E8E6F1] mx-auto mb-3" />
        </div>
        <div className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,16px))] space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <PlusBadge />
              <h2 className="mt-1.5 text-lg font-semibold text-[#413B5E] leading-snug">{heading}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-[#E8E6F1]/70"
              aria-label={t('common.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <ul className="space-y-2.5">
            {PERKS.map((p) => (
              <li key={p.title} className="flex items-start gap-2.5 text-xs text-[#413B5E]/85 leading-relaxed">
                <p.Icon className="w-4 h-4 text-[#8574B7] shrink-0" aria-hidden />
                <span>
                  <span className="font-semibold text-[#413B5E]">{t(p.title)}:</span> {t(p.text, p.n === undefined ? undefined : { n: p.n })}
                </span>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('plus.choosePlan')}>
            {PLUS_PLANS.map((p) => {
              const active = plan === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPlan(p.id)}
                  className={`relative rounded-2xl border px-2 pt-4 pb-2.5 text-center transition ${
                    active ? 'border-[#8574B7] bg-[#E8E6F1]/60 ring-1 ring-[#8574B7]' : 'border-[#D0CDE1] bg-white'
                  }`}
                >
                  {p.badge && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded-full bg-[#8574B7] text-[8.5px] font-semibold text-white">
                      {t(BADGE_LABEL[p.badge])}
                    </span>
                  )}
                  <span className="block text-[11px] font-semibold text-[#413B5E]">{t(PLAN_LABEL[p.id])}</span>
                  <span className="block mt-1 text-sm font-semibold text-[#413B5E]">{t('plus.perMonth', { price: p.perMonth })}</span>
                  <span className="block text-[9px] text-slate-600">{p.months === 1 ? t('plus.billedMonthly') : t('plus.billedEvery', { total: p.total, n: p.months })}</span>
                </button>
              );
            })}
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[11px] font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={checkout}
            disabled={busy}
            className="w-full py-3.5 rounded-2xl bg-[#8574B7] hover:bg-[#413B5E] text-white text-sm font-medium shadow-md shadow-[#8574B7]/25 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
            {t('plus.upgrade')}
          </button>
          <Link href="/plus" onClick={onClose} className="block text-center text-xs font-medium text-[#8574B7] hover:underline">
            {t('plus.viewPerks')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AILPlusModal;
