import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, User, LogOut, Heart } from 'lucide-react'

export default async function BrowsePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get current user profile to determine gender target
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If user hasn't completed onboarding yet, route to onboarding
  if (!currentProfile) {
    redirect('/onboarding')
  }

  // Fetch match candidates
  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', user.id)
    .order('created_at', { ascending: false })

  if (currentProfile?.target_gender) {
    query = query.eq('gender', currentProfile.target_gender)
  }

  const { data: matches } = await query

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
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 fill-rose-600 text-rose-600" />
            <span className="text-xl font-bold tracking-tight text-white">asiansin.love</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/inbox"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Inbox</span>
            </Link>

            <Link
              href="/onboarding"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              <User className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </Link>

            <form action={handleSignOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-red-900/60 hover:text-red-400"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Browse Members</h2>
            <p className="text-xs text-zinc-400">
              Showing {currentProfile.target_gender === 'female' ? 'women' : 'men'} looking for {currentProfile.gender === 'male' ? 'men' : 'women'}
            </p>
          </div>
          <span className="text-xs text-zinc-500 font-medium">
            {matches?.length || 0} active {matches?.length === 1 ? 'profile' : 'profiles'}
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {matches?.map((profile) => {
            const age = calculateAge(profile.birthdate)

            return (
              <div
                key={profile.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 shadow-lg backdrop-blur transition hover:border-zinc-700"
              >
                {/* Photo container */}
                <div className="relative h-64 w-full bg-zinc-900">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                      No Photo
                    </div>
                  )}
                </div>

                {/* Profile info & action */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {profile.display_name}
                      {age ? <span className="font-normal text-zinc-400">, {age}</span> : ''}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {profile.city ? `${profile.city}, ` : ''}{profile.country}
                    </p>
                    <p className="mt-2.5 text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                      {profile.bio || 'No bio provided yet.'}
                    </p>
                  </div>

                  <Link
                    href={`/chat/${profile.id}`}
                    className="mt-4 flex w-full items-center justify-center space-x-1.5 rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-rose-500 active:scale-[0.99]"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Message</span>
                  </Link>
                </div>
              </div>
            )
          })}

          {(!matches || matches.length === 0) && (
            <div className="col-span-full py-20 text-center">
              <p className="text-sm text-zinc-400">No members found matching your preferences yet.</p>
              <p className="mt-1 text-xs text-zinc-500">Sign up another test account in an incognito window to view them here.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}