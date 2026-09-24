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
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    title: "Smart Guardian Shield",
    desc: "Proactive heuristic filters block crypto investment traps, emergency hospital bills, and off-platform money solicitations before bad actors can contact you.",
  },
  {
    icon: Plane,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    title: "Travel Radar",
    desc: "Visiting Southeast Asia? Pin your arrival dates and target city directly so locals know when you will be physically in town. Zero endless pen-pal syndrome.",
  },
  {
    icon: Sparkles,
    color: "text-[#6d4aff]",
    bg: "bg-purple-50 border-purple-200",
    title: "Spark Chemistry",
    desc: "Replace low-effort winks and mindless right-swiping. Direct mutual chat opens the moment two people Spark each other.",
  },
  {
    icon: EyeOff,
    color: "text-sky-600",
    bg: "bg-sky-50 border-sky-200",
    title: "Guest Photo Masking",
    desc: "Public visitors can only view primary avatars. Secondary photo albums remain masked until an authenticated member signs in.",
  },
  {
    icon: BadgeCheck,
    color: "text-indigo-600",
    bg: "bg-indigo-50 border-indigo-200",
    title: "Pose-Verified Profiles",
    desc: "Catfishes and stolen internet photos are eliminated through real-time camera gesture checks. Meet the exact person you see on screen.",
  },
  {
    icon: FileCheck,
    color: "text-violet-600",
    bg: "bg-violet-50 border-violet-200",
    title: "No Blank Bios",
    desc: "Every member must be 18+ and draft an authentic 50-character introduction covering their values and goals before entering the browse feed.",
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-dvh bg-[#fbfbfe] font-sans text-slate-900 selection:bg-[#6d4aff] selection:text-white pb-16 relative">
      
      {/* Soft Ambient Lilac Glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[600px] bg-gradient-to-b from-[#6d4aff]/10 to-transparent blur-3xl opacity-50" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 py-3.5 backdrop-blur-md flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition">
          <Logo className="h-6 w-6" textSize="text-base sm:text-lg" />
        </Link>
        <div className="flex items-center gap-2.5">
          <Link
            href="/browse"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition hidden sm:inline"
          >
            Browse
          </Link>
          <Link
            href="/login?mode=signup"
            className="rounded-lg bg-[#6d4aff] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#5b3ae6] transition shadow-sm"
          >
            Join Free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-10 sm:pt-14">
        
        {/* Hero Header */}
        <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6d4aff]">
            Platform Standards
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Engineered For Serious Love, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6d4aff] via-[#7c3aed] to-[#a855f7]">
              Not Casual Scams
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Legacy dating sites are cluttered with spammers, money solicitations, and abandoned profiles. Here is how asiansin.love protects your journey.
          </p>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {features.map((item, idx) => {
            const Icon = item.icon
            return (
              <div 
                key={idx} 
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#6d4aff]/50 transition flex flex-col justify-start shadow-xs"
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className={`p-1.5 rounded-xl border ${item.bg} ${item.color} shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h2 className="text-xs font-bold text-slate-900 tracking-tight">{item.title}</h2>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            )
          })}
        </div>

        {/* Commitment Strip */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              100% Free For Local Southeast Asian Members
            </h2>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              Local singles across Southeast Asia can browse, match, and chat completely free of charge. No hidden fees or bait-and-switch paywalls.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Link
              href="/login?mode=signup"
              className="w-full sm:w-auto rounded-xl bg-[#6d4aff] px-4 py-2 text-xs font-bold text-white hover:bg-[#5b3ae6] transition shadow-md flex items-center justify-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-6 px-4 sm:px-6 text-xs text-slate-500">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5" textSize="text-xs" />
            <span className="text-slate-500">&copy; 2026 asiansin.love &bull; Modern Southeast Asian Dating</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link href="/browse" className="hover:text-slate-900 transition">Browse</Link>
            <Link href="/features" className="text-[#6d4aff] hover:underline transition">Features</Link>
            <Link href="/terms" className="hover:text-slate-900 transition">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-900 transition">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
