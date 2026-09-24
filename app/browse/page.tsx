import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Search, MapPin, BadgeCheck, Sparkles, Clock } from 'lucide-react'
import { SEA_COUNTRIES, COUNTRY_FILTER_OPTIONS } from '@/utils/constants'
import { UserMenu } from '@/components/UserMenu'

interface BrowseProps {
  searchParams: Promise<{
    country?: string
    city?: string
    intent?: string
    filter?: string
  }>
}

export default async function BrowsePage({ searchParams }: BrowseProps) {
  const { country, city, intent, filter } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let currentProfile = null
  if (user) {
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('id, display_name, birthdate, avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    if (!myProfile || !myProfile.display_name || !myProfile.birthdate) {
      const { redirect } = await import('next/navigation')
      redirect('/onboarding')
    }
    currentProfile = myProfile
  }

  let query = supabase
    .from('profiles')
    .select('id, display_name, city, country, birthdate, avatar_url, gender, bio, visiting_city, visiting_dates, looking_for, is_verified, sparks_count, created_at')
    .not('avatar_url', 'is', null)

  if (filter === 'top-sparks') {
    query = query.order('sparks_count', { ascending: false }).order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  if (country && country !== 'All') {
    query = query.eq('country', country)
  }

  if (city && city.trim() !== '') {
    query = query.ilike('city', `%${city.trim()}%`)
  }

  if (intent && intent !== 'All') {
    query = query.eq('looking_for', intent)
  }

  const { data: profiles } = await query

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return null
    const birth = new Date(birthdate)
    const diff = Date.now() - birth.getTime()
    return Math.abs(new Date(diff).getUTCFullYear() - 1970)
  }

  const isTopSparksActive = filter === 'top-sparks'

  const buildFilterUrl = (newParams: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams()
    if (country && country !== 'All') params.set('country', country)
    if (city) params.set('city', city)
    if (filter) params.set('filter', filter)

    for (const [k, v] of Object.entries(newParams)) {
      if (!v || v === 'All') {
        params.delete(k)
      } else {
        params.set(k, v)
      }
    }
    const q = params.toString()
    return `/browse${q ? `?${q}` : ''}`
  }

  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 pb-20 selection:bg-rose-500 selection:text-white">
      {/* Sleek Minimal Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-900 bg-zinc-950/80 px-4 sm:px-6 py-3 backdrop-blur-md flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition">
          <Logo className="h-6 w-6" textSize="text-base sm:text-lg" />
        </Link>

        <div className="flex items-center gap-2.5">
          {currentProfile ? (
            <UserMenu
              userId={currentProfile.id}
              displayName={currentProfile.display_name}
              avatarUrl={currentProfile.avatar_url}
            />
          ) : (
            <Link
              href="/login?mode=signup"
              className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition shadow-sm"
            >
              Join Free
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-6">
        <div className="space-y-3.5 mb-6">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <form method="GET" action="/browse" className="flex gap-2 flex-1 max-w-md">
              {country && country !== 'All' && <input type="hidden" name="country" value={country} />}
              {filter && <input type="hidden" name="filter" value={filter} />}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  name="city"
                  defaultValue={city || ''}
                  placeholder="Search city or district..."
                  className="w-full rounded-lg border border-zinc-800/80 bg-zinc-900/70 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-rose-500/80 focus:outline-none transition"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition"
              >
                Search
              </button>
            </form>

            <div className="inline-flex rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-1 self-start sm:self-auto">
              <Link
                href={buildFilterUrl({ filter: null })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  !isTopSparksActive
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Clock className="h-3 w-3" />
                <span>Recent</span>
              </Link>
              <Link
                href={buildFilterUrl({ filter: 'top-sparks' })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  isTopSparksActive
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Top Sparks</span>
              </Link>
            </div>
          </div>

          {/* Unified Country Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
            {COUNTRY_FILTER_OPTIONS.map((c) => {
              const active = (country === c.value) || (!country && c.value === 'All')
              return (
                <Link
                  key={c.value}
                  href={buildFilterUrl({ country: c.value === 'All' ? null : c.value })}
                  className={`shrink-0 rounded-md px-3 py-1 text-xs font-medium transition ${
                    active
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'border border-zinc-800/80 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {c.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {profiles && profiles.length > 0 ? (
            profiles.map((p) => {
              const age = calculateAge(p.birthdate)
              const hasSparks = (p.sparks_count ?? 0) > 0
              const isForeignVisitor = Boolean(p.visiting_city?.trim()) && !SEA_COUNTRIES.includes(p.country as any)

              return (
                <Link
                  key={p.id}
                  href={`/profile/${p.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-900/30 transition hover:border-zinc-700 hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[3/4] w-full bg-zinc-900 overflow-hidden">
                    <img
                      src={p.avatar_url}
                      alt={p.display_name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {isForeignVisitor && (
                        <div className="rounded border border-amber-500/30 bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300 backdrop-blur-sm">
                          ✈️ Visiting
                        </div>
                      )}
                      {hasSparks && (
                        <div className="rounded border border-rose-500/30 bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-rose-300 backdrop-blur-sm flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" />
                          <span>Top Spark</span>
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                      <div className="flex items-center gap-1">
                        <p className="text-xs sm:text-sm font-semibold truncate group-hover:text-rose-400 transition">
                          {p.display_name}{age ? `, ${age}` : ''}
                        </p>
                        {p.is_verified && (
                          <BadgeCheck className="h-3.5 w-3.5 text-sky-400 fill-sky-400/20 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 truncate mt-0.5">
                        <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                        <span>{p.city ? `${p.city}, ` : ''}{p.country}</span>
                      </div>
                      {p.looking_for && (
                        <div className="mt-1.5">
                          <span className="inline-block rounded border border-zinc-800 bg-black/50 px-1.5 py-0.5 text-[9px] text-zinc-300 font-normal truncate max-w-full">
                            {p.looking_for}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="col-span-full py-20 text-center text-xs text-zinc-500">
              No active profiles found matching this search criteria.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
