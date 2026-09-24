'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Camera, Trash2, Star, Check, AlertCircle, Bell } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Profile Form State
  const [displayName, setDisplayName] = useState('')
  const [gender, setGender] = useState('female')
  const [targetGender, setTargetGender] = useState('male')
  const [country, setCountry] = useState('Philippines')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('Single')
  const [height, setHeight] = useState('')

  // Travel Radar State
  const [visitingCity, setVisitingCity] = useState('')
  const [visitingDates, setVisitingDates] = useState('')

  // Email Notification Preferences
  const [notifyMessages, setNotifyMessages] = useState(true)
  const [notifySparks, setNotifySparks] = useState(true)
  const [notifyViews, setNotifyViews] = useState(false)

  // Photos State
  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setDisplayName(profile.display_name || '')
        setGender(profile.gender || 'female')
        setTargetGender(profile.target_gender || 'male')
        setCountry(profile.country || 'Philippines')
        setCity(profile.city || '')
        setBio(profile.bio || '')
        setMaritalStatus(profile.marital_status || 'Single')
        setHeight(profile.height || '')
        setVisitingCity(profile.visiting_city || '')
        setVisitingDates(profile.visiting_dates || '')

        // Email toggles
        setNotifyMessages(profile.email_notifications_messages ?? true)
        setNotifySparks(profile.email_notifications_sparks ?? true)
        setNotifyViews(profile.email_notifications_views ?? false)

        if (profile.photos && profile.photos.length > 0) {
          setPhotos(profile.photos)
        } else if (profile.avatar_url) {
          setPhotos([profile.avatar_url])
        }
      }

      setLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !userId) return
    if (photos.length >= 4) {
      setStatusMsg({ type: 'error', text: 'Standard accounts can hold up to 4 photos.' })
      return
    }

    const file = e.target.files[0]
    setUploadingPhoto(true)
    setStatusMsg(null)

    const fileExt = file.name.split('.').pop()
    const filePath = `${userId}/gallery-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file)

    if (uploadError) {
      setStatusMsg({ type: 'error', text: `Upload failed: ${uploadError.message}` })
      setUploadingPhoto(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    const updated = [...photos, urlData.publicUrl]
    setPhotos(updated)

    await supabase.from('profiles').update({
      photos: updated,
      avatar_url: updated[0] || null,
      updated_at: new Date().toISOString(),
    }).eq('id', userId)

    setUploadingPhoto(false)
  }

  const handleRemovePhoto = async (indexToRemove: number) => {
    if (!userId) return
    const updated = photos.filter((_, idx) => idx !== indexToRemove)
    setPhotos(updated)

    await supabase.from('profiles').update({
      photos: updated,
      avatar_url: updated[0] || null,
      updated_at: new Date().toISOString(),
    }).eq('id', userId)
  }

  const handleMakePrimary = async (index: number) => {
    if (!userId || index === 0) return
    const target = photos[index]
    const rest = photos.filter((_, idx) => idx !== index)
    const updated = [target, ...rest]
    setPhotos(updated)

    await supabase.from('profiles').update({
      photos: updated,
      avatar_url: updated[0],
      updated_at: new Date().toISOString(),
    }).eq('id', userId)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    if (bio.trim().length < 50) {
      setStatusMsg({ type: 'error', text: 'About Me must be at least 50 characters.' })
      return
    }

    setSaving(true)
    setStatusMsg(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        gender,
        target_gender: targetGender,
        country,
        city: city.trim(),
        bio: bio.trim(),
        marital_status: maritalStatus,
        height: height.trim(),
        visiting_city: visitingCity.trim(),
        visiting_dates: visitingDates.trim(),
        email_notifications_messages: notifyMessages,
        email_notifications_sparks: notifySparks,
        email_notifications_views: notifyViews,
        photos,
        avatar_url: photos[0] || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    setSaving(false)

    if (error) {
      setStatusMsg({ type: 'error', text: error.message })
    } else {
      setStatusMsg({ type: 'success', text: 'Profile updated successfully.' })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950 text-xs text-zinc-500 font-sans">
        Loading settings...
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 pb-16">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur flex items-center justify-between">
        <Link href="/browse" className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Browse</span>
        </Link>
        <span className="text-xs font-bold text-white">Profile Settings</span>
        <div className="w-12" />
      </header>

      <main className="mx-auto max-w-xl px-4 py-6">
        {statusMsg && (
          <div
            className={`mb-6 flex items-center gap-2 rounded-xl p-3 text-xs ${
              statusMsg.type === 'success'
                ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border border-rose-500/20 bg-rose-500/10 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Photo Manager */}
        <section className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Profile Photos</h2>
              <p className="text-xs text-zinc-400">Manage your gallery ({photos.length}/4 photos)</p>
            </div>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Free Tier</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {photos.map((url, idx) => (
              <div key={idx} className="relative aspect-[3/4] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 group">
                <img src={url} alt="" className="h-full w-full object-cover" />

                {idx === 0 ? (
                  <span className="absolute top-2 left-2 rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                    Primary
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleMakePrimary(idx)}
                    className="absolute top-2 left-2 rounded bg-black/60 p-1 text-[10px] text-zinc-300 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition"
                    title="Make Primary Photo"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRemovePhoto(idx)}
                  className="absolute top-2 right-2 rounded-full bg-black/70 p-1 text-zinc-300 hover:bg-rose-600 hover:text-white transition"
                  title="Remove Photo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {photos.length < 4 && (
              <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/60 hover:border-rose-500 hover:bg-zinc-800/60 transition">
                <Camera className="h-6 w-6 text-zinc-400" />
                <span className="mt-2 text-xs text-zinc-400 font-medium">
                  {uploadingPhoto ? 'Uploading...' : 'Add Photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingPhoto}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </section>

        {/* Profile Info Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-bold text-white mb-2">Member Details</h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-base sm:text-sm text-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">I Am A</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-base sm:text-sm text-white focus:border-rose-500 focus:outline-none"
              >
                <option value="female">Woman</option>
                <option value="trans">Trans Woman</option>
                <option value="male">Man</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Looking For</label>
              <select
                value={targetGender}
                onChange={(e) => setTargetGender(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-base sm:text-sm text-white focus:border-rose-500 focus:outline-none"
              >
                <option value="male">Men</option>
                <option value="female">Women</option>
                <option value="trans">Trans Women</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-base sm:text-sm text-white focus:border-rose-500 focus:outline-none"
              >
                <option value="Philippines">Philippines</option>
                <option value="Thailand">Thailand</option>
                <option value="Vietnam">Vietnam</option>
                <option value="Cambodia">Cambodia</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Cebu, Manila, Bangkok"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-base sm:text-sm text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Marital Status</label>
              <select
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-base sm:text-sm text-white focus:border-rose-500 focus:outline-none"
              >
                <option value="Single">Single</option>
                <option value="Never Married">Never Married</option>
                <option value="Separated">Separated</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Height</label>
              <input
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 5'4 (162 cm)"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-base sm:text-sm text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Travel Radar Section */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base">??</span>
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Travel Radar (Visiting Soon)
              </h3>
            </div>
            <p className="text-[11px] text-zinc-400">
              Visiting Southeast Asia soon? Add your destination and dates so locals know when you arrive.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Destination City</label>
                <input
                  type="text"
                  value={visitingCity}
                  onChange={(e) => setVisitingCity(e.target.value)}
                  placeholder="e.g. Manila, Bangkok, Cebu"
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-base sm:text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Dates / Month</label>
                <input
                  type="text"
                  value={visitingDates}
                  onChange={(e) => setVisitingDates(e.target.value)}
                  placeholder="e.g. Nov 12 - 28"
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-base sm:text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-rose-500" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Email Notification Alerts
              </h3>
            </div>
            <div className="space-y-2 pt-1 text-xs text-zinc-300">
              <label className="flex items-center justify-between cursor-pointer">
                <span>Direct Chat Messages</span>
                <input
                  type="checkbox"
                  checked={notifyMessages}
                  onChange={(e) => setNotifyMessages(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-rose-600 focus:ring-0"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span>Sparks Received (?)</span>
                <input
                  type="checkbox"
                  checked={notifySparks}
                  onChange={(e) => setNotifySparks(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-rose-600 focus:ring-0"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span>Profile Visitor Digest</span>
                <input
                  type="checkbox"
                  checked={notifyViews}
                  onChange={(e) => setNotifyViews(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-rose-600 focus:ring-0"
                />
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                About Me <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] ${bio.trim().length >= 50 ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                {bio.trim().length}/50 min
              </span>
            </div>
            <textarea
              rows={4}
              required
              minLength={50}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-base sm:text-sm text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
              placeholder="Tell others what you are looking for..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-rose-600 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </main>
    </div>
  )
}
