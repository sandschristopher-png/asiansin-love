import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { 
  ShieldCheck, 
  Sparkles, 
  Plane, 
  ArrowRight, 
  CheckCircle2, 
  EyeOff, 
  FileCheck, 
  BadgeCheck 
} from 'lucide-react'

export const metadata = {
  title: "Platform Features | asiansin.love",
  description: "Explore the proprietary scam-prevention, travel matching, and privacy features that define asiansin.love.",
}

export default function FeaturesPage() {
  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 selection:bg-rose-500 selection:text-white pb-24 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] bg-gradient-to-b from-rose-600/15 via-rose-950/10 to-transparent blur-3xl opacity-70" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 px-4 sm:px-6 py-3.5 backdrop-blur flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition">
          <Logo className="h-7 w-7" textSize="text-lg sm:text-xl" />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/browse"
            className="text-xs font-semibold text-zinc-400 hover:text-white transition hidden sm:inline"
          >
            Browse Members
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition shadow"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-12 sm:pt-16">
        
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="inline-block rounded-full bg-rose-500/10 border border-rose-500/20 px-3.5 py-1 text-xs font-semibold text-rose-400">
            Engineered For Authentic Connection
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Built For Serious Love, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-300 to-rose-500">
              Not Casual Games
            </span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Legacy dating apps are overrun by financial scams, paywalls, and low-effort bot profiles. Here is how asiansin.love protects your journey.
          </p>
        </div>

        {/* 6 Key Pillars Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Pillar 1: Smart Guardian */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 flex flex-col justify-between backdrop-blur">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Smart Guardian Anti-Scam Shield</h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Financial solicitation triggers (crypto investment pitches, urgent wire transfers, gift card codes, emergency hospital bills) are proactively quarantined by algorithmic heuristic scans. Bad actors are flagged and barred before they can isolate you.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Real-Time In-Chat Keyword Defense</span>
            </div>
          </div>

          {/* Pillar 2: Travel Radar */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 flex flex-col justify-between backdrop-blur">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Plane className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Travel Radar Integration</h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Traveling to Manila, Bangkok, or Cebu? Pin your upcoming dates and destination city directly to your profile. Local singles looking for long-term love can see when you will be physically present, eliminating eternal pen-pal syndrome.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-amber-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Pinned Destination Badges</span>
            </div>
          </div>

          {/* Pillar 3: Spark (✨) & Top Sparks */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 flex flex-col justify-between backdrop-blur">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Spark (✨) Mutual Chemistry</h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Move past cheap winks and mindless right-swipes. Send a Spark to signal genuine romantic intent. When a spark is reciprocated, both users receive priority notifications, and members with high mutual engagement earn the <strong>Top Spark</strong> showcase badge.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-rose-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Proprietary Chemistry Metric</span>
            </div>
          </div>

          {/* Pillar 4: Privacy & Photo Masking */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 flex flex-col justify-between backdrop-blur">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <EyeOff className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Guest Photo Masking</h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Your privacy comes first. While public visitors can view primary profile cards, secondary album photos remain cryptographically masked behind authenticated member sign-in. Your personal photos are protected from non-members and internet crawlers.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-sky-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Automated Album Blur &amp; RLS Protection</span>
            </div>
          </div>

          {/* Pillar 5: Verified Member Badges */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 flex flex-col justify-between backdrop-blur">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Pose-Verified Profiles</h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Say goodbye to catfish and stolen Instagram models. Members earn a verified badge through real-time gesture selfie matching, proving the person on your screen is the exact person you meet at the airport.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-indigo-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Dynamic Camera Verification</span>
            </div>
          </div>

          {/* Pillar 6: Mandatory 50-Character Bio */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 flex flex-col justify-between backdrop-blur">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <FileCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Quality-First Registration Gate</h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Zero blank profiles allowed. Every member must pass a strict 18+ birthdate verification and draft a minimum 50-character bio detailing their values, character, and relationship goals before entering the browse directory.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-purple-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>100% Filtered Against Low-Effort Bots</span>
            </div>
          </div>

        </div>

        {/* Commitment Banner */}
        <section className="mt-20 rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-8 sm:p-12 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="pointer-events-none absolute -bottom-20 left-1/2 -translate-x-1/2 h-40 w-96 bg-rose-600/10 blur-3xl" />
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            100% Free For Local Southeast Asian Members
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            We adhere strictly to Philippine R.A. 10906 and international ethical guidelines. Local singles in the Philippines, Thailand, Vietnam, Cambodia, and Laos can message, browse, and Spark completely free of charge.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:from-rose-500 hover:to-rose-400 transition shadow-xl shadow-rose-600/25 flex items-center justify-center gap-2"
            >
              <span>Join asiansin.love Today</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/browse"
              className="w-full sm:w-auto rounded-2xl border border-zinc-800 bg-zinc-900/80 px-8 py-3.5 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition"
            >
              Explore Directory
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-zinc-800/80 bg-zinc-950 py-10 px-4 sm:px-6 text-xs text-zinc-500">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Logo className="h-5 w-5" textSize="text-sm" />
            <span className="text-zinc-400">&copy; 2026 asiansin.love &bull; Modern Southeast Asian Dating</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/browse" className="hover:text-zinc-300 transition">Browse Directory</Link>
            <Link href="/features" className="text-rose-400 hover:text-rose-300 transition">Platform Features</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition">Privacy Policy</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
