import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, User, LogOut, Lock, LogIn, Compass } from 'lucide-react'
import { Logo } from '@/components/Logo'

interface BrowseProps {
  searchParams: Promise<{ country?: string }>
}

const COUNTRIES = [
  { label: 'All', value: '' },
  { label: 'Philippines 🇵🇭', value: 'Philippines' },
  { label: 'Thailand 🇹🇭', value: 'Thailand' },
  { label: 'Vietnam 🇻🇳', value: 'Vietnam' },
  { label: 'Cambodia 🇰🇭', value: 'Cambodia' },
]

export default async function BrowsePage({ searchParams }: BrowseProps) {
  const supabase = await createClient()
  const resolvedParams = await searchParams
  const selectedCountry = resolvedParams.country || ''

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()

  let currentProfile: any = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      redirect('/onboarding')
    }
    currentProfile = profile
  }

  // 2. Fetch profiles query
  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (user) {
    query = query.neq('id', user.id)
    if (currentProfile?.target_gender) {
      query = query.eq('gender', currentProfile.target_gender)
    }
  }

  if (selectedCountry) {
    query = query.ilike('country', `%${selectedCountry}%`)
  }

  const { data: matches } = await query

  // 3. Separate a pool for the Active Reel (e.g. top 10 profiles with photos)
  const activeReelMembers = matches?.filter((p) => Boolean(p.avatar_url)).slice(0, 12) || []

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return null
    const birth = new Date(birthdate)
    const diff = Date.now() - birth.getTime()
    return Math.abs(new Date(diff).getUTCFullYear() - 1970)
  }

  const handleSignOut = async () => {
    'use server'
    const serverSupabase = await createClient()
    await serverSupabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 pb-16">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">
          <Link href="/" className="hover:opacity-90 transition">
            <Logo className="h-7 w-7" textSize="text-lg sm:text-xl" />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <Link
                  href="/inbox"
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-rose-500" />
                  <span>Inbox</span>
                </Link>

                <Link
                  href="/settings"
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>

                <form action={handleSignOut}>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-red-900/60 hover:text-red-400"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition shadow"
                >
                  Join Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        {/* Active Members Horizontal Reel */}
        {activeReelMembers.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Online Members
              </h2>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
              {activeReelMembers.map((m) => (
                <Link
                  key={m.id}
                  href={`/profile/${m.id}`}
                  className="group relative flex flex-col items-center shrink-0 w-16 text-center"
                >
                  <div className="relative h-14 w-14 rounded-full p-0.5 ring-2 ring-zinc-800 group-hover:ring-rose-500 transition">
                    <img
                      src={m.avatar_url}
                      alt={m.display_name}
                      className="h-full w-full rounded-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-zinc-950 bg-emerald-500" />
                  </div>
                  <span className="mt-1.5 text-[11px] font-medium text-zinc-300 truncate w-full group-hover:text-white">
                    {m.display_name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Filters & Header Bar */}
        <section className="mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-white">Browse Members</h1>
              <p className="text-xs text-zinc-400">
                {currentProfile?.target_gender
                  ? `Showing ${currentProfile.target_gender === 'female' ? 'women' : currentProfile.target_gender === 'trans' ? 'trans women' : 'men'}`
                  : 'Showing active members across Southeast Asia'}
              </p>
            </div>
            <span className="text-xs text-zinc-500 font-medium">
              {matches?.length || 0} active {matches?.length === 1 ? 'profile' : 'profiles'}
            </span>
          </div>

          {/* Country Quick-Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {COUNTRIES.map((c) => {
              const active = selectedCountry.toLowerCase() === c.value.toLowerCase()
              return (
                <Link
                  key={c.label}
                  href={c.value ? `/browse?country=${encodeURIComponent(c.value)}` : '/browse'}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    active
                      ? 'bg-rose-600 text-white shadow'
                      : 'border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {c.label}
                </Link>
              )
            })}
          </div>
        </section>

        {/* Member Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {matches?.map((profile) => {
            const age = calculateAge(profile.birthdate)
            const genderLabel =
              profile.gender === 'trans' ? 'Trans Woman' : profile.gender === 'female' ? 'Woman' : 'Man'

            return (
              <div
                key={profile.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 shadow-lg backdrop-blur transition hover:border-zinc-700"
              >
                <Link
                  href={`/profile/${profile.id}`}
                  className="relative aspect-[3/4] w-full bg-zinc-900 overflow-hidden block"
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                      No Photo
                    </div>
                  )}

                  <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-zinc-300 backdrop-blur-md">
                    {genderLabel}
                  </span>

                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-md text-[10px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active</span>
                  </div>
                </Link>

                <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
                  <Link href={`/profile/${profile.id}`}>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-rose-400 transition truncate">
                      {profile.display_name}
                      {age ? <span className="font-normal text-zinc-400">, {age}</span> : ''}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-zinc-400 truncate mt-0.5">
                      {profile.city ? `${profile.city}, ` : ''}
                      {profile.country}
                    </p>
                    <p className="mt-2 text-xs text-zinc-300 line-clamp-2 leading-relaxed hidden sm:block">
                      {profile.bio || 'No bio provided yet.'}
                    </p>
                  </Link>

                  <Link
                    href={user ? `/chat/${profile.id}` : '/login'}
                    className="mt-3 flex w-full items-center justify-center space-x-1.5 rounded-xl bg-rose-600 py-2 sm:py-2.5 text-xs font-semibold text-white shadow transition hover:bg-rose-500 active:scale-[0.99]"
                  >
                    {user ? (
                      <>
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Message</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>Sign In to Chat</span>
                      </>
                    )}
                  </Link>
                </div>
              </div>
            )
          })}

          {(!matches || matches.length === 0) && (
            <div className="col-span-full py-20 text-center">
              <Compass className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-400">
                No members found in {selectedCountry || 'this category'} yet.
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Try picking another country pill or clearing the filter.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}