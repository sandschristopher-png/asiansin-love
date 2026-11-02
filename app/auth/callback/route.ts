import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  // Same-site paths only (blocks open redirects such as ?next=//evil.example).
  const rawNext = requestUrl.searchParams.get('next') || '';
  const next = /^\/(?![/\\])/.test(rawNext) ? rawNext : '/discover';
  const isRecovery = next === '/reset-password';
  const oauthError = requestUrl.searchParams.get('error');
  const oauthErrorDesc = requestUrl.searchParams.get('error_description');

  if (oauthError || oauthErrorDesc) {
    console.error('OAuth provider error:', oauthError, oauthErrorDesc);
    // Expired / already-used recovery links come back as ?error=access_denied&error_code=otp_expired.
    if (isRecovery) {
      return NextResponse.redirect(`${origin}/login?notice=reset_expired`);
    }
    const reason = encodeURIComponent(oauthErrorDesc || oauthError || 'oauth_error');
    return NextResponse.redirect(`${origin}/login?error=${reason}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      let destination = next;
      const { data: { user } } = await supabase.auth.getUser();
      // Password recovery always lands on /reset-password, even mid-onboarding.
      if (user && !isRecovery) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile || !profile.onboarding_completed) {
          destination = '/onboarding';
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${destination}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${destination}`);
      } else {
        return NextResponse.redirect(`${origin}${destination}`);
      }
    } else {
      console.error('exchangeCodeForSession error:', error.message);
      if (isRecovery) {
        return NextResponse.redirect(`${origin}/login?notice=reset_expired`);
      }
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  if (isRecovery) {
    return NextResponse.redirect(`${origin}/login?notice=reset_expired`);
  }
  return NextResponse.redirect(`${origin}/login?error=no_code_provided`);
}