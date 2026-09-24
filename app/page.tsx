import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Logo } from '@/components/Logo'
import { ShieldCheck, Sparkles, Plane, ArrowRight, CheckCircle2, Compass, BadgeCheck } from 'lucide-react'
import { SEA_COUNTRIES } from '@/utils/constants'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, city, country, avatar_url, gender, visiting_city, is_verified')
    .not('avatar_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(12)

  return (
    <div className="min-h-dvh bg-[#fdfdfd] font-sans text-[#1e192b] selection:bg-[#6d4aff] selection:text-white relative overflow-hidden">
      
      {/* Proton Ambient Lavender/Violet Radial Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[850px] bg-gradient-to-b from-purple-200/50 via-violet-100/30 to-transparent blur-3xl opacity-80" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-purple-100/80 bg-[#fdfdfd]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3.5">
          <Link href="/" className="hover:opacity-90 transition">
            <Logo className="h-7 w-7" textSize="text-base sm:text-lg" />
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/browse"
              className="text-xs font-semibold text-stone-600 hover:text-[#6d4aff] transition hidden sm:inline"
            >
              Browse
            </Link>
            <Link
              href="/login?mode=signin"
              className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-xs font-bold text-stone-700 hover:border-purple-300 hover:text-[#6d4aff] transition shadow-2xs"
            >
              Sign In
            </Link>
            <Link
              href="/login?mode=signup"
              className="rounded-full bg-[#6d4aff] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5b3adb] transition shadow-sm hover:shadow-md"
            >
              Create Account
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-14 sm:pt-20 pb-24">
        
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto space-y-5">
          
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50/80 px-3.5 py-1 text-xs font-bold text-[#6d4aff] shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-[#6d4aff]" />
            <span>High-Trust Southeast Asian Dating</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#1e192b] tracking-tight leading-[1.12]">
            Meaningful Romance Across <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6d4aff] via-[#8b5cf6] to-[#a855f7]">
              Southeast Asia
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed font-normal">
            A verified platform protected by Smart Guardian defenses. Free for Southeast Asian singles.
          </p>

          {/* Proton Rounded Pill Actions */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login?mode=signup"
              className="w-full sm:w-auto rounded-full bg-[#6d4aff] px-7 py-3 text-xs font-bold text-white hover:bg-[#5b3adb] transition shadow-sm hover:shadow-md flex items-center justify-center gap-2 group"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link
              href="/browse"
              className="w-full sm:w-auto rounded-full border border-stone-300 bg-white px-7 py-3 text-xs font-bold text-stone-700 hover:border-purple-300 hover:text-[#6d4aff] transition flex items-center justify-center gap-2 shadow-2xs"
            >
              <Compass className="h-3.5 w-3.5 text-stone-500" />
              <span>Explore Members</span>
            </Link>
          </div>

          {/* Micro Value Tags */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-600 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>100% Free For Locals</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#6d4aff]" />
              <span>Anti-Scam Guardian</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              <span>Pose-Verified Profiles</span>
            </div>
          </div>
        </div>

        {/* Member Showcase */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-4 px-0.5">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Active Members</span>
            </h2>
            <Link
              href="/browse"
              className="text-xs font-bold text-[#6d4aff] hover:underline transition flex items-center gap-1"
            >
              <span>View Directory</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {profiles && profiles.length > 0 ? (
              profiles.map((p) => {
                const isForeignVisitor = p.visiting_city && !SEA_COUNTRIES.includes(p.country as any)
                return (
                  <Link
                    key={p.id}
                    href={`/profile/${p.id}`}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-purple-100 bg-white transition hover:border-purple-300 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-[3/4] w-full bg-stone-100 overflow-hidden">
                      <img
                        src={p.avatar_url}
                        alt={p.display_name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />
                      
                      {isForeignVisitor && (
                        <div className="absolute top-2 left-2 rounded-md border border-amber-300/40 bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-amber-200 backdrop-blur-sm">
                          ✈️ Visiting
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold truncate group-hover:text-purple-300 transition">
                            {p.display_name}
                          </p>
                          {p.is_verified && (
                            <BadgeCheck className="h-3 w-3 text-sky-400 fill-sky-400/20 shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-stone-200 truncate">
                          {p.city ? `${p.city}, ` : ''}{p.country}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="col-span-full py-12 text-center text-xs text-stone-400 bg-white rounded-2xl border border-purple-100">
                Active member directory loading...
              </div>
            )}
          </div>
        </section>

        {/* Feature Cards with Proton-Style Glow borders */}
        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-2xs hover:border-purple-200 transition">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="h-8 w-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#6d4aff]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e192b]">Smart Guardian</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Automated heuristics block investment solicitations, emergency wire scams, and fraudulent accounts.
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-2xs hover:border-purple-200 transition">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="h-8 w-8 rounded-xl bg-purple-50 flex items-center justify-center text-amber-600">
                <Plane className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e192b]">Travel Radar</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Visiting Southeast Asia? Pin your arrival dates so singles nearby know when you are in town.
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-2xs hover:border-purple-200 transition">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="h-8 w-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#6d4aff]">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e192b]">Spark Chemistry</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Real-time messaging unlocks as soon as mutual interest is shared. No fake credits or paid swipes.
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-purple-100 bg-white py-8 px-4 sm:px-6 text-xs text-stone-500">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5" textSize="text-xs" />
            <span className="text-stone-600">&copy; 2026 asiansin.love &bull; Southeast Asian Dating</span>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold">
            <Link href="/browse" className="text-stone-600 hover:text-[#6d4aff] transition">Browse</Link>
            <Link href="/terms" className="text-stone-600 hover:text-[#6d4aff] transition">Terms</Link>
            <Link href="/privacy" className="text-stone-600 hover:text-[#6d4aff] transition">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}