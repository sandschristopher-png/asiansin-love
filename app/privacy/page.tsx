import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ArrowLeft, Shield, Lock, Eye, Trash2, Database } from 'lucide-react'

export const metadata = {
  title: "Privacy Policy | asiansin.love",
  description: "Learn how asiansin.love collects, stores, and protects member data.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 pb-20">
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
            Data Governance & Privacy
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">Privacy Policy</h1>
          <p className="mt-1 text-xs text-zinc-400">Last Updated: September 2026</p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Shield className="h-4 w-4" />
              <h2>1. Scope and Legal Compliance</h2>
            </div>
            <p>
              This Privacy Policy applies to all services provided under asiansin.love. We process personal information in strict accordance with applicable global privacy standards, including the EU General Data Protection Regulation (GDPR), the Philippine Data Privacy Act of 2012 (Republic Act No. 10173), and applicable state regulations.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Eye className="h-4 w-4" />
              <h2>2. Information We Collect</h2>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li><strong>Account Credentials:</strong> Email address and authentication verification records.</li>
              <li><strong>Profile Details:</strong> Display name, birthdate (used exclusively for strict 18+ verification), gender, country, city, bio text, and optional travel dates.</li>
              <li><strong>Media Content:</strong> Gallery photos uploaded by users (stored in encrypted object storage).</li>
              <li><strong>Interactions:</strong> Direct messages, mutual Sparks, favorites, and profile visit records.</li>
              <li><strong>Technical Metadata:</strong> IP address, device user-agent headers, and browser identifiers collected strictly for fraud prevention, anti-scam defense, and rate-limiting.</li>
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Lock className="h-4 w-4" />
              <h2>3. Photo Masking & Public Visibility</h2>
            </div>
            <p>
              Your primary photo and profile details are visible to active members. To safeguard member privacy against automated web scrapers and unauthorized downloads, secondary gallery photos (indices 1 through 3) are automatically masked and blurred for unauthenticated guest visitors.
            </p>
            <p className="text-zinc-400">
              We never sell, rent, or trade your personal information, messages, or gallery media to third-party marketing brokers or advertising networks.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Database className="h-4 w-4" />
              <h2>4. Infrastructure & Third-Party Processors</h2>
            </div>
            <p>We work exclusively with vetted infrastructure providers who comply with industry security standards:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li><strong>Supabase:</strong> Encrypted PostgreSQL cloud databases, Row-Level Security (RLS) enforcement, and authentication.</li>
              <li><strong>Vercel:</strong> Global serverless runtime environments, edge caching, and HTTPS transport layer security.</li>
              <li><strong>Stripe:</strong> PCI-DSS Level 1 certified billing infrastructure for VIP memberships. Sensitive payment card numbers never touch or store on our servers.</li>
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Trash2 className="h-4 w-4" />
              <h2>5. Data Retention & Right to Erasure</h2>
            </div>
            <p>
              You maintain the right to review, update, or purge your account data at any time. Initiating account deletion via Profile Settings removes your profile, photos, Sparks, and conversation metadata from live database systems. Inactive or abandoned incomplete profiles may be purged after 360 days.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-zinc-800/80 text-zinc-400 text-xs">
            <h3 className="font-semibold text-white">6. Inquiries & Law Enforcement</h3>
            <p>
              We cooperate with lawful court orders, subpoenas, and child protection warrants. For data protection inquiries, contact <span className="text-zinc-200">privacy@asiansin.love</span>.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
