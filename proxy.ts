import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { safeReturnTo } from '@/lib/authRedirect';

const PROTECTED_PREFIXES = [
  '/discover', '/sparks', '/messages', '/profile', '/chat', '/settings',
  '/favorites', '/notifications', '/announcements', '/verify', '/moments',
];

/** Signed-out request for a protected page -> /login?returnTo=<that page>. */
function loginUrl(request: NextRequest): URL {
  const url = new URL('/login', request.url);
  const back = safeReturnTo(request.nextUrl.pathname + request.nextUrl.search);
  if (back) url.searchParams.set('returnTo', back);
  return url;
}

/** Value = the member's id once profiles.onboarding_completed is confirmed true. */
const ONBOARDED_COOKIE = 'ail_onb';

export async function proxy(request: NextRequest) {
  // Showcase screenshots (scripts/capture-showcase.ts): on a development server only, a request that carries this cookie skips the
  // sign-in redirects so the real pages can be captured with mocked data. It opens no data: the APIs and the database still
  // answer only to real sessions, and a production build ignores the cookie entirely.
  if (process.env.NODE_ENV === 'development' && request.cookies.get('ail_showcase')?.value === '1') {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  /**
   * A redirect that carries any session cookies Supabase refreshed during this request. A bare redirect would drop
   * them, and the rotated refresh token would be lost on the very next page.
   */
  const redirectTo = (dest: URL | string) => {
    const redirect = NextResponse.redirect(dest instanceof URL ? dest : new URL(dest, request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

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
  // Stealth: no redirect here (a redirect to /login or away would reveal that /admin exists).
  // app/admin/layout.tsx checks the staff role server-side and renders the ordinary 404 for
  // signed-out visitors and non-staff alike; every /api/admin/* route re-checks with
  // verifyAdminCaller().
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
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
  const isOnboarded = async (uid: string): Promise<boolean> => {
    if (request.cookies.get(ONBOARDED_COOKIE)?.value === uid || !supabaseServiceKey) return true;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
    const { data: profile, error } = await adminClient
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', uid)
      .maybeSingle();
    // A failed lookup must not trap anyone: treat as onboarded and check again next request.
    const done = error ? true : Boolean(profile?.onboarding_completed);
    if (!error && done) {
      response.cookies.set(ONBOARDED_COOKIE, uid, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return done;
  };

  if (user && (isProtectedRoute || isOnboarding)) {
    const onboarded = await isOnboarded(user.id);

    if (isOnboarding && onboarded) {
      const redirect = redirectTo('/discover');
      redirect.cookies.set(ONBOARDED_COOKIE, user.id, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
      return redirect;
    }
    if (isProtectedRoute && !onboarded) {
      return redirectTo('/onboarding');
    }
  }

  // Onboarding itself is open to signed-out visitors and unfinished members.
  if (isOnboarding) {
    return response;
  }

  // --- LOGGED-OUT VISITORS ---
  if (!user) {
    // Protected route while signed out: sign in first, then come straight back.
    if (isProtectedRoute) {
      return redirectTo(loginUrl(request));
    }

    // Root '/' while signed out
    if (pathname === '/') {
      if (hasVisitedBefore) {
        return redirectTo('/login');
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

  // Signed in and hitting '/', '/login', or '/signup': unfinished members to /onboarding,
  // everyone else to their returnTo page or /discover.
  if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
    const dest = (await isOnboarded(user.id))
      ? safeReturnTo(request.nextUrl.searchParams.get('returnTo')) || '/discover'
      : '/onboarding';
    return redirectTo(dest);
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
    '/moments/:path*',
    '/notifications/:path*',
    '/announcements/:path*',
    '/verify/:path*',
    '/admin/:path*',
  ],
};