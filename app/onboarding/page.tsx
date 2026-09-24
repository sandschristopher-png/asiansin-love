'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Camera, Loader2, Plane, Building2, Trees, Waves } from 'lucide-react'
import { SEA_COUNTRIES } from '@/utils/constants'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Form Fields
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [gender, setGender] = useState('female')
  const [lookingFor, setLookingFor] = useState('Men')
  const [relationshipGoal, setRelationshipGoal] = useState('Long-Term Relationship')
  const [lifestyle, setLifestyle] = useState('Metro / City')
  const [birthdate, setBirthdate] = useState('')
  const [country, setCountry] = useState('Philippines')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [agreed, setAgreed] = useState(false)

  // Expat Travel Radar Fields
  const [visitingCity, setVisitingCity] = useState('')
  const [visitingDates, setVisitingDates] = useState('')

  const isExpat = !SEA_COUNTRIES.includes(country as any)

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, birthdate, avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.display_name && profile?.birthdate && profile?.avatar_url) {
        router.push('/browse')
        return
      }

      if (profile?.avatar_url) {
        setAvatarPreview(profile.avatar_url)
      }

      setInitialLoading(false)
    }

    checkUser()
  }, [router, supabase])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!agreed) {
      setErrorMsg('You must certify that you are at least 18 years of age and agree to the terms.')
      return
    }

    if (!avatarFile && !avatarPreview) {
      setErrorMsg('Please upload a clear profile photo to continue.')
      return
    }

    if (bio.trim().length < 50) {
      setErrorMsg('Please write at least 50 characters in your bio introduction.')
      return
    }

    setLoading(true)

    try {
      let finalAvatarUrl = avatarPreview?.startsWith('http') ? avatarPreview : null

      if (avatarFile && userId) {
        const fileExt = avatarFile.name.split('.').pop() || 'jpg'
        const filePath = `${userId}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        finalAvatarUrl = publicUrl
      }

      if (!finalAvatarUrl) {
        throw new Error('Photo upload failed. Please try choosing the photo again.')
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          display_name: displayName.trim(),
          gender,
          looking_for: relationshipGoal,
          lifestyle,
          birthdate,
          country,
          home_country: isExpat ? country : null,
          is_sea_local: !isExpat,
          city: city.trim(),
          bio: bio.trim(),
          avatar_url: finalAvatarUrl,
          visiting_city: isExpat ? visitingCity.trim() || null : null,
          visiting_dates: isExpat ? visitingDates.trim() || null : null,
          updated_at: new Date().toISOString(),
        })

      if (updateError) throw updateError

      router.push('/browse')
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving your profile.')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-dvh bg-zinc-950 flex items-center justify-center text-xs text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin text-rose-500 mr-2" />
        <span>Loading setup...</span>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 flex flex-col justify-center items-center py-10 px-4 selection:bg-rose-500 selection:text-white">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white">Create Your Member Profile</h1>
          <p className="text-xs text-zinc-400">A community dedicated strictly to genuine relationships &amp; love</p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-md space-y-5 shadow-2xl">
          
          {/* Photo Section */}
          <div className="flex flex-col items-center justify-center space-y-2 pb-2 border-b border-zinc-800/60">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              className="hidden"
            />

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative h-24 w-24 rounded-2xl overflow-hidden border-2 border-dashed border-zinc-700 hover:border-rose-500 cursor-pointer bg-zinc-950 flex flex-col items-center justify-center group transition"
            >
              {avatarPreview ? (
                <>
                  <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-zinc-400 group-hover:text-rose-400 transition">
                  <Camera className="h-6 w-6 mb-1" />
                  <span className="text-[10px] font-medium">Add Photo</span>
                </div>
              )}
            </div>

            <div className="text-center">
              <span className="text-xs font-semibold text-zinc-300 block">Profile Photo *</span>
              <span className="text-[10px] text-zinc-500">Upload a clear photo of your face</span>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Display Name *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Maria, Somchai, David"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none transition"
            />
          </div>

          {/* Gender & Looking For */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                I Am A
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none transition"
              >
                <option value="female">Woman</option>
                <option value="male">Man</option>
                <option value="transgender">Trans Woman</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Looking For
              </label>
              <select
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none transition"
              >
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Everyone">Everyone</option>
              </select>
            </div>
          </div>

          {/* Lifestyle / Roots Pill Selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Lifestyle &amp; Upbringing
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLifestyle('Metro / City')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                  lifestyle === 'Metro / City'
                    ? 'border-rose-500/80 bg-rose-500/10 text-white shadow-xs'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Building2 className="h-4 w-4 mb-1 text-sky-400" />
                <span className="text-[11px] font-medium leading-none">Metro / City</span>
                <span className="text-[9px] text-zinc-500 mt-0.5">Urban career</span>
              </button>

              <button
                type="button"
                onClick={() => setLifestyle('Province / Rural')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                  lifestyle === 'Province / Rural'
                    ? 'border-rose-500/80 bg-rose-500/10 text-white shadow-xs'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Trees className="h-4 w-4 mb-1 text-emerald-400" />
                <span className="text-[11px] font-medium leading-none">Province</span>
                <span className="text-[9px] text-zinc-500 mt-0.5">Simple roots</span>
              </button>

              <button
                type="button"
                onClick={() => setLifestyle('Coastal / Island')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                  lifestyle === 'Coastal / Island'
                    ? 'border-rose-500/80 bg-rose-500/10 text-white shadow-xs'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Waves className="h-4 w-4 mb-1 text-amber-400" />
                <span className="text-[11px] font-medium leading-none">Coastal</span>
                <span className="text-[9px] text-zinc-500 mt-0.5">Island pace</span>
              </button>
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Relationship Goal
            </label>
            <select
              value={relationshipGoal}
              onChange={(e) => setRelationshipGoal(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none transition"
            >
              <option value="Long-Term Relationship">Long-Term Relationship</option>
              <option value="Dating with Intent">Dating with Intent</option>
              <option value="Marriage-Minded">Marriage-Minded</option>
            </select>
          </div>

          {/* Date of Birth */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Date of Birth *
              </label>
              <span className="text-[10px] text-rose-400 font-semibold tracking-wide">MUST BE 18+</span>
            </div>
            <input
              type="date"
              required
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none transition"
            />
          </div>

          {/* Country & City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none transition"
              >
                <optgroup label="Southeast Asia">
                  <option value="Philippines">Philippines</option>
                  <option value="Thailand">Thailand</option>
                  <option value="Vietnam">Vietnam</option>
                  <option value="Cambodia">Cambodia</option>
                  <option value="Laos">Laos</option>
                  <option value="Indonesia">Indonesia</option>
                  <option value="Malaysia">Malaysia</option>
                  <option value="Singapore">Singapore</option>
                </optgroup>
                <optgroup label="International / Expats">
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Other">Other</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                City / Area *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Makati, Cebu, Bangkok"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Conditional Expat Travel Radar */}
          {isExpat && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                <Plane className="h-3.5 w-3.5" />
                <span>Travel Radar (Optional)</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Visiting Southeast Asia soon? Add your destination and dates so locals know when you will be in town.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={visitingCity}
                  onChange={(e) => setVisitingCity(e.target.value)}
                  placeholder="Visiting city (e.g. Manila)"
                  className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={visitingDates}
                  onChange={(e) => setVisitingDates(e.target.value)}
                  placeholder="Dates (e.g. Nov 10 - 24)"
                  className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Bio */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                About Me *
              </label>
              <span className={`text-[10px] font-medium ${bio.length >= 50 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {bio.length}/50 min
              </span>
            </div>
            <textarea
              required
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your character, interests, and what you are seeking in a life partner..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 text-xs text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none transition resize-none"
            />
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-rose-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="agree" className="text-[11px] text-zinc-400 leading-snug cursor-pointer select-none">
              I certify that I am at least 18 years of age and agree to the{' '}
              <a href="/terms" target="_blank" className="text-zinc-200 underline hover:text-white">Terms of Service</a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" className="text-zinc-200 underline hover:text-white">Privacy Policy</a>.
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-rose-600 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Profile...</span>
              </>
            ) : (
              <span>Complete &amp; Continue</span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
