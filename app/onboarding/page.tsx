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
  const [gender, setGender] = useState<'male' | 'female' | 'trans'>('male')
  const [targetGender, setTargetGender] = useState<'male' | 'female' | 'trans'>('female')
  const [birthdate, setBirthdate] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
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
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 4 - files.length)
      const combinedFiles = [...files, ...newFiles].slice(0, 4)
      setFiles(combinedFiles)
      setPreviewUrls(combinedFiles.map((file) => URL.createObjectURL(file)))
    }
  }

  const handleRemovePhoto = (indexToRemove: number) => {
    const nextFiles = files.filter((_, idx) => idx !== indexToRemove)
    setFiles(nextFiles)
    setPreviewUrls(nextFiles.map((file) => URL.createObjectURL(file)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    // Mandatory About Me character minimum check
    if (bio.trim().length < 50) {
      setErrorMsg('About Me must be at least 50 characters. Tell members a little about yourself.')
      return
    }

    if (files.length === 0) {
      setErrorMsg('Please upload at least one photo for your profile.')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    const uploadedUrls: string[] = []

    // Upload up to 4 photos
    for (let i = 0; i < files.length; i++) {
      const currentFile = files[i]
      const fileExt = currentFile.name.split('.').pop()
      const filePath = `${userId}/photo-${Date.now()}-${i}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, currentFile)

      if (uploadError) {
        setErrorMsg(`Photo upload failed: ${uploadError.message}`)
        setLoading(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath)

      uploadedUrls.push(publicUrlData.publicUrl)
    }

    const primaryAvatar = uploadedUrls[0] || ''

    // Upsert profile record
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
        bio: bio.trim(),
        avatar_url: primaryAvatar,
        photos: uploadedUrls,
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
          {/* Photo Gallery Upload (Up to 4) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Profile Photos ({previewUrls.length}/4)
              </label>
              <span className="text-[11px] text-zinc-500">Min 1, Max 4</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-[10px] text-white hover:bg-rose-600"
                  >
                    ✕
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-rose-600 px-1 text-[9px] font-bold text-white uppercase">
                      Primary
                    </span>
                  )}
                </div>
              ))}

              {previewUrls.length < 4 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-850 hover:border-rose-500 transition">
                  <Camera className="h-5 w-5 text-zinc-400" />
                  <span className="mt-1 text-[10px] text-zinc-400">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
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
                onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'trans')}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
              >
                <option value="male">Man</option>
                <option value="female">Woman</option>
                <option value="trans">Trans Woman</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Seeking</label>
              <select
                value={targetGender}
                onChange={(e) => setTargetGender(e.target.value as 'male' | 'female' | 'trans')}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
              >
                <option value="female">Woman</option>
                <option value="trans">Trans Woman</option>
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
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                About Me <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] ${bio.trim().length >= 50 ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                {bio.trim().length}/50 min chars
              </span>
            </div>
            <textarea
              rows={4}
              required
              minLength={50}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
              placeholder="Introduce yourself, what you do, and what you are looking for in a match (min 50 characters)..."
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