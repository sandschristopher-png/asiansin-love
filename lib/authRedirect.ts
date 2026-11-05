/**
 * Post-sign-in destination ("returnTo") helpers, shared by middleware, /auth/callback and the
 * auth screen. Pure (safe in middleware, route handlers and the browser).
 */

const AUTH_PATHS = ['/login', '/signup', '/auth', '/forgot-password', '/reset-password'];

/**
 * A same-site path to return to after signing in, or null. Rejects anything that could leave the
 * site (absolute URLs, protocol-relative //host, backslash tricks) and the auth pages themselves.
 */
export function safeReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (value.length > 512 || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  if (/[\u0000-\u001f]/.test(value)) return null;
  const path = value.split(/[?#]/)[0];
  if (AUTH_PATHS.some((p) => path === p || path.startsWith(p + '/'))) return null;
  return value;
}

/** "/login" or "/signup" with ?returnTo= kept when there is a safe one. */
export function authHref(page: '/login' | '/signup', returnTo: string | null | undefined): string {
  const safe = safeReturnTo(returnTo);
  return safe ? `${page}?returnTo=${encodeURIComponent(safe)}` : page;
}

/** Friendly copy for ?error= / ?error_description= values Supabase and OAuth providers send back. */
export function describeAuthError(code: string | null, description: string | null): string | null {
  if (!code && !description) return null;
  const text = (description || code || '').replace(/\+/g, ' ').trim();
  if (code === 'no_code_provided' || code === 'access_denied' || /denied|cancel/i.test(text)) {
    return 'Sign-in was cancelled. Please try again.';
  }
  if (/expired|invalid.*(link|code|token)|otp/i.test(text)) {
    return 'That sign-in link has expired or was already used. Please try again.';
  }
  if (/provider is not enabled|unsupported provider/i.test(text)) {
    return 'That sign-in option is not available right now. Please use another one.';
  }
  return text.length > 160 ? 'Sign-in failed. Please try again.' : text || 'Sign-in failed. Please try again.';
}
