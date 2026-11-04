import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const LIVE_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid'])

/**
 * Cancels every live Stripe subscription that belongs to this user so a deleted
 * account can never be billed again. Throws if a subscription could not be cancelled.
 */
async function cancelUserSubscriptions(userId: string, email: string | undefined) {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return // Stripe not configured (e.g. local dev): nothing to cancel

  const stripe = new Stripe(secret)
  const toCancel = new Map<string, Stripe.Subscription>()

  // 1) Subscriptions created by our checkout carry metadata.userId
  try {
    const found = await stripe.subscriptions.search({
      query: `metadata['userId']:'${userId}'`,
      limit: 100,
    })
    for (const sub of found.data) if (LIVE_STATUSES.has(sub.status)) toCancel.set(sub.id, sub)
  } catch (err) {
    console.warn('[account/delete] subscription search failed, falling back to email lookup:', err)
  }

  // 2) Fallback for older subscriptions without metadata: customers with the account email
  if (email) {
    const customers = await stripe.customers.list({ email, limit: 10 })
    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 100 })
      for (const sub of subs.data) {
        const owner = (sub.metadata as Record<string, string> | undefined)?.userId
        if (LIVE_STATUSES.has(sub.status) && (!owner || owner === userId)) toCancel.set(sub.id, sub)
      }
    }
  }

  for (const sub of toCancel.values()) {
    await stripe.subscriptions.cancel(sub.id)
  }
}

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

  // Stop billing first. If this fails we do NOT delete, so nobody keeps paying for a deleted account.
  try {
    await cancelUserSubscriptions(user.id, user.email ?? undefined)
  } catch (err) {
    console.error('[account/delete] could not cancel subscription:', err)
    return NextResponse.json(
      {
        error:
          'We could not cancel your Plus subscription automatically, so your account was not deleted. ' +
          'Please try again in a minute, or cancel in Manage Billing first.',
      },
      { status: 502 }
    )
  }

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
