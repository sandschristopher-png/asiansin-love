import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { ArrowLeft, MapPin, BadgeCheck, Plane, Heart, MessageSquare, ShieldAlert, Sparkles } from 'lucide-react'
import { SEA_COUNTRIES } from '@/utils/constants'
import { ProfileActions } from './ProfileActions'

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function ProfileDetailPage({ params }: ProfilePageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!profile) {
    notFound()
  }

  const isOwner = user?.id === profile.id
  const isForeignVisitor = profile.visiting_city && !SEA_COUNTRIES.includes(profile.country)

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return null
    const birth = new Date(birthdate)
    const diff = Date.now() - birth.getTime()
    return Math.abs(new Date(diff).getUTCFullYear() - 1970)
  }

  const age = calculateAge(profile.birthdate)

  return (
    <div className="min-h-dvh bg-[#fafaf9] font-sans text-stone-900 selection:bg-rose-500 selection:text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#fafaf9]/85 px-4 sm:px-6 py-3 backdrop-blur-md flex items-center justify-between">
        <Link href="/browse" className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Browse</span>
        </Link>
        <Link href="/" className="hover:opacity-90 transition">
          <Logo className="h-6 w-6" textSize="text-base sm:text-lg" />
        </Link>
        <div className="w-12" />
      </header>

      <main className="mx-auto max-w-xl px-4 pt-6 space-y-6">
        {/* Profile Visual Card */}
        <div className="rounded-3xl border border-stone-200 bg-white overflow-hidden shadow-sm">
          {/* Main Photo */}
          <div className="relative aspect-[4/5] w-full bg-stone-100">
            <img
              src={profile.avatar_url || '/placeholder.png'}
              alt={profile.display_name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />

            {/* Travel Radar Badge */}
            {isForeignVisitor && (
              <div className="absolute top-4 left-4 rounded-lg border border-amber-300/40 bg-black/60 px-2.5 py-1 text-xs font-semibold text-amber-200 backdrop-blur-md flex items-center gap-1.5">
                <Plane className="h-3.5 w-3.5" />
                <span>Visiting {profile.visiting_city} {profile.visiting_dates ? `(${profile.visiting_dates})` : ''}</span>
              </div>
            )}

            {/* Identity Banner */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">
                  {profile.display_name}{age ? `, ${age}` : ''}
                </h1>
                {profile.is_verified && (
                  <BadgeCheck className="h-5 w-5 text-sky-400 fill-sky-400/20 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-stone-200 mt-1">
                <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                <span>{profile.city ? `${profile.city}, ` : ''}{profile.country}</span>
              </div>
            </div>
          </div>

          {/* Body Information */}
          <div className="p-6 space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-stone-200 bg-[#fafaf9] p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Looking For</span>
                <span className="font-semibold text-stone-800">{profile.looking_for || 'Meaningful Relationship'}</span>
              </div>
              <div className="rounded-xl border border-stone-200 bg-[#fafaf9] p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Status</span>
                <span className="font-semibold text-stone-800">{profile.is_sea_local ? 'Southeast Asia Resident' : 'International Member'}</span>
              </div>
            </div>

            {/* Bio Section */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">About Me</h2>
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                {profile.bio || 'No bio written yet.'}
              </p>
            </div>

            {/* Interactive Actions (Spark, Message, Report) */}
            <ProfileActions
              targetUserId={profile.id}
              targetUserName={profile.display_name}
              currentUserId={user?.id || null}
              isOwner={isOwner}
            />
          </div>
        </div>
      </main>
    </div>
  )
}