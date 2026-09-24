import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Logo } from '@/components/Logo'
import { ShieldCheck, Sparkles, Plane, ArrowRight, CheckCircle2, Lock, MessageSquare, Compass, Heart } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch real members with photos to show live visual proof
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, city, country, avatar_url, gender, visiting_city')
    .not('avatar_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(12)

  const quickCities = [
    { name: 'Manila ????', query: 'Philippines' },
    { name: 'Cebu ????', query: 'Philippines' },
    { name: 'Bangkok ????', query: 'Thailand' },
    { name: 'Phuket ????', query: 'Thailand' },
    { name: 'Saigon ????', query: 'Vietnam' },
    { name: 'Phnom Penh ????', query: 'Cambodia' },
  ]

  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 selection:bg-rose-500 selection:text-white relative overflow-hidden">
      
      {/* Subtle Background Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] bg-gradient-to-b from-rose-600/15 via-rose-950/10 to-transparent blur-3xl opacity-70" />
      <div className="pointer-events-none absolute top-[600px] -right-40 h-[400px] w-[500px] bg-emerald-600/5 blur-3xl opacity-50" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3.5">
          <Link href="/" className="hover:opacity-90 transition">
            <Logo className="h-7 w-7" textSize="text-lg sm:text-xl" />
          </Link>

          <nav className="flex items-center gap-2.5 sm:gap-4">
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
              className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-3.5 py-1.5 text-xs font-bold text-white hover:from-rose-500 hover:to-rose-400 transition shadow-lg shadow-rose-600/20"
            >
              Join Free
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-10 sm:pt-16 pb-24">
        
        {/* Hero Pitch */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          
          {/* Live Activity Counter Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-1.5 text-xs font-semibold text-rose-300 backdrop-blur-md shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Over 10,000+ Active Singles Online Across Southeast Asia</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.12]">
            Southeast Asian Dating, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-300 to-rose-500">
              Without The Clutter & Scams
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 max-w-xl mx-auto leading-relaxed">
            Connect directly with verified singles in the Philippines, Thailand, Vietnam, and Cambodia. 100% free messaging for locals, zero spam ads, and built-in Smart Guardian protection.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 px-8 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:from-rose-500 hover:to-rose-400 transition shadow-xl shadow-rose-600/25 flex items-center justify-center gap-2 group"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
            </Link>
            <Link
              href="/browse"
              className="w-full sm:w-auto rounded-2xl border border-zinc-800 bg-zinc-900/80 px-8 py-3.5 text-xs sm:text-sm font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition flex items-center justify-center gap-2 backdrop-blur"
            >
              <Compass className="h-4 w-4 text-zinc-400" />
              <span>Explore Member Directory</span>
            </Link>
          </div>

          {/* Value Micro-Pills */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>100% Free For Local Members</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Scam-Protected Platform</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-rose-400" />
              <span>Mandatory 50-Char Bio</span>
            </div>
          </div>
        </div>

        {/* Quick Destination Discovery Strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 mr-1">Popular:</span>
          {quickCities.map((c) => (
            <Link
              key={c.name}
              href={`/browse?country=${encodeURIComponent(c.query)}`}
              className="rounded-full border border-zinc-800/80 bg-zinc-900/50 px-3 py-1 text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition"
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* Live Verified Member Gallery Showcase */}
        <section className="mt-10 sm:mt-12">
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Active Members</span>
              </h2>
              <p className="text-xs text-zinc-400">Discover authentic profiles online right now</p>
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
              profiles.map((p) => (
                <Link
                  key={p.id}
                  href={`/profile/${p.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 shadow-lg backdrop-blur transition hover:border-zinc-700 hover:-translate-y-1"
                >
                  <div className="relative aspect-[3/4] w-full bg-zinc-900 overflow-hidden">
                    <img
                      src={p.avatar_url}
                      alt={p.display_name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                    
                    {p.visiting_city && (
                      <div className="absolute top-2 left-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[9px] font-bold text-black backdrop-blur">
                        ?? Visiting
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <p className="text-xs font-bold truncate group-hover:text-rose-400 transition">
                        {p.display_name}
                      </p>
                      <p className="text-[10px] text-zinc-300 truncate">
                        {p.city ? `${p.city}, ` : ''}{p.country}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-xs text-zinc-500">
                Loading live directory members...
              </div>
            )}
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section className="mt-20">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">A Better Experience</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Built to Eliminate Dating App Burnout</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Bento Card 1 */}
            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 flex flex-col justify-between backdrop-blur hover:border-zinc-700 transition">
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 w-fit text-emerald-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">Smart Guardian Scam Shield</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Real-time pattern protection blocks financial solicitation triggers and early off-platform harvesting before bad actors can isolate you.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/60 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span>Active 24/7 Screening</span>
              </div>
            </div>

            {/* Bento Card 2 */}
            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 flex flex-col justify-between backdrop-blur hover:border-zinc-700 transition">
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 w-fit text-amber-400">
                  <Plane className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">Travel Radar System</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Visiting Manila or Bangkok soon? Pin your flight dates directly on your card so local members know you are real and arriving soon.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/60 text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                <span>Zero Pen-Pal Frustration</span>
              </div>
            </div>

            {/* Bento Card 3 */}
            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 flex flex-col justify-between backdrop-blur hover:border-zinc-700 transition">
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 w-fit text-rose-400">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">Spark (?) Mutual Matching</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Skip the cheesy winks and generic swiping. Send a clean Spark to show genuine interest and unlock reciprocal alerts when feelings are mutual.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/60 text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                <span>Elevated Connection Mechanic</span>
              </div>
            </div>

          </div>
        </section>

        {/* Bottom Callout Banner */}
        <section className="mt-20 rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-8 sm:p-12 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="pointer-events-none absolute -bottom-20 left-1/2 -translate-x-1/2 h-40 w-96 bg-rose-600/10 blur-3xl" />
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Real Connections Start Here
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Create your profile in 60 seconds. Free for local members, completely ad-free, and protected from the start.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:from-rose-500 hover:to-rose-400 transition shadow-xl shadow-rose-600/25"
            >
              Get Started Free
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-10 px-4 sm:px-6 text-xs text-zinc-500">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Logo className="h-5 w-5" textSize="text-sm" />
            <span className="text-zinc-400">&copy; 2026 asiansin.love &bull; Modern Southeast Asian Dating</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/browse" className="hover:text-zinc-300 transition">Browse Directory</Link>
            <Link href="/features" className="hover:text-zinc-300 transition">Platform Features</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition">Privacy Policy</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
