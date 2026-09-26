'use client'

import Link from 'next/link'
import { Check, ShieldCheck, ArrowLeft, Sparkles } from 'lucide-react'
import { Footer } from '@/components/Footer'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#130F18] flex flex-col justify-between font-sans text-[#E6D7FA]">
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <Link 
          href="/discover" 
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#9A79BA] hover:text-white transition mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Discover</span>
        </Link>

        <div className="text-center mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#9A79BA]">
            Membership Tiers
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Upgrade to Premium
          </h1>
          <p className="text-sm text-[#E6D7FA] max-w-md mx-auto">
            Connect without restrictions with verified Asian singles seeking intentional courtship.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto items-stretch">
          {/* Free Tier */}
          <div className="rounded-3xl border border-[#9A79BA]/30 bg-[#261F33] p-7 flex flex-col justify-between shadow-xl">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Standard</h2>
                <div className="mt-2 text-3xl font-extrabold text-white">
                  $0 <span className="text-xs text-[#9A79BA] font-normal">/ month</span>
                </div>
              </div>

              <ul className="space-y-3.5 text-xs text-[#E6D7FA]">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#9A79BA] shrink-0" />
                  <span>Create full courtship profile</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#9A79BA] shrink-0" />
                  <span>Browse verified catalog</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#9A79BA] shrink-0" />
                  <span>5 direct messages per day</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#9A79BA] shrink-0" />
                  <span>Gesture-verification badge</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 text-center text-xs text-[#9A79BA] font-semibold py-2.5 rounded-2xl border border-[#9A79BA]/25 bg-[#181222]">
              Current Plan
            </div>
          </div>

          {/* Premium Tier */}
          <div className="relative rounded-3xl border-2 border-[#9A79BA] bg-[#261F33] p-7 flex flex-col justify-between shadow-2xl shadow-[#653C87]/30">
            <span className="absolute -top-3.5 right-6 rounded-full bg-[#653C87] border border-[#9A79BA]/50 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md">
              Most Popular
            </span>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-1.5 text-white">
                  <h2 className="text-lg font-bold">VIP Unlimited</h2>
                  <Sparkles className="w-4 h-4 text-[#C9A4E8]" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-white">
                  $19.99 <span className="text-xs text-[#E6D7FA]/70 font-normal">/ month</span>
                </div>
              </div>

              <ul className="space-y-3.5 text-xs text-[#E6D7FA]">
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#C9A4E8] shrink-0" />
                  <span className="font-semibold text-white">Unlimited instant messaging</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#C9A4E8] shrink-0" />
                  <span>Zero daily cooldowns or limits</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#C9A4E8] shrink-0" />
                  <span>Priority search card placement</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#C9A4E8] shrink-0" />
                  <span>VIP verification badge on profile</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => alert('Stripe checkout will open here.')}
              className="mt-8 w-full rounded-2xl bg-[#653C87] hover:bg-[#7D49A8] py-3 text-xs sm:text-sm font-bold text-white transition shadow-lg shadow-[#653C87]/40 active:scale-95"
            >
              Get VIP Access
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
