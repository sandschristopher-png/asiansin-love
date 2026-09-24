import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { 
  ShieldCheck, 
  Sparkles, 
  Plane, 
  ArrowRight, 
  EyeOff, 
  FileCheck, 
  BadgeCheck 
} from 'lucide-react'

export const metadata = {
  title: "Why asiansin.love | Platform Standards",
  description: "How asiansin.love protects you from scams, eliminates fake accounts, and connects genuine singles across Southeast Asia.",
}

const features = [
  {
    icon: ShieldCheck,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Smart Guardian Shield",
    desc: "Proactive heuristic filters block crypto investment traps, emergency hospital bills, and off-platform money solicitations before bad actors can contact you.",
  },
  {
    icon: Plane,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    title: "Travel Radar",
    desc: "Visiting Southeast Asia? Pin your arrival dates and target city directly so locals know when you will be physically in town. Zero endless pen-pal syndrome.",
  },
  {
    icon: Sparkles,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    title: "Spark Chemistry",
    desc: "Replace low-effort winks and mindless right-swiping. Direct mutual chat opens the moment two people Spark each other.",
  },
  {
    icon: EyeOff,
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
    title: "Guest Photo Masking",
    desc: "Public visitors can only view primary avatars. Secondary photo albums remain masked until an authenticated member signs in.",
  },
  {
    icon: BadgeCheck,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    title: "Pose-Verified Profiles",
    desc: "Catfishes and stolen internet photos are eliminated through real-time camera gesture checks. Meet the exact person you see on screen.",
  },
  {
    icon: FileCheck,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    title: "No Blank Bios",
    desc: "Every member must be 18+ and draft an authentic 50-character introduction covering their values and goals before entering the browse feed.",
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 selection:bg-rose-500 selection:text-white pb-16 relative">
      
      {/* Subtle Glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[600px] bg-gradient-to-b from-rose-600/10 to-transparent blur-3xl opacity-50" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-900 bg-zinc-950/80 px-4 sm:px-6 py-3 backdrop-blur-md flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition">
          <Logo className="h-6 w-6" textSize="text-base sm:text-lg" />
        </Link>
        <div className="flex items-center gap-2.5">
          <Link
            href="/browse"
            className="text-xs font-semibold text-zinc-400 hover:text-white transition hidden sm:inline"
          >
            Browse
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition shadow-xs"
          >
            Join Free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-10 sm:pt-14">
        
        {/* Compact Hero Header */}
        <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
            Platform Standards
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Engineered For Serious Love, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-300 to-rose-500">
              Not Casual Scams
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Legacy dating sites are cluttered with spammers, money solicitations, and abandoned profiles. Here is how asiansin.love protects your journey.
          </p>
        </div>

        {/* Dense 3-Column Compact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((item, idx) => {
            const Icon = item.icon
            return (
              <div 
                key={idx} 
                className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4 hover:border-zinc-700 transition flex flex-col justify-start"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`p-1.5 rounded-lg border ${item.bg} ${item.color} shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h2 className="text-xs font-bold text-white tracking-tight">{item.title}</h2>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            )
          })}
        </div>

        {/* Compact Commitment Strip */}
        <section className="mt-10 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-sm sm:text-base font-bold text-white">
              100% Free For Local Southeast Asian Members
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              Local singles across Southeast Asia can browse, match, and chat completely free of charge. No hidden fees or bait-and-switch paywalls.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-900 bg-zinc-950 py-6 px-4 sm:px-6 text-xs text-zinc-500">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5" textSize="text-xs" />
            <span className="text-zinc-400">&copy; 2026 asiansin.love &bull; Modern Southeast Asian Dating</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link href="/browse" className="hover:text-zinc-300 transition">Browse</Link>
            <Link href="/features" className="text-rose-400 hover:text-rose-300 transition">Features</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition">Terms</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
