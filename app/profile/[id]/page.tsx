import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, ShieldAlert, Lock, MapPin, Calendar, Ruler, User, HeartHandshake, BadgeCheck } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { ProfileActions } from '@/components/ProfileActions'
import { SEA_COUNTRIES } from '@/utils/constants'

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function ProfileDetailPage({ params }: ProfilePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) {
    notFound()
  }

  // Deduplicated Daily Profile Views
  if (user && user.id !== profile.id) {
    const today = new Date().toISOString().split('T')[0]
    const { data: existingView } = await supabase
      .from('profile_views')
      .select('id')
      .eq('viewer_id', user.id)
      .eq('viewed_id', profile.id)
      .gte('created_at', `${today}T00:00:00Z`)
      .maybeSingle()

    if (!existingView) {
      await supabase.from('profile_views').insert({
        viewer_id: user.id,
        viewed_id: profile.id,
      })
    }
  }

  let isSparked = false
  if (user) {
    const { data: spk } = await supabase
      .from('sparks')
      .select('id')
      .eq('sender_id', user.id)
      .eq('receiver_id', profile.id)
      .maybeSingle()
    isSparked = !!spk
  }

  let isFavorited = false
  if (user) {
    const { data: fav } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('favorite_id', profile.id)
      .maybeSingle()
    isFavorited = !!fav
  }

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return null
    const birth = new Date(birthdate)
    const diff = Date.now() - birth.getTime()
    return Math.abs(new Date(diff).getUTCFullYear() - 1970)
  }

  const age = calculateAge(profile.birthdate)
  const gallery: string[] = profile.photos && profile.photos.length > 0 
    ? profile.photos 
    : (profile.avatar_url ? [profile.avatar_url] : [])

  const genderLabel = profile.gender === 'trans' ? 'Trans Woman' : profile.gender === 'female' ? 'Woman' : 'Man'
  const isForeignVisitor = profile.visiting_city && !SEA_COUNTRIES.includes(profile.country as any)

  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 pb-20 selection:bg-rose-500 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-zinc-900 bg-zinc-950/80 px-4 py-3 backdrop-blur-md flex items-center justify-between">
        <Link href="/browse" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Browse</span>
        </Link>
        <Link href="/browse" className="hover:opacity-90 transition">
          <Logo className="h-6 w-6" textSize="text-base" />
        </Link>
        <div className="w-12" />
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        <div className="space-y-4">

          {/* Architectural Hero Card */}
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900 shadow-xl">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-500 text-sm">
                No Photo Available
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="rounded border border-zinc-700/60 bg-black/60 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm">
                  {genderLabel}
                </span>
                <div className="flex items-center gap-1.5 rounded border border-emerald-500/20 bg-black/60 px-2 py-0.5 text-[11px] text-emerald-400 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Online</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <h1 className="text-2xl font-bold tracking-tight">
                  {profile.display_name}
                  {age ? <span className="font-normal text-zinc-300">, {age}</span> : ''}
                </h1>
                {profile.is_verified && (
                  <span title="Verified Member" className="inline-flex items-center">
                    <BadgeCheck className="h-5 w-5 text-sky-400 fill-sky-400/20" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-300">
                <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                <span>{profile.city ? `${profile.city}, ` : ''}{profile.country}</span>
              </div>

              {isForeignVisitor && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 backdrop-blur-sm">
                  <span>✈️</span>
                  <span>Visiting {profile.visiting_city} {profile.visiting_dates ? `(${profile.visiting_dates})` : ''}</span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Actions */}
          <ProfileActions
            targetUserId={profile.id}
            initialSparked={isSparked}
            initialFavorited={isFavorited}
            isAuthenticated={isAuthenticated}
          />

          {/* Direct Messaging Card */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Direct Conversation
            </label>
            {isAuthenticated ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-center text-xs text-zinc-300 flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 font-semibold text-rose-400">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Send a Spark to Connect</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  When you both Spark each other, mutual private messaging opens immediately.
                </p>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-rose-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 transition shadow-sm"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Sign In to Connect</span>
              </Link>
            )}
          </div>

          {/* Photo Gallery Grid */}
          {gallery.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Photos ({gallery.length})
                </h2>
                {!isAuthenticated && (
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Additional photos locked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {gallery.map((photoUrl: string, idx: number) => {
                  const isLocked = !isAuthenticated && idx > 0
                  return (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                      <img
                        src={photoUrl}
                        alt=""
                        className={`h-full w-full object-cover ${isLocked ? 'blur-md scale-105 select-none pointer-events-none' : ''}`}
                      />
                      {isLocked && (
                        <Link
                          href="/login"
                          className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] text-white p-2 text-center group"
                        >
                          <div className="rounded-lg bg-zinc-900/80 p-2 border border-zinc-700 group-hover:border-rose-500 transition">
                            <Lock className="h-3.5 w-3.5 text-zinc-300 group-hover:text-rose-400" />
                          </div>
                          <span className="mt-1.5 text-[10px] font-medium text-zinc-300">
                            Sign in
                          </span>
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* About Me */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">About</h2>
            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
              {profile.bio || 'No bio provided yet.'}
            </p>
          </div>

          {/* Structured Details */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4 space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">Details</h2>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <User className="h-3.5 w-3.5 text-zinc-500" />
                <span>Gender: <strong className="text-white font-medium">{genderLabel}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <HeartHandshake className="h-3.5 w-3.5 text-rose-400" />
                <span>Goal: <strong className="text-white font-medium">{profile.looking_for || 'Romantic Intent'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <span>Status: <strong className="text-white font-medium">{profile.marital_status || 'Single'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Ruler className="h-3.5 w-3.5 text-zinc-500" />
                <span>Height: <strong className="text-white font-medium">{profile.height || 'Unspecified'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                <span>Joined: <strong className="text-white font-medium">{new Date(profile.created_at).toLocaleDateString()}</strong></span>
              </div>
            </div>
          </div>

          {/* Guardian Shield Callout */}
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-emerald-300">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
            <p className="leading-relaxed">
              <strong>Smart Guardian Active:</strong> Never send money, gift cards, or wire transfers to anyone online.
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}
