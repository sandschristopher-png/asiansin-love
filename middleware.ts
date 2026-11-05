import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { adminRoleOf, isStaff } from '@/lib/adminRoles';
import { safeReturnTo } from '@/lib/authRedirect';

const PROTECTED_PREFIXES = [
  '/discover', '/sparks', '/messages', '/profile', '/chat', '/settings',
  '/favorites', '/notifications', '/announcements', '/verify', '/admin',
];

/** Signed-out request for a protected page -> /login?returnTo=<that page>. */
function loginRedirect(request: NextRequest) {
  const url = new URL('/login', request.url);
  const back = safeReturnTo(request.nextUrl.pathname + request.nextUrl.search);
  if (back) url.searchParams.set('returnTo', back);
  return NextResponse.redirect(url);
}

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
  // Signed out -> /login?returnTo=/admin; signed in without a staff role (or banned) -> /discover.
  // app/admin/layout.tsx re-checks the role server-side and every /api/admin/* route re-checks
  // with verifyAdminCaller(), so this is the first of three gates, not the only one.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!user) return loginRedirect(request);
    if (!supabaseServiceKey) return NextResponse.redirect(new URL('/discover', request.url));
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
    const { data: me } = await adminClient.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (!isStaff(adminRoleOf(me)) || me?.is_banned === true) {
      return NextResponse.redirect(new URL('/discover', request.url));
    }
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
    // Protected route while signed out: sign in first, then come straight back.
    if (isProtectedRoute) {
      return loginRedirect(request);
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

  // Signed in and hitting '/', '/login', or '/signup': unfinished members to /onboarding,
  // everyone else to their returnTo page or /discover.
  if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
    const dest = (await isOnboarded(user.id))
      ? safeReturnTo(request.nextUrl.searchParams.get('returnTo')) || '/discover'
      : '/onboarding';
    const redirect = NextResponse.redirect(new URL(dest, request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
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