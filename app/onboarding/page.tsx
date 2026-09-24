'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { AlertCircle, ShieldAlert } from 'lucide-react'

export default function OnboardingPage() {
  const supabase = createClient()
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [gender, setGender] = useState('female')
  const [targetGender, setTargetGender] = useState('male')
  const [birthdate, setBirthdate] = useState('')
  const [country, setCountry] = useState('Philippines')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Calculate the maximum selectable birthdate (exactly 18 years ago today)
  const maxBirthdate = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 18)
    return d.toISOString().split('T')[0]
  })()

  const validateAge = (selectedDate: string): boolean => {
    if (!selectedDate) return false
    const birth = new Date(selectedDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age >= 18
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    // Strict 18+ Age Validation
    if (!validateAge(birthdate)) {
      setErrorMsg('You must be at least 18 years of age to register on asiansin.love.')
      return
    }

    if (!agreedToTerms) {
      setErrorMsg('You must agree to the Terms of Service and Privacy Policy to continue.')
      return
    }

    if (bio.trim().length < 50) {
      setErrorMsg('About Me bio must be at least 50 characters.')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: displayName.trim(),
        gender,
        target_gender: targetGender,
        birthdate,
        country,
        city: city.trim(),
        bio: bio.trim(),
        updated_at: new Date().toISOString(),
      })

    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
    } else {
      router.push('/settings')
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <Logo className="h-9 w-9" textSize="text-2xl" />
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-white">
          Create Your Member Profile
        </h2>
        <p className="mt-1 text-center text-xs text-zinc-400">
          Complete your details to access the member directory
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="border border-zinc-800 bg-zinc-900/50 p-6 sm:rounded-3xl shadow-xl backdrop-blur">
          {errorMsg && (
            <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Maria, Chris"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-base sm:text-sm text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  I Am A
                </label>
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Looking For
                </label>
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

            {/* Strict 18+ Date of Birth Input */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">
                  Must be 18+
                </span>
              </div>
              <input
                type="date"
                required
                max={maxBirthdate}
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-base sm:text-sm text-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Country
                </label>
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Cebu, Manila, Bangkok"
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-base sm:text-sm text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
                />
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
                rows={3}
                required
                minLength={50}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-base sm:text-sm text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
                placeholder="Share a brief introduction about who you are and what you are looking for..."
              />
            </div>

            {/* Legal Certification Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-400 leading-relaxed">
                <input
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-rose-600 focus:ring-0"
                />
                <span>
                  I certify that I am at least 18 years of age and agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-zinc-200 underline hover:text-white">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" target="_blank" className="text-zinc-200 underline hover:text-white">
                    Privacy Policy
                  </Link>.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-rose-600 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 disabled:opacity-50 transition shadow"
            >
              {loading ? 'Creating Profile...' : 'Complete & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
