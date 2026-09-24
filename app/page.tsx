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

  const { data: profiles } = await queryProfiles(supabase)

  return (
    <div className="min-h-dvh bg-[#fbfbfe] font-sans text-slate-900 selection:bg-[#6d4aff] selection:text-white relative overflow-hidden">
      
      {/* Proton-style Soft Lilac/Purple Backdrop Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[800px] bg-gradient-to-b from-[#6d4aff]/15 via-[#9333ea]/5 to-transparent blur-3xl opacity-70" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3.5">
          <Link href="/" className="hover:opacity-90 transition">
            <Logo className="h-6 w-6" textSize="text-base sm:text-lg" />
          </Link>

          <nav className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/features"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition hidden sm:inline"
            >
              Features
            </Link>
            <Link
              href="/browse"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition hidden sm:inline"
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
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900 transition shadow-xs"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="rounded-lg bg-[#6d4aff] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#5b3ae6] transition shadow-sm"
                >
                  Join Free
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-20 pb-20">
        
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1 text-xs font-semibold text-[#6d4aff]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Southeast Asian Dating</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Meaningful Romance Across <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6d4aff] via-[#7c3aed] to-[#a855f7]">
              Southeast Asia
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            A verified community built for serious, lasting relationships. Always 100% free for locals.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              href="/login?mode=signup"
              className="w-full sm:w-auto rounded-xl bg-[#6d4aff] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#5b3ae6] transition shadow-md flex items-center justify-center gap-2 group"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link
              href="/browse"
              className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900 transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Compass className="h-3.5 w-3.5 text-slate-500" />
              <span>Explore Members</span>
            </Link>
          </div>

          {/* Value Micro-Pills */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Free for Locals</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Anti-Scam Protection</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#6d4aff]" />
              <span>Pose-Verified Profiles</span>
            </div>
          </div>
        </div>

        {/* Member Directory Preview */}
        <section className="mt-14">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Active Members</span>
            </h2>
            <Link
              href="/browse"
              className="text-xs font-semibold text-[#6d4aff] hover:text-[#5b3ae6] transition flex items-center gap-1"
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
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-[#6d4aff]/60 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-[3/4] w-full bg-slate-100 overflow-hidden">
                      <img
                        src={p.avatar_url}
                        alt={p.display_name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent pointer-events-none" />
                      
                      {isForeignVisitor && (
                        <div className="absolute top-2 left-2 rounded border border-amber-500/30 bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300 backdrop-blur-sm">
                          ✈️ Visiting
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-semibold truncate group-hover:text-purple-300 transition">
                            {p.display_name}
                          </p>
                          {p.is_verified && (
                            <BadgeCheck className="h-3 w-3 text-sky-400 fill-sky-400/20 shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-300 truncate">
                          {p.city ? `${p.city}, ` : ''}{p.country}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="col-span-full py-8 text-center text-xs text-slate-400">
                Active member directory loading...
              </div>
            )}
          </div>
        </section>

        {/* Editorial Section in Light Theme */}
        <section className="mt-16 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              A Direct, Honest Way to Meet in Southeast Asia
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong className="text-slate-900">asiansin.love</strong> connects foreign men with verified singles across Southeast Asia who are looking for genuine, lasting romance. No agencies, no paid chat operators, and no pay-per-letter tricks.
            </p>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              If you live in Southeast Asia, the platform is <strong className="text-slate-800">100% free</strong>—always. If you are traveling or looking from abroad, you get real verified profiles and tools like <strong className="text-slate-800">Travel Radar</strong> to coordinate trips in advance.
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 sm:px-6 text-xs text-slate-500">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5" textSize="text-xs" />
            <span className="text-slate-500">&copy; 2026 asiansin.love &bull; Southeast Asian Dating</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link href="/browse" className="hover:text-slate-900 transition">Browse</Link>
            <Link href="/features" className="hover:text-slate-900 transition">Features</Link>
            <Link href="/terms" className="hover:text-slate-900 transition">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-900 transition">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}

async function queryProfiles(supabase: any) {
  return await supabase
    .from('profiles')
    .select('id, display_name, city, country, avatar_url, gender, visiting_city, is_verified')
    .not('avatar_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(12)
}
