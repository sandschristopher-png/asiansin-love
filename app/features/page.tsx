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
  title: "Why asiansin.love | Platform Features",
  description: "Learn how asiansin.love protects you from scams, eliminates fake profiles, and connects genuine singles across Southeast Asia.",
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
            A Better Way To Meet
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Built For Real Relationships, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-300 to-rose-500">
              Not Time Wasters
            </span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Old dating sites are cluttered with spammers, money requests, and abandoned profiles. Here is how asiansin.love keeps your search simple, safe, and honest.
          </p>
        </div>

        {/* 6 Core Features Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Feature 1 */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 flex flex-col justify-between backdrop-blur">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Smart Guardian Scam Shield</h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                We automatically detect and block common scam triggers—like requests for crypto investments, sudden emergency hospital bills, and gift cards. Anyone attempting financial fraud is flagged before they can take advantage of you.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Protects against financial requests</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 flex flex-col justify-between backdrop-blur">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Plane className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Travel Radar</h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Visiting Manila, Bangkok, or Cebu soon? Post your upcoming travel dates directly to your profile. Singles nearby can see when you will be in town, making it easy to schedule real meetups instead of being endless pen pals.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-amber-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Clear travel dates &amp; destinations</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 flex flex-col justify-between backdrop-blur">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Spark (✨) Mutual Interest</h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Skip cheesy winks and mindless swiping. Send a Spark when someone truly catches your eye. When both of you Spark each other, mutual chat unlocks immediately, and members with high mutual interest earn the <strong>Top Spark</strong> badge.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-rose-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Connect when interest is mutual</span>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 flex flex-col justify-between backdrop-blur">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <EyeOff className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Guest Photo Protection</h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Your full photo album stays private. Non-members browsing without an account can only view your primary avatar. All secondary photos are blurred until a member signs in, keeping your pictures safe from internet bots and random search engines.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-sky-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Albums visible to registered members only</span>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 flex flex-col justify-between backdrop-blur">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Verified Member Badges</h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Avoid catfishes and stolen internet photos. Members can verify their profile by completing a quick live selfie pose check. Once approved, a verified checkmark appears on their profile so you know they are genuine.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-indigo-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Real photo verification</span>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 flex flex-col justify-between backdrop-blur">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <FileCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Meaningful Introductions</h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                No blank profiles or single-word bios. Every member must be at least 18 years old and write a short, thoughtful introduction about themselves and what they are looking for before they can contact others.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-purple-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Profiles with real personality</span>
            </div>
          </div>

        </div>

        {/* Commitment Banner */}
        <section className="mt-20 rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-8 sm:p-12 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="pointer-events-none absolute -bottom-20 left-1/2 -translate-x-1/2 h-40 w-96 bg-rose-600/10 blur-3xl" />
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            100% Free For Local Members
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Local singles living across Southeast Asia—including the Southeast Asia—can browse, send Sparks, and chat completely free of charge.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:from-rose-500 hover:to-rose-400 transition shadow-xl shadow-rose-600/25 flex items-center justify-center gap-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/browse"
              className="w-full sm:w-auto rounded-2xl border border-zinc-800 bg-zinc-900/80 px-8 py-3.5 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition"
            >
              Browse Directory
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
