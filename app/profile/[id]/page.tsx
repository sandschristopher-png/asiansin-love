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

  const genderLabel = profile.gender === 'transgender' ? 'Trans Woman' : profile.gender === 'female' ? 'Woman' : 'Man'
  const isForeignVisitor = Boolean(profile.visiting_city?.trim()) && !SEA_COUNTRIES.includes(profile.country as any)

  return (
    <div className="min-h-dvh bg-[#fbfbfe] font-sans text-slate-900 pb-20 selection:bg-[#6d4aff] selection:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-md flex items-center justify-between">
        <Link href="/browse" className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition">
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

          {/* Hero Avatar Card */}
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400 text-sm">
                No Photo Available
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />

            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="rounded border border-white/20 bg-black/50 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm">
                  {genderLabel}
                </span>
                <div className="flex items-center gap-1.5 rounded border border-emerald-400/30 bg-black/50 px-2 py-0.5 text-[11px] text-emerald-300 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Online</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <h1 className="text-2xl font-bold tracking-tight">
                  {profile.display_name}
                  {age ? <span className="font-normal text-slate-200">, {age}</span> : ''}
                </h1>
                {profile.is_verified && (
                  <span title="Verified Member" className="inline-flex items-center">
                    <BadgeCheck className="h-5 w-5 text-sky-400 fill-sky-400/20" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-200">
                <MapPin className="h-3.5 w-3.5 text-[#6d4aff] shrink-0" />
                <span>{profile.city ? `${profile.city}, ` : ''}{profile.country}</span>
              </div>

              {isForeignVisitor && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded border border-amber-400/40 bg-black/60 px-2.5 py-1 text-xs font-medium text-amber-300 backdrop-blur-sm">
                  <span>✈️</span>
                  <span>Visiting {profile.visiting_city} {profile.visiting_dates ? `(${profile.visiting_dates})` : ''}</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Actions */}
          <ProfileActions
            targetUserId={profile.id}
            initialSparked={isSparked}
            initialFavorited={isFavorited}
            isAuthenticated={isAuthenticated}
          />

          {/* Direct Messaging Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Direct Conversation
            </label>
            {isAuthenticated ? (
              <div className="rounded-xl border border-slate-200 bg-purple-50/50 p-3 text-center text-xs text-slate-700 flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 font-semibold text-[#6d4aff]">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Send a Spark to Connect</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  When you both Spark each other, mutual private messaging opens immediately.
                </p>
              </div>
            ) : (
              <Link
                href="/login?mode=signin"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#6d4aff] py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#5b3ae6] transition shadow-sm"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Sign In to Connect</span>
              </Link>
            )}
          </div>

          {/* Gallery */}
          {gallery.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Photos ({gallery.length})
                </h2>
                {!isAuthenticated && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Additional photos locked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {gallery.map((photoUrl: string, idx: number) => {
                  const isLocked = !isAuthenticated && idx > 0
                  return (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
                      <img
                        src={photoUrl}
                        alt=""
                        className={`h-full w-full object-cover ${isLocked ? 'blur-md scale-105 select-none pointer-events-none' : ''}`}
                      />
                      {isLocked && (
                        <Link
                          href="/login?mode=signin"
                          className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] text-white p-2 text-center group"
                        >
                          <div className="rounded-lg bg-white/80 p-2 border border-slate-200 shadow-sm transition">
                            <Lock className="h-3.5 w-3.5 text-slate-800" />
                          </div>
                          <span className="mt-1.5 text-[10px] font-medium text-white">
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

          {/* About */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">About</h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {profile.bio || 'No bio provided yet.'}
            </p>
          </div>

          {/* Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Details</h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>Gender: <strong className="text-slate-900 font-medium">{genderLabel}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <HeartHandshake className="h-3.5 w-3.5 text-[#6d4aff]" />
                <span>Goal: <strong className="text-slate-900 font-medium">{profile.looking_for || 'Romantic Intent'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span>Status: <strong className="text-slate-900 font-medium">{profile.marital_status || 'Single'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Ruler className="h-3.5 w-3.5 text-slate-400" />
                <span>Height: <strong className="text-slate-900 font-medium">{profile.height || 'Unspecified'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Joined: <strong className="text-slate-900 font-medium">{new Date(profile.created_at).toLocaleDateString()}</strong></span>
              </div>
            </div>
          </div>

          {/* Guardian Shield Callout */}
          <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-800">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            <p className="leading-relaxed">
              <strong>Smart Guardian Active:</strong> Never send money, gift cards, or wire transfers to anyone online.
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}
