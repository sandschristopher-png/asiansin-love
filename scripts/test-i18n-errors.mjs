// Error-mapper regression suite. Run: node scripts/test-i18n-errors.mjs
import { loadLib } from './lib/load-ts.mjs';

const { errorKey, localizeError } = await loadLib('i18n/errors');

let passed = 0;
const failures = [];
const eq = (name, got, want) => (got === want ? passed++ : failures.push(`${name}: got ${got}, want ${want}`));

// Codes win over everything
eq('QUOTA_EXCEEDED', errorKey({ code: 'QUOTA_EXCEEDED', status: 429 }), 'errors.quota');
eq('UNAUTHORIZED', errorKey({ code: 'UNAUTHORIZED' }), 'errors.session');
eq('SUBSCRIPTION_REQUIRED', errorKey({ code: 'SUBSCRIPTION_REQUIRED' }), 'errors.plusRequired');
eq('INVALID_DATES', errorKey({ code: 'INVALID_DATES' }), 'errors.invalidDates');
eq('LIMIT_REACHED', errorKey({ code: 'LIMIT_REACHED' }), 'errors.limitReached');
eq('DB_ERROR', errorKey({ code: 'DB_ERROR' }), 'errors.generic');
eq('pg unique', errorKey({ code: '23505' }), 'errors.duplicate');
eq('pg rls', errorKey({ code: 42501 }), 'errors.permission');
eq('supabase invalid_credentials', errorKey({ code: 'invalid_credentials' }), 'errors.badCredentials');
eq('supabase email rate', errorKey({ code: 'over_email_send_rate_limit' }), 'errors.rateLimit');

// Status
eq('401', errorKey({ status: 401 }), 'errors.session');
eq('413', errorKey({ status: 413 }), 'errors.fileTooLarge');
eq('415', errorKey({ status: 415 }), 'errors.fileType');
eq('429', errorKey({ status: 429 }), 'errors.rateLimit');
eq('500', errorKey({ status: 500 }), 'errors.generic');
eq('200 stays unknown', errorKey({ status: 200 }), null);

// Messages (Supabase, browsers, Postgres)
eq('invalid login', errorKey('Invalid login credentials'), 'errors.badCredentials');
eq('security purposes', errorKey(new Error('For security purposes, you can only request this after 52 seconds')), 'errors.rateLimit');
eq('failed to fetch', errorKey(new TypeError('Failed to fetch')), 'errors.network');
eq('safari load failed', errorKey('Load failed'), 'errors.network');
eq('jwt expired', errorKey('JWT expired'), 'errors.session');
eq('duplicate key', errorKey('duplicate key value violates unique constraint "profiles_username_key"'), 'errors.duplicate');
eq('rls', errorKey('new row violates row-level security policy for table "trips"'), 'errors.permission');
eq('abort', errorKey({ name: 'AbortError' }), 'errors.timeout');
eq('unknown english', errorKey('Something odd the server wrote'), null);
eq('empty', errorKey(null), null);

// localizeError: fallback and variables
const t = (key, vars) => `${key}${vars ? JSON.stringify(vars) : ''}`;
eq('fallback default', localizeError('???', t), 'errors.generic');
eq('fallback custom', localizeError('???', t, 'settings.portalFailed'), 'settings.portalFailed');
eq('quota vars', localizeError({ code: 'QUOTA_EXCEEDED' }, t), 'errors.quota{"n":30}');
eq('mapped beats fallback', localizeError({ status: 429 }, t, 'settings.portalFailed'), 'errors.rateLimit');

if (failures.length) {
  console.error(failures.join('\n'));
  console.error(`\n${failures.length} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`i18n errors: ${passed} checks passed`);
