import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/discover', '/onboarding', '/sparks', '/messages', '/profile', '/chat', '/settings'];

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

  // --- ADMIN ROUTE GUARD ---
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  // --- LOGGED-OUT VISITORS ---
  if (!user) {
    // If hitting a protected route (/discover, /onboarding, etc.) while signed out:
    if (isProtectedRoute) {
      const dest = hasVisitedBefore ? '/login' : '/';
      return NextResponse.redirect(new URL(dest, request.url));
    }

    // If hitting root '/' while signed out:
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

    // If visiting /login or /signup directly, mark as returning visitor
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
  // Ensure returning cookie is set whenever a member is signed in
  if (!hasVisitedBefore) {
    response.cookies.set('ail_returning', '1', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }

  // If signed in and hitting '/', '/login', or '/signup', send to /discover
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
    '/admin/:path*',
  ],
};
