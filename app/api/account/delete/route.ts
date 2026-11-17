import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'


/** Storage folders keyed by the member id (photos, verification selfies, voice notes). */
const USER_FOLDER_BUCKETS = ['avatars', 'user_photos', 'verifications', 'voice-notes']

/**
 * Removes the member's files from storage. Best-effort: the account rows are already gone, so a
 * failure here is logged rather than reported to the member.
 */
async function purgeUserStorage(userId: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return
  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
  for (const bucket of USER_FOLDER_BUCKETS) {
    try {
      for (;;) {
        const { data: files } = await admin.storage.from(bucket).list(userId, { limit: 100 })
        if (!files || files.length === 0) break
        const { error } = await admin.storage.from(bucket).remove(files.map((f) => `${userId}/${f.name}`))
        if (error) throw error
        if (files.length < 100) break
      }
    } catch (err) {
      console.warn(`[account/delete] storage purge failed for ${bucket}:`, err)
    }
  }
  await admin.storage
    .from('voice-intros')
    .remove([`${userId}.webm`, `${userId}.m4a`])
    .catch((err) => console.warn('[account/delete] voice intro purge failed:', err))
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Billing: Plus is handled by hand while payments move to a new processor, so there is no
  // subscription to cancel here. When the new processor goes live, cancel its subscription for
  // this member before deleting (and refuse to delete if that fails, so nobody is billed after).


  // Call the secure deletion function
  const { error } = await supabase.rpc('delete_user_account')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await purgeUserStorage(user.id)

  // Sign out user session
  await supabase.auth.signOut()

  return NextResponse.json({ success: true })
}
