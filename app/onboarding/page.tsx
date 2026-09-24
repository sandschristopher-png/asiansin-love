'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Camera, Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [targetGender, setTargetGender] = useState<'male' | 'female'>('female')
  const [birthdate, setBirthdate] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUserId(user.id)
      }
    }
    checkUser()
  }, [router, supabase])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setLoading(true)
    setErrorMsg(null)

    let avatarUrl = ''

    // 1. Upload photo to Supabase Storage if present
    if (file) {
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file)

      if (uploadError) {
        setErrorMsg(`Photo upload failed: ${uploadError.message}`)
        setLoading(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath)

      avatarUrl = publicUrlData.publicUrl
    }

    // 2. Insert profile record into public.profiles
    const { error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        display_name: displayName,
        gender,
        target_gender: targetGender,
        birthdate,
        country,
        city,
        bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })

    if (insertError) {
      setErrorMsg(insertError.message)
      setLoading(false)
      return
    }

    router.push('/browse')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-2xl font-bold tracking-tight text-white">Create Your Profile</h1>
        <p className="mt-1 text-sm text-zinc-400">Tell us about yourself to match with members.</p>

        {errorMsg && (
          <div className="mt-4 rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center">
            <label className="relative flex h-24 w-24 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-zinc-700 bg-zinc-800 hover:border-rose-500">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-7 w-7 text-zinc-400" />
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            <span className="mt-2 text-xs text-zinc-400">Upload profile photo</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
              placeholder="Your name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">I Am</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
              >
                <option value="male">Man</option>
                <option value="female">Woman</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Seeking</label>
              <select
                value={targetGender}
                onChange={(e) => setTargetGender(e.target.value as 'male' | 'female')}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
              >
                <option value="female">Woman</option>
                <option value="male">Man</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Birthdate</label>
            <input
              type="date"
              required
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Country</label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
                placeholder="e.g. United States, Japan"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
                placeholder="e.g. Las Vegas, Tokyo"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">About Me</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
              placeholder="Tell others what you are looking for..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}