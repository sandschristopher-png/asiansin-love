'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ArrowLeft, Camera, BadgeCheck, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'

export default function VerifyPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile) {
      setErrorMsg('Please select or capture a gesture verification photo.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be signed in to submit verification.')

      const fileExt = imageFile.name.split('.').pop() || 'jpg'
      const filePath = `verifications/${user.id}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, imageFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: insertError } = await supabase
        .from('verification_requests')
        .upsert({
          user_id: user.id,
          pose_image_url: publicUrl,
          status: 'pending',
        }, { onConflict: 'user_id' })

      if (insertError) throw insertError

      setSubmitted(true)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit verification.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-[#fafaf9] font-sans text-stone-900 selection:bg-rose-500 selection:text-white pb-20">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#fafaf9]/85 px-4 py-3 backdrop-blur-md flex items-center justify-between">
        <Link href="/browse" className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Browse</span>
        </Link>
        <Link href="/" className="hover:opacity-90 transition">
          <Logo className="h-6 w-6" textSize="text-base" />
        </Link>
        <div className="w-12" />
      </header>

      <main className="mx-auto max-w-md px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
            <BadgeCheck className="h-4 w-4" />
            <span>Pose Verification</span>
          </div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight">Earn Your Verified Badge</h1>
          <p className="text-xs text-stone-600 leading-relaxed max-w-xs mx-auto">
            Proving you are the real person in your photos increases your sparks by over 300% and protects the community.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 text-center">
            {errorMsg}
          </div>
        )}

        {submitted ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center space-y-4 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-sm font-bold text-stone-900">Pose Verification Received!</h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              Our review queue will verify your pose within 1-2 hours. Once approved, the verified badge will appear on your profile card automatically.
            </p>
            <Link
              href="/browse"
              className="inline-block rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-500 transition"
            >
              Return to Directory
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5 shadow-sm">
            {/* Gesture Instruction */}
            <div className="rounded-xl border border-stone-200 bg-[#fafaf9] p-4 text-xs space-y-2">
              <span className="font-bold uppercase tracking-wider text-rose-600 text-[10px] block">Current Required Pose</span>
              <p className="font-medium text-stone-800">
                Hold up <strong>three fingers (👌 or 3 fingers)</strong> right next to your cheek and snap a clear selfie.
              </p>
            </div>

            {/* Image Selector */}
            <div className="flex flex-col items-center justify-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/*"
                capture="user"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative aspect-square w-48 rounded-2xl overflow-hidden border-2 border-dashed border-stone-300 hover:border-rose-500 cursor-pointer bg-stone-50 flex flex-col items-center justify-center group transition"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Verification Selfie" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-stone-400 group-hover:text-rose-600 transition p-4 text-center">
                    <Camera className="h-8 w-8 mb-2" />
                    <span className="text-xs font-bold">Tap to Take Selfie</span>
                    <span className="text-[10px] text-stone-400 mt-1">Make sure lighting is bright</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !imageFile}
              className="w-full rounded-xl bg-rose-600 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              <span>Submit for Verification</span>
            </button>
          </form>
        )}
      </main>
    </div>
  )
}