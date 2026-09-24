import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function PrivacyPage() {
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

        <h1 className="text-2xl font-black">Privacy Policy</h1>
        <p className="text-xs text-stone-500">Effective Date: September 2026</p>

        <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
          <h2 className="text-sm font-bold text-stone-900">1. Data We Collect</h2>
          <p>We collect personal information necessary to deliver dating services: email addresses, profile bios, photographs, approximate location (city and country), and direct messages between consented users.</p>

          <h2 className="text-sm font-bold text-stone-900">2. Verification Photo Privacy</h2>
          <p>Selfie photos uploaded strictly for pose verification are accessible only by automated review systems and designated moderators. They are never published publicly on member profile feeds.</p>

          <h2 className="text-sm font-bold text-stone-900">3. Deletion Rights</h2>
          <p>Members have full sovereignty over their account. Executing "Delete My Profile" instantly purges auth records, stored media, and chat histories across our database.</p>
        </div>
      </div>
    </div>
  )
}