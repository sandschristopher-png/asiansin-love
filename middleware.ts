import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  // 1. Read session via request cookies
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

  // If not logged in, go to login
  if (!user) {
    console.log('[Middleware] No session detected, redirecting to /login');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Query is_admin using service role client to bypass RLS
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const { data: profile, error } = await adminClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  console.log(`[Middleware] User: ${user.email || user.id} | is_admin:`, profile?.is_admin, error ? `| Error: ${error.message}` : '');

  // If not an admin, redirect to hero/home page
  if (!profile?.is_admin) {
    console.log('[Middleware] Non-admin user blocked from /admin, redirecting to /');
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
