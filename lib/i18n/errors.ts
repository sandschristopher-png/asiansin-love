import type { TKey } from '@/lib/i18n';
import { FREE_DAILY_SPARKS } from '@/lib/plusPlans';

/**
 * Client-side error mapper. The server, Supabase and the browser report problems in English
 * (a `code`, an HTTP status, or a message); this turns any of them into a key under `errors.*`
 * so toasts and inline errors read in the member's language. Order of trust: a known `code`,
 * then the HTTP `status`, then a pattern in the message. Anything unrecognised becomes the
 * caller's fallback (default: a generic line), never raw English or a stack message.
 *
 *   const t = useLocale().t;
 *   setError(localizeError({ status: res.status, code: data.code, message: data.error }, t));
 */
export type ErrorKey = Extract<TKey, `errors.${string}`>;

export interface ErrorInfo {
  /** App code (QUOTA_EXCEEDED...), Supabase auth code (invalid_credentials...) or a Postgres code (23505). */
  code?: string | number | null;
  /** HTTP status of the response, when there is one. */
  status?: number | null;
  /** Free-text message, matched only against the patterns below. */
  message?: string | null;
  /** Error name, for example AbortError. */
  name?: string | null;
}

export type ErrorInput = ErrorInfo | Error | string | null | undefined;

type Translate = (key: TKey, vars?: Record<string, string | number>) => string;

const BY_CODE: Record<string, ErrorKey> = {
  // Server actions and API routes (actions/*.ts, app/api/**)
  QUOTA_EXCEEDED: 'errors.quota',
  UNAUTHORIZED: 'errors.session',
  SUBSCRIPTION_REQUIRED: 'errors.plusRequired',
  INVALID_INPUT: 'errors.invalidInput',
  INVALID_DATES: 'errors.invalidDates',
  LIMIT_REACHED: 'errors.limitReached',
  NOT_FOUND: 'errors.notFound',
  DB_ERROR: 'errors.generic',
  RATE_LIMITED: 'errors.rateLimit',
  FILE_TOO_LARGE: 'errors.fileTooLarge',
  UNSUPPORTED_FILE_TYPE: 'errors.fileType',
  // Supabase auth
  invalid_credentials: 'errors.badCredentials',
  over_request_rate_limit: 'errors.rateLimit',
  over_email_send_rate_limit: 'errors.rateLimit',
  over_sms_send_rate_limit: 'errors.rateLimit',
  session_not_found: 'errors.session',
  session_expired: 'errors.session',
  refresh_token_not_found: 'errors.session',
  refresh_token_already_used: 'errors.session',
  bad_jwt: 'errors.session',
  user_already_exists: 'errors.duplicate',
  email_exists: 'errors.duplicate',
  // Postgres / PostgREST
  '23505': 'errors.duplicate',
  '42501': 'errors.permission',
  PGRST301: 'errors.session',
  PGRST303: 'errors.session',
};

const BY_MESSAGE: [RegExp, ErrorKey][] = [
  [/invalid login credentials/i, 'errors.badCredentials'],
  [/rate limit|security purposes|too many (requests|attempts)/i, 'errors.rateLimit'],
  [/failed to fetch|networkerror|network request failed|load failed|fetch failed|network error|could not reach/i, 'errors.network'],
  [/jwt expired|not authenticated|auth session missing|refresh token|session (has )?(ended|expired)/i, 'errors.session'],
  [/duplicate key|already exists|already registered/i, 'errors.duplicate'],
  [/row-level security|permission denied|not allowed/i, 'errors.permission'],
  [/payload too large|file (is )?too large|exceeds the (maximum )?size/i, 'errors.fileTooLarge'],
  [/timed out|timeout|took too long|aborted/i, 'errors.timeout'],
];

function statusKey(status: number): ErrorKey | null {
  if (status === 401) return 'errors.session';
  if (status === 403) return 'errors.permission';
  if (status === 404) return 'errors.notFound';
  if (status === 408 || status === 504) return 'errors.timeout';
  if (status === 413) return 'errors.fileTooLarge';
  if (status === 415) return 'errors.fileType';
  if (status === 429) return 'errors.rateLimit';
  if (status >= 500) return 'errors.generic';
  return null;
}

function normalise(input: ErrorInput): ErrorInfo {
  if (!input) return {};
  if (typeof input === 'string') return { message: input };
  if (input instanceof Error) {
    const withCode = input as Error & { code?: string | number; status?: number };
    return { code: withCode.code, status: withCode.status, message: input.message, name: input.name };
  }
  return input;
}

/** The `errors.*` key for an error, or null when nothing in it is recognised. */
export function errorKey(input: ErrorInput): ErrorKey | null {
  const e = normalise(input);
  if (e.code !== undefined && e.code !== null && BY_CODE[String(e.code)]) return BY_CODE[String(e.code)];
  if (e.name === 'AbortError') return 'errors.timeout';
  if (typeof e.status === 'number') {
    const byStatus = statusKey(e.status);
    if (byStatus) return byStatus;
  }
  if (e.message) {
    for (const [re, key] of BY_MESSAGE) if (re.test(e.message)) return key;
  }
  return null;
}

/**
 * Localised text for an error. `fallback` is used when the error is not recognised, so a screen
 * can say something specific ("Could not open the billing portal.") instead of the generic line.
 */
export function localizeError(input: ErrorInput, t: Translate, fallback: ErrorKey | TKey = 'errors.generic'): string {
  const key = errorKey(input) ?? fallback;
  return t(key, key === 'errors.quota' ? { n: FREE_DAILY_SPARKS } : undefined);
}
