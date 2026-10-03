'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ShieldCheck, Lock, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function PricingPage() {
  const [handleModalOpen, setHandleModalOpen] = useState(false);
  const [newHandle, setNewHandle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandle.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/users/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newHandle.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.requires_payment) {
          setStatusMessage({
            type: 'error',
            text: 'Payment required: Please complete the $19.99 handle fee or upgrade to Plus.',
          });
        } else {
          setStatusMessage({ type: 'error', text: data.error || 'Failed to update handle.' });
        }
      } else {
        setStatusMessage({ type: 'success', text: `Handle updated successfully to @${data.username}` });
        setTimeout(() => {
          setHandleModalOpen(false);
          window.location.href = '/profile';
        }, 1200);
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col font-sans text-[#1C1924]">
      <Navbar />

      <main className="w-full px-4 py-5 flex-1">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </Link>
          <span className="text-[11px] uppercase tracking-wider text-neutral-400">
            Membership
          </span>
        </div>

        <div className="mb-5">
          <h1 className="text-base text-neutral-900 font-normal">Plus</h1>
          <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
            Serious courtship built on verified identities and mutual respect.
          </p>
        </div>

        <div className="w-full space-y-3">

          <div className="w-full rounded-xl border border-[#6555B8]/30 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-neutral-900 font-normal">Plus</span>
                <Sparkles className="w-3.5 h-3.5 text-[#6555B8]" />
              </div>
              <span className="rounded-full bg-[#6555B8] text-white px-2 py-0.5 text-[10px]">
                Recommended
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl text-neutral-900 font-normal">$19.99</span>
              <span className="text-xs text-neutral-500">/ month</span>
            </div>

            <div className="h-px bg-neutral-100 my-3" />

            <ul className="space-y-2 text-xs text-neutral-600 font-normal">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#6555B8] shrink-0" />
                <span>Unlimited direct messaging</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#6555B8] shrink-0" />
                <span>Zero daily message limits</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#6555B8] shrink-0" />
                <span>Priority placement in discovery</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#6555B8] shrink-0" />
                <span>Plus badge on profile</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#6555B8] shrink-0" />
                <span>Handle changes included</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => alert('Stripe checkout for Plus ($19.99/mo) will launch here.')}
              className="mt-4 w-full rounded-lg bg-[#6555B8] hover:bg-[#5848A6] py-2.5 text-xs text-white transition active:scale-[0.99] font-normal"
            >
              Upgrade to Plus
            </button>
          </div>

          <div className="w-full rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-sm text-neutral-900 font-normal">Handle Modification</span>
              </div>
              <span className="text-sm text-neutral-900 font-normal">$19.99</span>
            </div>

            <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed font-normal">
              To prevent impersonation, handles are permanently anchored. One-off updates can be submitted here.
            </p>

            <button
              type="button"
              onClick={() => setHandleModalOpen(true)}
              className="mt-3 w-full py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs text-neutral-800 transition active:scale-[0.99] font-normal"
            >
              Request New Handle
            </button>
          </div>

          <div className="w-full rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-900 font-normal">Standard</span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500">
                Current Plan
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl text-neutral-900 font-normal">$0</span>
              <span className="text-xs text-neutral-500">/ month</span>
            </div>

            <div className="h-px bg-neutral-100 my-3" />

            <ul className="space-y-2 text-xs text-neutral-500 font-normal">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span>Browse profiles in discovery</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span>Verified courtship profile</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span>Permanent handle lock</span>
              </li>
            </ul>
          </div>

        </div>
      </main>

      {handleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-lg border border-neutral-200">
            <h3 className="text-sm text-neutral-900 font-normal mb-1">
              Change Username Handle
            </h3>
            <p className="text-xs text-neutral-500 mb-3 font-normal">
              Enter your desired case-preserved handle (3–20 alphanumeric characters).
            </p>

            <form onSubmit={handleUpdateHandle} className="space-y-3 font-normal">
              <input
                type="text"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                placeholder="e.g. ChrisSands"
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-[#6555B8]"
                required
              />

              {statusMessage && (
                <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  statusMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setHandleModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-neutral-600 hover:bg-neutral-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-lg bg-[#6555B8] hover:bg-[#5848A6] text-white text-xs transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
