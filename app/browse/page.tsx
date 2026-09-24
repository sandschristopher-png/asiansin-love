import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { Search, MapPin, BadgeCheck } from 'lucide-react'
import { SEA_COUNTRIES } from '@/utils/constants'

interface BrowsePageProps {
  searchParams: Promise<{
    country?: string
    gender?: string
    q?: string
  }>
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const { country, gender, q } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('display_name, birthdate')
      .eq('id', user.id)
      .maybeSingle()

    if (!myProfile || !myProfile.display_name || !myProfile.birthdate) {
      redirect('/onboarding')
    }
  }

  let query = supabase
    .from('profiles')
    .select('id, display_name, city, country, avatar_url, gender, birthdate, visiting_city, is_verified, looking_for')
    .not('avatar_url', 'is', null)
    .order('created_at', { ascending: false })

  if (country && country !== 'all') {
    query = query.eq('country', country)
  }

  if (gender && gender !== 'all') {
    query = query.eq('gender', gender)
  }

  if (q) {
    query = query.ilike('city', `%${q}%`)
  }

  const { data: profiles } = await query

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return null
    const birth = new Date(birthdate)
    const diff = Date.now() - birth.getTime()
    return Math.abs(new Date(diff).getUTCFullYear() - 1970)
  }

  return (
    <div className="min-h-dvh bg-[#fdfdfd] font-sans text-[#1e192b] selection:bg-[#6d4aff] selection:text-white pb-20">
      <header className="sticky top-0 z-40 border-b border-purple-100 bg-[#fdfdfd]/85 px-4 sm:px-6 py-3.5 backdrop-blur-md flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition">
          <Logo className="h-7 w-7" textSize="text-base sm:text-lg" />
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/settings"
              className="text-xs font-bold text-stone-600 hover:text-[#6d4aff] transition px-2 py-1"
            >
              Settings
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login?mode=signin"
                className="rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-bold text-stone-700 hover:border-purple-300 hover:text-[#6d4aff] transition shadow-2xs"
              >
                Sign In
              </Link>
              <Link
                href="/login?mode=signup"
                className="rounded-full bg-[#6d4aff] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5b3adb] transition shadow-sm"
              >
                Join Free
              </Link>
            </div>
          )}
        </div>
      </header>

      {!user && (
        <div className="bg-purple-50 border-b border-purple-100 px-4 py-2.5 text-center text-xs text-purple-900">
          <span>You are browsing as a guest. </span>
          <Link href="/login?mode=signup" className="font-bold underline hover:text-[#6d4aff]">
            Create a free profile
          </Link>
          <span> to send sparks and message members.</span>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6">
        {/* Search & Filter Toolbar */}
        <div className="rounded-2xl border border-purple-100 bg-white p-3 shadow-2xs mb-6">
          <form method="get" className="flex flex-wrap items-center gap-2.5">
            <select
              name="country"
              defaultValue={country || 'all'}
              className="rounded-xl border border-stone-300 bg-[#fafaf9] px-3 py-2 text-xs font-medium text-stone-800 focus:border-[#6d4aff] focus:outline-none"
            >
              <option value="all">All Southeast Asia</option>
              {SEA_COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              name="gender"
              defaultValue={gender || 'all'}
              className="rounded-xl border border-stone-300 bg-[#fafaf9] px-3 py-2 text-xs font-medium text-stone-800 focus:border-[#6d4aff] focus:outline-none"
            >
              <option value="all">All Genders</option>
              <option value="female">Women</option>
              <option value="male">Men</option>
              <option value="transgender">Trans Women</option>
            </select>

            <div className="relative flex-1 min-w-[140px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                name="q"
                defaultValue={q || ''}
                placeholder="Search city..."
                className="w-full rounded-xl border border-stone-300 bg-[#fafaf9] pl-9 pr-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:border-[#6d4aff] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-[#6d4aff] px-4 py-2 text-xs font-bold text-white hover:bg-[#5b3adb] transition"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {profiles && profiles.length > 0 ? (
            profiles.map((p) => {
              const age = calculateAge(p.birthdate)
              const isForeignVisitor = p.visiting_city && !SEA_COUNTRIES.includes(p.country as any)

              return (
                <Link
                  key={p.id}
                  href={`/profile/${p.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-purple-100 bg-white transition hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5"
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
                          {p.display_name}{age ? `, ${age}` : ''}
                        </p>
                        {p.is_verified && (
                          <BadgeCheck className="h-3.5 w-3.5 text-sky-400 fill-sky-400/20 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-stone-200 truncate mt-0.5">
                        <MapPin className="h-3 w-3 text-purple-400 shrink-0" />
                        <span>{p.city ? `${p.city}, ` : ''}{p.country}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="col-span-full py-20 text-center text-xs text-stone-500 bg-white rounded-2xl border border-purple-100">
              No active profiles found matching this search criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}