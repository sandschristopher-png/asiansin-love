'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, MessageSquare, ShieldAlert, Loader2, Check } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface ProfileActionsProps {
  targetUserId: string
  targetUserName: string
  currentUserId: string | null
  isOwner: boolean
}

export function ProfileActions({ targetUserId, targetUserName, currentUserId, isOwner }: ProfileActionsProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loadingSpark, setLoadingSpark] = useState(false)
  const [sparkSent, setSparkSent] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('crypto_scam')
  const [reportDetails, setReportDetails] = useState('')
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [reporting, setReporting] = useState(false)

  const handleSpark = async () => {
    if (!currentUserId) {
      router.push('/login?mode=signup')
      return
    }

    setLoadingSpark(true)
    const { error } = await supabase
      .from('sparks')
      .upsert({
        sender_id: currentUserId,
        receiver_id: targetUserId,
        status: 'pending',
      }, { onConflict: 'sender_id,receiver_id' })

    setLoadingSpark(false)
    if (!error) {
      setSparkSent(true)
    }
  }

  const handleMessage = () => {
    if (!currentUserId) {
      router.push('/login?mode=signup')
      return
    }
    router.push(`/messages?user=${targetUserId}`)
  }

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId) return
    setReporting(true)

    await supabase.from('reports').insert({
      reporter_id: currentUserId,
      reported_id: targetUserId,
      reason: reportReason,
      details: reportDetails.trim(),
    })

    setReporting(false)
    setReportSubmitted(true)
    setTimeout(() => {
      setShowReport(false)
      setReportSubmitted(false)
    }, 2000)
  }

  if (isOwner) {
    return (
      <div className="pt-2">
        <button
          onClick={() => router.push('/onboarding')}
          className="w-full rounded-xl border border-stone-300 bg-stone-100 py-2.5 text-xs font-bold text-stone-800 hover:bg-stone-200 transition"
        >
          Edit My Profile
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleSpark}
          disabled={loadingSpark || sparkSent}
          className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-xs font-bold text-white hover:bg-rose-500 transition shadow-xs disabled:opacity-75"
        >
          {loadingSpark ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : sparkSent ? (
            <>
              <Check className="h-4 w-4" />
              <span>Spark Sent</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Send Spark</span>
            </>
          )}
        </button>

        <button
          onClick={handleMessage}
          className="flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white py-3 text-xs font-bold text-stone-800 hover:bg-stone-50 transition shadow-2xs"
        >
          <MessageSquare className="h-4 w-4 text-stone-600" />
          <span>Message</span>
        </button>
      </div>

      <div className="flex justify-center pt-2">
        <button
          onClick={() => setShowReport(true)}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-400 hover:text-rose-600 transition"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Report Profile to Guardian Shield</span>
        </button>
      </div>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-sm font-bold text-stone-900">Report {targetUserName}</h3>
            </div>

            {reportSubmitted ? (
              <div className="rounded-xl bg-emerald-50 p-4 text-center text-xs text-emerald-800">
                Report logged. Our Smart Guardian safety queue has flagged this account for immediate review.
              </div>
            ) : (
              <form onSubmit={submitReport} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-[#fafaf9] px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-rose-500"
                  >
                    <option value="crypto_scam">Cryptocurrency / Investment Pitch</option>
                    <option value="money_solicitation">Asking for Emergency Wire / Money</option>
                    <option value="fake_photos">Catfish / Stolen Photos</option>
                    <option value="harassment">Inappropriate or Harassing Conduct</option>
                    <option value="other">Other Suspicious Activity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">Details (Optional)</label>
                  <textarea
                    rows={2}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide context or handles mentioned..."
                    className="w-full rounded-xl border border-stone-300 bg-[#fafaf9] p-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReport(false)}
                    className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reporting}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition disabled:opacity-50"
                  >
                    {reporting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}