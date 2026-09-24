import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: "Privacy Policy | asiansin.love",
  description: "Privacy practices and data handling policies for asiansin.love.",
}

export default function PrivacyPage() {
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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-slate-500 mt-1">Effective Date: 2026 &bull; asiansin.love</p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Information We Collect</h2>
            <p>We collect information provided directly by you during signup, including email address, display name, age/birthdate, location, and photos you choose to upload.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Photo Protection & Public Masking</h2>
            <p>Your secondary photo albums are masked from anonymous public web visitors and web scrapers. Only authenticated, logged-in members can see full photo galleries.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Right to Erasure (Self-Serve Deletion)</h2>
            <p>Every member has the permanent right to wipe their profile data. Our Settings page provides a direct, immediate deletion endpoint that permanently purges your account from all database records.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. No Data Brokering</h2>
            <p>We do not sell, rent, or trade your personal profile data or messages to third-party advertisers or data brokers.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
