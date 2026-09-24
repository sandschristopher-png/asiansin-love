import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if user already completed profile
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, bio')
          .eq('id', user.id)
          .maybeSingle()

        // If they already have an existing profile, send to /browse
        if (profile?.bio) {
          return NextResponse.redirect(`${origin}/browse`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to login with error if failed
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
