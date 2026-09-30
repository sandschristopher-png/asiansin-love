'use client'

import Link from 'next/link'
import { Check, ShieldCheck, ArrowLeft, Sparkles } from 'lucide-react'
import { Footer } from '@/components/Footer'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F8F7FA] flex flex-col justify-between font-sans text-[#1C1924]">
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <Link 
          href="/discover" 
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#9A8CC3] hover:text-[#1C1924] transition mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Discover</span>
        </Link>

        <div className="text-center mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#9A8CC3]">
            Membership Tiers
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1C1924] tracking-tight">
            Upgrade to Premium
          </h1>
          <p className="text-sm text-[#1C1924] max-w-md mx-auto">
            Connect without restrictions with verified Asian singles seeking intentional courtship.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto items-stretch">
          {/* Free Tier */}
          <div className="rounded-3xl border border-[#9A8CC3]/30 bg-[#FFFFFF] p-7 flex flex-col justify-between shadow-xl">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#1C1924]">Standard</h2>
                <div className="mt-2 text-3xl font-extrabold text-[#1C1924]">
                  $0 <span className="text-xs text-[#9A8CC3] font-normal">/ month</span>
                </div>
              </div>

              <ul className="space-y-3.5 text-xs text-[#1C1924]">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#9A8CC3] shrink-0" />
                  <span>Create full courtship profile</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#9A8CC3] shrink-0" />
                  <span>Browse verified catalog</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#9A8CC3] shrink-0" />
                  <span>5 direct messages per day</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#9A8CC3] shrink-0" />
                  <span>Gesture-verification badge</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 text-center text-xs text-[#9A8CC3] font-semibold py-2.5 rounded-2xl border border-[#9A8CC3]/25 bg-[#FFFFFF]">
              Current Plan
            </div>
          </div>

          {/* Premium Tier */}
          <div className="relative rounded-3xl border-2 border-[#9A8CC3] bg-[#FFFFFF] p-7 flex flex-col justify-between shadow-2xl shadow-[#6555B8]/30">
            <span className="absolute -top-3.5 right-6 rounded-full bg-[#6555B8] border border-[#9A8CC3]/50 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md">
              Most Popular
            </span>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-1.5 text-[#1C1924]">
                  <h2 className="text-lg font-bold">VIP Unlimited</h2>
                  <Sparkles className="w-4 h-4 text-[#B2A4D7]" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-[#1C1924]">
                  $19.99 <span className="text-xs text-[#1C1924]/70 font-normal">/ month</span>
                </div>
              </div>

              <ul className="space-y-3.5 text-xs text-[#1C1924]">
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#B2A4D7] shrink-0" />
                  <span className="font-semibold text-[#1C1924]">Unlimited instant messaging</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#B2A4D7] shrink-0" />
                  <span>Zero daily cooldowns or limits</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#B2A4D7] shrink-0" />
                  <span>Priority search card placement</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#B2A4D7] shrink-0" />
                  <span>VIP verification badge on profile</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => alert('Stripe checkout will open here.')}
              className="mt-8 w-full rounded-2xl bg-[#6555B8] hover:bg-[#7D4B9F] py-3 text-xs sm:text-sm font-bold text-white transition shadow-lg shadow-[#6555B8]/40 active:scale-95"
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
