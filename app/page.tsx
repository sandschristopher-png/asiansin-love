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
    <div className="min-h-dvh bg-[#fafaf9] font-sans text-stone-900 selection:bg-rose-500 selection:text-white relative overflow-hidden">
      
      {/* Subtle Warm Pink/Rose Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[420px] w-[700px] bg-gradient-to-b from-rose-200/50 via-rose-100/20 to-transparent blur-3xl opacity-70" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#fafaf9]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">
          <Link href="/" className="hover:opacity-90 transition">
            <Logo className="h-6 w-6" textSize="text-base sm:text-lg" />
          </Link>

          <nav className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/features"
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition hidden sm:inline"
            >
              Features
            </Link>
            <Link
              href="/browse"
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition hidden sm:inline"
            >
              Browse
            </Link>
            <Link
              href="/login?mode=signin"
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-stone-400 hover:text-stone-900 transition shadow-2xs"
            >
              Sign In
            </Link>
            <Link
              href="/login?mode=signup"
              className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition shadow-xs"
            >
              Join Free
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-14 sm:pt-16 pb-20">
        
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-0.5 text-xs font-semibold text-rose-700 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Southeast Asian Dating</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight leading-[1.15]">
            Meaningful Romance Across <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-500 to-rose-500">
              Southeast Asia
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed font-normal">
            A verified community built for serious, lasting relationships. Always 100% free for locals.
          </p>

          {/* Core Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              href="/login?mode=signup"
              className="w-full sm:w-auto rounded-xl bg-rose-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-rose-500 transition shadow-xs flex items-center justify-center gap-2 group"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link
              href="/browse"
              className="w-full sm:w-auto rounded-xl border border-stone-300 bg-white px-6 py-2.5 text-xs font-semibold text-stone-700 hover:border-stone-400 hover:text-stone-900 transition flex items-center justify-center gap-2 shadow-2xs"
            >
              <Compass className="h-3.5 w-3.5 text-stone-500" />
              <span>Explore Members</span>
            </Link>
          </div>

          {/* Micro Value Tags */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-600 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Free for Locals</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Anti-Scam Protection</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-rose-600" />
              <span>Pose-Verified Profiles</span>
            </div>
          </div>
        </div>

        {/* Member Showcase */}
        <section className="mt-14">
          <div className="flex items-center justify-between mb-3.5 px-0.5">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Active Members</span>
            </h2>
            <Link
              href="/browse"
              className="text-xs font-bold text-rose-600 hover:text-rose-500 transition flex items-center gap-1"
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
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition hover:border-stone-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-[3/4] w-full bg-stone-100 overflow-hidden">
                      <img
                        src={p.avatar_url}
                        alt={p.display_name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />
                      
                      {isForeignVisitor && (
                        <div className="absolute top-2 left-2 rounded border border-amber-300/40 bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-amber-200 backdrop-blur-sm">
                          ✈️ Visiting
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold truncate group-hover:text-rose-300 transition">
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
              <div className="col-span-full py-8 text-center text-xs text-stone-400 bg-white rounded-xl border border-stone-200">
                Active member directory loading...
              </div>
            )}
          </div>
        </section>

        {/* Minimal Value Pillars */}
        <section className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">Smart Guardian</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Automated screening blocks crypto schemes, financial requests, and bad actors in real time.
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-2">
              <Plane className="h-4 w-4 text-amber-600 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">Travel Radar</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Visiting Southeast Asia? Pin your arrival dates so singles nearby know when you are in town.
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-2">
              <Sparkles className="h-4 w-4 text-rose-600 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">Spark Chemistry</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Connect directly when mutual interest is established. No low-effort winks or bot swiping.
            </p>
          </div>
        </section>

      </main>

      {/* Clean Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 px-4 sm:px-6 text-xs text-stone-500">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5" textSize="text-xs" />
            <span className="text-stone-600">&copy; 2026 asiansin.love &bull; Southeast Asian Dating</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <Link href="/browse" className="text-stone-600 hover:text-stone-900 transition">Browse</Link>
            <Link href="/features" className="text-stone-600 hover:text-stone-900 transition">Features</Link>
            <Link href="/terms" className="text-stone-600 hover:text-stone-900 transition">Terms</Link>
            <Link href="/privacy" className="text-stone-600 hover:text-stone-900 transition">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
