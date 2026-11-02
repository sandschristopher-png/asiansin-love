import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

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
          'We could not cancel your AIL+ subscription automatically, so your account was not deleted. ' +
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

  // Sign out user session
  await supabase.auth.signOut()

  return NextResponse.json({ success: true })
}
