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
    title: "Smart Guardian Shield",
    desc: "Proactive heuristic filters block crypto investment traps, emergency hospital bills, and off-platform money solicitations before bad actors can contact you.",
  },
  {
    icon: Plane,
    title: "Travel Radar",
    desc: "Visiting Southeast Asia? Pin your arrival dates and target city directly so locals know when you will be physically in town. Zero endless pen-pal syndrome.",
  },
  {
    icon: Sparkles,
    title: "Spark Chemistry",
    desc: "Replace low-effort winks and mindless right-swiping. Direct mutual chat opens the moment two people Spark each other.",
  },
  {
    icon: EyeOff,
    title: "Guest Photo Masking",
    desc: "Public visitors can only view primary avatars. Secondary photo albums remain masked until an authenticated member signs in.",
  },
  {
    icon: BadgeCheck,
    title: "Pose-Verified Profiles",
    desc: "Catfishes and stolen internet photos are eliminated through real-time camera gesture checks. Meet the exact person you see on screen.",
  },
  {
    icon: FileCheck,
    title: "No Blank Bios",
    desc: "Every member must be 18+ and draft an authentic 50-character introduction covering their values and goals before entering the browse feed.",
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-dvh bg-[#F8F7FA] font-sans text-[#1C1924] selection:bg-[#6555B8] selection:text-white pb-16 relative">

      
      {/* Soft Ambient Plum Glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[600px] bg-gradient-to-b from-[#6555B8]/20 to-transparent blur-3xl opacity-60" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#9A8CC3]/25 bg-[#FFFFFF]/90 px-4 sm:px-6 py-3.5 backdrop-blur-md flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition">
          <Logo className="h-6 w-6" textSize="text-base sm:text-lg" />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/discover"
            className="text-xs font-semibold text-[#1C1924] hover:text-[#1C1924] transition hidden sm:inline"
          >
            Explore Profiles
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-[#6555B8] hover:bg-[#7D4B9F] px-3.5 py-1.5 text-xs font-medium text-white transition shadow-md shadow-[#6555B8]/40 active:scale-95"
          >
            Join Free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-10 sm:pt-14">
        
        {/* Hero Header */}
        <div className="text-center max-w-xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
            Platform Standards
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-[#1C1924]  leading-tight">
            Engineered For Serious Love, <br />
            <span className="bg-gradient-to-r from-[#9A8CC3] via-[#1C1924] to-white bg-clip-text text-transparent">
              Not Casual Scams
            </span>
          </h1>
          <p className="text-sm text-[#1C1924] leading-relaxed">
            Legacy dating sites are cluttered with spammers, money solicitations, and abandoned profiles. Here is how asiansin.love protects your journey.
          </p>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((item, idx) => {
            const Icon = item.icon
            return (
              <div 
                key={idx} 
                className="rounded-3xl border border-[#9A8CC3]/35 bg-[#FFFFFF] p-6 hover:border-[#9A8CC3]/70 hover:shadow-xl transition flex flex-col justify-start space-y-3 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-[#FFFFFF] border border-[#9A8CC3]/40 text-[#9A8CC3] shrink-0">
                    <Icon className="h-5 w-5 text-[#B2A4D7]" />
                  </div>
                  <h2 className="text-sm font-medium text-[#1C1924] ">{item.title}</h2>
                </div>
                <p className="text-xs sm:text-sm text-[#1C1924] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            )
          })}
        </div>

        {/* Commitment Strip */}
        <section className="mt-12 rounded-3xl border border-[#9A8CC3]/35 bg-[#FFFFFF] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-base sm:text-lg font-medium text-[#1C1924]">
              100% Free For Local Southeast Asian Members
            </h2>
            <p className="text-xs sm:text-sm text-[#1C1924] max-w-xl leading-relaxed">
              Local singles across Southeast Asia can browse, match, and chat completely free of charge. No hidden fees or bait-and-switch paywalls.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Link
              href="/signup"
              className="w-full sm:w-auto rounded-2xl bg-[#6555B8] hover:bg-[#7D4B9F] px-6 py-3 text-xs sm:text-sm font-medium text-white transition shadow-lg shadow-[#6555B8]/40 flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-[#9A8CC3]/20 bg-[#FFFFFF] py-6 px-4 sm:px-6 text-xs text-[#1C1924]/80">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5" textSize="text-xs" />
            <span className="text-[#1C1924]/70">&copy; 2026 asiansin.love &bull; Modern Southeast Asian Dating</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <Link href="/discover" className="hover:text-[#1C1924] transition">Discover</Link>
            <Link href="/features" className="text-[#B2A4D7] hover:underline transition">Features</Link>
            <Link href="/terms" className="hover:text-[#1C1924] transition">Terms</Link>
            <Link href="/privacy" className="hover:text-[#1C1924] transition">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}


