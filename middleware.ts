import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/discover', '/sparks', '/messages', '/profile', '/chat', '/settings',
  '/favorites', '/notifications', '/announcements', '/verify',
];

/** Value = the member's id once profiles.onboarding_completed is confirmed true. */
const ONBOARDED_COOKIE = 'ail_onb';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const hasVisitedBefore = request.cookies.get('ail_returning')?.value === '1';

  // --- ADMIN ROUTES ---
  // No redirect here (a redirect to /login or away would reveal that /admin exists).
  // app/admin/layout.tsx checks the staff role server-side and renders a plain 404 otherwise;
  // every /api/admin/* route re-checks with verifyAdminCaller().
  if (pathname.startsWith('/admin')) {
    return response;
  }

  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );
  const isOnboarding = pathname.startsWith('/onboarding');

  // --- ONBOARDING GUARD ---
  // Signed-in members who haven't finished onboarding are kept on /onboarding; finished members
  // never see it again. onboarding_completed never flips back, so once confirmed it is cached in
  // a per-user cookie and the profile lookup is skipped on later requests.
  if (user && (isProtectedRoute || isOnboarding)) {
    let onboarded = request.cookies.get(ONBOARDED_COOKIE)?.value === user.id;
    if (!onboarded && supabaseServiceKey) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      const { data: profile, error } = await adminClient
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();
      // A failed lookup must not trap anyone: treat as onboarded and check again next request.
      onboarded = error ? true : Boolean(profile?.onboarding_completed);
      if (!error && onboarded) {
        response.cookies.set(ONBOARDED_COOKIE, user.id, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 30,
        });
      }
    }

    if (isOnboarding && onboarded) {
      const redirect = NextResponse.redirect(new URL('/discover', request.url));
      redirect.cookies.set(ONBOARDED_COOKIE, user.id, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
      return redirect;
    }
    if (isProtectedRoute && !onboarded) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // Onboarding itself is open to signed-out visitors and unfinished members.
  if (isOnboarding) {
    return response;
  }

  // --- LOGGED-OUT VISITORS ---
  if (!user) {
    // Protected route while signed out: returning visitors to login, first-timers to onboarding
    if (isProtectedRoute) {
      const dest = hasVisitedBefore ? '/login' : '/onboarding';
      return NextResponse.redirect(new URL(dest, request.url));
    }

    // Root '/' while signed out
    if (pathname === '/') {
      if (hasVisitedBefore) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      // First-time visitor: show HeroLanding at '/' and mark cookie for next visit
      response.cookies.set('ail_returning', '1', {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
      return response;
    }

    // Visiting /login or /signup directly: mark as returning visitor
    if (pathname === '/login' || pathname === '/signup') {
      if (!hasVisitedBefore) {
        response.cookies.set('ail_returning', '1', {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          sameSite: 'lax',
        });
      }
      return response;
    }

    return response;
  }

  // --- LOGGED-IN MEMBERS ---
  if (!hasVisitedBefore) {
    response.cookies.set('ail_returning', '1', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }

  // Signed in and hitting '/', '/login', or '/signup': send to /discover
  if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
    return NextResponse.redirect(new URL('/discover', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/discover/:path*',
    '/onboarding/:path*',
    '/sparks/:path*',
    '/messages/:path*',
    '/profile/:path*',
    '/chat/:path*',
    '/settings/:path*',
    '/favorites/:path*',
    '/notifications/:path*',
    '/announcements/:path*',
    '/verify/:path*',
    '/admin/:path*',
  ],
};