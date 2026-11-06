'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Heart, Loader2, Plane, X, Zap } from 'lucide-react';
import { AmbientAurora } from '@/components/ui/AmbientAurora';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { PLUS_PLANS, type PlusPlanId } from '@/lib/plusPlans';

type PlanId = PlusPlanId;

/** Mirrors the Stripe prices used by /api/plus/checkout and the /plus page (lib/plusPlans.ts). */
const PLANS: { id: PlanId; label: string; perMonth: string; note: string; badge?: string }[] = PLUS_PLANS.map((p) => ({
  id: p.id,
  label: p.label,
  perMonth: `${p.perMonth}/mo`,
  note: p.billingNote,
  badge: p.badge,
}));

const PERKS = [
  { Icon: EyeOff, title: 'Private Mode', text: 'Browse stealthily and only be visible to profiles you spark.' },
  { Icon: Eye, title: 'Visitor History', text: 'Unblur everyone who viewed your profile.' },
  { Icon: Plane, title: 'Passport Roaming', text: 'Browse and spark singles across Manila, Cebu, Bangkok, and Phnom Penh.' },
  // Accurate to the app: free members start 5 new conversations and send 20 Sparks a day.
  { Icon: Zap, title: 'Unlimited introductions', text: 'Start as many new conversations a day as you like (free: 5).' },
  { Icon: Heart, title: 'Unlimited Sparks', text: 'Spark everyone you like (free: 20 a day).' },
];

/**
 * Contextual Plus upgrade drawer (z-[70], above the BottomNav). `title` names the feature the
 * member just tapped, e.g. "Unlock Private Mode with Plus".
 */
export function AILPlusModal({
  open,
  onClose,
  title = 'Unlock more with Plus',
  returnPath = '/settings',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  returnPath?: string;
}) {
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
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not start checkout. Please try again.');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm ail-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="relative isolate w-full max-w-[430px] max-h-[90dvh] overflow-y-auto rounded-t-3xl bg-white shadow-xl ail-sheet-up"
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
              <h2 className="mt-1.5 text-lg font-bold text-[#413B5E] leading-snug">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#413B5E]/55 hover:bg-[#E8E6F1]/70"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <ul className="space-y-2.5">
            {PERKS.map((p) => (
              <li key={p.title} className="flex items-start gap-2.5 text-xs text-[#413B5E]/85 leading-relaxed">
                <p.Icon className="w-4 h-4 text-[#665D96] shrink-0" aria-hidden />
                <span>
                  <span className="font-semibold text-[#413B5E]">{p.title}:</span> {p.text}
                </span>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Choose a plan">
            {PLANS.map((p) => {
              const active = plan === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPlan(p.id)}
                  className={`relative rounded-2xl border px-2 pt-4 pb-2.5 text-center transition ${
                    active ? 'border-[#665D96] bg-[#E8E6F1]/60 ring-1 ring-[#665D96]' : 'border-[#D0CDE1] bg-white'
                  }`}
                >
                  {p.badge && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded-full bg-[#665D96] text-[8.5px] font-bold text-white">
                      {p.badge}
                    </span>
                  )}
                  <span className="block text-[11px] font-bold text-[#413B5E]">{p.label}</span>
                  <span className="block mt-1 text-sm font-bold text-[#413B5E]">{p.perMonth}</span>
                  <span className="block text-[9px] text-[#413B5E]/55">{p.note}</span>
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
            className="w-full py-3.5 rounded-2xl bg-[#665D96] hover:bg-[#413B5E] text-white text-sm font-semibold shadow-md shadow-[#665D96]/25 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
            Upgrade to Plus
          </button>
          <Link href="/plus" onClick={onClose} className="block text-center text-xs font-semibold text-[#665D96] hover:underline">
            View all member perks
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AILPlusModal;
