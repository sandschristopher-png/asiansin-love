import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: "Terms of Service | asiansin.love",
  description: "Terms and conditions for members using asiansin.love.",
}

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-[#fbfbfe] font-sans text-slate-900 pb-20 selection:bg-[#6d4aff] selection:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 py-3.5 backdrop-blur-md flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition">
          <Logo className="h-6 w-6" textSize="text-base sm:text-lg" />
        </Link>
        <Link href="/browse" className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Browse</span>
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-12 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Terms of Service</h1>
          <p className="text-xs text-slate-500 mt-1">Effective Date: 2026 &bull; asiansin.love</p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Eligibility & Age Requirement</h2>
            <p>You must be at least 18 years of age to register or access any part of asiansin.love. By creating an account, you affirm that all age and demographic data provided is accurate.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Anti-Scam & Zero Financial Solicitation</h2>
            <p>asiansin.love strictly prohibits any member from requesting, soliciting, or receiving money, cryptocurrency, wire transfers, or commercial transactions. Accounts identified attempting financial fraud are banned permanently without notice.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Free Access Policy for Local Members</h2>
            <p>Citizens and permanent residents living in Southeast Asian nations (Philippines, Thailand, Vietnam, Cambodia, Laos, Indonesia, Malaysia, Singapore) maintain 100% free access to core browsing and messaging features.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Community Guidelines & Respect</h2>
            <p>We do not tolerate harassment, abusive conduct, solicitation of commercial sex work, or unauthorized third-party agencies.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
