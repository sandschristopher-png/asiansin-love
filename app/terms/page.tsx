import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-[#fafaf9] font-sans text-stone-900 py-10 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <Link href="/browse" className="flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-stone-900">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
          <Logo className="h-6 w-6" textSize="text-base" />
        </div>

        <h1 className="text-2xl font-black">Terms of Service</h1>
        <p className="text-xs text-stone-500">Effective Date: September 2026</p>

        <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
          <h2 className="text-sm font-bold text-stone-900">1. Eligibility & Age Restriction</h2>
          <p>You must be at least 18 years of age to register an account or use asiansin.love. Misrepresentation of age or identity is grounds for immediate termination.</p>

          <h2 className="text-sm font-bold text-stone-900">2. Zero Tolerance Anti-Scam Policy</h2>
          <p>asiansin.love operates under strict Smart Guardian automated and manual supervision. Solicitations for cryptocurrency, foreign exchange, emergency wires, romance scam schemes, or escort services are permanently banned and reported to relevant fraud databases.</p>

          <h2 className="text-sm font-bold text-stone-900">3. User Conduct & Integrity</h2>
          <p>Members agree to provide authentic photos of themselves and maintain respectful communication. Automated scraping, harassment, or reverse-engineering is strictly prohibited.</p>
        </div>
      </div>
    </div>
  )
}