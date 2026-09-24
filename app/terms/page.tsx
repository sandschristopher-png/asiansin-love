import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ArrowLeft, ShieldAlert, CheckCircle2, AlertOctagon, Scale } from 'lucide-react'

export const metadata = {
  title: "Terms of Service | asiansin.love",
  description: "Terms and conditions of use for asiansin.love.",
}

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 px-4 sm:px-6 py-3.5 backdrop-blur flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition">
          <Logo className="h-7 w-7" textSize="text-lg" />
        </Link>
        <Link
          href="/browse"
          className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Browse</span>
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-10">
        <div className="mb-8">
          <span className="inline-block rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-400 mb-3">
            Legal Terms
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">Terms of Service</h1>
          <p className="mt-1 text-xs text-zinc-400">Effective Date: September 2026</p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <section className="space-y-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertOctagon className="h-4 w-4" />
              <h2>1. Strict Minimum Age Mandate (18+ Only)</h2>
            </div>
            <p className="text-zinc-200">
              You must be at least eighteen (18) years of age to register an account, browse profiles, or utilize any communication tools on asiansin.love. Creating an account by misrepresenting your age is a criminal violation and immediate grounds for permanent IP blacklisting, device banning, and reporting where applicable by law.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Scale className="h-4 w-4" />
              <h2>2. Legal Compliance & Philippine Statutory Notice</h2>
            </div>
            <p>
              asiansin.love operates strictly as an independent social communication and voluntary dating directory.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li><strong>Anti-Mail-Order Bride Act (Republic Act No. 10906):</strong> asiansin.love is not a matchmaking agency, mail-order marriage broker, or commercial catalog. We do not charge fees for local introductions, arrange marriages for compensation, or act as an intermediary in marital contracts. All local members utilize communication features 100% free of charge.</li>
              <li><strong>Anti-OSAEC & CSAE Mandate (Republic Act No. 11930):</strong> We maintain absolute zero tolerance for child sexual abuse or exploitation material. Any detected violation results in immediate algorithmic termination, database preservation, and immediate referral to international and domestic law enforcement bodies.</li>
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <ShieldAlert className="h-4 w-4" />
              <h2>3. Prohibited Conduct & Smart Guardian Enforcement</h2>
            </div>
            <p>Users agree never to engage in any of the following prohibited behaviors:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>Soliciting money, bank transfers, crypto assets, prepaid gift cards, or emergency bail/hospital funds.</li>
              <li>Attempting to harvest external off-platform contact details (WhatsApp, Telegram, Line) before exchanging legitimate on-platform messages.</li>
              <li>Commercial sex work, prostitution, escort solicitations, or human trafficking.</li>
              <li>Harassment, non-consensual sharing of intimate images, blackmail, or cyberstalking.</li>
            </ul>
            <p className="mt-2 text-zinc-400">
              Our <strong>Smart Guardian</strong> automated detection engine actively screens text patterns for violations. Accounts triggering scam thresholds will be terminated without prior notice or refund.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <h2>4. Assumption of Risk & In-Person Safety</h2>
            </div>
            <p>
              asiansin.love does not perform criminal background checks or passport verification on all registered users. You acknowledge that exercising discretion, personal caution, and situational awareness is your responsibility. Always arrange initial real-world meetings in public places and never transmit funds to anyone met online.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5">
            <h2 className="font-bold text-white text-sm">5. Limitation of Liability</h2>
            <p className="text-zinc-400">
              To the fullest extent permitted by applicable law, asiansin.love, its owners, and operators shall not be liable for any direct, indirect, incidental, or consequential damages resulting from user interactions, travel arrangements, monetary disputes, or conduct of third parties on the Platform.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
