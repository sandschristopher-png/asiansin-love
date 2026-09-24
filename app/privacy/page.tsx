import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ArrowLeft, Shield, Lock, Eye, Trash2 } from 'lucide-react'

export const metadata = {
  title: "Privacy Policy | asiansin.love",
  description: "Learn how asiansin.love protects your personal information, photos, and privacy.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 pb-20">
      {/* Top Header */}
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
            Legal & Security
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">Privacy Policy</h1>
          <p className="mt-1 text-xs text-zinc-400">Effective Date: September 2026</p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Shield className="h-4 w-4" />
              <h2>1. Introduction & Overview</h2>
            </div>
            <p>
              asiansin.love (&quot;we,&quot; &quot;our,&quot; or &quot;the Platform&quot;) is committed to safeguarding your personal data and ensuring full privacy transparency. This Privacy Policy details our practices regarding information collection, storage, processing, and account deletion across all international jurisdictions, including compliance with the European Union General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and the Republic of the Philippines Data Privacy Act of 2012 (Republic Act No. 10173).
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Eye className="h-4 w-4" />
              <h2>2. Data We Collect</h2>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li><strong>Account Credentials:</strong> Email address and authentication verification records managed via secure token authentication.</li>
              <li><strong>Profile Information:</strong> Display name, birthdate (used exclusively for strict age verification), self-selected gender, match preference, country, city, bio text, and optional travel schedule dates.</li>
              <li><strong>Gallery Media:</strong> User-submitted public and gallery photos stored in encrypted cloud object buckets.</li>
              <li><strong>Communications & Interactions:</strong> Direct chat logs, mutual Sparks, bookmarking favorites, and profile visit records.</li>
              <li><strong>Device & Telemetry Data:</strong> IP address, user-agent headers, and browser fingerprint metadata collected strictly to prevent automated scraping, bot networks, and fraudulent financial solicitations.</li>
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Lock className="h-4 w-4" />
              <h2>3. How We Use and Protect Your Data</h2>
            </div>
            <p>We process your data strictly to operate core platform features, including:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>Matching members across regions and displaying active directory cards.</li>
              <li>Operating the <strong>Smart Guardian</strong> algorithmic shield to identify and isolate scam triggers, wire-transfer requests, extortion attempts, and illicit material.</li>
              <li>Masking non-primary gallery photos from unauthenticated guest visitors.</li>
              <li>Transmitting transactional alerts (new messages, Sparks, and security notifications) in accordance with user settings.</li>
            </ul>
            <p className="mt-2 text-zinc-400 italic">
              We never sell, lease, or monetize your personal information or chat logs to third-party ad networks or data aggregators.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Shield className="h-4 w-4" />
              <h2>4. Subprocessors and Cloud Infrastructure</h2>
            </div>
            <p>To deliver a scalable and secure application, we rely on established cloud subprocessors:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li><strong>Supabase:</strong> Encrypted PostgreSQL database hosting, Row Level Security (RLS), and authentication token management.</li>
              <li><strong>Vercel:</strong> Edge routing, secure HTTPS serverless runtime environments, and global content delivery.</li>
              <li><strong>Stripe:</strong> PCI-DSS Level 1 certified billing provider for VIP subscriptions. Credit card and financial banking records never pass through or store on our application servers.</li>
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Trash2 className="h-4 w-4" />
              <h2>5. Your Rights & Permanent Account Deletion</h2>
            </div>
            <p>
              Under applicable international privacy regulations, you retain the permanent right to review, update, or purge all personal data held by asiansin.love.
            </p>
            <p>
              You may initiate complete deletion of your account, photos, chat history, and profile records at any time through the <strong>Profile Settings</strong> interface. Once confirmed, your records are deleted from active databases and storage buckets without undue delay.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-zinc-800/80 text-zinc-400">
            <h3 className="font-semibold text-white">6. Privacy Inquiries & Data Officer</h3>
            <p>
              For data privacy inquiries or formal compliance requests, contact our privacy administration team directly at <span className="text-zinc-200">privacy@asiansin.love</span>.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
