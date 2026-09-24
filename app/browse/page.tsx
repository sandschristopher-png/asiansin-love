import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Search, MapPin, BadgeCheck } from 'lucide-react'

interface BrowseProps {
  searchParams: Promise<{
    country?: string
    city?: string
    intent?: string
  }>
}

export default async function BrowsePage({ searchParams }: BrowseProps) {
  const { country, city, intent } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('profiles')
    .select('id, display_name, city, country, birthdate, avatar_url, gender, bio, visiting_city, looking_for, is_verified, created_at')
    .not('avatar_url', 'is', null)
    .order('created_at', { ascending: false })

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

  const countries = [
    { label: 'All', value: 'All' },
    { label: 'Philippines 🇵🇭', value: 'Philippines' },
    { label: 'Thailand 🇹🇭', value: 'Thailand' },
    { label: 'Vietnam 🇻🇳', value: 'Vietnam' },
    { label: 'Cambodia 🇰🇭', value: 'Cambodia' },
    { label: 'Laos 🇱🇦', value: 'Laos' },
    { label: 'Indonesia 🇮🇩', value: 'Indonesia' },
    { label: 'Malaysia 🇲🇾', value: 'Malaysia' },
    { label: 'Singapore 🇸🇬', value: 'Singapore' },
  ]

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return null
    const birth = new Date(birthdate)
    const diff = Date.now() - birth.getTime()
    return Math.abs(new Date(diff).getUTCFullYear() - 1970)
  }

  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 pb-20">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 px-4 sm:px-6 py-3.5 backdrop-blur flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition">
          <Logo className="h-7 w-7" textSize="text-lg sm:text-xl" />
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/settings"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition"
            >
              My Profile
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition shadow"
            >
              Join Free
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-6">
        <div className="space-y-4 mb-8">
          <form method="GET" action="/browse" className="flex gap-2 max-w-md">
            {country && <input type="hidden" name="country" value={country} />}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                name="city"
                defaultValue={city || ''}
                placeholder="Search nearby city or district (e.g. Malate, Makati, Vientiane)..."
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {countries.map((c) => {
              const active = (country === c.value) || (!country && c.value === 'All')
              return (
                <Link
                  key={c.value}
                  href={`/browse?country=${c.value}${city ? `&city=${encodeURIComponent(city)}` : ''}`}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {c.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {profiles && profiles.length > 0 ? (
            profiles.map((p) => {
              const age = calculateAge(p.birthdate)
              return (
                <Link
                  key={p.id}
                  href={`/profile/${p.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 shadow-lg backdrop-blur transition hover:border-zinc-700 hover:-translate-y-1"
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
                        ✈️ Visiting
                      </div>
                    )}

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                      <div className="flex items-center gap-1">
                        <p className="text-xs sm:text-sm font-bold truncate group-hover:text-rose-400 transition">
                          {p.display_name}{age ? `, ${age}` : ''}
                        </p>
                        {p.is_verified && (
                          <BadgeCheck className="h-3.5 w-3.5 text-sky-400 fill-sky-400/20 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-300 truncate mt-0.5">
                        <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                        <span>{p.city ? `${p.city}, ` : ''}{p.country}</span>
                      </div>
                      {p.looking_for && (
                        <span className="mt-1.5 inline-block rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-zinc-300 font-medium truncate max-w-full">
                          {p.looking_for}
                        </span>
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
