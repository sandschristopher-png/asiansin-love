import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Logo } from '@/components/Logo'
import { ShieldCheck, Sparkles, Plane, ArrowRight, CheckCircle2, Compass, BadgeCheck } from 'lucide-react'

const SEA_COUNTRIES = [
  'Philippines',
  'Thailand',
  'Vietnam',
  'Cambodia',
  'Laos',
  'Indonesia',
  'Malaysia',
  'Singapore',
]

export default async function HomePage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, city, country, avatar_url, gender, visiting_city, is_verified')
    .not('avatar_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(12)

  const quickCities = [
    { name: 'Manila', code: 'PH', query: 'Philippines' },
    { name: 'Cebu', code: 'PH', query: 'Philippines' },
    { name: 'Bangkok', code: 'TH', query: 'Thailand' },
    { name: 'Phuket', code: 'TH', query: 'Thailand' },
    { name: 'Saigon', code: 'VN', query: 'Vietnam' },
    { name: 'Phnom Penh', code: 'KH', query: 'Cambodia' },
  ]

  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 selection:bg-rose-500 selection:text-white relative overflow-hidden">
      
      {/* Ambient Backdrop Accent */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[450px] w-[750px] bg-gradient-to-b from-rose-600/15 via-rose-950/10 to-transparent blur-3xl opacity-60" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-zinc-950/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">
          <Link href="/" className="hover:opacity-90 transition">
            <Logo className="h-6 w-6" textSize="text-base sm:text-lg" />
          </Link>

          <nav className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/features"
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition hidden sm:inline"
            >
              Why asiansin.love
            </Link>
            <Link
              href="/browse"
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition hidden sm:inline"
            >
              Browse
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition shadow-sm"
            >
              Join Free
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-12 sm:pt-16 pb-24">
        
        {/* Hero Pitch */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3.5 py-1 text-xs font-semibold text-rose-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Verified Southeast Asian Dating</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Southeast Asian Dating, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-300 to-rose-500">
              Without The Clutter Or Scams
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Connect directly with verified singles in the Philippines, Thailand, Vietnam, and Cambodia. 100% free for locals, zero spam ads, and built-in Smart Guardian scam protection.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-xl bg-rose-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 transition shadow-md flex items-center justify-center gap-2 group"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link
              href="/browse"
              className="w-full sm:w-auto rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-3 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition flex items-center justify-center gap-2"
            >
              <Compass className="h-3.5 w-3.5 text-zinc-400" />
              <span>Explore Members</span>
            </Link>
          </div>

          {/* Value Micro-Pills */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>100% Free For Locals</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Smart Guardian Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-rose-400" />
              <span>Real Verified Bios</span>
            </div>
          </div>
        </div>

        {/* Quick Discovery Strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
          <span className="text-xs font-medium text-zinc-500 mr-1">Popular:</span>
          {quickCities.map((c) => (
            <Link
              key={c.name}
              href={`/browse?country=${encodeURIComponent(c.query)}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800/80 bg-zinc-900/50 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition"
            >
              <span>{c.name}</span>
              <span className="text-[10px] text-zinc-500 uppercase">{c.code}</span>
            </Link>
          ))}
        </div>

        {/* Member Grid Showcase */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Recently Joined Members</span>
              </h2>
            </div>
            <Link
              href="/browse"
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {profiles && profiles.length > 0 ? (
              profiles.map((p) => {
                const isForeignVisitor = p.visiting_city && !SEA_COUNTRIES.includes(p.country)
                return (
                  <Link
                    key={p.id}
                    href={`/profile/${p.id}`}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 transition hover:border-zinc-700 hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-[3/4] w-full bg-zinc-900 overflow-hidden">
                      <img
                        src={p.avatar_url}
                        alt={p.display_name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                      
                      {isForeignVisitor && (
                        <div className="absolute top-2 left-2 rounded border border-amber-500/30 bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300 backdrop-blur-sm">
                          ✈️ Visiting
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-semibold truncate group-hover:text-rose-400 transition">
                            {p.display_name}
                          </p>
                          {p.is_verified && (
                            <BadgeCheck className="h-3 w-3 text-sky-400 fill-sky-400/20 shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {p.city ? `${p.city}, ` : ''}{p.country}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="col-span-full py-16 text-center text-xs text-zinc-500">
                Be among the first to join. Create your profile above to appear here.
              </div>
            )}
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section className="mt-16">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">A Modern Experience</span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">Built to Eliminate Dating App Burnout</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 flex flex-col justify-between hover:border-zinc-700 transition">
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 w-fit text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Smart Guardian Scam Shield</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Automatic screening filters money solicitation, crypto schemes, and off-platform link harvesting.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 flex flex-col justify-between hover:border-zinc-700 transition">
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 w-fit text-amber-400">
                  <Plane className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Travel Radar System</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  International visitors can pin upcoming travel dates so locals know when they will physically be in town.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 flex flex-col justify-between hover:border-zinc-700 transition">
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 w-fit text-rose-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Spark (✨) Mutual Chemistry</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Direct connections happen when interest is mutual. No endless swiping or empty notifications.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 px-4 sm:px-6 text-xs text-zinc-500">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5" textSize="text-xs" />
            <span className="text-zinc-400">&copy; 2026 asiansin.love &bull; Modern Southeast Asian Dating</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link href="/browse" className="hover:text-zinc-300 transition">Browse</Link>
            <Link href="/features" className="hover:text-zinc-300 transition">Features</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition">Terms</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
