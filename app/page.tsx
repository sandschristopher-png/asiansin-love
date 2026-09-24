import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Logo } from '@/components/Logo'
import { ShieldCheck, Sparkles, ArrowRight, CheckCircle2, Compass, BadgeCheck } from 'lucide-react'
import { SEA_COUNTRIES } from '@/utils/constants'
import { UserMenu } from '@/components/UserMenu'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let currentProfile = null
  if (user) {
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
    currentProfile = myProfile
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, city, country, avatar_url, gender, visiting_city, is_verified')
    .not('avatar_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(12)

  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 selection:bg-rose-500 selection:text-white relative overflow-hidden">
      
      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[420px] w-[700px] bg-gradient-to-b from-rose-600/15 via-rose-950/5 to-transparent blur-3xl opacity-60" />

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
              Features
            </Link>
            <Link
              href="/browse"
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition hidden sm:inline"
            >
              Browse
            </Link>
            {currentProfile ? (
              <UserMenu
                userId={currentProfile.id}
                displayName={currentProfile.display_name}
                avatarUrl={currentProfile.avatar_url}
              />
            ) : (
              <>
                <Link
                  href="/login?mode=signin"
                  className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition shadow-sm"
                >
                  Join Free
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-14 sm:pt-16 pb-20">
        
        {/* Minimal Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-0.5 text-xs font-medium text-rose-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Southeast Asian Dating</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Meaningful Romance Across <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-300 to-rose-500">
              Southeast Asia
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            A verified community built for serious, lasting relationships. Always 100% free for locals.
          </p>

          {/* Core Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              href="/login?mode=signup"
              className="w-full sm:w-auto rounded-xl bg-rose-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-rose-500 transition shadow-sm flex items-center justify-center gap-2 group"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link
              href="/browse"
              className="w-full sm:w-auto rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-2.5 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition flex items-center justify-center gap-2"
            >
              <Compass className="h-3.5 w-3.5 text-zinc-400" />
              <span>Explore Members</span>
            </Link>
          </div>

          {/* Clean Micro Value Tags */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Free for Locals</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Anti-Scam Protection</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-rose-400" />
              <span>Pose-Verified Profiles</span>
            </div>
          </div>
        </div>

        {/* Member Directory Preview */}
        <section className="mt-14">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Active Members</span>
            </h2>
            <Link
              href="/browse"
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition flex items-center gap-1"
            >
              <span>View Directory</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {profiles && profiles.length > 0 ? (
              profiles.map((p) => {
                const isForeignVisitor = Boolean(p.visiting_city?.trim()) && !SEA_COUNTRIES.includes(p.country as any)
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
              <div className="col-span-full py-8 text-center text-xs text-zinc-500">
                Active member directory loading...
              </div>
            )}
          </div>
        </section>

        {/* Editorial Section: Direct, Honest, Modern */}
        <section className="mt-16 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 sm:p-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              A Direct, Honest Way to Meet in Southeast Asia
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              <strong className="text-white">asiansin.love</strong> connects foreign men with verified singles across Southeast Asia who are looking for genuine, lasting romance. No agencies, no paid chat operators, and no pay-per-letter tricks.
            </p>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              If you live in Southeast Asia, the platform is <strong className="text-zinc-200">100% free</strong>—always. If you are traveling or looking from abroad, you get real verified profiles and tools like <strong className="text-zinc-200">Travel Radar</strong> to coordinate trips in advance.
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 px-4 sm:px-6 text-xs text-zinc-500">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5" textSize="text-xs" />
            <span className="text-zinc-400">&copy; 2026 asiansin.love &bull; Southeast Asian Dating</span>
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
