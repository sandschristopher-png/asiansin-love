import Link from 'next/link'
import { Check, ShieldCheck, ArrowLeft } from 'lucide-react'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6 font-sans text-zinc-100">
      <div className="mx-auto max-w-4xl">
        <Link href="/browse" className="inline-flex items-center space-x-2 text-sm text-zinc-400 hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Browse</span>
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-white">Upgrade to Premium</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Connect without restrictions with verified Asian singles.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free Tier */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Standard</h2>
              <div className="mt-2 text-2xl font-extrabold text-zinc-300">$0 <span className="text-xs text-zinc-500 font-normal">/ month</span></div>
              <ul className="mt-6 space-y-3 text-xs text-zinc-400">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> Create full profile</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> Browse members</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> 5 messages per day</li>
              </ul>
            </div>
            <div className="mt-8 text-center text-xs text-zinc-500 font-medium py-2 rounded-lg border border-zinc-800">
              Current Plan
            </div>
          </div>

          {/* Premium Tier */}
          <div className="relative rounded-2xl border border-rose-500/60 bg-gradient-to-b from-rose-950/20 to-zinc-900/80 p-6 flex flex-col justify-between shadow-lg shadow-rose-950/20">
            <div>
              <span className="absolute -top-3 right-6 rounded-full bg-rose-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Most Popular
              </span>
              <h2 className="text-lg font-bold text-white">VIP Unlimited</h2>
              <div className="mt-2 text-2xl font-extrabold text-white">$19.99 <span className="text-xs text-zinc-400 font-normal">/ month</span></div>
              <ul className="mt-6 space-y-3 text-xs text-zinc-200">
                <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-rose-500" /> Unlimited instant messaging</li>
                <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-rose-500" /> Priority placement in search</li>
                <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-rose-500" /> Direct photo sharing access</li>
                <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-rose-500" /> VIP badge on profile</li>
              </ul>
            </div>

            <button
              onClick={() => alert('Connect your Stripe Checkout or payment link here')}
              className="mt-8 w-full rounded-lg bg-rose-600 py-2.5 text-xs font-semibold text-white hover:bg-rose-500 transition"
            >
              Get VIP Access
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}